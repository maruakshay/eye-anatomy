/* ---------------------------------------------------------------------------
   A reduced-eye optical model.

   The eye is treated as a single refracting surface (the "principal plane")
   sitting 1.6 mm behind the corneal apex, with vitreous of refractive index
   1.336 filling the space back to the retina. This is the standard
   simplification used in clinical optics: it reproduces the textbook figures
   (~+43 D cornea, ~+17 D lens, ~+60 D total, 24.0 mm axial length) and the
   familiar rule of thumb that 1 mm of extra axial length costs about 2.5 D.
   --------------------------------------------------------------------------- */

export const N_VITREOUS = 1.336;
export const PP_OFFSET_MM = 1.6; // principal plane behind corneal apex
export const VERTEX_MM = 12.0; // back-vertex distance of spectacles
export const PP_TO_SPEC_MM = VERTEX_MM + PP_OFFSET_MM;

/** Emmetropic reference eye: parallel light lands exactly on the retina. */
export const EMMETROPE = {
  axialLength: 24.0, // mm
  cornea: 43.0, // D
  lens: 16.64, // D  (43.0 + 16.64 = 1336 / 22.4 = +59.64 D total)
  toricity: 0, // D of difference between the two corneal meridians
  axis: 180, // deg, orientation of the flatter meridian
  age: 25,
  pupil: 4.0, // mm
};

/** Dioptric distance from the principal plane to the retina. */
export function retinalPlaneDioptres(axialLength) {
  return (N_VITREOUS * 1000) / (axialLength - PP_OFFSET_MM);
}

/** Distance from principal plane to retina, in mm. */
export function reducedDepth(axialLength) {
  return axialLength - PP_OFFSET_MM;
}

/**
 * Refractive error referred to the corneal plane (i.e. the contact-lens
 * power that would correct it). Negative = myopic, positive = hyperopic.
 */
export function ocularRefraction(eye, accommodation = 0) {
  const total = eye.cornea + eye.lens + accommodation;
  return retinalPlaneDioptres(eye.axialLength) - total;
}

/** Move a lens power from the corneal plane out to the spectacle plane. */
export function toSpectaclePlane(ocular) {
  return ocular / (1 + (PP_TO_SPEC_MM / 1000) * ocular);
}

/** Move a lens power from the spectacle plane back to the corneal plane. */
export function toCornealPlane(spectacle) {
  return spectacle / (1 - (PP_TO_SPEC_MM / 1000) * spectacle);
}

/** Where parallel light actually comes to a focus, in mm behind the principal plane. */
export function focalDepth(totalPower) {
  if (Math.abs(totalPower) < 1e-6) return Infinity;
  return (N_VITREOUS * 1000) / totalPower;
}

/* --------------------------- accommodation ------------------------------- */

/**
 * Hofstetter's equations for the amplitude of accommodation, the standard
 * clinical estimate. The lens stiffens steadily from childhood; by the
 * mid-fifties there is essentially nothing left in reserve.
 */
export function amplitude(age) {
  return {
    max: Math.max(0, 25 - 0.4 * age),
    mean: Math.max(0.25, 18.5 - 0.3 * age),
    min: Math.max(0, 15 - 0.25 * age),
  };
}

/**
 * Reading add that leaves half the remaining amplitude in reserve at 40 cm.
 * Uses Hofstetter's *minimum* line, which tracks measured clinical amplitudes
 * far better than the mean past forty — and so reproduces the add that an
 * optometrist actually writes: about +0.75 at 45, +1.25 at 50, +2.00 at 55.
 */
export function readingAdd(age, workingDistanceCm = 40) {
  const demand = 100 / workingDistanceCm;
  const reserve = amplitude(age).min / 2;
  return Math.max(0, quarter(demand - reserve));
}

/* ------------------------------ acuity ----------------------------------- */

const SNELLEN_LINES = [20, 25, 30, 40, 50, 60, 70, 80, 100, 125, 150, 200, 300, 400, 800];

/**
 * Diameter of the retinal blur circle, in mm, for a given amount of defocus.
 * A wide pupil gathers a wider cone of light, so it blurs more — which is why
 * squinting sharpens a myope's vision and why blur is worse at night.
 */
