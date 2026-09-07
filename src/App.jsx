import { Suspense, lazy, useCallback, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import EyeScene from "./three/EyeScene.jsx";
import PathwayScene from "./three/PathwayScene.jsx";
import { SYSTEMS, buildStructures } from "./three/eyeModel.js";
import { buildPathway } from "./three/pathway.js";
import { AXIAL_LENGTH } from "./three/dimensions.js";
import { VIRTUAL } from "./data/structureMap.js";
import { CONDITION_COUNT } from "./data/conditions.js";
import StructureRail from "./components/StructureRail.jsx";
import PathwayRail from "./components/PathwayRail.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import PathwayPanel from "./components/PathwayPanel.jsx";
import ViewControls from "./components/ViewControls.jsx";
import SearchBox from "./components/SearchBox.jsx";
import { useTheme } from "./lib/useTheme.js";

const Overlay = lazy(() => import("./components/Overlay.jsx"));

const ALL_SYSTEMS = SYSTEMS.filter((s) => !s.defaultOff).map((s) => s.id);

/** Preset views. Each sets what is visible, whether it is cut, and where you stand. */
const VIEWS = {
  exterior: {
    label: "Exterior",
    systems: ALL_SYSTEMS,
    section: false,
    camera: [[27, 15, 33], [0, 0, 0]],
    caption: "The globe as it sits in the orbit, with its muscles and surface vessels.",
  },
  section: {
    label: "Section",
    systems: ALL_SYSTEMS,
    section: true,
    camera: [[30, 12, 27], [0, 0, 0]],
    caption: "Cut in half along the visual axis — the view every textbook diagram is drawn from.",
  },
  fundus: {
    label: "Fundus",
    systems: ["vascular", "neural", "vessels"],
    section: false,
    camera: [[0, 0.5, 10], [-1.4, 0, -11]],
    caption:
      "Looking in through the pupil, from where an ophthalmoscope sits. The orange is choroidal blood seen through a transparent retina; the pale spot is the optic disc, and the arcades sweep around the macula without ever crossing it.",
  },
  vessels: {
    label: "Blood supply",
    systems: ["vessels"],
    section: false,
    camera: [[26, 15, 31], [0, 0, 0]],
    caption:
      "All five circulations with the tissue removed: retinal arcades, the vessels inside the optic nerve, the posterior ciliary ring, vortex veins at the equator, and the episcleral plexus at the front.",
  },
};

export default function App() {
  const { theme, toggle } = useTheme();
  const structures = useMemo(() => buildStructures(), []);
  const pathwayParts = useMemo(() => buildPathway(), []);
  const all = useMemo(() => [...structures, ...VIRTUAL], [structures]);
  const byId = useMemo(() => new Map(all.map((s) => [s.id, s])), [all]);
  const pathwayById = useMemo(() => new Map(pathwayParts.map((p) => [p.id, p])), [pathwayParts]);

  const [mode, setMode] = useState("eye");
  const [view, setView] = useState("exterior");
  const [visibleSystems, setVisibleSystems] = useState(() => new Set(ALL_SYSTEMS));
  const [selectedId, setSelectedId] = useState("cornea");
  const [openCondition, setOpenCondition] = useState(null);
  const [explode, setExplode] = useState(0);
  const [section, setSection] = useState(false);
  const [isolate, setIsolate] = useState(false);
  const [pathSelected, setPathSelected] = useState(null);
  const [lesionId, setLesionId] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [railOpen, setRailOpen] = useState(false);

  const eyeApi = useRef(null);
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  const toggleSystem = (id) => {
    setView(null);
    setVisibleSystems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyView = (key) => {
    const v = VIEWS[key];
    setView(key);
    setVisibleSystems(new Set(v.systems));
    setSection(v.section);
    setIsolate(false);
    setExplode(0);
    eyeApi.current?.setCamera(v.camera[0], v.camera[1]);
  };

  const select = useCallback(
    (id, condition = null) => {
      setMode("eye");
      setSelectedId(id);
      setOpenCondition(condition);
      setRailOpen(false);
      const system = byId.get(id)?.system;
      if (system && system !== "whole") {
        setVisibleSystems((prev) => {
          if (prev.has(system)) return prev;
          setView(null);
          return new Set([...prev, system]);
        });
      }
    },
    [byId],
  );

  const pickLesion = (id) => {
    setLesionId(id);
    setPathSelected(null);
    setRailOpen(false);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* --------------------------------- header -------------------------- */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-[10px]">
        <button
          onClick={() => setRailOpen((v) => !v)}
          className="rounded border border-line px-2 py-1 font-mono text-[0.7rem] text-ink2 lg:hidden"
          aria-label="Toggle list"
        >
          ☰
        </button>

        <h1 className="text-[1.12rem] tracking-[-0.01em] whitespace-nowrap">Eye Atlas</h1>

        <div className="flex rounded border border-line p-[2px]">
          {[
            ["eye", "The eye"],
            ["pathway", "How it sees"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              className={`rounded-[3px] px-[10px] py-[4px] text-[0.78rem] whitespace-nowrap transition-colors ${
                mode === id ? "bg-fundus text-on-accent" : "text-ink2 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="num hidden font-mono text-[0.64rem] whitespace-nowrap text-ink3 xl:inline">
          {structures.length} parts · {CONDITION_COUNT} conditions · {AXIAL_LENGTH.toFixed(1)} mm
        </span>

        <div className="ml-auto flex items-center gap-2">
          {mode === "eye" && <SearchBox structures={all} onPick={select} />}
          <button
            onClick={() => setOverlay("optics")}
            className="rounded border border-cobalt bg-cobalt-wash px-[10px] py-[6px] text-[0.78rem] whitespace-nowrap text-ink transition-colors hover:bg-cobalt hover:text-on-accent"
          >
            Focus &amp; glasses
          </button>
          <button
            onClick={() => setOverlay("vision")}
            className="rounded border border-fluor bg-fluor-wash px-[10px] py-[6px] text-[0.78rem] whitespace-nowrap text-ink transition-colors hover:bg-fluor hover:text-on-accent"
          >
            Test your vision
          </button>
          <button
            onClick={() => setOverlay("flags")}
            className="rounded border border-fundus px-[10px] py-[6px] text-[0.78rem] whitespace-nowrap text-fundus transition-colors hover:bg-fundus hover:text-on-accent"
          >
            Red flags
          </button>
          <button
            onClick={toggle}
            aria-label="Switch theme"
            className="rounded-full border border-line px-[10px] py-[5px] font-mono text-[0.66rem] whitespace-nowrap text-ink2 uppercase hover:border-ink3 hover:text-ink"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* --------------------------------- body ---------------------------- */}
      <div className="grid min-h-0 flex-1 max-lg:grid-rows-[48dvh_minmax(0,1fr)] lg:grid-cols-[228px_1fr_368px] lg:grid-rows-[minmax(0,1fr)]">
        <aside
          className={`min-h-0 overflow-hidden border-line bg-surface lg:block lg:border-r ${
            railOpen
              ? "absolute inset-x-0 top-[53px] bottom-0 z-40 overflow-y-auto border-b"
              : "hidden"
          }`}
        >
          {mode === "eye" ? (
            <StructureRail
              structures={structures}
              virtual={VIRTUAL}
              visibleSystems={visibleSystems}
              onToggleSystem={toggleSystem}
              selectedId={selectedId}
              onSelect={select}
            />
          ) : (
            <PathwayRail
              parts={pathwayParts}
              selectedId={pathSelected}
              lesionId={lesionId}
              onSelect={(id) => {
                setPathSelected(id);
                setLesionId(null);
                setRailOpen(false);
              }}
              onLesion={pickLesion}
            />
          )}
        </aside>

        <div className="relative min-h-0 min-w-0 bg-[radial-gradient(120%_120%_at_50%_35%,var(--color-surface)_0%,var(--color-ground)_70%)]">
          {mode === "eye" ? (
            <EyeScene
              structures={structures}
              visibleSystems={visibleSystems}
              selectedId={selectedId}
              onSelect={select}
              explode={explode}
              section={section}
              isolate={isolate}
              onReady={(api) => (eyeApi.current = api)}
            />
          ) : (
            <PathwayScene
              selectedId={pathSelected}
              onSelect={(id) => {
                setPathSelected(id);
                setLesionId(null);
              }}
              lesionId={lesionId}
              onLesion={pickLesion}
            />
          )}

          {mode === "eye" && (
            <>
              <div className="pointer-events-auto absolute top-3 left-3 flex flex-wrap gap-[5px]">
                {Object.entries(VIEWS).map(([key, v]) => (
                  <button
                    key={key}
                    onClick={() => applyView(key)}
                    aria-pressed={view === key}
                    className={`rounded-full border px-[10px] py-[4px] text-[0.74rem] backdrop-blur transition-colors ${
                      view === key
                        ? "border-fundus bg-fundus text-on-accent"
                        : "border-line bg-surface/85 text-ink2 hover:border-ink3 hover:text-ink"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <p className="pointer-events-none absolute top-[46px] left-4 max-w-[22rem] text-[0.72rem] leading-relaxed text-ink3">
                {view ? VIEWS[view].caption : "Custom view. Drag to orbit, scroll to zoom, click a part."}
              </p>

              <div className="pointer-events-none absolute z-20 flex justify-center max-lg:inset-x-0 max-lg:bottom-0 lg:inset-x-3 lg:bottom-3">
                <ViewControls
                  explode={explode}
                  onExplode={(v) => {
                    setExplode(v);
                    if (v > 0) setView(null);
                  }}
                  section={section}
                  onSection={(v) => {
                    setSection(v);
                    setView(null);
                  }}
                  isolate={isolate}
                  onIsolate={setIsolate}
                  canIsolate={Boolean(selectedId && structures.some((s) => s.id === selectedId))}
                  onReset={() => applyView("exterior")}
                />
              </div>
            </>
          )}

          {mode === "pathway" && (
            <p className="pointer-events-none absolute top-3 left-4 max-w-[24rem] text-[0.72rem] leading-relaxed text-ink3">
              <span className="text-cobalt">Blue</span> fibres carry the left half of the world,{" "}
              <span className="text-amber">amber</span> the right. Watch which ones cross at the
              chiasm — then click a red lesion marker.
            </p>
          )}
        </div>

        <aside className="min-h-0 overflow-hidden border-line bg-surface max-lg:border-t lg:border-l">
          {mode === "eye" ? (
            <DetailPanel
              structure={selected}
              openCondition={openCondition}
              onOpenCondition={setOpenCondition}
            />
          ) : (
            <PathwayPanel
              structure={pathSelected ? pathwayById.get(pathSelected) : null}
              lesion={lesionId}
              onLesion={pickLesion}
            />
          )}
        </aside>
      </div>

      <footer className="shrink-0 border-t z-[9999] border-line bg-surface px-4 py-[6px] text-[0.68rem] leading-snug text-ink3">
        Geometry generated from measured human anatomy; scene units are millimetres. Vessel
        calibres are exaggerated ~1.8× to stay visible. Educational only — not a diagnosis, and no
        page can examine your eyes.
      </footer>

      {overlay && (
        <Suspense fallback={null}>
          <Overlay tab={overlay} onTab={setOverlay} onClose={() => setOverlay(null)} />
        </Suspense>
      )}
      <Analytics />
    </div>
  );
}
