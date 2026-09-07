/* ---------------------------------------------------------------------------
   Procedural surface detail, drawn to canvas at load time.

   This is what stops the eye reading as a flat white circle: a smooth
   untextured sphere under soft lighting has almost no cue for depth. Real
   surface detail — episcleral vessels, iris striations, choroidal mottling —
   is what makes it legible as a solid object, and all three are anatomy a
   clinician recognises rather than decoration.

   UV conventions follow the geometry: SphereGeometry and LatheGeometry both
   give u = azimuth around the axis, v = position along the profile.
   --------------------------------------------------------------------------- */

import * as THREE from "three";

/** Deterministic noise, so the same eye comes back on every reload. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d") };
}

function finish(c, repeatX = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.repeat.set(repeatX, 1);
  t.anisotropy = 8;
  return t;
}

/* ------------------------------- the sclera -------------------------------- */

/**
 * White, but not paper-white: warmer and more vascular toward the front, where
 * the episcleral plexus runs, and faintly yellow with age at the periphery.
 * v = 0 is the limbus, v = 1 the posterior pole.
 */
export function scleraTexture() {
  const W = 2048;
  const H = 1024;
  const { c, ctx } = canvas(W, H);
  const rand = rng(20260907);

  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#f2eee6");
  base.addColorStop(0.18, "#f6f3ec");
  base.addColorStop(0.55, "#f3efe4");
  base.addColorStop(1, "#e9e2d2");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // fine collagen mottling
  for (let i = 0; i < 5000; i++) {
    const x = rand() * W;
    const y = rand() * H;
    ctx.fillStyle = `rgba(${196 + rand() * 40},${182 + rand() * 40},${164 + rand() * 40},0.05)`;
    ctx.beginPath();
    ctx.arc(x, y, 4 + rand() * 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // episcleral and conjunctival vessels: dense at the limbus, fading back
  const vessel = (x0, y0, len, width, alpha, depth) => {
    let x = x0;
    let y = y0;
    let ang = Math.PI / 2 + (rand() - 0.5) * 0.5; // heading posteriorly
    ctx.strokeStyle = `rgba(${168 + rand() * 40},${38 + rand() * 30},${30 + rand() * 24},${alpha})`;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = Math.max(4, Math.round(len / 9));
    for (let i = 0; i < steps; i++) {
      ang += (rand() - 0.5) * 0.42;
      x += Math.cos(ang) * 9;
      y += Math.sin(ang) * 9;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (depth > 0 && len > 40) {
      for (let b = 0; b < 2; b++) {
        vessel(x - (rand() - 0.5) * 30, y - rand() * len * 0.5, len * 0.45, width * 0.6, alpha * 0.8, depth - 1);
      }
    }
  };

  for (let i = 0; i < 210; i++) {
    const x = rand() * W;
    const y = rand() * H * 0.1; // start near the limbus
    vessel(x, y, 60 + rand() * 210, 1.1 + rand() * 3.4, 0.3 + rand() * 0.4, 2);
  }
  // a few long anterior ciliary vessels reaching further back
  for (let i = 0; i < 26; i++) {
    vessel(rand() * W, rand() * H * 0.05, 300 + rand() * 300, 2.4 + rand() * 2.6, 0.24, 1);
  }

  return finish(c);
}

/* -------------------------------- the iris --------------------------------- */

/**
 * Radial stromal striations, a collarette ridge about a third of the way out,
 * crypts, and the dark limbal ring. LatheGeometry hands us u = azimuth and
 * v = distance out from the pupil, which is exactly the iris's own coordinate
 * system — so the striations are just vertical lines.
 */
export function irisTexture(hex = "#8a5a30") {
  const W = 2048;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const rand = rng(770411);
  const base = new THREE.Color(hex);

  const shade = (mul, sat = 1) => {
    const col = base.clone().multiplyScalar(mul);
    col.offsetHSL(0, (sat - 1) * 0.3, 0);
    return `#${col.getHexString()}`;
  };

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, shade(0.42)); // pupillary ruff, in shadow
  g.addColorStop(0.1, shade(0.78));
  g.addColorStop(0.34, shade(1.22, 1.15)); // collarette, the brightest ring
  g.addColorStop(0.72, shade(0.92));
  g.addColorStop(0.93, shade(0.5));
  g.addColorStop(1, shade(0.26)); // limbal ring
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // radial striations — the trabeculae of the iris stroma
  for (let i = 0; i < 1500; i++) {
    const x = rand() * W;
    const from = 0.06 + rand() * 0.2;
    const to = from + 0.25 + rand() * 0.6;
    const light = rand() > 0.5;
    ctx.strokeStyle = light
      ? `rgba(255,238,210,${0.05 + rand() * 0.16})`
      : `rgba(26,12,4,${0.05 + rand() * 0.2})`;
    ctx.lineWidth = 1 + rand() * 3.6;
    ctx.beginPath();
    ctx.moveTo(x, from * H);
    ctx.bezierCurveTo(
      x + (rand() - 0.5) * 26, (from + to) * 0.5 * H,
      x + (rand() - 0.5) * 26, (from + to) * 0.55 * H,
      x + (rand() - 0.5) * 16, Math.min(1, to) * H,
    );
    ctx.stroke();
  }

  // crypts of Fuchs — dark irregular pits just outside the collarette
  for (let i = 0; i < 90; i++) {
    const x = rand() * W;
    const y = (0.36 + rand() * 0.4) * H;
    ctx.fillStyle = `rgba(18,8,2,${0.16 + rand() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + rand() * 26, 10 + rand() * 40, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // the collarette itself, as a soft raised ring
  ctx.strokeStyle = "rgba(255,240,214,0.16)";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(0, 0.335 * H);
  ctx.lineTo(W, 0.335 * H);
  ctx.stroke();

  const t = finish(c);
  t.flipY = false; // v = 0 is the pupil margin, not the limbus
  return t;
}

/** A bump map for the iris, from the same striation pattern. */
export function irisBumpTexture() {
  const W = 1024;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const rand = rng(31337);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    const x = rand() * W;
    const from = 0.05 + rand() * 0.25;
    ctx.strokeStyle = rand() > 0.5 ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    ctx.moveTo(x, from * H);
    ctx.lineTo(x + (rand() - 0.5) * 14, H);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.flipY = false;
  return t;
}

/* ------------------------------- the fundus -------------------------------- */

/**
 * The choroid. This is the layer that actually gives a fundus photograph its
 * colour — the retina in front of it is transparent, and the orange-red is
 * choroidal blood seen through it. Mottling and the coarse tessellation of a
 * lightly pigmented fundus are what a clinician reads for pigment and atrophy.
 */
export function choroidTexture() {
  const W = 2048;
  const H = 1024;
  const { c, ctx } = canvas(W, H);
  const rand = rng(5150);

  // v = 0 is the ora serrata, v = 1 the posterior pole: darker and redder centrally
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#a8623c");
  g.addColorStop(0.45, "#963f22");
  g.addColorStop(1, "#7c2a16");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // choriocapillaris mottling
  for (let i = 0; i < 9000; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const warm = rand() > 0.45;
    ctx.fillStyle = warm
      ? `rgba(${196 + rand() * 50},${96 + rand() * 50},${58 + rand() * 40},0.1)`
      : `rgba(${88 + rand() * 40},${26 + rand() * 24},${14 + rand() * 20},0.12)`;
    ctx.beginPath();
    ctx.arc(x, y, 5 + rand() * 34, 0, Math.PI * 2);
    ctx.fill();
  }

  // larger choroidal vessels, showing through as tessellation
  for (let i = 0; i < 150; i++) {
    let x = rand() * W;
    let y = rand() * H;
    let ang = rand() * Math.PI * 2;
    ctx.strokeStyle = `rgba(${104 + rand() * 30},${32 + rand() * 20},${18 + rand() * 16},0.3)`;
    ctx.lineWidth = 3 + rand() * 11;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 12; k++) {
      ang += (rand() - 0.5) * 0.7;
      x += Math.cos(ang) * 26;
      y += Math.sin(ang) * 26;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return finish(c);
}

/** Macular pigment: xanthophyll, densest at the fovea. */
export function maculaTexture() {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "#5e2410"); // the foveal pit, darkest
  g.addColorStop(0.16, "#7c3116");
  g.addColorStop(0.55, "#9c4a24");
  g.addColorStop(1, "#a8562c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The optic disc: pale, with a central cup and a crisp rim. */
export function discTexture() {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const rand = rng(9021);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "#fdf8ec"); // the cup — no axons, so palest
  g.addColorStop(0.42, "#f6e9cd");
  g.addColorStop(0.78, "#e8c99b"); // neuroretinal rim
  g.addColorStop(0.96, "#c98f5c");
  g.addColorStop(1, "#8a4a24"); // scleral ring
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
    const a = rand() * Math.PI * 2;
    const r = rand() * S * 0.46;
    ctx.strokeStyle = `rgba(180,140,90,${0.06 + rand() * 0.12})`;
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(S / 2 + Math.cos(a) * r * 0.3, S / 2 + Math.sin(a) * r * 0.3);
    ctx.lineTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