export function blurCircleMm(defocusD, pupilMm, axialLength) {
  const depthM = reducedDepth(axialLength) / 1000;
  return Math.abs(defocusD) * pupilMm * depthM;
}

/** The same blur circle expressed as an angle in the visual field, in arcminutes. */
export function blurArcmin(defocusD, pupilMm, axialLength) {
  const mm = blurCircleMm(defocusD, pupilMm, axialLength);
  return (mm / reducedDepth(axialLength)) * (180 / Math.PI) * 60;
}

/**
 * Estimated distance acuity from spherical defocus. An empirical fit that
 * tracks clinic reality closely: ~1 D of blur lands near 20/120, 2 D near
 * 20/200, 3 D near 20/300. Real acuity also depends on pupil size, contrast
 * and retinal health, so treat this as an estimate, not a measurement.
 */
export function estimateAcuity(defocusD) {
  const raw = 20 * (1 + 5 * Math.abs(defocusD));
  const line = SNELLEN_LINES.reduce((best, v) =>
    Math.abs(v - raw) < Math.abs(best - raw) ? v : best,
  );
  return {
    denominator: line,
    snellen: `20/${line}`,
    metric: `6/${Math.round((line * 6) / 20)}`,
    logMAR: Math.log10(line / 20),
  };
}

/* ------------------------- astigmatic meridians --------------------------- */

/**
 * A toric cornea has two principal meridians of different power, so there is
 * no single point of focus — light collapses into two focal lines separated
 * by Sturm's interval, with a blurred "circle of least confusion" between.
 */
export function meridians(eye, accommodation = 0) {
  const base = eye.cornea + eye.lens + accommodation;
  const retina = retinalPlaneDioptres(eye.axialLength);
  return {
    flat: { power: base, defocus: retina - base, axis: eye.axis },
    steep: {
      power: base + eye.toricity,
      defocus: retina - base - eye.toricity,
      axis: (eye.axis + 90) % 180,
    },
    circleOfLeastConfusion: retina - base - eye.toricity / 2,
  };
}

/* ------------------------ the whole prescription -------------------------- */

export function quarter(d) {
  return Math.round(d * 4) / 4;
}

