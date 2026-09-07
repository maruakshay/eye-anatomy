/* ---------------------------------------------------------------------------
   The blood supply, generated rather than drawn.

   Five separate vascular systems, each anatomically distinct and each the seat
   of its own diseases:

     retinal arteries / veins  the arcades a fundus examination reads
     central retinal vessels   running inside the optic nerve
     posterior ciliary         supplying the disc and the outer eye
     vortex veins              the choroid's drainage, piercing the sclera
     episcleral plexus         the vessels that make a red eye red

   Retinal vessels are authored in *fundus coordinates*: millimetres of retinal
   arc from the fovea, temporal positive and superior positive — the coordinate
   system fundus anatomy is actually described in. `projectFundus` wraps that
   flat map onto the retinal sphere, so an arcade authored the way it appears in
   a photograph ends up in the right place in three dimensions.

   Calibres are exaggerated about 1.8× from life. A real arteriole is 0.05 mm
   across on a 24 mm globe — around one pixel — and invisible is not useful.
   --------------------------------------------------------------------------- */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { D } from "./dimensions.js";

const rad = (deg) => (deg * Math.PI) / 180;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const bake = (geo) => {
  geo.rotateX(Math.PI / 2);
  return geo;
};

/* --------------------------- coordinate systems ---------------------------- */

/** Fundus map → local 3-space. u = temporal mm, v = superior mm, both as arc. */
export function projectFundus(u, v, radius) {
  const arc = Math.hypot(u, v);
  if (arc < 1e-6) return new THREE.Vector3(0, -radius, 0);
  const theta = arc / radius;
  const s = Math.sin(theta);
  return new THREE.Vector3(
    radius * s * (u / arc),
    -radius * Math.cos(theta),
    -radius * s * (v / arc),
  );
}

/** Polar position on a sphere: theta from the anterior pole, phi around it. */
function onSphere(radius, theta, phi) {
  const s = Math.sin(theta);
  return new THREE.Vector3(radius * s * Math.cos(phi), radius * Math.cos(theta), radius * s * Math.sin(phi));
}

const FOVEA_AVASCULAR = 0.45; // mm — nothing crosses the foveal avascular zone
const RETINA_EDGE = 11.2; // mm of arc — the ora serrata

/** Disc centre in fundus coordinates: 15° nasal to the fovea, slightly up. */
export const DISC_FUNDUS = [-D.retinaR * rad(D.discAngleDeg), 0.35];

/* --------------------------- the retinal arcades --------------------------- */

const ARCADES = {
  superiorTemporal: [
    [-2.55, 1.15], [-1.55, 2.7], [0.45, 3.85], [3.1, 4.15], [6.1, 3.6], [9.0, 2.5], [11.0, 1.4],
  ],
  inferiorTemporal: [
    [-2.55, -0.45], [-1.6, -2.25], [0.5, -3.55], [3.25, -3.95], [6.3, -3.45], [9.1, -2.35], [11.0, -1.25],
  ],
  superiorNasal: [
    [-3.55, 1.05], [-5.25, 2.15], [-7.45, 3.05], [-9.6, 3.45], [-11.0, 3.2],
  ],
  inferiorNasal: [
    [-3.55, -0.3], [-5.25, -1.6], [-7.45, -2.5], [-9.6, -2.9], [-11.0, -2.7],
  ],
};

const CALIBRE = {
  artery: [0.105, 0.071, 0.047, 0.031],
  vein: [0.134, 0.091, 0.060, 0.039],
};

/** Pull a 2-D path back inside the retina and out of the foveal centre. */
function legal(p) {
  const arc = p.length();
  if (arc > RETINA_EDGE) p.multiplyScalar(RETINA_EDGE / arc);
  const d = p.length();
  if (d < FOVEA_AVASCULAR && d > 1e-6) p.multiplyScalar(FOVEA_AVASCULAR / d);
  return p;
}

/**
 * Grows one vessel tree. Each generation throws off shorter, thinner branches,
 * alternating sides, which is what produces the dichotomous pattern of a real
 * fundus without hand-placing 90 vessels.
 */
