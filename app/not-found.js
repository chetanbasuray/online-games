import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm">
          404 · Lost move
        </span>
        <h1 className="text-4xl font-semibold sm:text-5xl">We couldn&rsquo;t find that board.</h1>
        <p className="max-w-2xl text-base text-slate-600">
          The page you&rsquo;re looking for has been captured or never opened. Jump back to the lobby or head straight into one of our featured games.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            Return home
          </Link>
          <Link
            href="/chess"
            className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
          >
            Play chess
          </Link>
        </div>
      </div>
    </main>
  );
}
