function Toggle({ on, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className={`rounded-full border px-[11px] py-[5px] text-[0.76rem] whitespace-nowrap transition-colors max-lg:px-[9px] max-lg:text-[0.72rem] ${
        on
          ? "border-fundus bg-fundus text-on-accent"
          : "border-line bg-surface/85 text-ink2 backdrop-blur hover:border-ink3 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function ViewControls({
  explode,
  onExplode,
  section,
  onSection,
  isolate,
  onIsolate,
  canIsolate,
  onReset,
}) {
  return (
    // Below lg the bar spans the full width of the canvas and pins to its
    // bottom edge: on a phone a centred, min-width island either overflowed
    // sideways or sat off the short 48dvh canvas entirely.
    <div className="pointer-events-auto flex w-full items-center gap-x-4 gap-y-2 rounded-md border border-line bg-surface/85 px-4 py-[10px] backdrop-blur-md max-lg:flex-col max-lg:items-stretch max-lg:gap-y-[7px] max-lg:rounded-none max-lg:border-x-0 max-lg:border-b-0 max-lg:px-3 max-lg:py-2 lg:w-auto lg:flex-wrap">
      <label className="flex flex-1 items-center gap-3 lg:min-w-[190px]">
        <span className="label-cap shrink-0 text-ink3">Take apart</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={explode}
          onChange={(e) => onExplode(Number(e.target.value))}
          className="min-w-0 flex-1"
          aria-label="Explode the model"
        />
      </label>

      <div className="flex items-center gap-[6px] max-lg:justify-center">
        <Toggle on={section} onClick={() => onSection(!section)} title="Cut the eye in half">
          Section
        </Toggle>
        <Toggle
          on={isolate}
          onClick={() => canIsolate && onIsolate(!isolate)}
          title={canIsolate ? "Show only the selected structure" : "Select something first"}
        >
          Isolate
        </Toggle>
        <button
          onClick={onReset}
          className="rounded-full border border-line bg-surface/85 px-[11px] py-[5px] text-[0.76rem] whitespace-nowrap text-ink2 backdrop-blur transition-colors hover:border-ink3 hover:text-ink max-lg:px-[9px] max-lg:text-[0.72rem]"
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
