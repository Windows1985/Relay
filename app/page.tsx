export default function Home() {
  // Placeholder — Phase 4 replaces this with the real "tonight's state"
  // screen (opens-at countdown / live / revealed / settled), derived
  // from lib/round.ts. Middleware already routes signed-out users to
  // /join and un-usernamed users to /pick-username before they see this.
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">Relay</h1>
      <p className="text-zinc-500">Scaffold is live. Round engine next.</p>
    </main>
  );
}
