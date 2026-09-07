# Eye Atlas

An interactive 3D atlas of the human eye, built for explaining things to patients. Orbit it,
take it apart, cut it in half, look in through the pupil the way an ophthalmoscope does — and
see the diseases that live in each structure, only when you ask for them.

Two modes:

- **The eye** — 29 structures including all five circulations, with four preset views
  (exterior, section, fundus, blood supply alone).
- **How it sees** — the visual pathway from retina to cortex, with eight lesion sites. Click
  one and it shows the visual field defect it produces, and why that pattern localises it.

Modelled on [ashemag/human-atlas](https://github.com/ashemag/human-atlas), scaled to one organ.

Vite + React 19 + Tailwind v4 + Three.js.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview
```

## Deploy to Vercel

No configuration needed — Vercel autodetects Vite, and `vercel.json` adds the SPA rewrite.

```bash
git init && git add -A && git commit -m "Eye Atlas"
gh repo create eye-atlas --public --source=. --push
npx vercel --prod
```

By hand: framework **Vite**, build `npm run build`, output `dist`.

## The geometry is generated, not downloaded

The reference project ships 33 MB of compressed BodyParts3D meshes. This one ships none. The eye
is nearly spherical and radially symmetric, so all 23 structures are built at runtime from
measured dimensions — sphere bands for the three coats, a steeper spherical cap for the cornea,
surfaces of revolution for the lens and the fluid compartments, swept tubes for the six
extraocular muscles.

`src/three/dimensions.js` holds every constant and derives the rest, so the model stays
self-consistent:

| | |
|---|---|
| Globe radius | 12.0 mm |
| Cornea radius of curvature | 7.8 mm, 11.5 mm across |
| **Derived axial length** | **23.88 mm** (measured average 23.9) |
| **Derived lens thickness** | **3.53 mm** (measured 3.5–4.0) |
| Rectus insertions | 5.5–7.7 mm behind the limbus |
| Total | 29 structures, ~231 k triangles |

### Why not an imported model

BodyParts3D (which the reference project uses) is CC BY-**SA**, so importing it would put the
whole project under share-alike — and its eye is a handful of low-poly parts carved out of a
whole-body scan, coarser than what `dimensions.js` derives here. It also would not have fixed
what "doesn't look 3D" actually was: a smooth untextured sphere under directional light has
almost no shading gradient, so it reads as a flat circle no matter how good the mesh is. The fix
was surface detail and image-based lighting, below.

The two lens surfaces meet exactly at the equator, and the corneal cap meets the sclera exactly
at the limbus, because both are solved from their radii rather than eyeballed. Scene units are
millimetres throughout. Whole payload: **~248 KB gzipped**, Three.js included.

## Vasculature

Five circulations, each generated and each separately selectable, because each is the seat of
its own diseases:

| System | What it explains |
|---|---|
| Retinal arteries & veins | The four arcades a fundus exam reads. They sweep around the macula and never cross the fovea — the centre of vision is fed from behind, by the choroid. |
| Central retinal artery & vein | Inside the optic nerve. A terminal artery with no collateral: ~90 minutes to infarction. |
| Posterior ciliary arteries | Two long, ~9 short, plus the circle of Zinn-Haller. The vessels giant cell arteritis occludes — which is why it blinds through the disc, not the retina. |
| Vortex veins | Four at the equator, piercing the sclera obliquely. |
| Episcleral & conjunctival plexus | Which layer is injected is how you tell conjunctivitis from uveitis. |

Retinal vessels are authored in **fundus coordinates** — millimetres of retinal arc from the
fovea, the coordinate system fundus anatomy is actually described in — then wrapped onto the
retinal sphere, so an arcade authored the way it looks in a photograph lands in the right place
in three dimensions. Branching is a seeded recursive generator, so the same fundus comes back
every reload; you can point at the same vessel twice.

Calibres are exaggerated ~1.8×. A real arteriole is 0.05 mm across on a 24 mm globe — about one
pixel, and invisible is not useful. The panel says so.

## How it sees: the visual pathway

The organising fact is that light from the left half of the world lands on the same side of
*both* retinas, so after the chiasm the brain handles halves of the world, not eyes. Fibres are
coloured by which hemifield they carry — blue for the left half, amber for the right — so you
can watch the nasal bundles cross and the two blue bundles arrive in the right tract together.

Eight lesion sites walk up the ladder, each with its field charts:

| Site | Defect | What it tells you |
|---|---|---|
| Retina | Monocular altitudinal | Respects the horizontal raphe |
| Optic nerve | Monocular total | In front of the chiasm |
| Nerve–chiasm junction | Junctional scotoma | The fellow eye's defect is the clue |
| Chiasm | Bitemporal hemianopia | At the chiasm — image today |
| Optic tract | Incongruous homonymous | Behind the chiasm |
| Temporal lobe | Superior quadrantanopia | Meyer's loop |
| Parietal lobe | Inferior quadrantanopia | Direct radiation |
| Occipital cortex | Congruous, macula spared | Dual blood supply at the pole |

Fields are plotted in space coordinates — chart-left is the left of the world for both eyes —
so a homonymous defect lines up across both charts and a bitemporal one splays outward.

## Rendering

What makes it read as a solid object rather than a disc:

- **Image-based lighting** (`RoomEnvironment` through `PMREMGenerator`), which gives the cornea
  a real specular highlight. `MeshPhysicalMaterial` with transmission 0.94 and IOR 1.376 — the
  cornea's actual refractive index — plus a clearcoat, so it looks wet.
- **Procedural textures** drawn to canvas at load: episcleral vessels and collagen mottling on
  the sclera; radial striations, crypts and a collarette on the iris, in the iris's own polar
  coordinate system; choriocapillaris mottling on the choroid; macular xanthophyll; a cupped
  optic disc.
- **ACES filmic tone mapping** and soft shadows from the muscles and vessels onto the sclera.
- The retina is rendered nearly transparent, because it *is* — the orange of a fundus photograph
  is choroidal blood seen straight through it. That is why the Fundus view looks like a fundus.

## Interaction

- **Drag** to orbit, **scroll** to zoom. It idles with a slow rotation until you touch it.
- **Click** a structure to select it. Clicking the same spot again steps back through whatever
  lies behind it — how you get to the iris through the cornea.
- **Take apart** slides all 23 pieces out along the optical axis.
- **Section** clips away the near half so you can look inside.
- **Isolate** shows only the selected piece.
- **System checkboxes** hide whole coats — the fibrous coat off is the fastest way in.
- **Preset views** jump to exterior, section, fundus (camera inside the eye at the pupil) or
  blood supply alone.
- **Search** spans structures, disease names and symptoms; picking a disease selects the
  structure it belongs to and opens it.

## Structure

```
src/
  three/dimensions.js     every measurement, and everything derived from it
  three/eyeModel.js       geometry + materials + the anatomy copy for 29 structures
  three/vasculature.js    five circulations, generated in fundus coordinates
  three/textures.js       procedural sclera, iris, choroid, macula, disc maps
  three/pathway.js        retina → cortex, plus eight lesions and their fields
  three/EyeScene.jsx      renderer, IBL, orbit, picking, explode, clipping
  three/PathwayScene.jsx  the pathway scene and its lesion markers
  data/conditions.js      95 conditions by region and urgency
  data/structureMap.js    which structure each condition belongs to
  data/prevention.js      red flags (plus prevention data, currently unused)
  components/
    StructureRail.jsx     systems and parts, with disease counts
    DetailPanel.jsx       the selected structure, and what goes wrong there
    PathwayRail.jsx  PathwayPanel.jsx  VisualField.jsx
    SearchBox.jsx  ViewControls.jsx  Overlay.jsx
    FocusSimulator.jsx    the optics simulator, behind the "Focus & glasses" button
    RayDiagram.jsx  VisionPreview.jsx  RedFlags.jsx
  lib/optics.js           reduced-eye optical model
```

Content lives only in `data/` and in the structure definitions in `eyeModel.js` — no copy is
embedded in components.

## The optics simulator

Behind the **Focus & glasses** button, because it answers a different question than the anatomy
does. It is a real reduced-eye model: refraction collapsed onto one plane 1.6 mm behind the
corneal apex, vitreous index 1.336, spectacles at 12 mm back-vertex distance. It reproduces the
+43 D cornea / +17 D lens / +59.6 D total of the standard emmetropic eye and recovers the rule
that 1 mm of axial length costs about 2.50 D. Accommodative amplitude follows Hofstetter's
minimum line, so the reading adds it prints are the ones an optometrist writes.

Verified across 5040 parameter combinations for finite renderable output.

## Scope

Educational. Not diagnostic, cannot measure intraocular pressure or see a retina, and clinical
thresholds vary by country. The "clinical detail" fields are orientation for reading further.
