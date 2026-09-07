import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LETTERS_PER_LINE,
  PASS_PER_LINE,
  SLOAN,
  acuityFor,
  letterHeightPx,
  pxPerArcmin,
  scoreAcuity,
  usableSteps,
} from "../lib/visionTest.js";

/* A rendered letter's cap height is not its font size. For the bold sans
   stacks below it lands near 0.72 em, and that ratio is what keeps a "20/20"
   letter five arcminutes tall rather than seven. */
const CAP_RATIO = 0.72;

const EYES = [
  { id: "right", label: "Right eye", cover: "Cover your LEFT eye" },
  { id: "left", label: "Left eye", cover: "Cover your RIGHT eye" },
];

const shuffled = () => [...SLOAN].sort(() => Math.random() - 0.5);

export default function AcuityTest({ cardWidthPx, distanceCm, onDone, onCancel }) {
  const hostRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const ppa = pxPerArcmin(cardWidthPx, distanceCm);
  const steps = useMemo(
    () => (width ? usableSteps(cardWidthPx, distanceCm, Math.min(width - 32, 360)) : []),
    [cardWidthPx, distanceCm, width],
  );

  const [eyeIndex, setEyeIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [letters, setLetters] = useState([]);
  const [answered, setAnswered] = useState([]);
  const [lines, setLines] = useState([]);
  const [results, setResults] = useState({});

  const startLine = useCallback((index) => {
    setStepIndex(index);
    setLetters(shuffled().slice(0, LETTERS_PER_LINE));
    setAnswered([]);
  }, []);

  useEffect(() => {
    if (ready && !letters.length) startLine(stepIndex);
  }, [ready, letters.length, stepIndex, startLine]);

  const finishEye = (allLines) => {
    const eye = EYES[eyeIndex].id;
    const next = { ...results, [eye]: scoreAcuity(allLines) };
    setResults(next);
    setLines([]);
    setLetters([]);
    setStepIndex(0);
    if (eyeIndex === EYES.length - 1) onDone(next);
    else {
      setEyeIndex(eyeIndex + 1);
      setReady(false);
    }
  };

  const answer = (choice) => {
    const nextAnswered = [...answered, choice];
    setAnswered(nextAnswered);
    if (nextAnswered.length < LETTERS_PER_LINE) return;

    const correct = nextAnswered.filter((c, i) => c === letters[i]).length;
    const allLines = [...lines, { logMAR: steps[stepIndex], correct }];
    setLines(allLines);

    const smallerExists = stepIndex + 1 < steps.length;
    if (correct >= PASS_PER_LINE && smallerExists) startLine(stepIndex + 1);
    else finishEye(allLines);
  };

  // Keyboard entry: on a laptop, typing the letter is faster than aiming at it.
  useEffect(() => {
    if (!ready) return;
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

  const eye = EYES[eyeIndex];

  if (!width || steps.length < 3) {
    return (
      <div ref={hostRef} className="rounded border border-line bg-surface p-5 text-[0.87rem] text-ink2">
        {width
          ? `At ${distanceCm} cm this screen can only draw ${steps.length} chart line${
              steps.length === 1 ? "" : "s"
            } honestly. Move further back, or use a larger display.`
          : "Measuring the chart…"}
      </div>
    );
  }

  if (!ready) {
    return (
      <div ref={hostRef} className="rounded border border-line bg-surface p-6">
        <p className="label-cap text-ink3">{eye.label}</p>
        <h4 className="mt-2 font-display text-[1.3rem]">{eye.cover}</h4>
        <p className="mt-2 max-w-[60ch] text-[0.87rem] leading-relaxed text-ink2">
          Use your palm, not your fingers, and do not press on the eye. Keep your glasses or
          contact lenses on if you normally wear them for distance — this measures the vision you
          actually walk around with. Stay {distanceCm} cm away, and read each letter aloud before
          you press it. Guessing is expected: press the closest letter, or Space if there is
          nothing there.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setReady(true)}
            className="rounded border border-fundus bg-fundus px-4 py-2 text-[0.85rem] text-on-accent"
          >
            Start {eye.label.toLowerCase()}
          </button>
          <button
            onClick={onCancel}
            className="rounded border border-line px-4 py-2 text-[0.85rem] text-ink2 hover:text-ink"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const logMAR = steps[stepIndex];
  const height = letterHeightPx(logMAR, ppa);
  const current = letters[answered.length];

  return (
    <div ref={hostRef} className="rounded border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linesoft px-4 py-[9px]">
        <span className="label-cap text-ink3">
          {eye.label} · {eye.cover.toLowerCase()}
        </span>
        <span className="num font-mono text-[0.72rem] text-ink3">
          line {acuityFor(logMAR).snellen} · letter {answered.length + 1}/{LETTERS_PER_LINE}
        </span>
      </div>

      <div className="flex min-h-[190px] items-center justify-center overflow-hidden px-4 py-8">
        <span
          className="block font-sans leading-none font-bold text-ink select-none"
          style={{ fontSize: `${height / CAP_RATIO}px` }}
          aria-hidden="true"
        >
          {current}
        </span>
      </div>

      <div className="border-t border-linesoft px-3 py-3">
        <p className="mb-2 text-center text-[0.78rem] text-ink3">
          Which letter is it? Typing works too.
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
      </div>
    </div>
  );
}
