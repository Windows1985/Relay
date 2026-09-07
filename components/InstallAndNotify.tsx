"use client";

import { useEffect, useState } from "react";
import { BellIcon, DownloadIcon } from "@/components/icons";

const DISMISSED_KEY = "relay_install_prompt_dismissed";

// The VAPID *public* key is public by design — it is handed to Google/Mozilla's
// push services and stored inside every browser subscription. Shipping it as a
// default means subscribing works with no deployment configuration; the env var
// still wins if a different keypair is ever used. The private half lives only
// in the database, read by the push Edge Function.
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLwVnbe1LzCFXVa4ofPqVSZ02ZANaUMXweLbsa_tmGXK-CWRVam6m5yhShLF5VrfHUEb4vOyGIs7PurzODlCeV0";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Shown after the first reveal (spec: the install prompt goes after the
// payoff, not at join). With `always`, it never hides itself — used on the
// /install page where the user came looking for it.
export function InstallAndNotify({ always = false }: { always?: boolean }) {
  const [dismissed, setDismissed] = useState(!always);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!always && localStorage.getItem(DISMISSED_KEY)) return;
    setDismissed(false);
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    if (!("Notification" in window) || !("PushManager" in window)) setStatus("unsupported");
    else if (Notification.permission === "denied") setStatus("denied");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [always]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    if (!always) setDismissed(true);
  }

  async function install() {
    if (!installPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (installPrompt as any).prompt();
    dismiss();
  }

  async function enableNotifications() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await fetch("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub.toJSON()) });
    setStatus("subscribed");
    dismiss();
  }

  if (dismissed) return null;

  return (
    <section className="card flex w-full flex-col gap-3 p-5">
      {status === "subscribed" ? (
        <p className="text-center text-sm font-bold text-ok">Notifications are on. You&apos;ll get a nudge when tonight&apos;s game goes live.</p>
      ) : (
        <>
          <div>
            <h3 className="font-display text-lg font-semibold">
              {isStandalone ? "Get nudged when it's live" : "Put Relay on your home screen"}
            </h3>
            <p className="text-sm text-ink-2">
              {isStandalone
                ? "One tap, and we'll tell you the moment tonight's game opens."
                : "It works like an app — and that's the only way notifications can reach you on iPhone."}
            </p>
          </div>
          {status === "denied" && (
            <p className="text-sm text-danger">Notifications are blocked for this site — allow them in your browser settings to turn this on.</p>
          )}
          {status === "unsupported" && !isStandalone && (
            <p className="text-sm text-ink-2">This browser can&apos;t do notifications until Relay is installed to the home screen.</p>
          )}
          <div className="flex flex-col gap-2">
            {installPrompt && (
              <button onClick={install} className="btn-primary w-full">
                <DownloadIcon size={18} />
                Install Relay
              </button>
            )}
            {status !== "unsupported" && status !== "denied" && (
              <button onClick={enableNotifications} className={installPrompt ? "btn-secondary w-full" : "btn-primary w-full"}>
                <BellIcon size={18} />
                Turn on notifications
              </button>
            )}
            {!always && (
              <button onClick={dismiss} className="py-2 text-sm font-bold text-ink-2">
                Not now
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
