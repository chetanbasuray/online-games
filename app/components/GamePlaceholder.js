import GameFooter from "./GameFooter";

export default function GamePlaceholder({ title, creator, moreInfo }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div className="w-full max-w-3xl space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm text-slate-600">
              We&rsquo;re putting the finishing touches on this classic so it feels right at home with the rest of the collection.
              Check back soon for its return.
            </p>
            <span className="mt-6 inline-flex rounded-full border border-slate-300 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">
              In development
            </span>
          </div>
        </div>
        <GameFooter
          gameName={title}
          creator={creator}
          moreInfo={moreInfo}
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
