import * as THREE from "three";
import { buildVasculature } from "./vasculature.js";
import {
  choroidTexture,
  discTexture,
  irisBumpTexture,
  irisTexture,
  maculaTexture,
  scleraTexture,
} from "./textures.js";
import {
  D,
  AXIAL_LENGTH,
  CORNEA_APEX_Y,
  CORNEA_CENTRE_Y,
  CORNEA_HALF_ANGLE,
  IRIS_ROOT_Y,
  LENS_EQUATOR_Y,
  LENS_POSTERIOR_Y,
  LENS_THICKNESS,
  LIMBUS_THETA,
  corneaPosteriorAt,
  insertionTheta,
  irisEdgeY,
  lensAnteriorAt,
  lensPosteriorAt,
} from "./dimensions.js";

const rad = (deg) => (deg * Math.PI) / 180;

/** Local build space uses +Y anterior; world space uses +Z. */
const bake = (geo) => {
  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
};

/** A band of a sphere, from `fromDeg` to `toDeg` off the anterior pole. */
const shell = (radius, fromDeg, toDeg, seg = 96) =>
  bake(
    new THREE.SphereGeometry(radius, seg, Math.round(seg * 0.6), 0, Math.PI * 2, rad(fromDeg), rad(toDeg - fromDeg)),
  );

/** A surface of revolution from a profile of [offAxis, axial] pairs. */
const lathe = (points, seg = 96) =>
  bake(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg));

/* ------------------------------- geometries ------------------------------- */

function corneaGeometry() {
  const g = new THREE.SphereGeometry(D.corneaR, 96, 48, 0, Math.PI * 2, 0, CORNEA_HALF_ANGLE);
  g.translate(0, CORNEA_CENTRE_Y, 0);
  return bake(g);
}

function tearFilmGeometry() {
  // 3 µm in life. Drawn 50× thicker so it can be seen and selected at all.
  const g = new THREE.SphereGeometry(D.corneaR + 0.15, 64, 32, 0, Math.PI * 2, 0, CORNEA_HALF_ANGLE);
  g.translate(0, CORNEA_CENTRE_Y, 0);
  return bake(g);
}

function irisGeometry(pupilR = D.pupilR) {
  const inner = irisEdgeY(pupilR);
  const steps = 10;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const rho = pupilR + (D.corneaSemiDiameter - pupilR) * t;
    // a shallow forward bow, as the iris does in life
    const y = inner + (IRIS_ROOT_Y - inner) * t + Math.sin(t * Math.PI) * 0.16;
    pts.push([rho, y]);
  }
  return lathe(pts, 96);
}

function lensGeometry() {
  const steps = 40;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const rho = (D.lensSemiDiameter * i) / steps;
    pts.push([rho, lensAnteriorAt(rho)]);
  }
  for (let i = steps - 1; i >= 0; i--) {
    const rho = (D.lensSemiDiameter * i) / steps;
    pts.push([rho, lensPosteriorAt(rho)]);
  }
  return lathe(pts, 96);
}

function aqueousGeometry(pupilR = D.pupilR) {
  const steps = 18;
  const pts = [];
  // back of the cornea, apex outward to the drainage angle
  for (let i = 0; i <= steps; i++) {
    const rho = (D.corneaSemiDiameter * i) / steps;
    pts.push([rho, corneaPosteriorAt(rho)]);
  }
  // down the front of the iris to the pupil margin
  pts.push([D.corneaSemiDiameter, IRIS_ROOT_Y]);
  const irisSteps = 8;
  for (let i = irisSteps; i >= 0; i--) {
    const t = i / irisSteps;
    const rho = pupilR + (D.corneaSemiDiameter - pupilR) * t;
    const y = irisEdgeY(pupilR) + (IRIS_ROOT_Y - irisEdgeY(pupilR)) * t + Math.sin(t * Math.PI) * 0.16;
    pts.push([rho, y + 0.02]);
  }
  // across the pupil, over the front of the lens, back to the axis
  for (let i = steps; i >= 0; i--) {
    const rho = (pupilR * i) / steps;
    pts.push([rho, lensAnteriorAt(rho) + 0.02]);
  }
  return lathe(pts, 96);
}

