import Link from "next/link";
import { InstallAndNotify } from "@/components/InstallAndNotify";
import { InstallSteps } from "@/components/InstallSteps";
import { ChevronLeftIcon } from "@/components/icons";

export default function InstallPage() {
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
      </section>

      <InstallAndNotify always />

      <section className="card p-5">
        <InstallSteps />
      </section>

      <section className="card flex flex-col gap-2 p-5">
        <h2 className="font-display text-lg font-semibold">What notifications do</h2>
        <ul className="flex flex-col gap-2 text-sm text-ink-2">
          <li>• A nudge the moment tonight&apos;s game opens.</li>
          <li>• One reminder with two hours left, only if you haven&apos;t played.</li>
          <li>• Nothing else. No guilt trips, no marketing.</li>
        </ul>
        <p className="text-xs text-ink-2">
          If notifications can&apos;t reach you (iPhones in the EU, for one), the home tab always shows the live state
          — &quot;3 of 6 played&quot; — so nothing depends on them.
        </p>
      </section>
    </main>
  );
}
