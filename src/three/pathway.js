/* ---------------------------------------------------------------------------
   The visual pathway, from retina to cortex — and the one thing it explains
   better than any other diagram: why the *pattern* of field loss tells you
   where the lesion is.

   The organising fact is the chiasm. Light from the left half of the world
   lands on the +X half of BOTH retinas (the lens inverts the image). Nasal
   fibres cross and temporal fibres do not, so the +X-side bundle of each eye
   ends up in the right optic tract together. From the chiasm back, one tract
   carries one half of the *world*, not one eye.

   So: monocular loss is in front of the chiasm. Bitemporal loss is at it.
   Anything homonymous is behind it. That ladder is what the lesion sites below
   walk through.

   Geometry is in millimetres, matching the eye model. Eyes at ±31.5 mm
   (interpupillary 63 mm), looking down +Z, brain receding to −Z.
   --------------------------------------------------------------------------- */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const GLOBE_R = 12;
export const EYE_X = 31.5;
export const CHIASM_Z = -52;
export const LGN = new THREE.Vector3(20, -5, -80);
export const V1_Z = -148;

const tube = (pts, r, seg = 48, rad = 8) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, rad, false);

/* ------------------------------- the fibres -------------------------------- */

/**
 * One hemifield's worth of fibres, for one eye.
 *
 * `side` is which half of the retina the bundle comes from: +1 is the +X half,
 * which sees the LEFT of the world and ends in the RIGHT (+X) tract. `eyeX` is
 * which eye it starts from. A bundle crosses when its side and its eye are on
 * opposite sides — that is exactly the definition of a nasal fibre.
 */
function bundle(eyeX, side) {
  const crosses = Math.sign(eyeX) !== side;
  const offset = side * 2.6;
  const startX = eyeX + offset;
  const tractX = side * 9;

  return tube(
    [
      [startX, 0, -GLOBE_R + 1],
      [eyeX + offset * 0.9, 0, -24],
      [eyeX * 0.55 + offset, -1, -40],
      // through the chiasm: crossing fibres pass the midline here
      [crosses ? side * 3.2 : startX * 0.5, -2, CHIASM_Z],
      [tractX * 0.8, -2.5, CHIASM_Z - 9],
      [tractX, -3.5, CHIASM_Z - 20],
      [side * 15, -4.5, -74],
      [side * 19, -5, -79],
    ],
    2.1,
    64,
  );
}

function opticRadiation(side, division) {
  const start = [side * 19, -5, -80];
  // Meyer's loop: the fibres carrying the SUPERIOR field detour forward into
  // the temporal lobe before turning back, which is why a temporal lobectomy
  // takes the upper quadrant and not the lower one.
  const pts =
    division === "temporal"
      ? [
          start,
          [side * 25, -8, -74],
          [side * 28, -9, -66],
          [side * 27, -9, -78],
          [side * 24, -8, -100],
          [side * 18, -6, -122],
          [side * 11, -5, V1_Z + 6],
        ]
      : [
          start,
          [side * 22, -2, -92],
          [side * 21, 1, -112],
          [side * 16, 2, -132],
          [side * 10, 2, V1_Z + 6],
        ];
  return tube(pts, division === "temporal" ? 2.6 : 2.8, 64);
}

/* ------------------------------ the structures ------------------------------ */

