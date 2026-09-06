// Rendered instantly by the App Router on every navigation, so a tap gets
// visible feedback immediately instead of the previous dead pause while the
// server fetched.
export default function Loading() {
  return (
    <main className="page flex flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="flex items-center justify-between py-1">
        <span className="skeleton h-8 w-28 rounded-xl" />
        <span className="skeleton h-8 w-16 rounded-full" />
      </div>
      <section className="card flex flex-col items-center gap-4 p-6">
        <span className="skeleton h-40 w-40 rounded-full" />
        <span className="skeleton h-6 w-48 rounded-lg" />
        <span className="skeleton h-4 w-56 rounded-lg" />
        <span className="skeleton h-[52px] w-full rounded-full" />
      </section>
    </main>
  );
}
