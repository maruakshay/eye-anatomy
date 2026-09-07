import { useEffect, useState } from "react";
import {
  CONTRAST_LETTERS,
  CONTRAST_PASS,
  CONTRAST_STEPS,
  SLOAN,
  letterHeightPx,
  pxPerArcmin,
} from "../lib/visionTest.js";

const CAP_RATIO = 0.72;

/* Letters are held at 20/60 — comfortably large — and only the contrast falls.
   That separates a resolution problem from a contrast problem, which is the
   distinction that matters in early cataract, corneal oedema and optic
   neuropathy, where the letter chart can stay stubbornly normal. */
const LETTER_LOGMAR = 0.5;

const shuffled = () => [...SLOAN].sort(() => Math.random() - 0.5);

export default function ContrastTest({ cardWidthPx, distanceCm, onDone, onCancel }) {
  const ppa = pxPerArcmin(cardWidthPx, distanceCm);
  const height = letterHeightPx(LETTER_LOGMAR, ppa);

  const [stepIndex, setStepIndex] = useState(0);
  const [letters, setLetters] = useState(() => shuffled().slice(0, CONTRAST_LETTERS));
  const [answered, setAnswered] = useState([]);
  const [lowestPassed, setLowestPassed] = useState(null);

  const answer = (choice) => {
    const next = [...answered, choice];
    setAnswered(next);
    if (next.length < CONTRAST_LETTERS) return;

    const correct = next.filter((c, i) => c === letters[i]).length;
    const passed = correct >= CONTRAST_PASS;
    const step = CONTRAST_STEPS[stepIndex];
    const bestSoFar = passed ? step : lowestPassed;
    setLowestPassed(bestSoFar ?? null);

    if (passed && stepIndex + 1 < CONTRAST_STEPS.length) {
      setStepIndex(stepIndex + 1);
      setLetters(shuffled().slice(0, CONTRAST_LETTERS));
      setAnswered([]);
    } else {
      onDone({ lowestPassed: bestSoFar ?? null, floored: passed });
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toUpperCase();
      if (SLOAN.includes(k)) answer(k);
      if (e.key === " ") {
        e.preventDefault();
        answer("?");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const contrast = CONTRAST_STEPS[stepIndex];
  // Weber contrast against a white page: the ink is (1 − c) of the background.
  const ink = Math.round(255 * (1 - contrast));

  return (
    <div className="rounded border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linesoft px-4 py-[9px]">
        <span className="label-cap text-ink3">Contrast · both eyes open</span>
        <span className="num font-mono text-[0.72rem] text-ink3">
          {(contrast * 100).toFixed(contrast < 0.05 ? 1 : 0)}% contrast · letter{" "}
          {answered.length + 1}/{CONTRAST_LETTERS}
        </span>
      </div>

      <div
        className="flex min-h-[190px] items-center justify-center overflow-hidden px-4 py-8"
        style={{ background: "#fff" }}
      >
        <span
          className="block font-sans leading-none font-bold select-none"
          style={{ fontSize: `${height / CAP_RATIO}px`, color: `rgb(${ink},${ink},${ink})` }}
          aria-hidden="true"
        >
          {letters[answered.length]}
        </span>
      </div>

      <div className="border-t border-linesoft px-3 py-3">
        <p className="mb-2 text-center text-[0.78rem] text-ink3">
          Turn your screen brightness up and kill any reflections first — both change this result
          more than most eye disease does.
        </p>
        <div className="flex flex-wrap justify-center gap-[6px]">
          {SLOAN.map((l) => (
            <button
              key={l}
              onClick={() => answer(l)}
              className="num min-w-[42px] rounded border border-line bg-surface px-3 py-2 font-mono text-[0.95rem] text-ink transition-colors hover:border-fundus hover:bg-fundus hover:text-on-accent"
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => answer("?")}
            className="rounded border border-line bg-surface px-3 py-2 font-mono text-[0.8rem] text-ink3 transition-colors hover:border-ink3 hover:text-ink"
          >
            Nothing there
          </button>
        </div>
        <div className="mt-3 text-center">
          <button onClick={onCancel} className="text-[0.78rem] text-ink3 underline hover:text-ink">
            Stop and go back
          </button>
        </div>
      </div>
    </div>
  );
}
