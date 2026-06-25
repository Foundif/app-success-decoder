import { useEffect, useState } from "react";
import logoAsset from "@/assets/tilltask-logo.png.asset.json";

export const LOGO_URL = logoAsset.url;

/** Square orange "T" mark only — use in tight headers and avatars. */
export function BrandMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-white shadow-sm border border-border/60 grid place-items-center overflow-hidden shrink-0`}
    >
      <img
        src={LOGO_URL}
        alt="TillTask"
        className="w-[180%] h-[180%] object-cover object-left scale-100"
        style={{ objectPosition: "5% center" }}
        draggable={false}
      />
    </div>
  );
}

/** Full lockup with logo + wordmark. */
export function BrandLockup({ className = "h-9" }: { className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="TillTask"
      className={`${className} w-auto object-contain`}
      draggable={false}
    />
  );
}

/** Initial white splash; fades out after mount. SSR-safe. */
export function SplashScreen() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip splash inside Lovable editor iframe to avoid flashing
    if (window.self !== window.top) {
      setDone(true);
      return;
    }
    const t = window.setTimeout(() => setDone(true), 900);
    return () => clearTimeout(t);
  }, []);
  if (done) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-white grid place-items-center animate-in fade-in pointer-events-none">
      <div className="flex flex-col items-center gap-3">
        <img
          src={LOGO_URL}
          alt="TillTask"
          className="h-16 w-auto object-contain animate-pulse"
          draggable={false}
        />
        <div className="text-xs tracking-[0.3em] text-muted-foreground font-semibold">
          LOADING
        </div>
      </div>
    </div>
  );
}
