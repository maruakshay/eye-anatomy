/* ---------------------------------------------------------------------------
   Every dimension of the model, in millimetres, from measured human anatomy.
   Scene units are millimetres, so nothing here is arbitrary.

   Local build space puts the optical axis along +Y with the cornea at +Y.
   Each geometry is then baked with rotateX(π/2), which maps local +Y to world
   +Z — so in world space the eye looks down +Z, up is +Y and the nose is at −X.
   --------------------------------------------------------------------------- */

export const D = {
  /* fibrous coat */
  scleraR: 11.8, // mid-thickness of a 0.5 mm shell on a 24 mm globe
  conjunctivaR: 12.15,
  corneaR: 7.8, // radius of curvature — far steeper than the globe
  corneaSemiDiameter: 5.75, // 11.5 mm across
  corneaThickness: 0.52,

  /* vascular coat */
  choroidR: 11.35,
  ciliaryOuterR: 5.9,
  ciliaryInnerR: 5.0,

  /* neural coat */
  retinaR: 11.05,
  maculaR: 2.75, // 5.5 mm across
  discR: 0.85, // 1.7 mm across
  discAngleDeg: 15, // nasal to the fovea
  nerveR: 1.6,
  nerveLength: 11,

  /* lens */
  lensAnteriorR: 10.0,
  lensPosteriorR: 6.0,
  lensSemiDiameter: 4.75, // 9.5 mm equator
  anteriorChamberDepth: 3.0,
  lensAnteriorOffset: 3.6, // behind the corneal apex

  /* aperture */
  pupilR: 2.0,

  /* vitreous */
  vitreousR: 10.85,

  /* orbit */
  muscleR: 1.15,
  muscleGlobeR: 12.45, // muscles ride just outside the sclera
  orbitApexY: -24,
};

/* --- derived, so the model stays self-consistent if a constant changes ----- */

/** Half-angle the corneal cap subtends at its own centre of curvature. */
export const CORNEA_HALF_ANGLE = Math.asin(D.corneaSemiDiameter / D.corneaR);

/** How far the corneal apex stands proud of the limbus plane. */
export const CORNEA_SAGITTA = D.corneaR * (1 - Math.cos(CORNEA_HALF_ANGLE));

/** Polar angle from the anterior pole at which the sclera reaches the limbus. */
export const LIMBUS_THETA = Math.asin(D.corneaSemiDiameter / D.scleraR);

export const LIMBUS_Y = D.scleraR * Math.cos(LIMBUS_THETA);

/** Anterior corneal pole. */
export const CORNEA_APEX_Y = LIMBUS_Y + CORNEA_SAGITTA;

/** Centre of curvature of the corneal cap. */
export const CORNEA_CENTRE_Y = CORNEA_APEX_Y - D.corneaR;

/** Corneal apex to retina — the axial length a biometer measures. */
export const AXIAL_LENGTH = CORNEA_APEX_Y + D.retinaR;

/* lens geometry, derived from its two radii of curvature */
export const LENS_ANTERIOR_Y = CORNEA_APEX_Y - D.lensAnteriorOffset;
export const LENS_ANTERIOR_CENTRE = LENS_ANTERIOR_Y - D.lensAnteriorR;
export const LENS_EQUATOR_Y =
  LENS_ANTERIOR_CENTRE +
  Math.sqrt(D.lensAnteriorR ** 2 - D.lensSemiDiameter ** 2);
export const LENS_POSTERIOR_Y =
  LENS_EQUATOR_Y - (D.lensPosteriorR - Math.sqrt(D.lensPosteriorR ** 2 - D.lensSemiDiameter ** 2));
export const LENS_POSTERIOR_CENTRE = LENS_POSTERIOR_Y + D.lensPosteriorR;
export const LENS_THICKNESS = LENS_ANTERIOR_Y - LENS_POSTERIOR_Y;

/** Axial height of the lens's anterior surface at a given distance off-axis. */
export const lensAnteriorAt = (rho) =>
  LENS_ANTERIOR_CENTRE + Math.sqrt(Math.max(0, D.lensAnteriorR ** 2 - rho ** 2));

/** Axial height of the lens's posterior surface at a given distance off-axis. */
export const lensPosteriorAt = (rho) =>
  LENS_POSTERIOR_CENTRE - Math.sqrt(Math.max(0, D.lensPosteriorR ** 2 - rho ** 2));

/** Axial height of the cornea's posterior surface at a given distance off-axis. */
export const corneaPosteriorAt = (rho) => {
  const r = D.corneaR - D.corneaThickness;
  return CORNEA_CENTRE_Y + Math.sqrt(Math.max(0, r ** 2 - rho ** 2));
};

/** Where the iris sits: it rests on the lens, so its inner edge follows it. */
export const IRIS_ROOT_Y = LIMBUS_Y - 0.16;
export const irisEdgeY = (pupilR) => lensAnteriorAt(pupilR) + 0.05;

/**
 * Polar angle of a rectus insertion, measured from the anterior pole.
 * Insertions are quoted in the literature as arc distance behind the limbus.
 */
export const insertionTheta = (mmBehindLimbus) =>
  LIMBUS_THETA + mmBehindLimbus / D.scleraR;
