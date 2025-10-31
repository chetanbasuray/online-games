"use client";

export default function GameFooter({
  gameName,
  creator,
  moreInfo,
  className = "",
  variant = "classic",
}) {
  if (!creator && !moreInfo?.url) {
    return null;
  }

  const isClassic = variant === "classic";

  const sharedCardLayout = "w-full max-w-3xl space-y-3 px-6 py-5 sm:mx-auto sm:w-auto lg:mx-0 lg:w-full";

  const cardClassName = isClassic
    ? `${sharedCardLayout} rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/60 text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.08)]`
    : `cosmic-card ${sharedCardLayout}`;

  const titleClassName = isClassic
    ? "text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
    : "text-xs font-semibold uppercase tracking-[0.45em] text-white/60";

  const textClassName = isClassic ? "text-sm text-slate-600" : "text-sm text-white/80";

  const linkClassName = isClassic
    ? "font-semibold text-blue-700 underline-offset-2 hover:underline"
    : "font-semibold text-white hover:underline";

  return (
    <footer
      className={`mt-10 flex w-full max-w-4xl flex-col items-center text-center sm:mx-auto sm:w-auto lg:mt-0 lg:max-w-xs lg:items-start lg:text-left ${className}`}
    >
      <div className={cardClassName}>
        <p className={titleClassName}>
          {gameName} Origins
        </p>
        {creator ? (
          <p className={textClassName}>
            {gameName} was created by <span className={isClassic ? "font-semibold text-slate-800" : "font-semibold text-white"}>{creator}</span>.
          </p>
        ) : null}
        {moreInfo?.url ? (
          <p className={isClassic ? "text-sm text-slate-600" : "text-sm text-white/70"}>
            Learn more about {gameName} at{" "}
            <a
              href={moreInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {moreInfo.label ?? moreInfo.url}
            </a>
            .
          </p>
        ) : null}
      </div>
    </footer>
  );
}
