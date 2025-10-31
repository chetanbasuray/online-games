import GameFooter from "./GameFooter";

export default function GamePlaceholder({ title, creator, moreInfo }) {
  return (
    <div className="cosmic-page">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 py-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div
          className="cosmic-panel flex w-full max-w-3xl flex-col items-center gap-6 px-10 py-14 text-center scale-in"
          style={{ "--scale-duration": "0.7s" }}
        >
          <h1 className="cosmic-heading text-5xl font-bold fade-in" style={{ "--fade-duration": "0.7s", "--fade-delay": "0.1s" }}>
            {title}
          </h1>
          <p className="fade-in text-lg text-white/75" style={{ "--fade-delay": "0.2s" }}>
            We&rsquo;re giving this classic the same starlit glow as the rest of the arcade. Check back soon for its grand entrance.
          </p>
          <span className="cosmic-pill fade-in px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70" style={{ "--fade-delay": "0.35s" }}>
            In development
          </span>
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
