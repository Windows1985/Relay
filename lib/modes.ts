// Player-facing copy per game mode. Client-safe mirror of what modes.id
// means; the rules themselves live in the DB row.
export const MODE_COPY: Record<string, { title: string; hint: string }> = {
  shake: { title: "Shake it", hint: "Shake your phone as many times as you can in 15 seconds." },
  stop10: { title: "Stop at 10.00", hint: "Start, then stop the hidden timer at exactly ten seconds." },
  tap_fast: { title: "Tap frenzy", hint: "Tap as fast as you can for 10 seconds." },
  reaction: { title: "Reaction test", hint: "Wait for the flash, then tap. Best of three." },
  flip: { title: "Flip it", hint: "Flip your phone over as many times as you can in 20 seconds." },
  circle_trace: { title: "Trace the circle", hint: "Trace the circle as precisely as you can." },
  closest_colour: { title: "Colour hunt", hint: "Find something this colour and snap it." },
  shoes: { title: "Your shoes", hint: "Right now. No getting up." },
  ugliest: { title: "Ugliest thing", hint: "The ugliest thing within arm's reach." },
  wrong_place: { title: "Wrong place", hint: "Something that should not be where it is." },
  damp: { title: "Damp", hint: "The closest thing you own to the word \"damp\"." },
  best_ending: { title: "Best ending", hint: "Finish the sentence. Funniest wins." },
  one_lie: { title: "One lie", hint: "Tell one lie about yourself. Make it believable." },
  guess_poster: { title: "Guess the poster", hint: "Write something. Everyone guesses who wrote what." },
  most_likely: { title: "Most likely to", hint: "Pick the friend." },
  no_phone: { title: "No phone", hint: "Who survives longest without their phone?" },
  lying: { title: "Who's lying", hint: "Who is lying right now?" },
};

export function modeCopy(id: string) {
  return MODE_COPY[id] ?? { title: id.replace(/_/g, " "), hint: "" };
}
