import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { material } from "./eyeModel.js";

const EXPLODE_MM = 7.5;
const PICK_MIN_OPACITY = 0.2;

export default function EyeScene({
  structures,
  visibleSystems,
  selectedId,
  onSelect,
  explode,
  section,
  isolate,
  onReady,
}) {
  const host = useRef(null);
  const api = useRef({});
  const [hovered, setHovered] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });

  /* --------------------------- one-time scene setup ---------------------- */
  useEffect(() => {
    const el = host.current;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    camera.position.set(27, 15, 33);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    // An image-based environment is what gives the cornea a real specular
    // highlight and the sclera a soft falloff. Without it a white sphere under
    // directional light has almost no shape cue and reads as a flat disc.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3; // low enough to fly inside for the fundus view
    controls.maxDistance = 120;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });

    scene.add(new THREE.HemisphereLight(0xffffff, 0x3d4d5c, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(18, 26, 22);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const cam = key.shadow.camera;
    cam.left = -24;
    cam.right = 24;
    cam.top = 24;
    cam.bottom = -24;
    cam.near = 1;
    cam.far = 90;
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.05;
    const fill = new THREE.DirectionalLight(0xdde9f2, 0.4);
    fill.position.set(-22, -10, -14);
    const rim = new THREE.DirectionalLight(0xffe6d2, 0.5);
    rim.position.set(-4, 6, -28);
    scene.add(key, fill, rim);

    // Cuts away the half of the eye nearest the default camera, so the section
    // view looks *into* the eye rather than at the back of the far wall.
    const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);

    const root = new THREE.Group();
    scene.add(root);

    const meshes = new Map();
    for (const st of structures) {
      const mat = material(st.mat);
      let obj;
      if (st.isLines) {
        const lineMat = new THREE.LineBasicMaterial({
          color: mat.color.clone(),
          transparent: true,
          opacity: mat.opacity,
        });
        mat.dispose();
        obj = new THREE.LineSegments(st.geometry, lineMat);
      } else {
        obj = new THREE.Mesh(st.geometry, mat);
      }
      obj.name = st.id;
      obj.userData.st = st;
      if (!st.isLines) {
        obj.castShadow = st.system === "muscles" || st.system === "vessels";
        obj.receiveShadow = (obj.material.opacity ?? 1) > 0.6;
      }
      obj.userData.home = st.explode.clone().multiplyScalar(EXPLODE_MM);
      obj.userData.target = new THREE.Vector3();
      meshes.set(st.id, obj);
      root.add(obj);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.45;
    const ndc = new THREE.Vector2();
    let pointer = null;
    let lastPick = { x: -1, y: -1, index: 0 };

    const hits = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const all = raycaster
        .intersectObjects([...meshes.values()], false)
        .filter((h) => h.object.visible)
        // clipping planes do not affect raycasting, so reject the cut-away half
        .filter((h) => !api.current.section || h.point.x <= 0);
      const solid = all.filter((h) => (h.object.material.opacity ?? 1) >= PICK_MIN_OPACITY);
      return solid.length ? solid : all;
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
      // Clicking the same spot again steps back through what lies behind it.
      const same = Math.abs(ev.clientX - lastPick.x) < 4 && Math.abs(ev.clientY - lastPick.y) < 4;
      const index = same ? (lastPick.index + 1) % h.length : 0;
      lastPick = { x: ev.clientX, y: ev.clientY, index };
      onSelect(h[index].object.name);
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerleave", onLeave);
    renderer.domElement.addEventListener("click", onClick);

    const resize = () => {
      const { clientWidth: w, clientHeight: hgt } = el;
      if (!w || !hgt) return;
      camera.aspect = w / hgt;
      camera.updateProjectionMatrix();
      renderer.setSize(w, hgt);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf;
    let hoverName = null;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      controls.update();

      // ease each structure toward its exploded position
      for (const obj of meshes.values()) {
        obj.position.lerp(obj.userData.target, 0.14);
      }

      if (pointer) {
        const h = hits(pointer);
        const name = h.length ? h[0].object.name : null;
        if (name !== hoverName) {
          hoverName = name;
          setHovered(name);
          renderer.domElement.style.cursor = name ? "pointer" : "grab";
        }
      }
      renderer.render(scene, camera);
    };
    tick();

    api.current = {
      meshes,
      clip,
      section: false,
      camera,
      controls,
      reset: () => {
        controls.reset();
        camera.position.set(27, 15, 33);
        controls.target.set(0, 0, 0);
        controls.autoRotate = false;
      },
      setCamera: (pos, target, spin = false) => {
        camera.position.set(...pos);
        controls.target.set(...target);
        controls.autoRotate = spin;
        controls.update();
      },
    };
    onReady?.(api.current);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      for (const obj of meshes.values()) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
      envRT.texture.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structures]);

  /* ------------------------- visibility & isolation ---------------------- */
  useEffect(() => {
    const { meshes } = api.current;
    if (!meshes) return;
    for (const [id, obj] of meshes) {
      const st = obj.userData.st;
      const inSystem = visibleSystems.has(st.system);
      obj.visible = isolate && selectedId ? id === selectedId : inSystem;
    }
  }, [visibleSystems, isolate, selectedId]);

  /* -------------------------------- explode ------------------------------ */
  useEffect(() => {
    const { meshes } = api.current;
    if (!meshes) return;
    for (const obj of meshes.values()) {
      obj.userData.target.copy(obj.userData.home).multiplyScalar(explode);
    }
  }, [explode]);

  /* ------------------------------ section cut ---------------------------- */
  useEffect(() => {
    const { meshes, clip } = api.current;
    if (!meshes) return;
    api.current.section = section;
    for (const obj of meshes.values()) {
      obj.material.clippingPlanes = section ? [clip] : null;
      obj.material.needsUpdate = true;
    }
  }, [section]);

  /* --------------------------- selection highlight ----------------------- */
  useEffect(() => {
    const { meshes } = api.current;
    if (!meshes) return;
    for (const [id, obj] of meshes) {
      const m = obj.material;
      const on = id === selectedId;
      const warm = id === hovered;
      if (m.emissive) {
        m.emissive.setHex(on ? 0xff7a45 : warm ? 0xff7a45 : 0x000000);
        m.emissiveIntensity = on ? 0.42 : warm ? 0.16 : 0;
      }
      if (m.userData.baseOpacity !== undefined && m.transparent) {
        m.opacity = on ? Math.min(1, m.userData.baseOpacity + 0.3) : m.userData.baseOpacity;
      }
    }
  }, [selectedId, hovered]);

  const hoverName = hovered ? api.current.meshes?.get(hovered)?.userData.st.name : null;

  return (
    <div ref={host} className="relative h-full w-full touch-none">
      {hoverName && (
        <div
          className="pointer-events-none fixed z-50 -translate-y-8 translate-x-3 rounded border border-line bg-surface px-2 py-1 font-mono text-[0.7rem] whitespace-nowrap text-ink shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          {hoverName}
        </div>
      )}
    </div>
  );
}
