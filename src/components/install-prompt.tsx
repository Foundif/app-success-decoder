import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    // iOS Safari fallback (no beforeinstallprompt)
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
    <div className="fixed inset-x-3 bottom-20 md:bottom-4 md:left-auto md:right-4 md:w-80 z-50 bg-card border border-primary/30 shadow-xl rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom">
      <div className="w-10 h-10 rounded-xl bg-primary/15 grid place-items-center shrink-0">
        <Download className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">Install TillTask</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {iosHint ? (
            <>
              Tap <Share className="inline w-3 h-3 mx-0.5" /> Share, then "Add to Home Screen".
            </>
          ) : (
            "Get a one-tap app icon with offline-friendly access."
          )}
        </p>
        {!iosHint && (
          <Button size="sm" className="mt-2 h-8" onClick={install}>
            Install app
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