function grow(curve, gen, maxGen, out, rand, side) {
  out.push({ curve, gen });
  if (gen >= maxGen) return;

  const n = [4, 3, 2][gen] ?? 2;
  for (let i = 0; i < n; i++) {
    const t = 0.2 + ((i + 0.35 + rand() * 0.4) * 0.68) / n;
    const at = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const s = side * (i % 2 === 0 ? 1 : -1);
    const angle = rad(38 + rand() * 26) * s;

    const dir = tangent
      .clone()
      .rotateAround(new THREE.Vector2(0, 0), angle);
    const len = (1.9 - gen * 0.5) * (0.65 + rand() * 0.7);

    const mid = at.clone().add(dir.clone().multiplyScalar(len * 0.55));
    mid.add(new THREE.Vector2(rand() - 0.5, rand() - 0.5).multiplyScalar(0.35));
    const end = at.clone().add(dir.clone().multiplyScalar(len));
    end.add(new THREE.Vector2(rand() - 0.5, rand() - 0.5).multiplyScalar(0.5));

    const child = new THREE.SplineCurve([at.clone(), legal(mid), legal(end)]);
    grow(child, gen + 1, maxGen, out, rand, s);
  }
}

/** A 2-D fundus curve becomes a tube on the retinal surface. */
function tubeOnRetina(curve2, radius, radiusOffset, samples = 26) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const p = curve2.getPoint(i / samples);
    pts.push(projectFundus(p.x, p.y, D.retinaR - radiusOffset));
  }
  const curve3 = new THREE.CatmullRomCurve3(pts);
  return bake(new THREE.TubeGeometry(curve3, samples, radius, 6, false));
}

function retinalTree(kind, rand) {
  const parts = [];
  const isVein = kind === "vein";
  // Veins run alongside their artery, displaced a little to one side.
  const offset = isVein ? 0.5 : 0;

  for (const [name, pts] of Object.entries(ARCADES)) {
    const superior = name.startsWith("superior");
    const shifted = pts.map(([u, v]) => new THREE.Vector2(u, v + (superior ? -offset : offset)));
    const trunk = new THREE.SplineCurve(shifted);
    const collected = [];
    grow(trunk, 0, 3, collected, rand, superior ? 1 : -1);
    for (const { curve, gen } of collected) {
      parts.push(tubeOnRetina(curve, CALIBRE[kind][gen], isVein ? 0.06 : 0.14));
    }
  }
  return mergeGeometries(parts);
}

/* ---------------------- vessels inside the optic nerve --------------------- */

function centralRetinalVessels() {
  const a = rad(D.discAngleDeg);
  const axis = new THREE.Vector3(-Math.sin(a), -Math.cos(a), 0);
  const disc = axis.clone().multiplyScalar(D.retinaR - 0.05);
  const perp = new THREE.Vector3(0, 0, 1);
  const parts = [];

  for (const [lateral, r] of [
    [-0.34, 0.17], // central retinal artery
    [0.34, 0.21], // central retinal vein, always the wider of the two
  ]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push(
        disc
          .clone()
          .add(axis.clone().multiplyScalar(t * D.nerveLength * 0.94))
          .add(perp.clone().multiplyScalar(lateral * Math.min(1, t * 5))),
      );
    }
    parts.push(bake(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 8, false)));
  }
  return mergeGeometries(parts);
}

/* --------------------- posterior ciliary arteries -------------------------- */

