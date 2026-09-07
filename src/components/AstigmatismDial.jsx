import { useState } from "react";

/* A clock dial. A single-meridian blur means the two principal meridians of
   the eye are not equally powered — one set of spokes lands in focus while the
   set at right angles to it does not. The darkest hour, multiplied by thirty,
   is the axis a refraction would put the minus cylinder on. */
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const SIZE = 300;

function Dial() {
  const c = SIZE / 2;
  const rOuter = c - 26;
  const rInner = c * 0.24;
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block bg-white" aria-hidden="true">
      {/* Two spokes per hour, ten degrees apart, as on a printed fan dial. */}
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * 10 - 90) * (Math.PI / 180);
        return (
          <line
            key={i}
            x1={c + Math.cos(a) * rInner}
            y1={c + Math.sin(a) * rInner}
            x2={c + Math.cos(a) * rOuter}
            y2={c + Math.sin(a) * rOuter}
            stroke="#111"
            strokeWidth={2.2}
            strokeLinecap="butt"
          />
        );
      })}
      {HOURS.map((h) => {
        const a = (h * 30 - 90) * (Math.PI / 180);
        return (
          <text
            key={h}
            x={c + Math.cos(a) * (rOuter + 14)}
            y={c + Math.sin(a) * (rOuter + 14) + 4}
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
            fill="#111"
          >
            {h}
          </text>
        );
      })}
      <circle cx={c} cy={c} r={3} fill="#111" />
    </svg>
  );
}

export default function AstigmatismDial({ onDone, onCancel }) {
  const [even, setEven] = useState(null);
  const [hour, setHour] = useState(null);

  const finish = () => {
    if (even) return onDone({ even: true });
    const axis = (hour * 30) % 180;
    onDone({ even: false, hour, axis });
  };

  return (
    <div className="rounded border border-line bg-surface">
      <div className="border-b border-linesoft px-4 py-[9px]">
        <span className="label-cap text-ink3">Astigmatism dial · one eye at a time</span>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <div className="rounded border border-line p-2">
            <Dial />
          </div>
        </div>

        <div>
          <p className="max-w-[60ch] text-[0.87rem] leading-relaxed text-ink2">
            Take your glasses off if the blur they correct is what you want to look for; keep them
            on to check whether they are still right. Cover one eye, look at the centre, and let
            the whole fan sit slightly out of focus — step back until it does. Astigmatism shows
            itself as one direction of lines staying black while the lines at right angles to it go
            grey.
          </p>

          <div className="mt-4 border-t border-linesoft pt-3">
            <p className="text-[0.87rem] text-ink">Do all the spokes look equally black?</p>
            <div className="mt-2 flex gap-[6px]">
              {[
                ["Yes, all even", true],
                ["No, some are darker", false],
              ].map(([label, value]) => (
                <button
                  key={label}
                  onClick={() => {
                    setEven(value);
                    setHour(null);
                  }}
                  aria-pressed={even === value}
                  className={`rounded border px-3 py-[6px] text-[0.82rem] transition-colors ${
                    even === value
                      ? "border-fundus bg-fundus text-on-accent"
                      : "border-line text-ink2 hover:border-ink3 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {even === false && (
            <div className="mt-4 border-t border-linesoft pt-3">
              <p className="text-[0.87rem] text-ink">
                Which hour on the clock holds the darkest, sharpest line?
              </p>
              <div className="mt-2 flex flex-wrap gap-[6px]">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHour(h)}
                    aria-pressed={hour === h}
                    className={`num min-w-[40px] rounded border px-3 py-[6px] font-mono text-[0.85rem] transition-colors ${
                      hour === h
                        ? "border-fundus bg-fundus text-on-accent"
                        : "border-line text-ink2 hover:border-ink3 hover:text-ink"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={finish}
              disabled={even === null || (even === false && hour === null)}
              className="rounded border border-fundus bg-fundus px-4 py-2 text-[0.85rem] text-on-accent disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink3"
            >
              Record
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
