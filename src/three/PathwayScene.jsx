import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LESIONS, buildPathway } from "./pathway.js";

const MAT = {
  globe: { color: 0xf0ece2, roughness: 0.5, opacity: 0.5 },
  leftField: { color: 0x4f86d6, roughness: 0.35, opacity: 1 },
  rightField: { color: 0xd69a3a, roughness: 0.35, opacity: 1 },
  chiasm: { color: 0xdcc7bd, roughness: 0.55, opacity: 0.9 },
  lgn: { color: 0xa88ab0, roughness: 0.5, opacity: 1 },
  meyer: { color: 0x4a9d8f, roughness: 0.42, opacity: 1 },
  parietal: { color: 0x7f74b5, roughness: 0.42, opacity: 1 },
  cortex: { color: 0xc9a29a, roughness: 0.7, opacity: 0.72 },
};

export default function PathwayScene({ selectedId, onSelect, lesionId, onLesion }) {
  const host = useRef(null);
  const api = useRef({});
  const [hovered, setHovered] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const parts = useMemo(() => buildPathway(), []);

  useEffect(() => {
    const el = host.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 2000);
    camera.position.set(210, 130, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, -3, -68);
    controls.minDistance = 60;
    controls.maxDistance = 600;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.addEventListener("start", () => (controls.autoRotate = false));

    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4a58, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(120, 180, 140);
    const fill = new THREE.DirectionalLight(0xd8e6f2, 0.5);
    fill.position.set(-140, -60, -80);
    scene.add(key, fill);

    const meshes = new Map();
    for (const p of parts) {
      const spec = MAT[p.mat];
      const mat = new THREE.MeshStandardMaterial({
        color: spec.color,
        roughness: spec.roughness,
        metalness: 0.02,
        transparent: spec.opacity < 1,
        opacity: spec.opacity,
        side: THREE.DoubleSide,
        depthWrite: spec.opacity > 0.6,
      });
      mat.userData.baseOpacity = spec.opacity;
      const mesh = new THREE.Mesh(p.geometry, mat);
      mesh.name = p.id;
      mesh.userData.part = p;
      meshes.set(p.id, mesh);
      scene.add(mesh);
    }

    /* lesion markers */
    const markers = new Map();
    const markerGeo = new THREE.SphereGeometry(5.4, 20, 14);
    for (const l of LESIONS) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xb8351a,
        roughness: 0.3,
        emissive: 0x000000,
        transparent: true,
        opacity: 0.5,
      });
      const m = new THREE.Mesh(markerGeo, mat);
      m.position.set(...l.at);
      m.name = `lesion:${l.id}`;
      m.userData.lesion = l;
      markers.set(l.id, m);
      scene.add(m);
    }

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let pointer = null;

    const pickables = () => [...markers.values(), ...meshes.values()];
    const hits = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObjects(pickables(), false).filter((h) => h.object.visible);
    };

    const onMove = (ev) => {
      pointer = ev;
      setTip({ x: ev.clientX, y: ev.clientY });
    };
    const onLeave = () => {
      pointer = null;
      setHovered(null);
    };
    const onClick = (ev) => {
      const h = hits(ev);
      if (!h.length) return;
      const obj = h[0].object;
      if (obj.userData.lesion) onLesion(obj.userData.lesion.id);
      else onSelect(obj.name);
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerleave", onLeave);
    renderer.domElement.addEventListener("click", onClick);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf;
    let hoverName = null;
    let t = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      controls.update();
      t += 0.05;
      // the active lesion pulses, so it reads as the thing being asked about
      for (const [id, m] of markers) {
        const on = id === api.current.lesionId;
        m.material.opacity = on ? 0.75 + Math.sin(t) * 0.2 : 0.32;
        m.material.emissiveIntensity = on ? 0.5 : 0;
        m.material.emissive.setHex(on ? 0xff5a2a : 0x000000);
        m.scale.setScalar(on ? 1.25 : 0.8);
      }
      if (pointer) {
        const h = hits(pointer);
        const name = h.length ? h[0].object.name : null;
        if (name !== hoverName) {
          hoverName = name;
          setHovered(
            h.length
              ? h[0].object.userData.lesion?.label ?? h[0].object.userData.part?.name ?? null
              : null,
          );
          renderer.domElement.style.cursor = name ? "pointer" : "grab";
        }
      }
      renderer.render(scene, camera);
    };
    tick();

    api.current = {
      meshes,
      markers,
      lesionId: null,
      reset: () => {
        camera.position.set(210, 130, 120);
        controls.target.set(0, -3, -68);
        controls.autoRotate = false;
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      markerGeo.dispose();
      for (const m of markers.values()) m.material.dispose();
      for (const m of meshes.values()) {
        m.geometry.dispose();
        m.material.dispose();
      }
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts]);

  useEffect(() => {
    api.current.lesionId = lesionId;
  }, [lesionId]);

  useEffect(() => {
    const { meshes } = api.current;
    if (!meshes) return;
    for (const [id, m] of meshes) {
      const on = id === selectedId;
      m.material.emissive?.setHex(on ? 0xff7a45 : 0x000000);
      if (m.material.emissive) m.material.emissiveIntensity = on ? 0.4 : 0;
      if (m.material.userData.baseOpacity !== undefined) {
        m.material.opacity = on
          ? Math.min(1, m.material.userData.baseOpacity + 0.25)
          : m.material.userData.baseOpacity;
      }
    }
  }, [selectedId]);

  return (
    <div ref={host} className="relative h-full w-full touch-none">
      {hovered && (
        <div
          className="pointer-events-none fixed z-50 -translate-y-8 translate-x-3 rounded border border-line bg-surface px-2 py-1 font-mono text-[0.7rem] whitespace-nowrap text-ink shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          {hovered}
        </div>
      )}
    </div>
  );
}