function ciliaryArteries(rand) {
  const R = D.choroidR + 0.1;
  const parts = [];

  // Two long posterior ciliary arteries, nasal and temporal, reaching all the
  // way forward to the ciliary body.
  for (const phi of [0, Math.PI]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const theta = rad(168) - (rad(168) - rad(48)) * (i / 14);
      pts.push(onSphere(R, theta, phi + Math.sin(i * 0.7) * 0.05));
    }
    parts.push(bake(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.14, 8, false)));
  }

  // Short posterior ciliary arteries, which supply the choroid and — through
  // the circle of Zinn-Haller — the optic nerve head itself.
  for (let i = 0; i < 9; i++) {
    const phi = (i / 9) * Math.PI * 2 + 0.2;
    const stop = rad(96 + rand() * 40);
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const theta = rad(166) - (rad(166) - stop) * (k / 8);
      pts.push(onSphere(R, theta, phi + (rand() - 0.5) * 0.06 * k));
    }
    parts.push(bake(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.085, 6, false)));
  }

  // The circle of Zinn-Haller, ringing the optic nerve.
  const a = rad(D.discAngleDeg);
  const ring = new THREE.TorusGeometry(1.85, 0.075, 8, 40);
  ring.rotateX(Math.PI / 2);
  ring.rotateZ(-a);
  ring.translate(-(D.choroidR - 0.4) * Math.sin(a), -(D.choroidR - 0.4) * Math.cos(a), 0);
  parts.push(bake(ring));

  return mergeGeometries(parts);
}

/* ------------------------------ vortex veins ------------------------------- */

function vortexVeins(rand) {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const phi = rad(45 + i * 90);
    const theta = rad(88 + (i % 2 ? 5 : -5));

    // tributaries on the choroid, converging on the ampulla
    for (let k = 0; k < 5; k++) {
      const spread = rad(22) * (k / 4 - 0.5) * 2;
      const pts = [];
      for (let j = 0; j <= 7; j++) {
        const t = j / 7;
        pts.push(
          onSphere(
            D.choroidR + 0.06,
            theta + spread * (1 - t) + (rand() - 0.5) * 0.02,
            phi + spread * 1.6 * (1 - t),
          ),
        );
      }
      parts.push(bake(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.075, 6, false)));
    }

    // the vein itself, piercing the sclera obliquely and running back
    const pts = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      const r = D.choroidR + 0.06 + t * 2.6;
      pts.push(onSphere(r, theta + t * rad(16), phi));
    }
    parts.push(bake(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.19, 8, false)));
  }
  return mergeGeometries(parts);
}

/* --------------------------- episcleral plexus ----------------------------- */

function episcleralVessels(rand) {
  const R = D.scleraR + 0.07;
  const parts = [];
  const strand = (theta0, phi0, length, radius, depth) => {
    let theta = theta0;
    let phi = phi0;
    const pts = [onSphere(R, theta, phi)];
    const steps = Math.max(3, Math.round(length * 5));
    for (let i = 0; i < steps; i++) {
      theta += length / steps;
      phi += (rand() - 0.5) * 0.09;
      pts.push(onSphere(R, theta, phi));
    }
    parts.push(bake(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps * 2, radius, 5, false)));
    if (depth > 0) {
      strand(theta0 + length * 0.5, phi0 + (rand() - 0.5) * 0.3, length * 0.5, radius * 0.62, depth - 1);
    }
  };

  for (let i = 0; i < 54; i++) {
    strand(rad(31) + rand() * 0.05, rand() * Math.PI * 2, 0.25 + rand() * 0.75, 0.055 + rand() * 0.05, 1);
  }
  // anterior ciliary arteries, arriving with the rectus tendons
  for (const phi of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    for (const d of [-0.18, 0.18]) {
      strand(rad(34), phi + d, 1.5, 0.115, 0);
    }
  }
  return mergeGeometries(parts);
}

/* ------------------------------- assembly ---------------------------------- */