function vitreousGeometry() {
  const pts = [];
  const steps = 40;
  // the sphere, from the posterior pole forward to the ora serrata at 60°
  for (let i = 0; i <= steps; i++) {
    const theta = Math.PI - (i / steps) * (Math.PI - rad(60));
    pts.push([D.vitreousR * Math.sin(theta), D.vitreousR * Math.cos(theta)]);
  }
  // anterior hyaloid, sweeping in to hug the back of the lens
  pts.push([D.lensSemiDiameter + 1.4, LENS_EQUATOR_Y - 0.6]);
  const lensSteps = 20;
  for (let i = lensSteps; i >= 0; i--) {
    const rho = (D.lensSemiDiameter * i) / lensSteps;
    pts.push([rho, lensPosteriorAt(rho) - 0.06]);
  }
  return lathe(pts, 64);
}

function zonuleGeometry() {
  const ciliaryR = D.scleraR - 0.8;
  const theta = rad(45);
  const from = new THREE.Vector2(ciliaryR * Math.sin(theta), ciliaryR * Math.cos(theta));
  const positions = [];
  const bundles = 72;
  for (let i = 0; i < bundles; i++) {
    const phi = (i / bundles) * Math.PI * 2;
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    // three fibres per bundle: to the anterior capsule, the equator, the posterior
    for (const [tRho, tY] of [
      [D.lensSemiDiameter - 0.5, lensAnteriorAt(D.lensSemiDiameter - 0.5)],
      [D.lensSemiDiameter, LENS_EQUATOR_Y],
      [D.lensSemiDiameter - 0.5, lensPosteriorAt(D.lensSemiDiameter - 0.5)],
    ]) {
      positions.push(from.x * c, from.y, from.x * s);
      positions.push(tRho * c, tY, tRho * s);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.rotateX(Math.PI / 2);
  return g;
}

function capOnRetina(capRadius, offsetDeg = 0, inset = 0.02) {
  const r = D.retinaR - inset;
  const alpha = capRadius / r;
  const g = new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, Math.PI - alpha, alpha);
  if (offsetDeg) g.rotateZ(-rad(offsetDeg));
  return bake(g);
}

function opticNerveGeometry() {
  const g = new THREE.CylinderGeometry(D.nerveR, D.nerveR * 1.55, D.nerveLength, 40, 1, false);
  g.translate(0, -D.nerveLength / 2, 0);
  g.rotateZ(-rad(D.discAngleDeg));
  const a = rad(D.discAngleDeg);
  g.translate(-D.retinaR * Math.sin(a), -D.retinaR * Math.cos(a), 0);
  return bake(g);
}

/** A rectus muscle: straight from the orbital apex, then wrapped on the globe. */
function rectusGeometry(dir, mmBehindLimbus) {
  const u = dir.clone().normalize();
  const insertion = insertionTheta(mmBehindLimbus);
  const pts = [
    u.clone().multiplyScalar(1.8).setY(D.orbitApexY),
    u.clone().multiplyScalar(2.6).setY(D.orbitApexY * 0.55),
  ];
  const from = rad(128);
  const steps = 9;
  for (let i = 0; i <= steps; i++) {
    const theta = from + ((insertion - from) * i) / steps;
    pts.push(
      u
        .clone()
        .multiplyScalar(D.muscleGlobeR * Math.sin(theta))
        .setY(D.muscleGlobeR * Math.cos(theta)),
    );
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return bake(new THREE.TubeGeometry(curve, 64, D.muscleR * 1.35, 10, false));
}

/** An oblique: a tendon slung across the globe from an anterior origin. */
function obliqueGeometry(origin, waypoints, insertionDir) {
  const pts = [
    new THREE.Vector3(...origin),
    ...waypoints.map((w) => new THREE.Vector3(...w)),
    new THREE.Vector3(...insertionDir).normalize().multiplyScalar(D.muscleGlobeR),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  return bake(new THREE.TubeGeometry(curve, 64, D.muscleR * 1.1, 10, false));
}

function lidGeometry(upper) {
  const g = new THREE.SphereGeometry(
    D.scleraR + 1.25,
    64,
    32,
    upper ? Math.PI + 0.16 : 0.16,
    Math.PI - 0.32,
    0,
    rad(upper ? 78 : 66),
  );
  return bake(g);
}

/* -------------------------------- materials -------------------------------- */

const MAT = {
  sclera: { color: 0xffffff, roughness: 0.58, opacity: 1, map: "sclera" },
  conjunctiva: { color: 0xf0d9d2, roughness: 0.35, opacity: 0.26 },
  cornea: { color: 0xf2fbff, roughness: 0.035, opacity: 0.34, physical: true },
  tearFilm: { color: 0xcfe8f2, roughness: 0.02, opacity: 0.13 },
  iris: { color: 0xffffff, roughness: 0.48, opacity: 1, map: "iris", bump: "irisBump" },
  ciliary: { color: 0xa8503a, roughness: 0.6, opacity: 1 },
  choroid: { color: 0xffffff, roughness: 0.55, opacity: 1, map: "choroid" },
  retina: { color: 0xe8b294, roughness: 0.32, opacity: 0.3 },
  macula: { color: 0xffffff, roughness: 0.5, opacity: 0.92, map: "macula" },
  opticDisc: { color: 0xffffff, roughness: 0.45, opacity: 1, map: "disc" },
  opticNerve: { color: 0xe4dbc6, roughness: 0.5, opacity: 1 },
  lens: { color: 0xd2e4ef, roughness: 0.06, opacity: 0.42 },
  zonules: { color: 0xbfc8cc, opacity: 0.75 },
  aqueous: { color: 0xcfe3f2, roughness: 0.05, opacity: 0.14 },
  vitreous: { color: 0xd8e6ec, roughness: 0.05, opacity: 0.1 },
  muscle: { color: 0xa63a2c, roughness: 0.62, opacity: 1 },
  lid: { color: 0xd5a184, roughness: 0.7, opacity: 1 },
  artery: { color: 0xc4341f, roughness: 0.32, opacity: 1 },
  vein: { color: 0x7c1b2f, roughness: 0.36, opacity: 1 },
  episcleral: { color: 0xb03c2a, roughness: 0.4, opacity: 0.88 },
};

/* Textures are big canvases — built once, on first use, never per material. */
const TEX = {};
const texture = (key) => {
  if (TEX[key]) return TEX[key];
  const make = {
    sclera: scleraTexture,
    iris: irisTexture,
    irisBump: irisBumpTexture,
    choroid: choroidTexture,
    macula: maculaTexture,
    disc: discTexture,
  }[key];
  TEX[key] = make();
  return TEX[key];
};

export function disposeTextures() {
  for (const k of Object.keys(TEX)) {
    TEX[k].dispose();
    delete TEX[k];
  }
}

function material(key) {
  const spec = MAT[key];
  const common = {
    color: spec.color,
    roughness: spec.roughness ?? 0.5,
    transparent: spec.opacity < 1,
    opacity: spec.opacity,
    side: THREE.DoubleSide,
    depthWrite: spec.opacity > 0.6,
  };

  // The cornea is the one surface that has to look wet. Transmission plus a
  // clearcoat and an environment map is what produces the specular highlight
  // that reads, instantly, as a living eye rather than a plastic ball.
  const m = spec.physical
    ? new THREE.MeshPhysicalMaterial({
        ...common,
        metalness: 0,
        transmission: 0.94,
        ior: 1.376,
        thickness: 0.55,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        specularIntensity: 1,
      })
    : new THREE.MeshStandardMaterial({ ...common, metalness: 0.02 });

  if (spec.map) m.map = texture(spec.map);
  if (spec.bump) {
    m.bumpMap = texture(spec.bump);
    m.bumpScale = 1.4;
  }
  m.userData.baseOpacity = spec.opacity;
  return m;
}

/* ------------------------------- the structures ---------------------------- */

const Z = (n) => new THREE.Vector3(0, 0, n); // world: +Z anterior
const Y = (n) => new THREE.Vector3(0, n, 0); // world: +Y superior
const X = (n) => new THREE.Vector3(n, 0, 0); // world: +X temporal

export const SYSTEMS = [
  { id: "fibrous", name: "Fibrous coat", note: "The pressure vessel and its window" },
  { id: "vascular", name: "Vascular coat", note: "Blood supply, aperture, focus motor" },
  { id: "neural", name: "Neural coat", note: "Sensor and cable" },
  { id: "optical", name: "Optical media", note: "Everything light crosses" },
  { id: "vessels", name: "Blood supply", note: "Five separate circulations" },
  { id: "muscles", name: "Extraocular muscles", note: "Six per eye" },
  { id: "adnexa", name: "Adnexa", note: "Lids and tear film", defaultOff: true },
];

/**
 * Builds every mesh once. Returns plain descriptors; the scene layer owns the
 * Object3D wiring so this file stays pure geometry and anatomy.
 */
export function buildStructures() {
  const s = (def) => ({ explode: Z(0), ...def });

  return [
    ...buildVasculature().map((v) => s(v)),
    /* ------------------------------ fibrous ------------------------------ */
    s({
      id: "sclera",
      name: "Sclera",
      system: "fibrous",
      geometry: shell(D.scleraR, (LIMBUS_THETA * 180) / Math.PI, 180),
      mat: "sclera",
      explode: Z(-1.35),
      blurb:
        "Dense interwoven collagen holding the eye's shape against its own internal pressure. Its fibres are irregular, which is why it is white where the cornea is clear.",
      specs: [
        ["Outer radius", "12.0 mm"],
        ["Thickness", "0.3–1.0 mm"],
        ["Thinnest", "behind muscle insertions"],
        ["Resists", "10–21 mmHg"],
      ],
    }),
    s({
      id: "cornea",
      name: "Cornea",
      system: "fibrous",
      geometry: corneaGeometry(),
      mat: "cornea",
      explode: Z(2.3),
      blurb:
        "The eye's strongest lens — about +43 of its roughly +60 dioptres. No blood vessels at all, because vessels would scatter light. The most densely nerve-supplied tissue in the body.",
      specs: [
        ["Power", "+43 D"],
        ["Radius of curvature", "7.8 mm"],
        ["Diameter", "11.5 mm"],
        ["Central thickness", "0.52 mm"],
        ["Blood vessels", "none"],
      ],
    }),
    s({
      id: "conjunctiva",
      name: "Conjunctiva",
      system: "fibrous",
      geometry: shell(D.conjunctivaR, (LIMBUS_THETA * 180) / Math.PI, 102, 64),
      mat: "conjunctiva",
      explode: Z(1.7),
      blurb:
        "A transparent membrane over the white of the eye carrying the goblet cells that make tears spreadable, and the vessels that dilate to make an eye look red.",
      specs: [
        ["Thickness", "≈ 0.3 mm"],
        ["Secretes", "mucins"],
        ["Immune tissue", "CALT"],
      ],
    }),

    /* ------------------------------ vascular ----------------------------- */
    s({
      id: "iris",
      name: "Iris",
      system: "vascular",
      geometry: irisGeometry(),
      mat: "iris",
      explode: Z(1.15),
      blurb:
        "A muscular diaphragm doing exactly what a camera aperture does. Closing from 8 mm to 2 mm cuts incoming light about sixteenfold — and by blocking the imperfect edges of the optics, it sharpens the image. That is what squinting is.",
      specs: [
        ["Pupil range", "2–8 mm"],
        ["Equivalent aperture", "f/8.3 – f/2.1"],
        ["Constrictor", "CN III, parasympathetic"],
        ["Dilator", "sympathetic"],
      ],
    }),
    s({
      id: "ciliary",
      name: "Ciliary body",
      system: "vascular",
      geometry: shell(D.scleraR - 0.8, (LIMBUS_THETA * 180) / Math.PI + 3, 56, 64),
      mat: "ciliary",
      explode: Z(0.95),
      blurb:
        "Two unrelated jobs in one ring of tissue: a muscle that reshapes the lens to focus close up, and an epithelium that manufactures the fluid filling the front of the eye. Which is why drugs aimed at one often disturb the other.",
      specs: [
        ["Accommodation at 20", "≈ 10 D"],
        ["Accommodation at 55", "≈ 1 D"],
        ["Aqueous output", "2.5 µL/min"],
        ["Innervation", "CN III"],
      ],
    }),
    s({
      id: "choroid",
      name: "Choroid",
      system: "vascular",
      geometry: shell(D.choroidR, 56, 180),
      mat: "choroid",
      explode: Z(-0.95),
      blurb:
        "A dense sponge of vessels with the highest blood flow per gram of any tissue in the body. It feeds the outer retina and carries away the heat of all that absorbed light.",
      specs: [
        ["Thickness", "0.2–0.3 mm"],
        ["Blood flow", "highest per gram, anywhere"],
        ["Supplies", "outer retina & fovea"],
      ],
    }),

    /* ------------------------------- neural ------------------------------ */
    s({
      id: "retina",
      name: "Retina",
      system: "neural",
      geometry: shell(D.retinaR, 60, 180),
      mat: "retina",
      explode: Z(-0.55),
      blurb:
        "Brain tissue, pushed out into the eye during development and about as thick as a sheet of paper. 120 million rods for dim light, 6 million cones for detail and colour. It does not regenerate — which is the whole reason prevention matters more than treatment. It is drawn almost transparent here because it is: the orange of a fundus photograph is choroidal blood seen straight through it.",
      specs: [
        ["Thickness", "0.25 mm"],
        ["Rods", "≈ 120 million"],
        ["Cones", "≈ 6 million"],
        ["Layers", "10"],
        ["Regenerates", "no"],
      ],
    }),
    s({
      id: "macula",
      name: "Macula & fovea",
      system: "neural",
      geometry: capOnRetina(D.maculaR, 0, 0.03),
      mat: "macula",
      explode: Z(-0.35),
      blurb:
        "A pit a third of a millimetre across does nearly all of your detailed seeing. Reading, recognising a face, anything you would call 'seeing clearly' happens in a patch of retina smaller than a full stop. Move the target a few degrees off it and acuity drops tenfold.",
      specs: [
        ["Macula", "5.5 mm across"],
        ["Foveola", "0.35 mm across"],
        ["Peak cone density", "≈ 200 000 /mm²"],
        ["Rods at centre", "none"],
        ["Cone : ganglion", "≈ 1 : 1"],
      ],
    }),
    s({
      id: "opticDisc",
      name: "Optic disc",
      system: "neural",
      geometry: capOnRetina(D.discR, D.discAngleDeg, 0.04),
      mat: "opticDisc",
      explode: Z(-0.45),
      blurb:
        "The hole where a million nerve fibres leave. No photoreceptors at all, so you have a real blind spot 15° off centre — about nine full moons wide — that your brain silently fills in. This is also where glaucoma does its damage.",
      specs: [
        ["Nerve fibres", "≈ 1.2 million"],
        ["Size", "1.5 × 1.9 mm"],
        ["Photoreceptors", "none"],
        ["Blind spot at", "15° temporal"],
        ["Healthy cup : disc", "< 0.6"],
      ],
    }),
    s({
      id: "opticNerve",
      name: "Optic nerve",
      system: "neural",
      geometry: opticNerveGeometry(),
      mat: "opticNerve",
      explode: new THREE.Vector3(-0.45, 0, -1.7),
      blurb:
        "Not really a nerve but a tract of the central nervous system, wrapped in the same membranes as the brain. That has consequences: pressure inside the skull swells it, and inflammation in it is often the first sign of multiple sclerosis.",
      specs: [
        ["Length to chiasm", "≈ 50 mm"],
        ["Crossing at chiasm", "≈ 53%"],
        ["Sheath", "continuous with meninges"],
        ["Regenerates", "no"],
      ],
    }),

    /* ------------------------------ optical ------------------------------ */
    s({
      id: "lens",
      name: "Crystalline lens",
      system: "optical",
      geometry: lensGeometry(),
      mat: "lens",
      explode: Z(0.8),
      blurb:
        "It keeps growing your whole life, adding layers like an onion and never shedding a cell. That single design decision is why it stiffens into presbyopia in your forties and eventually clouds into cataract. Both are the same fact seen twice.",
      specs: [
        ["Power at rest", "+17 D"],
        ["Accommodated", "up to +25 D"],
        ["Thickness", `${LENS_THICKNESS.toFixed(2)} mm`],
        ["Equator", "9.5 mm"],
        ["Cells shed", "none, ever"],
      ],
    }),
    s({
      id: "zonules",
      name: "Zonular fibres",
      system: "optical",
      geometry: zonuleGeometry(),
      mat: "zonules",
      explode: Z(0.8),
      isLines: true,
      blurb:
        "Hundreds of fibrillin threads suspending the lens like the spokes of a wheel. Under tension they hold it flat for distance; released, the elastic capsule rounds it up for near.",
      specs: [
        ["Fibre diameter", "≈ 10 µm"],
        ["Protein", "fibrillin-1"],
        ["Span", "ciliary body → capsule"],
      ],
    }),
    s({
      id: "aqueous",
      name: "Aqueous humour",
      system: "optical",
      geometry: aqueousGeometry(),
      mat: "aqueous",
      explode: Z(1.5),
      blurb:
        "Made continuously and drained continuously; the balance sets the pressure inside the eye. Clog the drain and pressure climbs — the mechanism behind most glaucoma. The whole volume turns over about every 100 minutes.",
      specs: [
        ["Chamber depth", "3.0 mm"],
        ["Normal pressure", "10–21 mmHg"],
        ["Production", "2.5 µL/min"],
        ["Drains via", "trabecular meshwork"],
      ],
    }),
    s({
      id: "vitreous",
      name: "Vitreous humour",
      system: "optical",
      geometry: vitreousGeometry(),
      mat: "vitreous",
      explode: Z(-0.2),
      blurb:
        "A gel filling four fifths of the eye, holding the retina against the wall. With age it liquefies and shrinks, casting the shadows people see as floaters — and when it finally peels away it can tear the retina on the way out.",
      specs: [
        ["Volume", "4 mL (80% of the eye)"],
        ["Water", "98–99%"],
        ["Structure", "collagen II + hyaluronan"],
        ["Cells", "hyalocytes only"],
      ],
    }),

    /* ------------------------------ muscles ------------------------------ */
    s({
      id: "superiorRectus",
      name: "Superior rectus",
      system: "muscles",
      geometry: rectusGeometry(new THREE.Vector3(0, 0, -1), 7.7),
      mat: "muscle",
      explode: Y(1.5),
      blurb: "Elevates the eye. Shares its nerve supply and its fascia with the levator of the upper lid, which is why the lid rises as you look up.",
      specs: [["Nerve", "CN III"], ["Insertion", "7.7 mm behind limbus"], ["Action", "elevation"]],
    }),
    s({
      id: "inferiorRectus",
      name: "Inferior rectus",
      system: "muscles",
      geometry: rectusGeometry(new THREE.Vector3(0, 0, 1), 6.5),
      mat: "muscle",
      explode: Y(-1.5),
      blurb: "Depresses the eye. Trapped in an orbital floor fracture it tethers upgaze — the classic cause of double vision after a blow to the eye.",
      specs: [["Nerve", "CN III"], ["Insertion", "6.5 mm behind limbus"], ["Action", "depression"]],
    }),
    s({
      id: "medialRectus",
      name: "Medial rectus",
      system: "muscles",
      geometry: rectusGeometry(new THREE.Vector3(-1, 0, 0), 5.5),
      mat: "muscle",
      explode: X(-1.5),
      blurb: "The strongest of the six. Turns the eye toward the nose; both together are what convergence for reading is.",
      specs: [["Nerve", "CN III"], ["Insertion", "5.5 mm behind limbus"], ["Action", "adduction"]],
    }),
    s({
      id: "lateralRectus",
      name: "Lateral rectus",
      system: "muscles",
      geometry: rectusGeometry(new THREE.Vector3(1, 0, 0), 6.9),
      mat: "muscle",
      explode: X(1.5),
      blurb: "Turns the eye outward, and the only muscle supplied by the sixth nerve — a nerve so easily compressed that its palsy is a false localising sign of raised intracranial pressure.",
      specs: [["Nerve", "CN VI"], ["Insertion", "6.9 mm behind limbus"], ["Action", "abduction"]],
    }),
    s({
      id: "superiorOblique",
      name: "Superior oblique",
      system: "muscles",
      geometry: obliqueGeometry([-6.2, 9.4, -7], [[-2.4, 4.2, -9.4], [2.6, -1.6, -10.2]], [0.45, -0.5, -0.74]),
      mat: "muscle",
      explode: new THREE.Vector3(0.5, 1.2, -0.9),
      blurb: "Its tendon turns through a pulley of cartilage in the front of the orbit before running backwards to insert. Depresses and intorts the eye; its palsy makes people tilt their head to fuse.",
      specs: [["Nerve", "CN IV"], ["Runs through", "the trochlea"], ["Action", "depression & intorsion"]],
    }),
    s({
      id: "inferiorOblique",
      name: "Inferior oblique",
      system: "muscles",
      geometry: obliqueGeometry([-6.4, 9.2, 6.6], [[-2.2, 3.4, 9.2], [2.8, -2.2, 9.4]], [0.5, -0.45, 0.74]),
      mat: "muscle",
      explode: new THREE.Vector3(0.5, -1.2, 0.9),
      blurb: "The only muscle originating at the front of the orbit rather than the apex. Elevates and extorts the eye, and inserts close to the macula.",
      specs: [["Nerve", "CN III"], ["Origin", "anterior orbital floor"], ["Action", "elevation & extorsion"]],
    }),

    /* ------------------------------- adnexa ------------------------------ */
    s({
      id: "tearFilm",
      name: "Tear film",
      system: "adnexa",
      geometry: tearFilmGeometry(),
      mat: "tearFilm",
      explode: Z(2.7),
      exaggerated: "Drawn 50× thicker than life so it can be seen at all.",
      blurb:
        "Three micrometres thick — a thousandth of a fingernail — and the first surface light meets. When it breaks up, vision blurs. That is why a dry eye can read 20/20 one moment and not the next.",
      specs: [
        ["Thickness", "≈ 3 µm"],
        ["Layers", "mucin · aqueous · lipid"],
        ["Break-up time", "> 10 s normal"],
        ["Volume", "≈ 7 µL"],
      ],
    }),
    s({
      id: "upperLid",
      name: "Upper eyelid",
      system: "adnexa",
      geometry: lidGeometry(true),
      mat: "lid",
      explode: Y(2.4),
      blurb:
        "A shutter that resurfaces the tear film roughly every five seconds, and a pump that pushes tears toward the drain. Blink rate collapses during screen work, which is most of what 'digital eye strain' actually is.",
      specs: [
        ["Blinks", "15–20 /min at rest"],
        ["During screen use", "as low as 4 /min"],
        ["Skin thickness", "thinnest on the body"],
      ],
    }),
    s({
      id: "lowerLid",
      name: "Lower eyelid",
      system: "adnexa",
      geometry: lidGeometry(false),
      mat: "lid",
      explode: Y(-2.4),
      blurb:
        "Holds the tear lake against the eye. Age slackens it, and once it turns outward the tear pump fails; turned inward, the lashes abrade the cornea instead.",
      specs: [
        ["Meibomian glands", "≈ 25 per lid"],
        ["Tear drainage", "via the punctum"],
      ],
    }),
  ];
}

export { AXIAL_LENGTH, material, D };
