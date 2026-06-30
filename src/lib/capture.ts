// Browser-only screen capture controller for TillTask.
// - getDisplayMedia for screen sharing
// - 1 snapshot every 10s, resized to 1280w, WebP @ q=0.4 (~30-80 KB)
// - Rolling 5-min low-bitrate VP9 buffer (~5 MB max) -> dumps to webm on admin request
// - Listens for visibility/idle/online/stream-end -> writes activity_alerts
//
// Storage path: recordings/{companyId}/{employeeId}/{kind}-{timestamp}.{ext}
import { supabase } from "@/integrations/supabase/client";

type CaptureOpts = {
  userId: string;
  companyId: string;
  attendanceId?: string | null;
  onAlert?: (kind: string, msg: string) => void;
  onStopped?: () => void;
};

type AlertType = "tab_hidden" | "idle" | "offline" | "capture_stopped";

const SNAPSHOT_INTERVAL_MS = 10_000;
const SNAPSHOT_WIDTH = 1280;
const SNAPSHOT_QUALITY = 0.4;
const ROLLING_MAX_SECONDS = 300; // 5 minutes
const VIDEO_BITS = 150_000; // ~150 kbps -> ~1MB/min
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
const HIDDEN_THRESHOLD_MS = 2 * 60 * 1000;

export class CaptureSession {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private snapTimer: number | null = null;
  private idleTimer: number | null = null;
  private hiddenTimer: number | null = null;
  private lastActivity = Date.now();
  private lastVisibleAt = Date.now();
  private alertingHidden = false;
  private alertingIdle = false;
  private opts: CaptureOpts;
  public active = false;

  constructor(opts: CaptureOpts) {
    this.opts = opts;
    this.video = document.createElement("video");
    this.video.muted = true;
    this.video.playsInline = true;
    this.canvas = document.createElement("canvas");
  }