export function buildVasculature() {
  const rand = rng(88231);
  return [
    {
      id: "retinalArteries",
      name: "Retinal arteries",
      system: "vessels",
      geometry: retinalTree("artery", rng(4471)),
      mat: "artery",
      explode: new THREE.Vector3(0, 0, -0.5),
      exaggerated: "Calibres drawn ~1.8× life size; a real arteriole is 0.05 mm across.",
      blurb:
        "Four arcades leaving the disc and sweeping around the macula, never crossing the fovea — the centre of vision is supplied entirely from behind, by the choroid. Arteries are the brighter and narrower of each pair, and the normal artery-to-vein calibre ratio is about 2:3.",
      specs: [
        ["Source", "central retinal artery"],
        ["Calibre at disc", "≈ 0.1 mm"],
        ["A : V ratio", "2 : 3 normal"],
        ["Foveal avascular zone", "0.5 mm"],
        ["Collateral supply", "none — it is a terminal artery"],
      ],
    },
    {
      id: "retinalVeins",
      name: "Retinal veins",
      system: "vessels",
      geometry: retinalTree("vein", rng(9912)),
      mat: "vein",
      explode: new THREE.Vector3(0, 0, -0.5),
      blurb:
        "Wider, darker and running alongside their arteries — sharing a common adventitial sheath where they cross. That shared sheath is precisely why an artery stiffened by hypertension compresses the vein beside it, and why branch vein occlusions happen at crossings.",
      specs: [
        ["Drain to", "central retinal vein"],
        ["Calibre at disc", "≈ 0.15 mm"],
        ["Crossings", "share adventitia with arteries"],
        ["Exit", "via the cavernous sinus"],
      ],
    },
    {
      id: "centralRetinalVessels",
      name: "Central retinal artery & vein",
      system: "vessels",
      geometry: centralRetinalVessels(),
      mat: "artery",
      explode: new THREE.Vector3(-0.45, 0, -1.7),
      blurb:
        "The artery enters the optic nerve about 10 mm behind the globe and runs up its centre to fan out at the disc. It is a terminal branch of the ophthalmic artery with no useful collateral, which is why occluding it infarcts the whole inner retina within roughly 90 minutes.",
      specs: [
        ["Origin", "ophthalmic artery"],
        ["Enters nerve at", "≈ 10 mm behind globe"],
        ["Supplies", "inner retina"],
        ["Ischaemic tolerance", "≈ 90 minutes"],
      ],
    },
    {
      id: "ciliaryArteries",
      name: "Posterior ciliary arteries",
      system: "vessels",
      geometry: ciliaryArteries(rand),
      mat: "artery",
      explode: new THREE.Vector3(0, 0, -1.1),
      blurb:
        "A separate supply from the retinal circulation: two long arteries running forward to the ciliary body, and a ring of short ones feeding the choroid and — through the circle of Zinn-Haller — the optic nerve head. These are the vessels giant cell arteritis occludes, which is why it blinds through the disc rather than the retina.",
      specs: [
        ["Origin", "ophthalmic artery"],
        ["Long posterior ciliary", "2, nasal & temporal"],
        ["Short posterior ciliary", "6–12"],
        ["Supply the disc via", "circle of Zinn-Haller"],
        ["Also supply", "outer retina & fovea"],
      ],
    },
    {
      id: "vortexVeins",
      name: "Vortex veins",
      system: "vessels",
      geometry: vortexVeins(rand),
      mat: "vein",
      explode: new THREE.Vector3(0, 0, -0.2),
      blurb:
        "Four to six veins draining the whole choroid. Tributaries converge into an ampulla at the equator, then pierce the sclera obliquely — a slanted tunnel that acts as a valve, and a landmark surgeons work around during retinal detachment repair.",
      specs: [
        ["Number", "4–6"],
        ["Location", "at the equator"],
        ["Drain", "the entire choroid"],
        ["Exit to", "superior & inferior ophthalmic veins"],
      ],
    },
    {
      id: "episcleralVessels",
      name: "Episcleral & conjunctival vessels",
      system: "vessels",
      geometry: episcleralVessels(rand),
      mat: "episcleral",
      explode: new THREE.Vector3(0, 0, 1.6),
      blurb:
        "The vessels you actually see when an eye is red. Which layer is injected tells you what is wrong: superficial conjunctival vessels move with the conjunctiva and blanch with phenylephrine, while the deeper episcleral plexus does neither — and a deep violet ring around the cornea means inflammation inside the eye, not on it.",
      specs: [
        ["Superficial", "conjunctival — mobile, blanches"],
        ["Deep", "episcleral — fixed, does not blanch"],
        ["Circumcorneal flush", "suggests uveitis or keratitis"],
        ["Anterior ciliary arteries", "arrive with rectus tendons"],
      ],
    },
  ];
}
