import { useEffect, useState } from "react";
import logoAsset from "@/assets/tilltask-logo.png.asset.json";
import markAsset from "@/assets/tilltask-mark.png.asset.json";

export const LOGO_URL = logoAsset.url;
export const MARK_URL = markAsset.url;

/** 
 * Square orange "T" mark on a clean white tile.
 * Used in app headers, install prompts, mobile topbars, and avatars.
 */
export function BrandMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-white shadow-sm border border-border/60 grid place-items-center overflow-hidden shrink-0 p-1.5`}
    >
      <img
        src={MARK_URL}
        alt="TillTask"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

/** Full brand lockup with logo + wordmark. */
export function BrandLockup({ className = "h-9" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-border/50 grid place-items-center overflow-hidden p-1">
        <img
          src={MARK_URL}
          alt="TillTask Mark"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
      <img
        src={LOGO_URL}
        alt="TillTask"
        className={`${className} w-auto object-contain`}
        draggable={false}
      />
    </div>
  );
}

/** Initial clean white splash screen. */
export function SplashScreen() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.self !== window.top) {
      setDone(true);
      return;
    }
    const t = window.setTimeout(() => setDone(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white grid place-items-center animate-in fade-in pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-border/60 grid place-items-center p-2.5 animate-pulse">
          <img
            src={MARK_URL}
            alt="TillTask"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
        <div className="text-xs tracking-[0.25em] text-muted-foreground font-semibold">
          TILLTASK
        </div>
      </div>
    </div>
  );
}
