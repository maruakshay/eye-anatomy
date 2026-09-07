/* ---------------------------------------------------------------------------
   Which structure each condition belongs to, so selecting a part of the eye
   surfaces only the handful of diseases that live there.

   Defaults come from the condition's region; the overrides below move the
   entries whose region is broader than the structure that actually fails.
   --------------------------------------------------------------------------- */

import { CONDITIONS } from "./conditions.js";

/** Structures with no mesh, reachable from the list and from search. */
export const VIRTUAL = [
  {
    id: "globe",
    name: "The eye as a whole",
    system: "whole",
    blurb:
      "Refractive error is not a fault in any one part — it is a mismatch between the length of the eye and the power of its optics. Systemic disease and injury also cut across structures.",
    specs: [
      ["Axial length", "23.9 mm average"],
      ["Total power", "≈ +60 D"],
      ["1 mm of length", "≈ 2.5 D"],
      ["Volume", "≈ 6.5 mL"],
    ],
  },
  {
    id: "lids",
    name: "Lid margin & lacrimal system",
    system: "whole",
    blurb:
      "The glands along the lash line and the drainage channel to the nose. Unglamorous, and the source of most everyday eye discomfort.",
    specs: [
      ["Meibomian glands", "≈ 50 per eye"],
      ["Tear drainage", "punctum → sac → nose"],
      ["Meibum melts at", "≈ 32 °C"],
    ],
  },
  {
    id: "muscles",
    name: "Binocular alignment",
    system: "whole",
    blurb:
      "Two eyes aimed at one point to within a fraction of a degree. When that fails, adults see double and children suppress an eye — which is how vision is lost without any part of the eye being diseased.",
    specs: [
      ["Muscles per eye", "6"],
      ["Fusion tolerance", "< 1°"],
      ["Saccade peak", "up to 700 °/s"],
    ],
  },
];

const BY_REGION = {
  lids: "lids",
  surface: "tearFilm",
  conjunctiva: "conjunctiva",
  cornea: "cornea",
  iris: "iris",
  lens: "lens",
  pressure: "aqueous",
  vitreous: "vitreous",
  retina: "retina",
  pathway: "opticNerve",
  binocular: "muscles",
  colour: "retina",
  refractive: "globe",
  trauma: "globe",
  systemic: "globe",
};

/** Conditions whose home is more specific than their region. */
const OVERRIDE = {
  /* the macula, not the retina at large */
  "Dry age-related macular degeneration": "macula",
  "Wet (neovascular) AMD": "macula",
  "Diabetic macular oedema": "macula",
  "Central serous chorioretinopathy": "macula",
  "Macular hole & epiretinal membrane": "macula",
  "Stargardt disease": "macula",
  "Myopic maculopathy": "macula",
  "Hydroxychloroquine retinopathy": "macula",
  "Solar & laser retinopathy": "macula",
  "Cystoid macular oedema": "macula",

  /* the vascular coat */
  "Choroidal melanoma": "choroid",

  /* the five circulations — where the vessel actually is */
  "Retinal artery occlusion": "retinalArteries",
  "Retinal vein occlusion": "retinalVeins",
  "Hypertensive retinopathy": "retinalArteries",
  "Sickle cell retinopathy": "retinalArteries",
  "Diabetic retinopathy": "retinalArteries",
  "Subconjunctival haemorrhage": "episcleralVessels",
  // Giant cell arteritis occludes the short posterior ciliary arteries — which
  // is why it blinds through the optic nerve head rather than the retina.
  "Giant cell arteritis": "ciliaryArteries",
  "Non-arteritic ischaemic optic neuropathy": "ciliaryArteries",

  /* the nerve head itself, not the drainage */
  "Primary open-angle glaucoma": "opticDisc",
  "Normal-tension glaucoma": "opticDisc",
  "Ocular hypertension": "opticDisc",

  /* the ciliary body's two jobs */
  "Presbyopia": "ciliary",
  "Lens dislocation (ectopia lentis)": "zonules",

  /* the sclera is where these actually sit */
  "Episcleritis & scleritis": "sclera",
  "Open globe injury": "sclera",
  "Blunt trauma & orbital fracture": "sclera",
  "Rheumatoid arthritis & the eye": "sclera",

  /* corneal, though filed elsewhere */
  "Chemical burn": "cornea",
  "UV photokeratitis (snow blindness)": "cornea",
  "Contact lens overwear & hypoxia": "cornea",
  "Trachoma": "conjunctiva",
  "Onchocerciasis (river blindness)": "cornea",

  /* surface */
  "Sjögren syndrome": "tearFilm",

  /* retinal, though filed as systemic */
  "Sickle cell retinopathy": "retina",
  "CMV retinitis & HIV": "retina",
  "Retinopathy of prematurity": "retina",
  "Hypertensive retinopathy": "retina",

  /* uveal */
  "Sarcoidosis": "iris",

  /* the lid margin */
  "Dry eye disease": "lids",
  "Blocked tear duct & dacryocystitis": "lids",
};

export function structureFor(condition) {
  return OVERRIDE[condition.name] ?? BY_REGION[condition.region] ?? "globe";
}

/** condition-name → structure id, and its inverse. */
export const CONDITIONS_BY_STRUCTURE = CONDITIONS.reduce((acc, c) => {
  const id = structureFor(c);
  (acc[id] ??= []).push(c);
  return acc;
}, {});

/** Emergencies first, so the panel leads with what matters. */
const ORDER = { emergency: 0, urgent: 1, manage: 2, routine: 3 };
for (const list of Object.values(CONDITIONS_BY_STRUCTURE)) {
  list.sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency] || a.name.localeCompare(b.name));
}