export function buildPathway() {
  const parts = [];

  const add = (id, name, geometry, mat, blurb, specs) =>
    parts.push({ id, name, geometry, mat, blurb, specs });

  /* --- the two globes --- */
  const globes = [];
  for (const x of [EYE_X, -EYE_X]) {
    const g = new THREE.SphereGeometry(GLOBE_R, 48, 32);
    g.translate(x, 0, 0);
    globes.push(g);
    const c = new THREE.SphereGeometry(7.8, 32, 20, 0, Math.PI * 2, 0, 0.83);
    c.rotateX(-Math.PI / 2);
    c.translate(x, 0, 5.03);
    globes.push(c);
  }
  add(
    "globes",
    "The eyes",
    mergeGeometries(globes),
    "globe",
    "Two independent optical instruments, each splitting its image down the middle before sending it on. Nothing about a field defect makes sense until you accept that the eye is not the unit the brain works in — the half-world is.",
    [
      ["Interpupillary distance", "63 mm"],
      ["Fibres per nerve", "≈ 1.2 million"],
      ["Binocular overlap", "≈ 120°"],
    ],
  );

  /* --- fibre bundles, coloured by which half of the world they carry --- */
  add(
    "leftFieldFibres",
    "Fibres carrying the LEFT half of vision",
    mergeGeometries([bundle(EYE_X, 1), bundle(-EYE_X, 1)]),
    "leftField",
    "From the +X half of both retinas. The right eye's bundle is temporal and stays on its own side; the left eye's is nasal and crosses at the chiasm. They arrive in the right optic tract together — so from here back, this is one hemifield, not one eye.",
    [
      ["From", "temporal retina OD + nasal retina OS"],
      ["Crosses at chiasm", "the nasal half only"],
      ["Ends in", "right tract → right LGN → right V1"],
    ],
  );
  add(
    "rightFieldFibres",
    "Fibres carrying the RIGHT half of vision",
    mergeGeometries([bundle(EYE_X, -1), bundle(-EYE_X, -1)]),
    "rightField",
    "The mirror image: nasal fibres of the right eye cross, temporal fibres of the left eye do not, and both end in the left tract. Roughly 53% of all fibres cross — slightly more than half, because the nasal retina is the larger portion.",
    [
      ["From", "nasal retina OD + temporal retina OS"],
      ["Proportion crossing", "≈ 53%"],
      ["Ends in", "left tract → left LGN → left V1"],
    ],
  );

  /* --- chiasm --- */
  const chiasm = new THREE.SphereGeometry(7.2, 32, 20);
  chiasm.scale(1.5, 0.5, 0.8);
  chiasm.translate(0, -2, CHIASM_Z);
  add(
    "chiasm",
    "Optic chiasm",
    chiasm,
    "chiasm",
    "Where the nasal fibres of each eye cross. It sits directly above the pituitary gland, which is why a pituitary adenoma growing upward presses on the crossing fibres first — taking the temporal field of both eyes and nothing else.",
    [
      ["Width", "≈ 13 mm"],
      ["Sits above", "the pituitary fossa"],
      ["Crossing fibres", "≈ 53%"],
      ["Classic lesion", "pituitary adenoma"],
    ],
  );

  /* --- lateral geniculate nuclei --- */
  const lgns = [];
  for (const s of [1, -1]) {
    const g = new THREE.SphereGeometry(4.6, 24, 16);
    g.scale(1, 0.75, 1.3);
    g.translate(s * LGN.x, LGN.y, LGN.z);
    lgns.push(g);
  }
  add(
    "lgn",
    "Lateral geniculate nucleus",
    mergeGeometries(lgns),
    "lgn",
    "The relay in the thalamus, and the first place the two eyes' signals sit side by side — six layers, alternating between eyes, which is where the machinery of binocular vision and stereopsis begins.",
    [
      ["Layers", "6, alternating by eye"],
      ["Magnocellular", "layers 1–2, motion"],
      ["Parvocellular", "layers 3–6, detail & colour"],
      ["Onward", "via the optic radiations"],
    ],
  );

  /* --- optic radiations --- */
  add(
    "meyerLoop",
    "Temporal radiation (Meyer's loop)",
    mergeGeometries([opticRadiation(1, "temporal"), opticRadiation(-1, "temporal")]),
    "meyer",
    "Fibres carrying the SUPERIOR field swing forward into the temporal lobe before turning back toward the cortex. That detour is why temporal lobe surgery or a temporal stroke produces a defect in the upper quadrant — the 'pie in the sky'.",
    [
      ["Carries", "the superior visual field"],
      ["Detours through", "the temporal lobe"],
      ["Lesion gives", "superior quadrantanopia"],
      ["Surgical relevance", "temporal lobectomy for epilepsy"],
    ],
  );
  add(
    "parietalRadiation",
    "Parietal radiation",
    mergeGeometries([opticRadiation(1, "parietal"), opticRadiation(-1, "parietal")]),
    "parietal",
    "Fibres carrying the INFERIOR field take the direct route back through the parietal lobe. A lesion here produces the mirror defect — the lower quadrant, 'pie on the floor' — and often takes optokinetic responses with it.",
    [
      ["Carries", "the inferior visual field"],
      ["Route", "direct, through parietal white matter"],
      ["Lesion gives", "inferior quadrantanopia"],
    ],
  );

  /* --- primary visual cortex --- */
  const cortex = [];
  for (const s of [1, -1]) {
    const g = new THREE.SphereGeometry(15, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.7);
    g.scale(0.62, 1, 1.5);
    g.rotateX(Math.PI / 2);
    g.translate(s * 9, 0, V1_Z);
    cortex.push(g);
    // the occipital pole, where the macula is represented
    const pole = new THREE.SphereGeometry(6.4, 24, 16);
    pole.scale(0.8, 0.8, 0.55);
    pole.translate(s * 8, 0, V1_Z - 15);
    cortex.push(pole);
  }
  add(
    "v1",
    "Primary visual cortex (V1)",
    mergeGeometries(cortex),
    "cortex",
    "A map of half the visual world on each side, folded around the calcarine fissure — upper field below the fissure, lower field above it, inverted again. The central few degrees claim a wildly disproportionate area at the occipital pole, and that pole has a dual blood supply, which is why an occipital stroke so often spares the very centre of vision.",
    [
      ["Represents", "the contralateral hemifield"],
      ["Central 10°", "≈ 50% of the cortical area"],
      ["Occipital pole", "dual blood supply"],
      ["Hence", "macular sparing in stroke"],
    ],
  );

  return parts;
}

