import { useEffect, useRef, useState } from "react";
import { PLATES, plateDots } from "../lib/visionTest.js";

const SIZE = 320;

/** Draws one plate: dots packed into a disc, coloured by whether they fall
    inside the glyph. The number is carried by hue alone — never by lightness,
    which is what makes it a colour test rather than a reading test. */
function drawPlate(canvas, plate) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // The glyph is rasterised once into an offscreen mask and then sampled, so
  // the dots decide their own colour without any per-dot text measurement.
  const mask = document.createElement("canvas");
  mask.width = SIZE;
  mask.height = SIZE;
  const mctx = mask.getContext("2d");
  mctx.fillStyle = "#000";
  mctx.textAlign = "center";
  mctx.textBaseline = "middle";
  mctx.font = `800 ${SIZE * 0.66}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  // Stroked as well as filled: a digit two dots wide reads as a smear, so the
  // glyph is thickened until each stroke is four or five dots across.
  mctx.lineWidth = SIZE * 0.026;
  mctx.lineJoin = "round";
  mctx.strokeStyle = "#000";
  mctx.fillText(plate.figure, SIZE / 2, SIZE / 2 + SIZE * 0.02, SIZE * 0.62);
  mctx.strokeText(plate.figure, SIZE / 2, SIZE / 2 + SIZE * 0.02, SIZE * 0.62);
  const alpha = mctx.getImageData(0, 0, SIZE, SIZE).data;

  const inFigure = (x, y) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) return 0;
    return alpha[(py * SIZE + px) * 4 + 3] > 140 ? 1 : 0;
  };

  const dots = plateDots(SIZE, Math.random, inFigure);

  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = "#f2efe9";
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  for (const d of dots) {
    const palette = d.inFigure ? plate.fg : plate.bg;
    ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function ColorPlates({ onDone, onCancel }) {
  const canvasRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState("");
  const [answers, setAnswers] = useState([]);

  const plate = PLATES[index];

  useEffect(() => {
    if (canvasRef.current) drawPlate(canvasRef.current, plate);
  }, [plate]);

  const submit = (value) => {
    const answer = {
      id: plate.id,
      kind: plate.kind,
      figure: plate.figure,
      given: value,
      correct: value === plate.figure,
    };
    const next = [...answers, answer];
    setAnswers(next);
    setGiven("");
    if (index === PLATES.length - 1) onDone(next);
    else setIndex(index + 1);
  };

  return (
    <div className="rounded border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linesoft px-4 py-[9px]">
        <span className="label-cap text-ink3">Colour · both eyes open</span>
        <span className="num font-mono text-[0.72rem] text-ink3">
          plate {index + 1}/{PLATES.length}
        </span>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            style={{ width: SIZE, height: SIZE }}
            className="block rounded-full"
            aria-label="Colour vision plate"
          />
        </div>

        <div>
          <p className="max-w-[60ch] text-[0.87rem] leading-relaxed text-ink2">
            What number is in the dots? Answer in a few seconds — staring lets you piece the shape
            together from lightness instead of colour, which defeats the plate. Use daylight if you
            can, and do not tilt a laptop screen: the colours shift with the angle.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-linesoft pt-4">
            <input
              value={given}
              onChange={(e) => setGiven(e.target.value.replace(/\D/g, "").slice(0, 2))}
              onKeyDown={(e) => e.key === "Enter" && given && submit(given)}
              inputMode="numeric"
              placeholder="00"
              aria-label="The number you see"
              className="num w-[74px] rounded border border-line bg-ground px-3 py-2 text-center font-mono text-[1rem] text-ink"
            />
            <button
              onClick={() => submit(given)}
              disabled={!given}
              className="rounded border border-fundus bg-fundus px-4 py-2 text-[0.85rem] text-on-accent disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink3"
            >
              {index === PLATES.length - 1 ? "Finish" : "Next plate"}
            </button>
            <button
              onClick={() => submit("")}
              className="rounded border border-line px-3 py-2 text-[0.82rem] text-ink2 hover:text-ink"
            >
              No number
            </button>
            <button
              onClick={onCancel}
              className="ml-auto text-[0.78rem] text-ink3 underline hover:text-ink"
            >
              Back
            </button>
          </div>

          <p className="mt-4 border-t border-linesoft pt-3 text-[0.8rem] leading-relaxed text-ink3">
            Inherited red–green deficiency affects about one man in twelve and one woman in two
            hundred, is present from birth, and does not change. Colour vision that
            <em> changes</em> — especially in one eye, especially with reds looking washed out — is
            a different matter entirely, and points at the optic nerve.
          </p>
        </div>
      </div>
    </div>
  );
}
