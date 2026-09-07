import { useMemo, useState } from "react";
import RayDiagram from "./RayDiagram.jsx";
import { SnellenPreview, ReadingPreview } from "./VisionPreview.jsx";
import {
  PRESETS,
  amplitude,
  analyse,
  blurArcmin,
  estimateAcuity,
  formatRx,
  readingAdd,
  retinalPlaneDioptres,
  signed,
  solve,
  toCornealPlane,
} from "../lib/optics.js";

function Slider({ label, value, unit, min, max, step, onChange, hint }) {
  return (
    <label className="grid gap-[5px]">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8rem] text-ink2">{label}</span>
        <span className="num font-mono text-[0.85rem] text-ink">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {hint && <span className="font-mono text-[0.66rem] text-ink3">{hint}</span>}
    </label>
  );
}

function Readout({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-t border-linesoft py-[7px] text-[0.83rem]">
      <span className="text-ink3">{term}</span>
      <span className="num text-right font-mono text-ink">{children}</span>
    </div>
  );
}

export default function FocusSimulator() {
  const [eye, setEye] = useState(PRESETS[1].eye);
  const [presetId, setPresetId] = useState(PRESETS[1].id);
  const [corrected, setCorrected] = useState(false);
  const [accom, setAccom] = useState(0);

  const set = (patch) => {
    setEye((e) => ({ ...e, ...patch }));
    setPresetId(null);
  };

  const applyPreset = (p) => {
    setEye(p.eye);
    setPresetId(p.id);
    setAccom(0);
  };

  const rx = useMemo(() => analyse(eye), [eye]);
  const amp = amplitude(eye.age);
  const maxAccom = Math.round(amp.min * 4) / 4;
  const usedAccom = Math.min(accom, maxAccom);

  const distance = useMemo(() => solve(eye, { corrected }), [eye, corrected]);
  const near = useMemo(
    () =>
      solve(eye, {
        corrected,
        distanceCm: 40,
        addWorn: corrected ? readingAdd(eye.age) : 0,
      }),
    [eye, corrected],
  );

  // The ray diagram shows distant light with whatever accommodation the slider
  // is holding — which is how a young hyperope hides their prescription
  // entirely, at the cost of never relaxing.
  const diagramAnalysis = useMemo(() => {
    const base = eye.cornea + eye.lens + eye.toricity / 2;
    const atEye = corrected ? toCornealPlane(rx.sphere + rx.cylinder / 2) : 0;
    const defocus = retinalPlaneDioptres(eye.axialLength) - (base + usedAccom + atEye);
    return {
      ...rx,
      blurArcmin: Math.abs(blurArcmin(defocus, eye.pupil, eye.axialLength)),
      acuity: estimateAcuity(defocus),
    };
  }, [eye, corrected, usedAccom, rx]);

  const preset = PRESETS.find((p) => p.id === presetId);

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_-16px_rgba(0,0,0,0.25)]">
      <div className="grid lg:grid-cols-[1fr_318px]">
        {/* ------------------------------- stage ------------------------------ */}
        <div className="min-w-0">
          <RayDiagram
            eye={eye}
            analysis={diagramAnalysis}
            corrected={corrected}
            accommodation={usedAccom}
          />
        </div>

        {/* ------------------------------- panel ------------------------------ */}
        <aside className="flex flex-col gap-5 border-line p-5 max-lg:border-t lg:border-l">
          <div>
            <p className="label-cap mb-2 text-ink3">Start from a real eye</p>
            <div className="flex flex-wrap gap-[6px]">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  aria-pressed={presetId === p.id}
                  className={`rounded-full border px-[10px] py-[5px] text-[0.78rem] transition-colors ${
                    presetId === p.id
                      ? "border-fundus bg-fundus text-on-accent"
                      : "border-line bg-surface2 text-ink2 hover:border-ink3 hover:text-ink"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {preset && (
              <p className="mt-3 text-[0.82rem] leading-relaxed text-ink2">{preset.note}</p>
            )}
          </div>

          <div className="grid gap-[13px] border-t border-line pt-4">
            <Slider
              label="Axial length"
              value={eye.axialLength.toFixed(1)}
              unit=" mm"
              min={20}
              max={30}
              step={0.1}
              onChange={(v) => set({ axialLength: v })}
              hint="24.0 mm is average · 1 mm ≈ 2.5 D"
            />
            <Slider
              label="Corneal power"
              value={eye.cornea.toFixed(1)}
              unit=" D"
              min={36}
              max={54}
              step={0.5}
              onChange={(v) => set({ cornea: v })}
              hint="43 D is average"
            />
            <Slider
              label="Corneal toricity"
              value={eye.toricity.toFixed(2)}
              unit=" D"
              min={0}
              max={5}
              step={0.25}
              onChange={(v) => set({ toricity: v })}
              hint="the difference between the two meridians"
            />
            {eye.toricity > 0.1 && (
              <Slider
                label="Axis"
                value={eye.axis}
                unit="°"
                min={0}
                max={180}
                step={5}
                onChange={(v) => set({ axis: v })}
              />
            )}
            <Slider
              label="Age"
              value={eye.age}
              unit=" yrs"
              min={6}
              max={85}
              step={1}
              onChange={(v) => set({ age: v })}
              hint={`amplitude of accommodation ≈ ${amp.min.toFixed(2)} D`}
            />
            <Slider
              label="Pupil"
              value={eye.pupil.toFixed(1)}
              unit=" mm"
              min={1.5}
              max={8}
              step={0.1}
              onChange={(v) => set({ pupil: v })}
              hint="a wider pupil blurs more — hence squinting"
            />
            <Slider
              label="Accommodating"
              value={usedAccom.toFixed(2)}
              unit=" D"
              min={0}
              max={Math.max(0.25, maxAccom)}
              step={0.25}
              onChange={setAccom}
              hint={`this eye has ${maxAccom.toFixed(2)} D left to spend`}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-[9px] rounded border border-cobalt bg-cobalt-wash px-3 py-[9px] text-[0.86rem] text-ink">
            <input
              type="checkbox"
              checked={corrected}
              onChange={(e) => setCorrected(e.target.checked)}
              className="m-0 accent-[var(--color-cobalt)]"
            />
            Put the glasses on
          </label>

          <div className="grid gap-2 border-t border-line pt-4">
            <p className="label-cap text-ink3">The prescription this eye needs</p>
            <p className="num font-mono text-[1.5rem] leading-tight tracking-[-0.02em] text-fundus">
              {formatRx(rx)}
            </p>
            {rx.add > 0 && (
              <p className="num font-mono text-[0.9rem] text-ink2">
                ADD {signed(rx.add)} for reading
              </p>
            )}
            <p className="label-cap text-ink3">{rx.diagnosis}</p>
          </div>

          <div className="border-t border-line">
            <Readout term="Total eye power">{rx.totalPower.toFixed(2)} D</Readout>
            <Readout term="Retina sits at">{rx.retinalPlane.toFixed(2)} D</Readout>
            <Readout term="Spherical equivalent">{signed(rx.sphEquiv)} D</Readout>
            <Readout term="Far point">
              {Number.isFinite(rx.farPointM)
                ? `${Math.abs(rx.farPointM * 100).toFixed(0)} cm ${rx.farPointM < 0 ? "in front" : "behind"}`
                : "infinity"}
            </Readout>
            <Readout term="Nearest clear point">
              {Number.isFinite(rx.nearPointCm) ? `${rx.nearPointCm.toFixed(0)} cm` : "—"}
            </Readout>
            <Readout term="Blur circle on retina">{Math.abs(distance.blurArcmin).toFixed(1)}′</Readout>
          </div>
        </aside>
      </div>

      {/* --------------------------- what it looks like ---------------------- */}
      <div className="border-t border-line bg-surface2 p-5">
        <p className="label-cap mb-3 text-ink3">
          What this eye sees {corrected ? "with the correction on" : "uncorrected"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SnellenPreview
            label="Distance chart, 6 metres"
            arcmin={Math.abs(distance.blurArcmin)}
            acuity={distance.acuity}
            tone={Math.abs(distance.defocus) < 0.3 ? "good" : "bad"}
          />
          <ReadingPreview
            label="Reading card, 40 cm"
            arcmin={Math.abs(near.blurArcmin)}
            tone={near.strained || Math.abs(near.defocus) > 0.3 ? "bad" : "good"}
            note={
              Math.abs(near.defocus) > 0.3
                ? `${signed(near.defocus)} D of blur — out of accommodation`
                : near.strained
                  ? `sharp, but using ${near.accommodation.toFixed(2)} of ${near.available.toFixed(2)} D — this is where eyestrain comes from`
                  : `sharp, using ${near.accommodation.toFixed(2)} of ${near.available.toFixed(2)} D`
            }
          />
        </div>
        <p className="mt-3 max-w-[70ch] text-[0.78rem] leading-relaxed text-ink3">
          The blur applied to these panels is the model's own retinal blur circle, converted to
          visual angle — the same figure the ray diagram labels. Acuity estimates are empirical
          approximations from spherical defocus; real acuity also depends on contrast, pupil size
          and retinal health. {!corrected && "Tick 'Put the glasses on' to see the difference."}
        </p>
      </div>
    </div>
  );
}
