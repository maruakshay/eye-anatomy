function Toggle({ on, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className={`rounded-full border px-[11px] py-[5px] text-[0.76rem] whitespace-nowrap transition-colors ${
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
    <div className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-line bg-surface/85 px-4 py-[10px] backdrop-blur-md">
      <label className="flex min-w-[190px] flex-1 items-center gap-3">
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

      <div className="flex items-center gap-[6px]">
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
          className="rounded-full border border-line bg-surface/85 px-[11px] py-[5px] text-[0.76rem] text-ink2 backdrop-blur transition-colors hover:border-ink3 hover:text-ink"
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
