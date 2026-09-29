import { useEffect, useState } from "react";
import logoAsset from "@/assets/tilltask-logo.png.asset.json";
import markAsset from "@/assets/tilltask-mark.png.asset.json";

export const LOGO_URL = logoAsset.url;
export const MARK_URL = markAsset.url;

/** 
 * Clean white tile hosting the standalone "T" mark.
 * Used for square icons, avatars, and compact PWA elements.
 */
export function BrandMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-white shadow-xs border border-border/60 grid place-items-center overflow-hidden shrink-0 p-1`}
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

/** 
 * Full horizontal brand lockup using your uploaded TillTask logo.
 * Used in sidebar, auth page header, desktop nav, and modal headers.
 */
export function BrandLockup({ className = "h-8" }: { className?: string }) {
  return (
    <div className="flex items-center shrink-0">
      <img
        src={LOGO_URL}
        alt="TillTask"
        className={`${className} w-auto object-contain max-w-full`}
        draggable={false}
      />
    </div>
  );
}

/** Initial splash screen featuring your uploaded TillTask logo. */
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
      <div className="flex flex-col items-center gap-3 px-6">
        <img
          src={LOGO_URL}
          alt="TillTask"
          className="w-60 max-w-[75vw] h-auto object-contain animate-pulse"
          draggable={false}
        />
      </div>
    </div>
  );
}
