# 👁️ Eye Atlas

An interactive 3D atlas of the human eye, designed as a patient-education tool. Orbit the globe, disassemble its layers, perform a virtual cross-section, or peer through the pupil as if using an ophthalmoscope to explore the diseases associated with each structure.

![Eye Atlas Preview](public/eye.svg)

## ✨ Key Features

- **The Eye**: A detailed 3D model featuring 29 structures, including all five vascular circulations.
- **How it Sees**: An interactive visualization of the visual pathway from retina to cortex, featuring eight lesion sites and their corresponding visual field defects.
- **Patient-Centric Design**: Integrated disease database and "Red Flag" system that connects anatomical structures to clinical conditions and urgent symptoms.
- **Vision Screening Suite**: A calibrated set of screening tests (Acuity, Amsler Grid, Contrast, Color, and Astigmatism) that uses a physical reference to ensure precise measurement of visual function on any screen.
- **Optics Simulator**: A reduced-eye model that simulates refraction, glasses, and accommodative amplitude.

---

## 🚀 Quick Start

### Run Locally
```bash
npm install
npm run dev      # http://localhost:5173
```

### Build & Preview
```bash
npm run build    # Outputs to dist/
npm run preview
```

### Deploy to Vercel
Vercel autodetects Vite. The `vercel.json` is pre-configured for SPA rewrites.
```bash
git init && git add -A && git commit -m "Eye Atlas"
gh repo create eye-atlas --public --source=. --push
npx vercel --prod
```

---

## 🛠️ Technical Deep Dive

### 📐 Procedural Geometry
Unlike most atlases that ship heavy mesh files, the Eye Atlas generates its geometry at runtime. The eye is nearly spherical and radially symmetric, allowing all structures to be derived from measured anatomical dimensions.

**Why procedural?**
1. **Performance**: The entire payload is **~248 KB gzipped** (Three.js included), compared to 30MB+ for typical mesh-based atlases.
2. **Precision**: Surfaces (like the corneal cap and lens) are solved mathematically from their radii, ensuring perfect alignment at the limbus and equator.
3. **Licensing**: Avoids the "Share-Alike" restrictions of common medical datasets.

| Metric | Value |
| :--- | :--- |
| Globe radius | 12.0 mm |
| Cornea radius of curvature | 7.8 mm, 11.5 mm across |
| **Derived axial length** | **23.88 mm** (Avg: 23.9) |
| **Derived lens thickness** | **3.53 mm** (Avg: 3.5–4.0) |
| Rectus insertions | 5.5–7.7 mm behind the limbus |
| Total Complexity | 29 structures, ~231k triangles |

### 🩸 Vasculature & Fundus Mapping
The atlas simulates five distinct circulatory systems, each selectable to explain specific pathologies:

- **Retinal Arcades**: Authored in **fundus coordinates** (mm of retinal arc from the fovea) and wrapped onto the sphere.
- **Central Retinal Vessels**: Modeled as terminal arteries within the optic nerve.
- **Posterior Ciliary Arteries**: Includes the circle of Zinn-Haller to explain Giant Cell Arteritis.
- **Vortex Veins**: Oblique exits at the equator.
- **Episcleral Plexus**: Used to differentiate conjunctivitis from uveitis.

*Note: Calibres are exaggerated ~1.8× for visibility, as a real 0.05mm arteriole would be sub-pixel on a 24mm globe.*

### 🧠 The Visual Pathway
The pathway uses color-coding to explain hemifield processing: **Blue** for the left half of the world, **Amber** for the right. This allows users to visualize nasal bundle crossing at the chiasm.

| Site | Defect | Clinical Significance |
| :--- | :--- | :--- |
| Retina | Monocular altitudinal | Respects the horizontal raphe |
| Optic nerve | Monocular total | Localizes lesion in front of chiasm |
| Chiasm | Bitemporal hemianopia | Classic "tunnel vision" localization |
| Optic tract | Incongruous homonymous | Localizes lesion behind the chiasm |
| Occipital cortex | Congruous, macula spared | Dual blood supply at the pole |

### 👓 The Optics Simulator
Hidden behind "Focus & glasses," this is a **reduced-eye model**:
- Refraction is collapsed onto one plane 1.6mm behind the corneal apex.
- Vitreous index: 1.336 | Spectacles distance: 12mm.
- Reproduces the +43D cornea / +17D lens / +59.6D total of an emmetropic eye.
- Accommodative amplitude follows Hofstetter's minimum line.

### 📏 Screen Calibration
To provide meaningful acuity scores (logMAR/Snellen), the app implements a calibration step. By matching a known physical constant (the 85.6mm width of a standard ID card), the system calculates the exact $\mu m$ per pixel of the user's display, allowing for the rendering of mathematically accurate optotypes at specific viewing distances.

---

## 🎨 Rendering & Interaction

### Visual Fidelity
- **Image-Based Lighting (IBL)**: Uses `RoomEnvironment` and `PMREMGenerator` for realistic corneal specular highlights.
- **Materials**: `MeshPhysicalMaterial` with transmission (0.94) and IOR (1.376) to simulate the cornea's refractive index.
- **Procedural Textures**: Dynamic canvas-drawn maps for iris crypts, scleral collagen, and macular xanthophyll.
- **Tone Mapping**: ACES filmic tone mapping for high-dynamic-range lighting.

### Controls
- **Orbit/Zoom**: Drag to rotate, scroll to zoom.
- **Smart Picking**: Clicking the same spot repeatedly steps through overlapping structures (e.g., Cornea $\rightarrow$ Iris).
- **Explode**: Slides all 23 pieces along the optical axis for internal inspection.
- **Section**: Clips the near half of the globe.
- **Search**: Global search across structures, diseases, and symptoms.

---

## 📂 Project Structure

```text
src/
├── three/
│   ├── dimensions.js     # Anatomical constants & derivations
│   ├── eyeModel.js        # Geometry, materials, and anatomy data
│   ├── vasculature.js     # Fundus-coordinate vessel generation
│   ├── textures.js        # Procedural map generation
│   ├── pathway.js         # Visual pathway & lesion field logic
│   ├── EyeScene.jsx       # Core Three.js renderer & interaction
│   └── PathwayScene.jsx   # Pathway visualization
├── data/
│   ├── conditions.js      # 95 clinical conditions
│   ├── structureMap.js    # Condition-to-structure mapping
│   └── prevention.js       # Red flags & prevention data
├── components/             # UI Rails, Panels, and Overlays
└── lib/
    └── optics.js          # Reduced-eye mathematical model
```

## ⚠️ Scope
**Educational Only.** This tool is not for diagnostic use. It cannot measure intraocular pressure or perform actual retinal scans. Clinical thresholds are provided as orientation for further study.

**Tech Stack**: Vite + React 19 + Tailwind v4 + Three.js
