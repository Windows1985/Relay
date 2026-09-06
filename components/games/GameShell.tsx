import { modeCopy } from "@/lib/modes";

const HEX = /^#[0-9a-f]{6}$/i;

// Every game's frame: the game's name, one line of instruction, and the
// night's prompt when there is one (a colour swatch for colour hunts).
export function GameShell({
  modeId,
  promptText,
  children,
}: {
  modeId: string;
  promptText: string | null;
  children: React.ReactNode;
}) {
  const { title, hint } = modeCopy(modeId);
  const isSwatch = promptText !== null && HEX.test(promptText);

  return (
    <section className="card flex w-full flex-col items-center gap-5 p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-sm text-ink-2">{hint}</p>
        {promptText && isSwatch && (
          <span
            className="mt-1 h-16 w-16 rounded-full border-4 border-paper shadow-md"
            style={{ background: promptText }}
            aria-label={`Target colour ${promptText}`}
          />
        )}
        {promptText && !isSwatch && (
          <p className="mt-1 rounded-2xl bg-paper-warm px-4 py-3 font-display text-lg font-semibold">{promptText}</p>
        )}
      </div>
      {children}
    </section>
  );
}
