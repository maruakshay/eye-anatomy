import { useEffect, useRef, useState } from "react";
import { mmPerDegree, pxPerMm } from "../lib/visionTest.js";

/* The grid is drawn in degrees of visual field, not pixels: one square per
   degree, twenty degrees across, which is the ten-centimetre card held at
   thirty-three centimetres. Distortion inside that field is the macula
   reporting that its photoreceptors have been displaced. */
const MAX_SQUARES = 20;

const QUESTIONS = [
  {
    id: "dot",
    text: "Can you see the centre dot clearly while looking straight at it?",
    flagIf: false,
    label: "the centre dot missing or smudged",
  },
  {
    id: "wavy",
    text: "Do any lines look wavy, bent or pinched?",
    flagIf: true,
    label: "wavy, bent or pinched lines",
  },
  {
    id: "missing",
    text: "Is any part of the grid missing, grey or blacked out?",
    flagIf: true,
    label: "a missing, grey or black patch",
  },
  {
    id: "blurred",
    text: "Is one area blurred while the rest stays sharp?",
    flagIf: true,
    label: "one blurred area in an otherwise sharp grid",
  },
  {
    id: "corners",
    text: "Can you see all four corners without moving your eye?",
    flagIf: false,
    label: "a corner of the grid missing",
  },
];

const EYES = [
  { id: "right", label: "Right eye", cover: "Cover your left eye" },
  { id: "left", label: "Left eye", cover: "Cover your right eye" },
];

function Grid({ sizePx, step, squares }) {
  const lines = [];
  for (let i = 0; i <= squares; i++) {
    // Half-pixel offset: a 1 px stroke centred on an integer coordinate
    // straddles two pixel rows and renders grey.
    const at = i * step + 0.5;
    lines.push(<line key={`h${i}`} x1={0} y1={at} x2={sizePx} y2={at} />);
    lines.push(<line key={`v${i}`} x1={at} y1={0} x2={at} y2={sizePx} />);
  }
  return (
    <svg
      width={sizePx + 1}
      height={sizePx + 1}
      viewBox={`0 0 ${sizePx + 1} ${sizePx + 1}`}
      className="block bg-white"
      aria-hidden="true"
    >
      <g stroke="#111" strokeWidth={1} shapeRendering="crispEdges">
        {lines}
      </g>
      <circle cx={sizePx / 2} cy={sizePx / 2} r={Math.max(2.5, step / 4)} fill="#111" />
    </svg>
  );
}

export default function AmslerGrid({ cardWidthPx, onDone, onCancel }) {
  const hostRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [eyeIndex, setEyeIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});

  // Fixed at 33 cm: the distance the grid was designed for, and close enough to
  // a comfortable reading distance that people can actually hold it.
  const distanceCm = 33;
  // One degree per square, rounded to whole pixels: a fractional grid pitch
  // makes some lines land between pixels and render heavier than their
  // neighbours, which reads as exactly the unevenness the test asks about.
  const step = Math.max(6, Math.min(26, Math.round(mmPerDegree(distanceCm) * pxPerMm(cardWidthPx))));
  // Squares stay one degree wide whatever happens; it is the *extent* that
  // shrinks on a narrow screen. A twelve-degree grid still covers the macula,
  // whereas a squeezed twenty-degree one would be lying about its geometry.
  const squares = Math.max(8, Math.min(MAX_SQUARES, 2 * Math.floor(width / step / 2) || MAX_SQUARES));
  const sizePx = step * squares;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth - 24));
    ro.observe(el);
    setWidth(el.clientWidth - 24);
    return () => ro.disconnect();
  }, []);

  const eye = EYES[eyeIndex];
  const complete = QUESTIONS.every((q) => answers[q.id] !== undefined);

  const submit = () => {
    const flags = QUESTIONS.filter((q) => answers[q.id] === q.flagIf).map((q) => q.label);
    const next = { ...results, [eye.id]: { flags, answers } };
    setResults(next);
    setAnswers({});
    if (eyeIndex === EYES.length - 1) onDone(next);
    else setEyeIndex(eyeIndex + 1);
  };

  return (
    <div ref={hostRef} className="overflow-hidden rounded border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linesoft px-4 py-[9px]">
        <span className="label-cap text-ink3">
          {eye.label} · {eye.cover.toLowerCase()}
        </span>
        <span className="num font-mono text-[0.72rem] text-ink3">
          hold {distanceCm} cm away · {squares}° field
        </span>
      </div>

      <div className="grid min-w-0 gap-5 p-4 lg:grid-cols-[auto_1fr]">
        <div className="flex min-w-0 justify-center">
          <div className="rounded border border-line p-2">
            <Grid sizePx={sizePx} step={step} squares={squares} />
          </div>
        </div>

        <div className="min-w-0">
          <p className="max-w-[60ch] text-[0.87rem] leading-relaxed text-ink2">
            Wear your reading glasses if you use them. Hold the screen {distanceCm} cm away, cover
            one eye, and stare only at the centre dot — do not let your eye wander over the grid.
            Then answer for the whole grid as it appears in your peripheral vision.
          </p>

          <ul className="m-0 mt-4 list-none p-0">
            {QUESTIONS.map((q) => (
              <li key={q.id} className="grid gap-2 border-t border-linesoft py-[10px] sm:grid-cols-[1fr_auto]">
                <span className="text-[0.87rem] text-ink">{q.text}</span>
                <span className="flex shrink-0 gap-[6px]">
                  {[
                    ["Yes", true],
                    ["No", false],
                  ].map(([label, value]) => (
                    <button
                      key={label}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: value }))}
                      aria-pressed={answers[q.id] === value}
                      className={`min-w-[54px] rounded border px-3 py-1 text-[0.8rem] transition-colors ${
                        answers[q.id] === value
                          ? "border-fundus bg-fundus text-on-accent"
                          : "border-line text-ink2 hover:border-ink3 hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-2">
            <button
              onClick={submit}
              disabled={!complete}
              className="rounded border border-fundus bg-fundus px-4 py-2 text-[0.85rem] text-on-accent disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink3"
            >
              {eyeIndex === EYES.length - 1 ? "Finish" : "Next eye"}
            </button>
            <button
              onClick={onCancel}
              className="rounded border border-line px-4 py-2 text-[0.85rem] text-ink2 hover:text-ink"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
