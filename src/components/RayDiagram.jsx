import { toCornealPlane, N_VITREOUS, PP_OFFSET_MM } from "../lib/optics.js";

const S = 11; // px per mm
const APEX = 196; // corneal apex — far enough right to draw 12 mm of vertex distance to scale
const AXIS = 195; // optical axis
const VIEW = { w: 700, h: 400 };

/** A schematic spectacle lens whose shape follows the sign and size of its power. */
function lensPath(x, y, power, h = 52) {
  const c = Math.min(26, Math.max(4, Math.abs(power) * 2.4));
  if (power >= 0) {
    return `M ${x} ${y - h} C ${x - c} ${y - h * 0.45} ${x - c} ${y + h * 0.45} ${x} ${y + h}
            C ${x + c} ${y + h * 0.45} ${x + c} ${y - h * 0.45} ${x} ${y - h} Z`;
  }
  const w = 5;
  return `M ${x - w} ${y - h} C ${x - w + c} ${y - h * 0.4} ${x - w + c} ${y + h * 0.4} ${x - w} ${y + h}
          L ${x + w} ${y + h} C ${x + w - c} ${y + h * 0.4} ${x + w - c} ${y - h * 0.4} ${x + w} ${y - h} Z`;
}

/** Trace one meridian: five rays from infinity, bent once at the principal plane. */
function traceMeridian({ power, specPower, pupilHalf, ppX, dRed, retinaX, corrected }) {
  const specX = APEX - 12 * S;
  const ocular = corrected ? toCornealPlane(specPower) : 0;
  const vergence = ocular + power;
  const fMm = Math.abs(vergence) < 1e-6 ? Infinity : (N_VITREOUS * 1000) / vergence;
  const focusX = Number.isFinite(fMm) ? ppX + fMm * S : VIEW.w * 2;
  const shrink = corrected ? 1 - specPower * 0.0136 : 1;

  const rays = [-1, -0.5, 0, 0.5, 1].map((k) => {
    const h = k * pupilHalf;
    const hPp = h * shrink;
    const yRet = Number.isFinite(fMm) ? hPp * (1 - dRed / fMm) : hPp;
    const pts = corrected
      ? [[0, AXIS + h], [specX, AXIS + h], [ppX, AXIS + hPp], [retinaX, AXIS + yRet]]
      : [[0, AXIS + h], [ppX, AXIS + h], [retinaX, AXIS + yRet]];
    return { pts: pts.map((p) => p.join(",")).join(" "), yRet, hPp };
  });

  const blurHalf = Number.isFinite(fMm) ? Math.abs(pupilHalf * shrink * (1 - dRed / fMm)) : pupilHalf;
  return { rays, focusX, fMm, blurHalf, specX };
}

