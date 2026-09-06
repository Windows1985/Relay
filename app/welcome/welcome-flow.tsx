"use client";

import { useState, useTransition } from "react";
import { InstallSteps } from "@/components/InstallSteps";
import { BoltIcon, CheckIcon, FlameIcon, LockIcon, TrophyIcon, UsersIcon } from "@/components/icons";
import { finishOnboarding } from "./actions";

const GAME_KINDS = [
  { Icon: BoltIcon, title: "Quick-reflex games", body: "Shake, tap, flip, trace, or stop a hidden timer at exactly ten seconds. Your phone measures it — no scores to argue about." },
  { Icon: UsersIcon, title: "Photo & writing games", body: "Snap the ugliest thing in reach, or finish a sentence. Everyone votes with a heart; most hearts wins the night." },
  { Icon: TrophyIcon, title: "Name games", body: "\"Most likely to…\" — you pick a friend, and the group's picks get tallied." },
];

export function WelcomeFlow({ username }: { username: string }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const last = 2;

  const finish = () => startTransition(() => { finishOnboarding(); });

  return (
    <main className="page flex flex-col gap-5">
      <header className="flex items-center justify-between py-1">
        <h1 className="font-display text-2xl font-bold">Hey {username}</h1>
        <span className="chip num">{step + 1} of {last + 1}</span>
      </header>

      {step === 0 && (
        <section className="card flex flex-col gap-4 p-6">
          <div className="mx-auto ring">
            <div className="ring-inner h-28 w-28">
              <LockIcon size={32} className="text-ink-2" />
            </div>
          </div>
          <h2 className="text-center font-display text-xl font-semibold">One game a night</h2>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex gap-3">
              <BoltIcon size={20} className="mt-0.5 shrink-0 text-g3" />
              <span><b>Same time every night.</b> Your group picks the window (7–10pm by default). The game itself is a surprise — nobody knows which one until it opens.</span>
            </li>
            <li className="flex gap-3">
              <LockIcon size={20} className="mt-0.5 shrink-0 text-g3" />
              <span><b>You have to play to see.</b> Everyone&apos;s answers stay locked until you&apos;ve posted your own. Miss the window and you don&apos;t get to look.</span>
            </li>
            <li className="flex gap-3">
              <FlameIcon size={20} className="mt-0.5 shrink-0 text-g3" />
              <span><b>The streak is the group&apos;s.</b> It survives as long as most of you play — a couple of no-shows is fine. Tokens you win buy name colours; the group can bank a freeze to survive a bad night.</span>
            </li>
          </ul>
          <button onClick={() => setStep(1)} className="btn-primary w-full">
            Got it — what are the games?
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="card flex flex-col gap-4 p-6">
          <h2 className="text-center font-display text-xl font-semibold">The games</h2>
          <p className="text-center text-sm text-ink-2">Ten of them, rotating, so it doesn&apos;t get stale. They come in three flavours:</p>
          <ul className="flex flex-col gap-4">
            {GAME_KINDS.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <Icon size={22} className="mt-0.5 shrink-0 text-g3" />
                <span className="text-sm">
                  <b className="block">{title}</b>
                  {body}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
            <button onClick={() => setStep(2)} className="btn-primary flex-1">Next</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <>
          <section className="card flex flex-col gap-3 p-6">
            <h2 className="font-display text-xl font-semibold">Put it on your home screen</h2>
            <p className="text-sm text-ink-2">
              Relay is a website that installs like an app — no app store. It&apos;s worth doing: it&apos;s one tap at 7pm,
              and on iPhone it&apos;s the only way notifications can reach you.
            </p>
            <InstallSteps />
          </section>
          <section className="card flex flex-col gap-2 p-5">
            <h3 className="font-display text-lg font-semibold">What notifications do</h3>
            <p className="text-sm text-ink-2">
              A nudge when tonight&apos;s game opens, and one reminder with two hours left if you still haven&apos;t played.
              Nothing else. If they can&apos;t reach you, the home screen always shows the live state anyway.
            </p>
          </section>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
            <button onClick={finish} disabled={pending} className="btn-primary flex-1">
              <CheckIcon size={18} />
              Start playing
            </button>
          </div>
        </>
      )}
    </main>
  );
}
