"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InstallAndNotify } from "@/components/InstallAndNotify";
import { ChevronLeftIcon } from "@/components/icons";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const STEPS: Record<Platform, { title: string; steps: string[] }> = {
  ios: {
    title: "On iPhone (Safari)",
    steps: [
      "Tap the Share button — the square with an arrow at the bottom of Safari.",
      "Scroll down and tap \"Add to Home Screen\", then \"Add\".",
      "Open Relay from the new icon. You may need to sign in once more there — the home-screen app keeps its own login, which is why accounts exist.",
      "Turn on notifications from inside the installed app (the button below only works there on iPhone).",
    ],
  },
  android: {
    title: "On Android (Chrome)",
    steps: [
      "Tap the Install button below if you see one — Chrome offers it directly.",
      "Otherwise tap the ⋮ menu at the top right and choose \"Install app\" or \"Add to Home screen\".",
      "Open Relay from the icon. Notifications work here whether or not it's installed.",
    ],
  },
  desktop: {
    title: "On a computer",
    steps: [
      "In Chrome or Edge, click the install icon at the right end of the address bar.",
      "Relay opens in its own window. Notifications work as long as the browser is running.",
      "Honestly, though — this is a phone game. Install it there.",
    ],
  },
};

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const guide = STEPS[platform];

  return (
    <main className="page flex flex-col gap-5">
      <header className="flex items-center gap-2 py-1">
        <Link href="/me" className="-ml-2 p-2" aria-label="Back">
          <ChevronLeftIcon size={24} />
        </Link>
        <h1 className="font-display text-2xl font-bold">Install &amp; notifications</h1>
      </header>

      <section className="card flex flex-col gap-2 p-5">
        <h2 className="font-display text-lg font-semibold">Relay is an app without an app store</h2>
        <p className="text-sm text-ink-2">
          It runs in your browser, but you can add it to your home screen like any other app. Same account,
          same group, same streak — just an icon you can tap at 7pm instead of hunting for a link.
        </p>
        {installed && <p className="text-sm font-bold text-ok">You&apos;re already using the installed app.</p>}
      </section>

      <InstallAndNotify always />

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-display text-lg font-semibold">{guide.title}</h2>
        <ol className="flex flex-col gap-3">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="avatar h-7 w-7 shrink-0 text-sm">{i + 1}</span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card flex flex-col gap-2 p-5">
        <h2 className="font-display text-lg font-semibold">What notifications do</h2>
        <ul className="flex flex-col gap-2 text-sm text-ink-2">
          <li>• A nudge the moment tonight&apos;s game opens.</li>
          <li>• One reminder with two hours left, only if you haven&apos;t played.</li>
          <li>• Nothing else. No streaks-are-dying guilt trips, no marketing.</li>
        </ul>
        <p className="text-xs text-ink-2">
          If notifications can&apos;t reach you (iPhones in the EU, for one), the home tab always shows the live state
          — &quot;3 of 6 played&quot; — so nothing depends on them.
        </p>
      </section>
    </main>
  );
}