/* ------------------------------ lesion sites -------------------------------- */

/**
 * Eight lesions walking up the pathway. Field defects are written in space
 * coordinates — 'left' means the left half of the world is missing, for both
 * eyes — because that is what makes a homonymous defect look homonymous.
 */
export const LESIONS = [
  {
    id: "retina",
    label: "Retina",
    at: [EYE_X + 4, 7, -6],
    site: "Superior branch retinal artery, right eye",
    cause: "Branch retinal artery occlusion, or a retinal detachment.",
    field: { od: ["lower"], os: [] },
    reading:
      "Monocular, and it stops dead at the horizontal midline — retinal nerve fibres do not cross the horizontal raphe. A sharp horizontal edge in one eye alone means retina or optic nerve head, not brain.",
    localises: "In front of the chiasm — one eye only",
  },
  {
    id: "opticNerve",
    label: "Optic nerve",
    at: [EYE_X - 6, -1, -32],
    site: "Right optic nerve",
    cause: "Optic neuritis, compression, or ischaemic optic neuropathy.",
    field: { od: ["all"], os: [] },
    reading:
      "One eye affected, the other completely normal, plus a relative afferent pupillary defect. Cover the good eye and the patient notices; leave it open and they may not have noticed at all.",
    localises: "In front of the chiasm — one eye only",
  },
  {
    id: "junction",
    label: "Nerve–chiasm junction",
    at: [7, -2, CHIASM_Z + 7],
    site: "Junction of right optic nerve and chiasm",
    cause: "Medial sphenoid or tuberculum sellae meningioma.",
    field: { od: ["all"], os: ["upper-left"] },
    reading:
      "The junctional scotoma: total loss in one eye plus a superotemporal wedge missing in the *other*. That second, easily missed defect is the one that localises the lesion — and it is why the fellow eye's field must always be tested.",
    localises: "At the nerve–chiasm junction",
  },
  {
    id: "chiasm",
    label: "Chiasm",
    at: [0, 3, CHIASM_Z],
    site: "Central chiasm",
    cause: "Pituitary adenoma growing upward, or craniopharyngioma.",
    field: { od: ["right"], os: ["left"] },
    reading:
      "Bitemporal hemianopia — each eye loses its outer half, so the patient keeps a full field only where the two eyes overlap. They often report bumping into door frames on both sides, and acuity can be perfectly normal. This pattern means chiasm, and chiasm means imaging today.",
    localises: "At the chiasm",
  },
  {
    id: "tract",
    label: "Optic tract",
    at: [12, -3, CHIASM_Z - 16],
    site: "Right optic tract",
    cause: "Tumour, demyelination, or infarct.",
    field: { od: ["left"], os: ["left"] },
    reading:
      "The same half of the world missing in both eyes — homonymous. Tract lesions are characteristically *incongruous*: the two eyes' defects do not match in shape, because the fibres have not yet been sorted into a tidy retinotopic map.",
    localises: "Behind the chiasm — right side",
  },
  {
    id: "meyer",
    label: "Temporal lobe",
    at: [28, -9, -70],
    site: "Right temporal lobe, Meyer's loop",
    cause: "Temporal lobectomy for epilepsy, or a middle cerebral infarct.",
    field: { od: ["upper-left"], os: ["upper-left"] },
    reading:
      "A superior quadrant gone on the same side in both eyes — 'pie in the sky'. It maps precisely onto the forward detour those fibres make through the temporal lobe, and it is a known and counselled risk of temporal lobe surgery.",
    localises: "Right temporal lobe",
  },
  {
    id: "parietal",
    label: "Parietal lobe",
    at: [21, 2, -108],
    site: "Right parietal radiation",
    cause: "Middle cerebral artery infarct, or tumour.",
    field: { od: ["lower-left"], os: ["lower-left"] },
    reading:
      "The inferior quadrant instead — 'pie on the floor'. Parietal lesions often bring neglect and a defective optokinetic response with them, so the visual field is rarely the only finding.",
    localises: "Right parietal lobe",
  },
  {
    id: "occipital",
    label: "Occipital cortex",
    at: [9, 0, V1_Z - 18],
    site: "Right occipital cortex",
    cause: "Posterior cerebral artery infarct.",
    field: { od: ["left"], os: ["left"], spareMacula: true },
    reading:
      "Homonymous, highly congruous — the two eyes' defects are near-identical, because the cortical map is precise — and typically sparing the central few degrees. That macular sparing is why acuity can measure 20/20 in a patient who cannot read a line of text or safely drive.",
    localises: "Right occipital cortex",
  },
];
