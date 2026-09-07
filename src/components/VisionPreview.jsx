/* ---------------------------------------------------------------------------
   Renders a Snellen chart and a reading card, then blurs them by the amount
   of retinal blur the model computed.

   Scale: the 20/20 row is set at 8 px, whose cap height is about 5 arcminutes
   of visual angle — the real definition of the 20/20 line. That fixes the
   conversion at roughly 1.12 px per arcminute, so the blur applied here is the
   same blur circle the ray diagram draws, in the same angular units.
   --------------------------------------------------------------------------- */

const PX_PER_ARCMIN = 1.12;
const BASE_PX = 8;

const CHART = [
  { den: 200, letters: "E" },
  { den: 100, letters: "F P" },
  { den: 70, letters: "T O Z" },
  { den: 50, letters: "L P E D" },
  { den: 40, letters: "P E C F D" },
  { den: 30, letters: "E D F C Z P" },
  { den: 25, letters: "F E L O P Z D" },
  { den: 20, letters: "D E F P O T E C" },
];

function sigmaFor(arcmin) {
  return Math.min(44, 0.35 * arcmin * PX_PER_ARCMIN);
}

export function SnellenPreview({ label, arcmin, acuity, tone = "neutral" }) {
  const sigma = sigmaFor(arcmin);
  return (
    <div className="overflow-hidden rounded border border-line bg-surface">
      <h4
        className={`label-cap m-0 border-b border-linesoft px-4 py-[9px] ${
          tone === "good" ? "text-fluor" : tone === "bad" ? "text-fundus" : "text-ink3"
        }`}
      >
        {label}
      </h4>
      <div className="overflow-hidden px-3 pt-4 pb-3 text-center">
        <div
          className="num font-mono leading-[1.5] font-medium tracking-[0.18em] text-ink transition-[filter] duration-200"
          style={{ filter: `blur(${sigma.toFixed(2)}px)` }}
          aria-hidden="true"
        >
          {CHART.map((row) => (
            <div key={row.den} style={{ fontSize: `${BASE_PX * (row.den / 20)}px` }}>
              {row.letters}
            </div>
          ))}
        </div>
      </div>
      <p className="num border-t border-linesoft px-4 py-2 text-center font-mono text-[0.72rem] text-ink3">
        ≈ {acuity.snellen} &nbsp;·&nbsp; {acuity.metric} &nbsp;·&nbsp; logMAR{" "}
        {acuity.logMAR.toFixed(2)}
      </p>
    </div>
  );
}

export function ReadingPreview({ label, arcmin, note, tone = "neutral" }) {
  const sigma = sigmaFor(arcmin) * 0.85;
  return (
    <div className="overflow-hidden rounded border border-line bg-surface">
      <h4
        className={`label-cap m-0 border-b border-linesoft px-4 py-[9px] ${
          tone === "good" ? "text-fluor" : tone === "bad" ? "text-fundus" : "text-ink3"
        }`}
      >
        {label}
      </h4>
      <div className="overflow-hidden px-4 pt-4 pb-3">
        <p
          className="text-[11px] leading-[1.45] text-ink transition-[filter] duration-200"
          style={{ filter: `blur(${sigma.toFixed(2)}px)` }}
          aria-hidden="true"
        >
          The retina consumes more oxygen per gram of tissue than any other organ in the body,
          including the brain and the heart. Every photon that reaches a photoreceptor has already
          crossed the tear film, the cornea, the aqueous, the lens and the entire thickness of the
          neural retina before it is finally absorbed.
        </p>
      </div>
      <p className="num border-t border-linesoft px-4 py-2 font-mono text-[0.72rem] text-ink3">
        {note}
      </p>
    </div>
  );
}
