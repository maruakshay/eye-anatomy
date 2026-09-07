import { useEffect, useState } from "react";
import AcuityTest from "./AcuityTest.jsx";
import AmslerGrid from "./AmslerGrid.jsx";
import AstigmatismDial from "./AstigmatismDial.jsx";
import ColorPlates from "./ColorPlates.jsx";
import ContrastTest from "./ContrastTest.jsx";
import {
  ACUITY_FOOTNOTE,
  CARD_ASPECT,
  CARD_MM,
  mmPerPx,
  readAcuity,
  readContrast,
} from "../lib/visionTest.js";

const STORE_KEY = "eye-atlas.calibration";

const TESTS = [
  {
    id: "acuity",
    name: "Letter acuity",
    what: "How fine a detail each eye can resolve, one eye at a time, scored the way a clinic scores it.",
    finds: "Uncorrected or out-of-date prescriptions, and any large difference between the two eyes.",
    needs: "distance",
  },
  {
    id: "amsler",
    name: "Amsler grid",
    what: "A 20° grid stared at from 33 cm, checking the centre of the field for distortion.",
    finds: "Macular problems: wet AMD, macular oedema, an epiretinal membrane pulling on the fovea.",
  },
  {
    id: "astigmatism",
    name: "Astigmatism dial",
    what: "A fan of spokes that goes unevenly grey when the eye has two different powers in it.",
    finds: "Uncorrected astigmatism, and glasses whose cylinder axis has drifted.",
  },
  {
    id: "contrast",
    name: "Contrast",
    what: "The same large letter, fading toward the colour of the page.",
    finds: "Early cataract, corneal oedema and optic nerve disease, which often spare the letter chart.",
    needs: "distance",
  },
  {
    id: "color",
    name: "Colour plates",
    what: "Generated pseudo-isochromatic plates, where the number is carried by hue alone.",
    finds: "Inherited red–green deficiency. Poorly, on an uncalibrated screen — but well enough to prompt a proper check.",
  },
];

const TONE = {
  good: "text-fluor",
  watch: "text-amber",
  bad: "text-fundus",
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* private windows and blocked storage both land here; defaults are fine */
  }
  return null;
}