export default function RayDiagram({ eye, analysis, corrected, accommodation }) {
  const r = (eye.axialLength * S) / 2;
  const centerX = APEX + r;
  const retinaX = APEX + 2 * r;
  const ppX = APEX + PP_OFFSET_MM * S;
  const dRed = eye.axialLength - PP_OFFSET_MM;
  const pupilHalf = (eye.pupil / 2) * S;
  const astigmatic = eye.toricity > 0.1;

  const base = eye.cornea + eye.lens + accommodation;
  const flat = traceMeridian({
    power: base,
    specPower: analysis.sphere,
    pupilHalf, ppX, dRed, retinaX, corrected,
  });
  const steep = astigmatic
    ? traceMeridian({
        power: base + eye.toricity,
        specPower: analysis.sphere + analysis.cylinder,
        pupilHalf, ppX, dRed, retinaX, corrected,
      })
    : null;

  // Corneal arc: limbus to limbus along the globe, at ±48° from the axis.
  const lx = centerX - 0.669 * r;
  const lyTop = AXIS - 0.743 * r;
  const lyBot = AXIS + 0.743 * r;

  const lensX = APEX + 5.6 * S;
  const lensH = 4.6 * S;

  const onRetina = Math.abs(flat.focusX - retinaX) < 3 && (!steep || Math.abs(steep.focusX - retinaX) < 3);
  const focusOffsetMm = (flat.focusX - retinaX) / S;

  return (
    <figure className="m-0 px-2 pt-2">
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        role="img"
        aria-label={`Ray diagram: parallel light entering an eye of axial length ${eye.axialLength.toFixed(1)} millimetres, ${corrected ? "with" : "without"} spectacle correction`}
        className="block h-auto w-full"
      >
        {/* ------------------------------ the globe --------------------------- */}
        <circle cx={centerX} cy={AXIS} r={r} fill="var(--color-cobalt)" opacity="0.045" />
        <circle cx={centerX} cy={AXIS} r={r} fill="none" stroke="var(--color-ink3)" strokeWidth="1.6" opacity="0.4" />

        {/* retina: the back half, drawn as the surface that matters */}
        <path
          d={`M ${centerX - 0.34 * r} ${AXIS - 0.94 * r} A ${r} ${r} 0 1 1 ${centerX - 0.34 * r} ${AXIS + 0.94 * r}`}
          fill="none" stroke="var(--color-cobalt)" strokeWidth="4" opacity="0.55"
        />

        {/* cornea */}
        <path d={`M ${lx} ${lyTop} A ${r} ${r} 0 0 0 ${lx} ${lyBot}`}
          fill="none" stroke="currentColor" strokeWidth="2.6" opacity="0.6" />

        {/* iris leaves, framing the pupil */}
        <line x1={lx} y1={lyTop} x2={lx} y2={AXIS - pupilHalf} stroke="var(--color-fundus)" strokeWidth="5" opacity="0.5" strokeLinecap="round" />
        <line x1={lx} y1={lyBot} x2={lx} y2={AXIS + pupilHalf} stroke="var(--color-fundus)" strokeWidth="5" opacity="0.5" strokeLinecap="round" />

        {/* crystalline lens, sketched for context */}
        <path d={lensPath(lensX, AXIS, 8, lensH)} fill="var(--color-cobalt)" opacity="0.12" stroke="var(--color-cobalt)" strokeWidth="1.2" />

        {/* --------------------------- principal plane ----------------------- */}
        <line x1={ppX} y1={AXIS - r * 0.8} x2={ppX} y2={AXIS + r * 0.8}
          stroke="var(--color-ink3)" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
        <text x={ppX - 6} y={AXIS + r * 0.8 + 14} textAnchor="end" fill="var(--color-ink3)" fontFamily="var(--font-mono)" fontSize="10">
          all refraction, {(base + eye.toricity / 2).toFixed(1)} D
        </text>

        {/* ------------------------- spectacle lens -------------------------- */}
        {corrected && (
          <g>
            <path d={lensPath(flat.specX, AXIS, analysis.sphere)}
              fill="var(--color-cobalt)" opacity="0.2" stroke="var(--color-cobalt)" strokeWidth="1.8" />
            <text x={flat.specX} y={AXIS - 62} textAnchor="middle" fill="var(--color-cobalt)" fontFamily="var(--font-mono)" fontSize="11" fontWeight="500">
              {analysis.sphere > 0 ? "+" : "−"}{Math.abs(analysis.sphere).toFixed(2)} D
            </text>
            <text x={flat.specX} y={AXIS + 74} textAnchor="middle" fill="var(--color-ink3)" fontFamily="var(--font-mono)" fontSize="9.5">
              12 mm
            </text>
          </g>
        )}

        {/* -------------------------------- rays ----------------------------- */}
        {steep &&
          steep.rays.map((ray, i) => (
            <polyline key={`s${i}`} points={ray.pts} fill="none" stroke="var(--color-fundus)" strokeWidth="1.3" opacity="0.75" />
          ))}
        {flat.rays.map((ray, i) => (
          <polyline key={`f${i}`} points={ray.pts} fill="none" stroke="var(--color-cobalt)" strokeWidth="1.4" opacity="0.9" />
        ))}

        {/* dashed continuation to a focus that lies behind the retina */}
        {[flat, steep].filter(Boolean).map((m, mi) =>
          m.focusX > retinaX && m.focusX < VIEW.w
            ? m.rays.map((ray, i) => (
                <line key={`c${mi}${i}`}
                  x1={retinaX} y1={AXIS + ray.yRet} x2={m.focusX} y2={AXIS}
                  stroke={mi ? "var(--color-fundus)" : "var(--color-cobalt)"}
                  strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
              ))
            : null,
        )}

        {/* ------------------------- focus annotations ----------------------- */}
        {[
          { m: flat, colour: "var(--color-cobalt)", dy: -14, name: astigmatic ? "focal line 1" : "focus" },
          steep && { m: steep, colour: "var(--color-fundus)", dy: 22, name: "focal line 2" },
        ]
          .filter(Boolean)
          .map(({ m, colour, dy, name }, i) =>
            m.focusX < VIEW.w - 20 ? (
              <g key={i}>
                <circle cx={m.focusX} cy={AXIS} r="4.5" fill="none" stroke={colour} strokeWidth="2" />
                <text x={m.focusX} y={AXIS + dy} textAnchor="middle" fill={colour} fontFamily="var(--font-mono)" fontSize="10">
                  {name}
                </text>
              </g>
            ) : null,
          )}

        {/* Sturm's interval */}
        {steep && Math.abs(steep.focusX - flat.focusX) > 14 && (
          <g>
            <line x1={Math.min(flat.focusX, steep.focusX)} y1={AXIS - 42} x2={Math.max(flat.focusX, steep.focusX)} y2={AXIS - 42}
              stroke="var(--color-ink2)" strokeWidth="1" />
            <text x={(flat.focusX + steep.focusX) / 2} y={AXIS - 48} textAnchor="middle" fill="var(--color-ink2)" fontFamily="var(--font-mono)" fontSize="10">
              Sturm's interval
            </text>
          </g>
        )}

        {/* --------------------------- retina & blur ------------------------- */}
        <line x1={retinaX} y1={AXIS - r * 0.95} x2={retinaX} y2={AXIS + r * 0.95}
          stroke="var(--color-ink3)" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />

        {!onRetina && (
          <g>
            <line x1={retinaX} y1={AXIS - Math.max(flat.blurHalf, steep?.blurHalf ?? 0)}
              x2={retinaX} y2={AXIS + Math.max(flat.blurHalf, steep?.blurHalf ?? 0)}
              stroke="var(--color-fundus)" strokeWidth="4" strokeLinecap="round" />
            <text x={retinaX + 10} y={AXIS - Math.max(flat.blurHalf, steep?.blurHalf ?? 0) - 8}
              fill="var(--color-fundus)" fontFamily="var(--font-mono)" fontSize="10.5">
              blur {analysis.blurArcmin.toFixed(0)}′
            </text>
          </g>
        )}
        {onRetina && (
          <g>
            <circle cx={retinaX} cy={AXIS} r="5" fill="var(--color-fluor)" />
            <text x={retinaX + 12} y={AXIS - 10} fill="var(--color-fluor)" fontFamily="var(--font-mono)" fontSize="10.5">
              sharp on the fovea
            </text>
          </g>
        )}

        <text x={retinaX + 10} y={AXIS + r * 0.95 + 4} fill="var(--color-cobalt)" fontFamily="var(--font-mono)" fontSize="10.5">
          retina
        </text>

        {/* -------------------------- axial length ---------------------------- */}
        <g opacity="0.85">
          <line x1={APEX} y1={VIEW.h - 26} x2={retinaX} y2={VIEW.h - 26} stroke="var(--color-ink3)" strokeWidth="1" />
          <line x1={APEX} y1={VIEW.h - 31} x2={APEX} y2={VIEW.h - 21} stroke="var(--color-ink3)" strokeWidth="1" />
          <line x1={retinaX} y1={VIEW.h - 31} x2={retinaX} y2={VIEW.h - 21} stroke="var(--color-ink3)" strokeWidth="1" />
          <text x={(APEX + retinaX) / 2} y={VIEW.h - 10} textAnchor="middle" fill="var(--color-ink3)" fontFamily="var(--font-mono)" fontSize="10.5">
            axial length {eye.axialLength.toFixed(1)} mm
          </text>
        </g>

        {/* incoming light label */}
        <text x="4" y={AXIS - pupilHalf - 12} fill="var(--color-ink3)" fontFamily="var(--font-mono)" fontSize="10">
          light from a distant object
        </text>
      </svg>

      <figcaption className="px-3 pt-1 pb-2 text-[0.78rem] leading-relaxed text-ink3">
        A reduced eye: all of the cornea's and lens's power is collapsed onto one refracting plane
        1.6 mm behind the corneal apex, which reproduces the clinical figures. The focus sits{" "}
        {onRetina ? (
          <span>exactly on the retina.</span>
        ) : (
          <span className="num text-ink2">
            {Math.abs(focusOffsetMm).toFixed(1)} mm {focusOffsetMm < 0 ? "in front of" : "behind"} the
            retina.
          </span>
        )}
      </figcaption>
    </figure>
  );
}
