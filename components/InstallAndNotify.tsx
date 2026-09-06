"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "relay_install_prompt_dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Shown once, after the first reveal (spec: install prompt goes after the
// payoff, not at join, because Add to Home Screen has heavy drop-off
// beforehand). Handles both halves of the same moment: installing to the
// home screen (where beforeinstallprompt is available) and subscribing to
// push (which works in-browser on Android/desktop regardless of install).
export function InstallAndNotify() {
  const [dismissed, setDismissed] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setDismissed(false);
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function install() {
    if (!installPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (installPrompt as any).prompt();
    dismiss();
  }

  async function enableNotifications() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return dismiss();

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    await fetch("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub.toJSON()) });
    setSubscribed(true);
    dismiss();
  }

  if (dismissed) return null;

  return (
    <div className="bezel-inset flex w-full max-w-sm flex-col gap-2 px-4 py-3 text-center">
      {subscribed ? (
        <p className="text-sm text-ok">Notifications on.</p>
      ) : (
        <>
          <p className="text-xs text-ink-dim">
            {isStandalone
              ? "Get a nudge when tonight's game goes live."
              : "Add Relay to your home screen and get a nudge when tonight's game goes live."}
          </p>
          <div className="flex gap-2">
            {installPrompt && (
              <button onClick={install} className="btn-tactile flex-1 py-2 text-xs font-bold uppercase">
                Install
              </button>
            )}
            <button onClick={enableNotifications} className="btn-ghost flex-1 py-2 text-xs uppercase">
              Notify me
            </button>
            <button onClick={dismiss} className="text-xs text-ink-dim underline">
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
