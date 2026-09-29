import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARK_URL } from "@/components/brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "tilltask:install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari fallback
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|crios|fxios).)*safari/i.test(ua);
    if (isIos && isSafari) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted") dismiss();
    else setShow(false);
  }

  return (
    <div className="fixed inset-x-3 bottom-20 md:bottom-4 md:left-auto md:right-4 md:w-80 z-50 bg-white border border-border/80 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom">
      {/* TillTask "T" Mark Tile */}
      <div className="w-11 h-11 rounded-xl bg-white border border-border/60 shadow-xs grid place-items-center shrink-0 p-1.5 overflow-hidden">
        <img
          src={MARK_URL}
          alt="TillTask"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground">Install TillTask</div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {iosHint ? (
            <>
              Tap <Share className="inline w-3 h-3 mx-0.5" /> Share, then tap "Add to Home Screen".
            </>
          ) : (
            "Add to home screen for fast one-tap daily clock-in."
          )}
        </p>
        {!iosHint && (
          <Button size="sm" className="mt-2.5 h-8 text-xs font-semibold" onClick={install}>
            Install App
          </Button>
        )}
      </div>

      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground p-1 -m-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