  async start() {
    if (this.active) return;
    // @ts-ignore
    const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 5, max: 10 } },
      audio: false,
    });
    this.stream = stream;
    this.video.srcObject = stream;
    await this.video.play().catch(() => {});

    stream.getVideoTracks().forEach((t) => {
      t.addEventListener("ended", () => {
        this.recordAlert("capture_stopped", "Screen sharing was stopped");
        this.stop();
        this.opts.onStopped?.();
      });
    });

    // rolling recorder
    try {
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      this.recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: VIDEO_BITS,
      });
      this.recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
          // trim: keep only last ~ROLLING_MAX_SECONDS / 5s chunks
          const max = Math.ceil(ROLLING_MAX_SECONDS / 5) + 2;
          if (this.chunks.length > max) this.chunks.splice(0, this.chunks.length - max);
        }
      };
      this.recorder.start(5000); // emit chunks every 5s
    } catch (e) {
      console.warn("MediaRecorder unsupported", e);
    }

    // 1fps snapshot
    this.snapTimer = window.setInterval(() => this.snapshot(), SNAPSHOT_INTERVAL_MS);
    // Fire one immediately
    setTimeout(() => this.snapshot(), 1500);

    // alerts
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
    window.addEventListener("offline", this.onOffline);
    window.addEventListener("online", this.onOnline);
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, this.onActivity, { passive: true }),
    );
    this.idleTimer = window.setInterval(() => this.checkIdle(), 30_000);

    // poll for admin clip requests every 15s
    this.pollClipRequests();
    this.clipPollTimer = window.setInterval(() => this.pollClipRequests(), 15_000);

    this.active = true;
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    if (this.snapTimer) clearInterval(this.snapTimer);
    if (this.idleTimer) clearInterval(this.idleTimer);
    if (this.hiddenTimer) clearTimeout(this.hiddenTimer);
    if (this.clipPollTimer) clearInterval(this.clipPollTimer);
    try {
      this.recorder?.state !== "inactive" && this.recorder?.stop();
    } catch {}
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("focus", this.onFocus);
    window.removeEventListener("offline", this.onOffline);
    window.removeEventListener("online", this.onOnline);
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((ev) =>
      window.removeEventListener(ev, this.onActivity),
    );
  }

  // ============ snapshots ============
  private snapCount = 0;
  private async snapshot() {
    if (!this.stream || this.video.videoWidth === 0) return;
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    const scale = Math.min(1, SNAPSHOT_WIDTH / vw);
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);
    this.canvas.width = w;
    this.canvas.height = h;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(this.video, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) =>
      this.canvas.toBlob(res, "image/webp", SNAPSHOT_QUALITY),
    );
    if (!blob) return;
    const ts = Date.now();
    const path = `${this.opts.companyId}/${this.opts.userId}/snap-${ts}.webp`;
    const { error } = await supabase.storage.from("recordings").upload(path, blob, {
      contentType: "image/webp",
      upsert: false,
    });
    if (error) {
      console.warn("snapshot upload failed", error.message);
      return;
    }
    // Store the STORAGE PATH (not a 7-day signed URL). The viewer signs on demand,
    // so screenshots keep loading after any deployment / past expiry.
    await supabase.from("screenshots").insert({
      user_id: this.opts.userId,
      company_id: this.opts.companyId,
      captured_at: new Date(ts).toISOString(),
      image_url: path,
      activity_label: document.title?.slice(0, 60) ?? null,
      app_name: "Browser",
      status: "pending",
    });

    // Run AI distraction check on roughly every 6th snapshot (~1 per minute)
    this.snapCount++;
    if (this.snapCount % 6 === 1) {
      this.runAiCheck(blob).catch(() => {});
    }
  }

  private async runAiCheck(blob: Blob) {
    try {
      const b64 = await blobToBase64(blob);
      const { analyzeSnapshot } = await import("@/lib/monitoring.functions");
      await analyzeSnapshot({
        data: {
          companyId: this.opts.companyId,
          attendanceId: this.opts.attendanceId ?? null,
          imageBase64: b64,
          mime: "image/webp",
        },
      });
    } catch (e) {
      // silent — AI is best-effort
    }
  }

  // ============ alerts ============
  private async recordAlert(type: AlertType, message: string) {
    this.opts.onAlert?.(type, message);
    await supabase.from("activity_alerts").insert({
      company_id: this.opts.companyId,
      employee_id: this.opts.userId,
      attendance_id: this.opts.attendanceId ?? null,
      alert_type: type,
      severity: type === "capture_stopped" || type === "offline" ? "critical" : "warning",
      message,
    });
  }

  private onActivity = () => {
    this.lastActivity = Date.now();
    if (this.alertingIdle) {
      this.alertingIdle = false;
    }
  };
  private checkIdle = () => {
    if (!this.active) return;
    if (Date.now() - this.lastActivity > IDLE_THRESHOLD_MS && !this.alertingIdle) {
      this.alertingIdle = true;
      this.recordAlert("idle", "No mouse/keyboard activity for 5+ minutes");
    }
  };
  private onVisibility = () => {
    if (document.visibilityState === "hidden") {
      this.lastVisibleAt = Date.now();
      this.hiddenTimer = window.setTimeout(() => {
        if (document.visibilityState === "hidden" && !this.alertingHidden) {
          this.alertingHidden = true;
          this.recordAlert("tab_hidden", "Work tab hidden for 2+ minutes");
        }
      }, HIDDEN_THRESHOLD_MS);
    } else {
      if (this.hiddenTimer) clearTimeout(this.hiddenTimer);
      this.alertingHidden = false;
    }
  };
  private onBlur = () => this.onVisibility();
  private onFocus = () => {
    if (this.hiddenTimer) clearTimeout(this.hiddenTimer);
    this.alertingHidden = false;
  };
  private onOffline = () => this.recordAlert("offline", "Device went offline");
  private onOnline = () => {/* no-op */};

  // ============ admin-on-demand clip ============
  private clipPollTimer: number | null = null;
  private fulfilling = false;
  private async pollClipRequests() {
    if (this.fulfilling) return;
    const { data } = await supabase
      .from("clip_requests")
      .select("id, duration_seconds")
      .eq("employee_id", this.opts.userId)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (!data) return;
    this.fulfilling = true;
    try {
      await this.fulfillClip(data.id, data.duration_seconds ?? 300);
    } finally {
      this.fulfilling = false;
    }
  }
  private async fulfillClip(requestId: string, duration: number) {
    if (!this.recorder || this.chunks.length === 0) return;
    // Force flush
    try {
      this.recorder.requestData?.();
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
    const blob = new Blob(this.chunks, { type: "video/webm" });
    const ts = Date.now();
    const path = `${this.opts.companyId}/${this.opts.userId}/clip-${ts}.webm`;
    const { error } = await supabase.storage.from("recordings").upload(path, blob, {
      contentType: "video/webm",
      upsert: false,
    });
    if (error) {
      console.warn("clip upload failed", error.message);
      return;
    }
    const { data: clip } = await supabase
      .from("recording_clips")
      .insert({
        company_id: this.opts.companyId,
        employee_id: this.opts.userId,
        attendance_id: this.opts.attendanceId ?? null,
        storage_path: path,
        duration_seconds: Math.min(duration, ROLLING_MAX_SECONDS),
        size_bytes: blob.size,
        mime_type: "video/webm",
      })
      .select("id")
      .single();
    await supabase
      .from("clip_requests")
      .update({
        status: "fulfilled",
        fulfilled_at: new Date().toISOString(),
        clip_id: clip?.id ?? null,
      })
      .eq("id", requestId);
    this.opts.onAlert?.("info", "Sent requested clip to admin");
  }
}