function Calibration({ cardWidthPx, distanceCm, onChange, open, onOpen }) {
  if (!open) {
    return (
      <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-md border border-line bg-surface px-4 py-[10px]">
        <span className="num font-mono text-[0.74rem] text-ink3">
          calibrated · {(mmPerPx(cardWidthPx) * 1000).toFixed(0)} µm per pixel · {distanceCm} cm
          away
        </span>
        <button onClick={onOpen} className="text-[0.78rem] text-ink3 underline hover:text-ink">
          Recalibrate
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-cobalt bg-cobalt-wash/60 p-4">
      <p className="label-cap text-cobalt">Step one · calibrate the screen</p>
      <div className="mt-3 grid gap-5 lg:grid-cols-[auto_1fr]">
        <div>
          <div
            className="rounded-[9px] border-2 border-dashed border-cobalt bg-surface"
            style={{ width: cardWidthPx, height: Math.round(cardWidthPx * CARD_ASPECT) }}
          >
            <div className="flex h-full flex-col justify-end p-2">
              <span className="num font-mono text-[0.6rem] text-ink3">{CARD_MM} mm</span>
            </div>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <p className="max-w-[62ch] text-[0.87rem] leading-relaxed text-ink2">
            Hold any bank card against the box and drag until the two match exactly. Every card on
            earth is 85.6 mm wide, which turns your unknown screen into a ruler — without it, a
            letter on this page has no known size and an acuity score means nothing.
          </p>

          <label className="grid gap-[5px]">
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-[0.8rem] text-ink2">Card width</span>
              <span className="num font-mono text-[0.85rem] text-ink">
                {cardWidthPx} px · {(mmPerPx(cardWidthPx) * 1000).toFixed(0)} µm per pixel
              </span>
            </span>
            <input
              type="range"
              min="180"
              max="700"
              step="1"
              value={cardWidthPx}
              onChange={(e) => onChange({ cardWidthPx: Number(e.target.value) })}
              className="w-full"
            />
          </label>

          <label className="grid gap-[5px]">
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-[0.8rem] text-ink2">
                How far your eyes are from the screen
              </span>
              <span className="num font-mono text-[0.85rem] text-ink">{distanceCm} cm</span>
            </span>
            <input
              type="range"
              min="30"
              max="400"
              step="5"
              value={distanceCm}
              onChange={(e) => onChange({ distanceCm: Number(e.target.value) })}
              className="w-full"
            />
            <span className="font-mono text-[0.66rem] text-ink3">
              200 cm or more lets this screen draw a true 20/20 line. Measure it, do not guess —
              an error here scales the whole result.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function Row({ term, children, tone }) {
  return (
    <div className="grid gap-1 border-t border-linesoft py-[10px] sm:grid-cols-[190px_1fr]">
      <span className="label-cap text-ink3">{term}</span>
      <span className={`text-[0.87rem] leading-relaxed ${tone ? TONE[tone] : "text-ink"}`}>
        {children}
      </span>
    </div>
  );
}

function AcuityResult({ result }) {
  const eyes = [
    ["Right eye", result.right],
    ["Left eye", result.left],
  ];
  const both = eyes.map(([, r]) => r).filter(Boolean);
  const gap =
    both.length === 2 ? Math.abs(both[0].logMAR - both[1].logMAR) : null;

  return (
    <>
      {eyes.map(([label, r]) => {
        const read = readAcuity(r);
        return (
          <Row key={label} term={label} tone={read.tone}>
            {r ? (
              <>
                <span className="num font-mono">{r.snellen}</span> · {r.metric} · logMAR{" "}
                {r.logMAR.toFixed(2)} — {read.text}
                {r.floored && " Limited by this screen, so it may be better than shown."}
              </>
            ) : (
              read.text
            )}
          </Row>
        );
      })}
      {gap !== null && gap >= 0.2 && (
        <Row term="Difference" tone="watch">
          The two eyes differ by {gap.toFixed(2)} logMAR — two chart lines or more. A gap that size
          is worth an examination even when the better eye is perfect, because the brain hides it
          completely while both eyes are open.
        </Row>
      )}
    </>
  );
}

export default function VisionTest() {
  const [cal, setCal] = useState(() => load() ?? { cardWidthPx: 340, distanceCm: 200 });
  const [calOpen, setCalOpen] = useState(true);
  const [active, setActive] = useState(null);
  const [results, setResults] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cal));
    } catch {
      /* nothing to do: calibration simply will not persist */
    }
  }, [cal]);

  const finish = (id) => (payload) => {
    setResults((r) => ({ ...r, [id]: payload }));
    setActive(null);
  };

  const common = {
    cardWidthPx: cal.cardWidthPx,
    distanceCm: cal.distanceCm,
    onCancel: () => setActive(null),
  };

  const amsler = results.amsler;
  const amslerFlags = amsler
    ? [
        ...(amsler.right?.flags ?? []).map((f) => `right eye: ${f}`),
        ...(amsler.left?.flags ?? []).map((f) => `left eye: ${f}`),
      ]
    : [];
  const color = results.color;
  const colorControlOk = color?.find((a) => a.kind === "control")?.correct;
  const colorMissed = color?.filter((a) => a.kind === "red-green" && !a.correct).length ?? 0;
  const contrast = results.contrast;
  const contrastRead = contrast ? readContrast(contrast.lowestPassed) : null;

  return (
    <div className="grid gap-5">
      <p className="max-w-[74ch] text-[0.88rem] leading-relaxed text-ink2">
        These are screening tests, not an examination. They measure what you can report about your
        own vision on a screen you calibrated yourself — which is genuinely useful for catching a
        change, and useless for excluding disease. Nothing here is stored anywhere but this
        browser.
      </p>

      <Calibration
        cardWidthPx={cal.cardWidthPx}
        distanceCm={cal.distanceCm}
        onChange={(patch) => setCal((c) => ({ ...c, ...patch }))}
        open={calOpen && !active}
        onOpen={() => setCalOpen(true)}
      />

      {active === "acuity" && <AcuityTest {...common} onDone={finish("acuity")} />}
      {active === "amsler" && (
        <AmslerGrid cardWidthPx={cal.cardWidthPx} onDone={finish("amsler")} onCancel={common.onCancel} />
      )}
      {active === "astigmatism" && (
        <AstigmatismDial onDone={finish("astigmatism")} onCancel={common.onCancel} />
      )}
      {active === "contrast" && <ContrastTest {...common} onDone={finish("contrast")} />}
      {active === "color" && <ColorPlates onDone={finish("color")} onCancel={common.onCancel} />}

      {!active && (
        <div className="rounded-md border border-line bg-surface">
          <p className="label-cap border-b border-linesoft px-4 py-[10px] text-ink3">
            Step two · pick a test
          </p>
          <ul className="m-0 list-none p-0">
            {TESTS.map((t) => {
              const done = results[t.id] !== undefined;
              return (
                <li
                  key={t.id}
                  className="grid gap-x-6 gap-y-2 border-b border-linesoft px-4 py-4 last:border-b-0 lg:grid-cols-[1fr_150px]"
                >
                  <div>
                    <p className="flex items-baseline gap-2 text-[0.95rem] font-medium text-ink">
                      {t.name}
                      {done && <span className="label-cap text-fluor">done</span>}
                      {t.needs === "distance" && (
                        <span className="label-cap text-ink3">at {cal.distanceCm} cm</span>
                      )}
                    </p>
                    <p className="mt-1 max-w-[68ch] text-[0.85rem] leading-relaxed text-ink2">
                      {t.what}
                    </p>
                    <p className="mt-1 max-w-[68ch] text-[0.8rem] leading-relaxed text-ink3">
                      Picks up: {t.finds}
                    </p>
                  </div>
                  <div className="lg:text-right">
                    <button
                      onClick={() => {
                        setCalOpen(false);
                        setActive(t.id);
                      }}
                      className="rounded border border-cobalt bg-cobalt-wash px-4 py-2 text-[0.84rem] text-ink transition-colors hover:bg-cobalt hover:text-on-accent"
                    >
                      {done ? "Test again" : "Start"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!active && Object.keys(results).length > 0 && (
        <div className="rounded-md border border-line bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="label-cap text-ink3">What you found</p>
            <button
              onClick={() => setResults({})}
              className="text-[0.78rem] text-ink3 underline hover:text-ink"
            >
              Clear results
            </button>
          </div>

          <div className="mt-2">
            {results.acuity && <AcuityResult result={results.acuity} />}

            {amsler && (
              <Row term="Amsler grid" tone={amslerFlags.length ? "bad" : "good"}>
                {amslerFlags.length ? (
                  <>
                    Reported: {amslerFlags.join("; ")}. New distortion of straight lines is the
                    classic symptom of wet AMD, where treatment works and delay costs vision
                    permanently. Get an eye examination within days, not weeks.
                  </>
                ) : (
                  "No distortion or missing area reported in either eye."
                )}
              </Row>
            )}

            {results.astigmatism && (
              <Row term="Astigmatism dial" tone={results.astigmatism.even ? "good" : "watch"}>
                {results.astigmatism.even
                  ? "All spokes equally black — no astigmatic blur showing on this dial."
                  : `The ${results.astigmatism.hour} o'clock line reads darkest, which corresponds to a cylinder axis near ${results.astigmatism.axis}°. That is a hint for a refraction to confirm, not a prescription.`}
              </Row>
            )}

            {contrast && (
              <Row term="Contrast" tone={contrastRead.tone}>
                {contrast.lowestPassed === null
                  ? contrastRead.text
                  : `Read letters down to ${(contrast.lowestPassed * 100).toFixed(
                      contrast.lowestPassed < 0.05 ? 1 : 0,
                    )}% contrast. ${contrastRead.text}`}
              </Row>
            )}

            {color && (
              <Row
                term="Colour plates"
                tone={!colorControlOk ? "watch" : colorMissed ? "watch" : "good"}
              >
                {!colorControlOk
                  ? "The control plate was misread, so this run says nothing about your colour vision — it says the screen, the lighting or the viewing angle needs fixing first."
                  : colorMissed === 0
                    ? "All plates read correctly, which makes a significant red–green deficiency unlikely."
                    : `${colorMissed} of the red–green plates misread. On an uncalibrated screen that is a prompt for proper Ishihara plates under a daylight lamp, not a diagnosis.`}
              </Row>
            )}
          </div>

          <p className="mt-4 border-t border-line pt-3 text-[0.83rem] leading-relaxed text-ink3">
            {ACUITY_FOOTNOTE} Nothing on this page can measure your eye pressure, see your optic
            nerve or your retina, or detect a tumour. A dilated examination does all three, and
            every one of those conditions is silent until it is not. If anything here changed
            suddenly, or came with pain, floaters, flashes or a curtain across your vision, read
            the Red flags tab instead of retaking a test.
          </p>
        </div>
      )}
    </div>
  );
}
