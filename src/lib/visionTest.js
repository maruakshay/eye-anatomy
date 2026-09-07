/* ---------------------------------------------------------------------------
   Everything a self-test needs to draw a target of a *known angular size* on
   an unknown screen.

   Two unknowns stand between a browser and a real chart: how big a CSS pixel
   is in millimetres, and how far the eye is from the glass. The first is
   measured against a bank card (ISO/IEC 7810 ID-1, 85.60 mm wide, the same in
   every wallet in the world); the second is asked for and trusted. With both,
   a letter can be drawn at a genuine visual angle, and a genuine — if
   unsupervised — acuity falls out.
   --------------------------------------------------------------------------- */

export const CARD_MM = 85.6;
export const CARD_ASPECT = 53.98 / 85.6;

const ARCMIN_TAN = Math.tan(Math.PI / (180 * 60));
const DEG_TAN = Math.tan(Math.PI / 180);

/** Millimetres per CSS pixel, from the width the user matched to their card. */
export const mmPerPx = (cardWidthPx) => CARD_MM / cardWidthPx;
export const pxPerMm = (cardWidthPx) => cardWidthPx / CARD_MM;

/** How many millimetres of screen one arcminute of visual angle covers. */
export const mmPerArcmin = (distanceCm) => distanceCm * 10 * ARCMIN_TAN;
export const mmPerDegree = (distanceCm) => distanceCm * 10 * DEG_TAN;

export const pxPerArcmin = (cardWidthPx, distanceCm) =>
  mmPerArcmin(distanceCm) * pxPerMm(cardWidthPx);

/* --------------------------------- acuity --------------------------------- */

/**
 * A 20/20 letter is five arcminutes tall — that is the definition, not a
 * convention. Every other line is that letter scaled by 10^logMAR.
 */
export const LETTER_ARCMIN_AT_0 = 5;

export const letterHeightPx = (logMAR, pxPerArcmin_) =>
  LETTER_ARCMIN_AT_0 * Math.pow(10, logMAR) * pxPerArcmin_;

/* The lines a chart is actually printed with. 10^0.3 is 1.995, so the maths
   gives 20/39.9 where every clinic in the world writes 20/40. */
const SNELLEN_FEET = [10, 12.5, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400];

const snap = (value) => {
  const near = SNELLEN_FEET.find((v) => Math.abs(v - value) / value < 0.04);
  return near ?? Math.round(value * 10) / 10;
};

const trim = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Snellen in both notations, plus the decimal clinicians actually compare. */
export function acuityFor(logMAR) {
  const ratio = Math.pow(10, logMAR);
  const feet = snap(20 * ratio);
  return {
    logMAR: Math.round(logMAR * 100) / 100,
    snellen: `20/${trim(feet)}`,
    metric: `6/${trim(Math.round(feet * 0.3 * 10) / 10)}`,
    decimal: Math.round((1 / ratio) * 100) / 100,
  };
}

/* The Sloan set: ten letters chosen in 1959 to be equally legible, which is
   what makes a wrong answer mean something. Never the full alphabet. */
export const SLOAN = ["C", "D", "H", "K", "N", "O", "R", "S", "V", "Z"];

/** Chart lines from 20/200 down to 20/12.5, the ETDRS ladder. */
export const LOGMAR_STEPS = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2];

export const LETTERS_PER_LINE = 5;
export const PASS_PER_LINE = 3;

/**
 * Which lines this screen can honestly draw at this distance, given the largest
 * square of chart it has to draw in. A stroke thinner than about a pixel and a
 * half is being limited by the display rather than by the eye, and a letter
 * wider than the box cannot be shown at all — so both ends are cut instead of
 * quietly rendering a lie.
 */
export function usableSteps(cardWidthPx, distanceCm, boxPx, minStrokePx = 1.4) {
  const ppa = pxPerArcmin(cardWidthPx, distanceCm);
  return LOGMAR_STEPS.filter((step) => {
    const h = letterHeightPx(step, ppa);
    // Sloan letters are drawn on a 5×5 grid: one stroke is a fifth of the height.
    if (h / 5 < minStrokePx) return false;
    return h * 1.3 < boxPx;
  });
}

/**
 * ETDRS-style scoring: the last line read, credited letter by letter. Each of
 * the five letters on a line is worth 0.02 logMAR, so a line read 4/5 scores
 * better than the same line read 3/5.
 */
export function scoreAcuity(lines) {
  const passed = lines.filter((l) => l.correct >= PASS_PER_LINE);
  if (!passed.length) return null;
  const last = passed[passed.length - 1];
  const credit = (last.correct - LETTERS_PER_LINE) * 0.02;
  return {
    ...acuityFor(last.logMAR + credit),
    line: acuityFor(last.logMAR),
    lettersRead: lines.reduce((n, l) => n + l.correct, 0),
    lettersShown: lines.length * LETTERS_PER_LINE,
    floored: last.logMAR === Math.min(...lines.map((l) => l.logMAR)),
  };
}

/* ------------------------------- contrast --------------------------------- */

/* Weber contrast of the letter against the page. The 2.5% and 1.25% steps are
   where early cataract, corneal oedema and optic neuropathy show up long
   before the letter chart moves. */
export const CONTRAST_STEPS = [0.5, 0.25, 0.12, 0.06, 0.03, 0.015];
export const CONTRAST_LETTERS = 3;
export const CONTRAST_PASS = 2;

