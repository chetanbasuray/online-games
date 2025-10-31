"use client";

export default function GameFooter({ gameName, creator, moreInfo }) {
  if (!creator && !moreInfo?.url) {
    return null;
  }

  return (
    <footer className="relative z-10 mt-10 flex w-full max-w-4xl flex-col items-center text-center sm:mx-auto sm:w-auto">
      <div className="cosmic-card w-full max-w-3xl space-y-3 px-6 py-5 sm:mx-auto sm:w-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/60">
          {gameName} Origins
        </p>
        {creator ? (
          <p className="text-sm text-white/80">
            {gameName} was created by <span className="font-semibold text-white">{creator}</span>.
          </p>
        ) : null}
        {moreInfo?.url ? (
          <p className="text-sm text-white/70">
            Learn more about {gameName} at{" "}
            <a
              href={moreInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:underline"
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