export function signed(d, digits = 2) {
  const v = Number(d);
  if (Math.abs(v) < 0.005) return digits === 2 ? "0.00" : "0";
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}`;
}

/**
 * The full picture for one eye: what it does uncorrected, what lens fixes it,
 * and what is left over once that lens is on.
 */
export function analyse(eye) {
  const m = meridians(eye, 0);

  // Correct the flatter meridian with sphere, the difference with cylinder,
  // then vertex both out to the spectacle plane.
  const sphereOcular = m.flat.defocus;

  const sphere = quarter(toSpectaclePlane(sphereOcular));
  const cylinder = quarter(toSpectaclePlane(m.steep.defocus) - sphere);
  const add = readingAdd(eye.age);
  const amp = amplitude(eye.age);

  const sphEquiv = sphere + cylinder / 2;
  const acuity = estimateAcuity(m.circleOfLeastConfusion);

  // Far point: the one distance the uncorrected eye focuses sharply.
  const farPointM = Math.abs(sphereOcular) < 0.05 ? Infinity : 1 / sphereOcular;

  // Nearest point a corrected eye can still pull into focus, using every
  // dioptre of accommodation it has left.
  const nearPointCm = amp.min > 0.1 ? 100 / amp.min : Infinity;

  return {
    meridians: m,
    sphere,
    cylinder,
    axis: eye.axis,
    add,
    amplitude: amp,
    sphEquiv,
    acuity,
    farPointM,
    nearPointCm,
    totalPower: eye.cornea + eye.lens,
    retinalPlane: retinalPlaneDioptres(eye.axialLength),
    focalDepth: focalDepth(eye.cornea + eye.lens),
    reducedDepth: reducedDepth(eye.axialLength),
    blurArcmin: blurArcmin(m.circleOfLeastConfusion, eye.pupil, eye.axialLength),
    diagnosis: describe(sphere, cylinder, eye.age, add),
  };
}

function describe(sphere, cylinder, age, add) {
  const parts = [];
  const sphEq = sphere + cylinder / 2;
  if (sphEq <= -6) parts.push("high myopia");
  else if (sphEq <= -0.5) parts.push("myopia");
  else if (sphEq >= 2) parts.push("moderate hyperopia");
  else if (sphEq >= 0.5) parts.push("hyperopia");
  if (Math.abs(cylinder) >= 0.75) parts.push("astigmatism");
  if (age >= 42 && add > 0) parts.push("presbyopia");
  if (!parts.length) return "emmetropia — no correction needed";
  return parts.join(" · ");
}

/** Formats as it would appear on a real spectacle prescription. */
export function formatRx({ sphere, cylinder, axis }) {
  const s = signed(sphere);
  if (Math.abs(cylinder) < 0.125) return `${s} DS`;
  return `${s} ${signed(cylinder)} × ${String(axis).padStart(3, "0")}`;
}

/* ------------------------------- presets --------------------------------- */

export const PRESETS = [
  {
    id: "emmetrope",
    name: "Emmetropia",
    note: "Everything in proportion. Parallel light lands exactly on the fovea.",
    eye: { ...EMMETROPE },
  },
  {
    id: "myopia",
    name: "Myopia",
    note: "The eye grew too long for its optics, so the image focuses in front of the retina.",
    eye: { ...EMMETROPE, axialLength: 25.4, age: 22 },
  },
  {
    id: "high-myopia",
    name: "High myopia",
    note: "Beyond about −6 D the retina itself is stretched thin, which carries its own risks.",
    eye: { ...EMMETROPE, axialLength: 27.6, age: 30, pupil: 5 },
  },
  {
    id: "hyperopia",
    name: "Hyperopia",
    note: "A short eye. Young hyperopes hide it by accommodating, at the cost of eyestrain.",
    eye: { ...EMMETROPE, axialLength: 22.4, age: 30 },
  },
  {
    id: "astigmatism",
    name: "Astigmatism",
    note: "A cornea curved more steeply in one direction. There is no single focal point at all.",
    eye: { ...EMMETROPE, axialLength: 24.3, toricity: 2.0, axis: 175, age: 28 },
  },
  {
    id: "presbyopia",
    name: "Presbyopia",
    note: "Distance is fine; the lens has simply lost the flexibility to refocus up close.",
    eye: { ...EMMETROPE, axialLength: 24.0, age: 55 },
  },
  {
    id: "keratoconus",
    name: "Keratoconus",
    note: "A cone-shaped cornea: steep, irregular and highly astigmatic. Glasses stop being enough.",
    eye: { ...EMMETROPE, axialLength: 24.0, cornea: 47.5, toricity: 3.5, axis: 25, age: 24 },
  },
];

/* ------------------------- looking at something --------------------------- */

/** Vergence arriving at the principal plane from an object at a given distance. */
export function objectVergence(distanceCm) {
  if (!Number.isFinite(distanceCm)) return 0;
  return -1000 / (distanceCm * 10 + PP_TO_SPEC_MM);
}

/**
 * What actually happens when this eye looks at something a given distance away,
 * with or without its correction on. The eye accommodates as much as the task
 * needs, but no more than it has left — which is exactly where presbyopia and
 * hyperopic eyestrain come from.
 */
export function solve(eye, { corrected = false, distanceCm = Infinity, addWorn = 0 } = {}) {
  const rx = analyse(eye);
  const retina = retinalPlaneDioptres(eye.axialLength);
  const base = eye.cornea + eye.lens + eye.toricity / 2; // spherical equivalent
  const objectU = objectVergence(distanceCm);

  const specPower = corrected ? rx.sphere + rx.cylinder / 2 + addWorn : 0;
  const lensAtEye = corrected ? toCornealPlane(specPower) : 0;

  const demand = retina - (objectU + base + lensAtEye);
  const available = amplitude(eye.age).min;
  const accommodation = Math.min(Math.max(demand, 0), available);
  const defocus = retina - (objectU + base + lensAtEye + accommodation);

  return {
    rx,
    defocus,
    accommodation,
    available,
    demand,
    /** Fraction of the remaining amplitude this task consumes. Over 1 means blur. */
    effort: available > 0 ? Math.min(1, accommodation / available) : demand > 0 ? 1 : 0,
    strained: demand > available * 0.66 && demand > 0.25,
    blurArcmin: blurArcmin(defocus, eye.pupil, eye.axialLength),
    acuity: estimateAcuity(defocus),
  };
}
