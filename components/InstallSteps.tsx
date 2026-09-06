"use client";

import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "desktop";

const STEPS: Record<Platform, { title: string; steps: string[] }> = {
  ios: {
    title: "On iPhone (Safari)",
    steps: [
      "Tap the Share button — the square with an arrow, at the bottom of Safari.",
      'Scroll down, tap "Add to Home Screen", then "Add".',
      "Open Relay from the new icon. It may ask you to sign in once more — the home-screen app keeps its own login, which is exactly why Relay uses accounts.",
      "Turn on notifications from inside the installed app. On iPhone that's the only place they can work.",
    ],
  },
  android: {
    title: "On Android (Chrome)",
    steps: [
      "Tap the Install button if Chrome offers one.",
      'Otherwise open the ⋮ menu and choose "Install app" or "Add to Home screen".',
      "Open Relay from the icon. Notifications work here whether or not it's installed.",
    ],
  },
  desktop: {
    title: "On a computer",
    steps: [
      "In Chrome or Edge, click the install icon at the right end of the address bar.",
      "Relay opens in its own window, and notifications work while the browser is running.",
      "It's built for a phone, though — install it there too.",
    ],
  },
};

export function InstallSteps() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setPlatform(/iPhone|iPad|iPod/.test(ua) ? "ios" : /Android/.test(ua) ? "android" : "desktop");
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const guide = STEPS[platform];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold">{guide.title}</h2>
        {installed && <span className="chip text-ok">Installed</span>}
      </div>
      <ol className="flex flex-col gap-3">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="avatar h-7 w-7 shrink-0 text-sm">{i + 1}</span>
            <span className="text-sm leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
