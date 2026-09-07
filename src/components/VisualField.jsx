/* ---------------------------------------------------------------------------
   A pair of visual field charts, plotted in space coordinates: the left of
   each chart is the left of the world, for both eyes. Labs vary, but this is
   the layout that makes the diagnosis visible — a homonymous defect lines up
   across both charts, a bitemporal one splays outward.

   The faint blue and amber wash matches the fibre colours in the 3-D pathway,
   so it is obvious which bundle carries which half of the chart.
   --------------------------------------------------------------------------- */

const R = 78;
const C = 96;

const REGION = {
  all: { x: C - R, y: C - R, w: R * 2, h: R * 2 },
  left: { x: C - R, y: C - R, w: R, h: R * 2 },
  right: { x: C, y: C - R, w: R, h: R * 2 },
  upper: { x: C - R, y: C - R, w: R * 2, h: R },
  lower: { x: C - R, y: C, w: R * 2, h: R },
  "upper-left": { x: C - R, y: C - R, w: R, h: R },
  "upper-right": { x: C, y: C - R, w: R, h: R },
  "lower-left": { x: C - R, y: C, w: R, h: R },
  "lower-right": { x: C, y: C, w: R, h: R },
};

function Chart({ eye, regions = [], spareMacula }) {
  const isRight = eye === "OD";
  // The physiological blind spot lies 15° temporal — chart-right for the right
  // eye, chart-left for the left.
  const blindX = C + (isRight ? 1 : -1) * R * 0.5;
  const clip = `fieldClip-${eye}`;
  const lost = regions.length > 0;

  return (
    <figure className="m-0 grid justify-items-center gap-1">
      <svg viewBox={`0 0 ${C * 2} ${C * 2}`} role="img" className="w-full max-w-[190px]"
        aria-label={`${eye} visual field${lost ? `, missing: ${regions.join(", ")}` : ", full"}`}>
        <defs>
          <clipPath id={clip}>
            <circle cx={C} cy={C} r={R} />
          </clipPath>
        </defs>

        {/* which hemifield each half belongs to, matching the pathway colours */}
        <g clipPath={`url(#${clip})`}>
          <rect x={C - R} y={C - R} width={R} height={R * 2} fill="var(--color-cobalt)" opacity="0.09" />
          <rect x={C} y={C - R} width={R} height={R * 2} fill="var(--color-amber)" opacity="0.09" />
        </g>

        {/* degree rings at 10°, 20°, 30° */}
        {[0.34, 0.67, 1].map((k) => (
          <circle key={k} cx={C} cy={C} r={R * k} fill="none" stroke="var(--color-line)" strokeWidth="1" />
        ))}
        <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="var(--color-line)" strokeWidth="1" />
        <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="var(--color-line)" strokeWidth="1" />

        {/* the defect */}
        <g clipPath={`url(#${clip})`}>
          {regions.map((key) => {
            const r = REGION[key];
            if (!r) return null;
            return <rect key={key} {...r} fill="var(--color-ink)" opacity="0.82" />;
          })}
          {spareMacula && lost && (
            <circle cx={C} cy={C} r={R * 0.19} fill="var(--color-fluor)" opacity="0.55" />
          )}
        </g>

        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--color-ink2)" strokeWidth="1.4" />

        {/* fixation and the blind spot */}
        <circle cx={C} cy={C} r="2.4" fill="var(--color-ink2)" />
        <ellipse cx={blindX} cy={C} rx="7" ry="10" fill="var(--color-ink3)" opacity="0.5" />

        <text x={C - R - 3} y={C - 6} textAnchor="end" fill="var(--color-ink3)" fontFamily="var(--font-mono)" fontSize="10">
          {isRight ? "N" : "T"}
        </text>
        <text x={C + R + 3} y={C - 6} fill="var(--color-ink3)" fontFamily="var(--font-mono)" fontSize="10">
          {isRight ? "T" : "N"}
        </text>
      </svg>
      <figcaption className="font-mono text-[0.68rem] text-ink3">
        {eye} · {isRight ? "right eye" : "left eye"}
      </figcaption>
    </figure>
  );
}

export default function VisualField({ field }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {/* left eye on the left of the page, as a chart is normally laid out */}
        <Chart eye="OS" regions={field.os} spareMacula={field.spareMacula} />
        <Chart eye="OD" regions={field.od} spareMacula={field.spareMacula} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.64rem] text-ink3">
        <span className="flex items-center gap-[5px]">
          <i className="h-[8px] w-[8px] rounded-sm bg-cobalt opacity-40" /> left half of the world
        </span>
        <span className="flex items-center gap-[5px]">
          <i className="h-[8px] w-[8px] rounded-sm bg-amber opacity-40" /> right half
        </span>
        <span className="flex items-center gap-[5px]">
          <i className="h-[8px] w-[8px] rounded-sm bg-ink opacity-80" /> not seen
        </span>
        {field.spareMacula && (
          <span className="flex items-center gap-[5px]">
            <i className="h-[8px] w-[8px] rounded-full bg-fluor opacity-60" /> macula spared
          </span>
        )}
      </div>
    </div>
  );
}