/* --------------------------------- colour --------------------------------- */

/**
 * Pseudo-isochromatic plates, generated rather than scanned: dots of random
 * size packed into a disc, coloured from one of two palettes chosen to sit on
 * a red–green confusion line — near-identical in lightness, so the figure is
 * carried by hue alone and disappears for a red–green deficient eye.
 *
 * A browser on an uncalibrated screen cannot replace Ishihara's plates under a
 * daylight lamp. It can only ever say "worth checking properly".
 */
export const PLATES = [
  {
    id: "control",
    figure: "12",
    kind: "control",
    bg: ["#b7b3ae", "#c6c2bc", "#a9a5a0", "#cfcbc5"],
    fg: ["#3f6fb5", "#4a7cc4", "#35619f", "#5688cc"],
    note: "Everyone sees this one. If you cannot, the screen or the lighting is the problem, not your eyes.",
  },
  {
    id: "rg1",
    figure: "5",
    kind: "red-green",
    bg: ["#c98a5b", "#d8a06d", "#bb7c4d", "#e2b382", "#cf9663"],
    fg: ["#83a13f", "#95b04f", "#71903a", "#a6bd63", "#8aa746"],
    note: "Green figure on warm ground. The commonest inherited deficiency reads this as a blank field or a different number.",
  },
  {
    id: "rg2",
    figure: "2",
    kind: "red-green",
    bg: ["#c08a72", "#cf9a80", "#b17c66", "#dcae95"],
    fg: ["#8a9a68", "#98a874", "#7b8b5a", "#a6b482"],
    note: "The same axis with less separation between the palettes, so a mild deficiency shows up here rather than on the first plate.",
  },
];

/**
 * Packs the dots for one plate. Dart-throwing against a uniform grid of
 * occupied cells — the grid is what keeps a few thousand rejection tests from
 * turning into a few million, and dot count is what makes the figure legible:
 * too few and the glyph reads as a smear.
 */
export function plateDots(size, rng = Math.random, mask) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 2;
  const rMin = size * 0.0085;
  const rMax = size * 0.023;
  const gap = size * 0.0035;

  const cell = (rMax + gap) * 2;
  const cols = Math.ceil(size / cell);
  const grid = new Map();
  const key = (ix, iy) => iy * cols + ix;

  const dots = [];
  for (let attempt = 0; attempt < 60000 && dots.length < 3200; attempt++) {
    const r = rMin + rng() * (rMax - rMin);
    const t = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * (R - r);
    const x = cx + Math.cos(t) * d;
    const y = cy + Math.sin(t) * d;

    const ix = Math.floor(x / cell);
    const iy = Math.floor(y / cell);
    let clash = false;
    for (let dy = -1; dy <= 1 && !clash; dy++) {
      for (let dx = -1; dx <= 1 && !clash; dx++) {
        for (const o of grid.get(key(ix + dx, iy + dy)) ?? []) {
          const ex = o.x - x;
          const ey = o.y - y;
          if (ex * ex + ey * ey < (o.r + r + gap) ** 2) clash = true;
        }
      }
    }
    if (clash) continue;

    // A dot straddling the edge of the glyph is decided by a majority of five
    // samples, so the figure's boundary stays a clean line of whole dots.
    const votes =
      mask(x, y) +
      mask(x - r * 0.6, y) +
      mask(x + r * 0.6, y) +
      mask(x, y - r * 0.6) +
      mask(x, y + r * 0.6);

    const dot = { x, y, r, inFigure: votes >= 3 };
    dots.push(dot);
    const k = key(ix, iy);
    const bucket = grid.get(k);
    if (bucket) bucket.push(dot);
    else grid.set(k, [dot]);
  }
  return dots;
}

/* ------------------------------ interpretation ---------------------------- */

/** Plain, non-diagnostic readings. Deliberately conservative at every step. */
export function readAcuity(result) {
  if (!result) return { tone: "bad", text: "Could not read the largest line shown." };
  const l = result.logMAR;
  if (l <= 0.0) return { tone: "good", text: "Normal or better — 20/20 or sharper." };
  if (l <= 0.2) return { tone: "good", text: "Within the normal range for an unsupervised test." };
  if (l <= 0.3) return { tone: "watch", text: "Slightly below the driving standard in most countries." };
  if (l <= 0.5) return { tone: "watch", text: "Reduced. Commonly just an out-of-date prescription." };
  return { tone: "bad", text: "Substantially reduced on this screen." };
}

export function readContrast(lowestPassed) {
  if (lowestPassed === null) return { tone: "bad", text: "No contrast level was read reliably." };
  if (lowestPassed <= 0.03) return { tone: "good", text: "Good contrast sensitivity." };
  if (lowestPassed <= 0.06) return { tone: "good", text: "Within a normal range for a screen test." };
  if (lowestPassed <= 0.12) return { tone: "watch", text: "Slightly reduced — glare and screen brightness matter here." };
  return { tone: "watch", text: "Reduced contrast, with sharp letters possibly still normal." };
}

/** The one number people misread. 6/6 is 20/20; neither is "perfect vision". */
export const ACUITY_FOOTNOTE =
  "Acuity is one number about one function. An eye can read 20/20 with untreated glaucoma, a growing melanoma, or diabetic retinopathy weeks from bleeding.";
