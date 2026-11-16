// ============================================================================
// MODE CONSTRUCTION : poser / enlever / peindre des blocs, puis s'y promener
// ============================================================================
import {
  THREE, newScene, followSun, boxGeo, mat, block, save, persist, camera, renderer,
  createPlayer, stepPlayer, syncAvatar, followCamera, cam, input, sfx, speak,
  toast, ui, resetInput, cloudBlocks
} from './moteur.js';

export const BUILD_COLORS = [
  0xef4444, 0xf97316, 0xfacc15, 0x84cc16, 0x22c55e, 0x14b8a6,
  0x3b82f6, 0x8b5cf6, 0xec4899, 0xffffff, 0x9ca3af, 0x1f2937,
  0x92400e, 0xfde68a, 'glass'
];
const AREA = 12;   // de -12 à 11
const MAXY = 24;
const CAP = 3000;

export function startConstruction({ onExit, hud }) {
  const scene = newScene(0x9fdcff, 160);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    scene.add(cloudBlocks(Math.cos(a) * 45, 18 + (i % 3) * 4, Math.sin(a) * 45, 1.4));
  }

  // Sol : grande prairie + zone de construction quadrillée
  const meadow = new THREE.Mesh(new THREE.BoxGeometry(120, 1, 120), new THREE.MeshLambertMaterial({ color: 0x65c466 }));
  meadow.position.y = -0.52;
  meadow.receiveShadow = true;
  scene.add(meadow);
  const plate = new THREE.Mesh(boxGeo(AREA * 2, 1, AREA * 2), mat(0x86efac));
  plate.position.y = -0.5;
  plate.receiveShadow = true;
  scene.add(plate);

  // Blocs : un maillage instancié par couleur
  const cells = new Map(); // "x,y,z" -> indice couleur
  const meshes = BUILD_COLORS.map((c) => {
    const m = new THREE.InstancedMesh(
      boxGeo(1, 1, 1),
      c === 'glass' ? new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45 }) : mat(c),
      CAP
    );
    m.count = 0;
    m.castShadow = c !== 'glass';
    m.receiveShadow = true;
    m.userData.keys = [];
    scene.add(m);
    return m;
  });
  const M = new THREE.Matrix4();
  function rebuild() {
    meshes.forEach((m) => { m.count = 0; m.userData.keys = []; });
    cells.forEach((ci, key) => {
      const m = meshes[ci];
      if (m.count >= CAP) return;
      const [x, y, z] = key.split(',').map(Number);
      M.makeTranslation(x + 0.5, y + 0.5, z + 0.5);
      m.setMatrixAt(m.count, M);
      m.userData.keys.push(key);
      m.count++;
    });
    meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); });
    hud(`🧱 ${cells.size} bloc${cells.size > 1 ? 's' : ''}`);
  }

  if (save.build && save.build.length) save.build.forEach(([x, y, z, c]) => cells.set(`${x},${y},${z}`, c));
  rebuild();

  let saveTimer = null;
  function store() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      save.build = [...cells.entries()].map(([k, c]) => [...k.split(',').map(Number), c]);
      persist();
    }, 400);
  }

  const undo = [];
  function snapshot() {
    undo.push(new Map(cells));
    if (undo.length > 40) undo.shift();
  }

  // --- Outils ---
  const state = { tool: 'place', color: 0, walking: false };
  const toolbar = document.getElementById('buildBar');
  const palette = document.getElementById('buildPalette');
  palette.innerHTML = '';
  BUILD_COLORS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'bp-color' + (i === 0 ? ' active' : '');
    if (c === 'glass') { b.classList.add('glass'); b.textContent = '🪟'; }
    else b.style.background = `#${c.toString(16).padStart(6, '0')}`;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      state.color = i;
      palette.querySelectorAll('.bp-color').forEach((x) => x.classList.toggle('active', x === b));
      if (state.tool === 'remove') setTool('place');
      sfx('pop');
    });
    palette.appendChild(b);
  });
  function setTool(t) {
    state.tool = t;
    toolbar.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('active', x.dataset.tool === t));
  }
  const listeners = [];
  const on = (id, fn) => {
    const el = document.getElementById(id);
    const h = (e) => { e.stopPropagation(); fn(); };
    el.addEventListener('pointerdown', h);
    listeners.push(() => el.removeEventListener('pointerdown', h));
  };
  toolbar.querySelectorAll('[data-tool]').forEach((el) => {
    const h = (e) => {
      e.stopPropagation();
      setTool(el.dataset.tool);
      sfx('pop');
      toast({ place: '🧱 Touche pour poser un bloc', remove: '⛏️ Touche un bloc pour l’enlever', paint: '🖌️ Touche un bloc pour le peindre' }[el.dataset.tool]);
    };
    el.addEventListener('pointerdown', h);
    listeners.push(() => el.removeEventListener('pointerdown', h));
  });
  setTool('place');

  on('buildUndo', () => {
    if (!undo.length) { toast('Rien à annuler !'); return; }
    const prev = undo.pop();
    cells.clear();
    prev.forEach((v, k) => cells.set(k, v));
    rebuild();
    store();
    sfx('remove');
  });
  let clearArmed = 0;
  on('buildClear', () => {
    if (performance.now() - clearArmed > 2500) {
      clearArmed = performance.now();
      toast('⚠️ Touche encore pour tout effacer');
      return;
    }
    snapshot();
    cells.clear();
    rebuild();
    store();
    sfx('fall');
    toast('🧹 Tout est effacé ! (Oups pour revenir)');
  });
  on('buildHouse', () => {
    snapshot();
    stampHouse(cells);
    rebuild();
    store();
    sfx('checkpoint');
    toast('🏠 Une maison à décorer !');
  });
  on('buildWalk', () => setWalking(!state.walking));

  // --- Caméra en orbite (mode construction) ---
  const orbit = { yaw: 0.7, pitch: 0.75, dist: 26, target: new THREE.Vector3(0, 2, 0) };
  function placeOrbitCamera() {
    const cp = Math.cos(orbit.pitch);
    camera.position.set(
      orbit.target.x + Math.sin(orbit.yaw) * cp * orbit.dist,
      orbit.target.y + Math.sin(orbit.pitch) * orbit.dist,
      orbit.target.z + Math.cos(orbit.yaw) * cp * orbit.dist
    );
    camera.lookAt(orbit.target);
  }

  // --- Toucher : poser / enlever / peindre ---
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function tap(clientX, clientY) {
    if (ui.busy || state.walking) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([plate, ...meshes.filter((m) => m.count > 0)], false);
    if (!hits.length) return;
    const h = hits[0];
    const isBlock = h.object !== plate;
    const key = isBlock ? h.object.userData.keys[h.instanceId] : null;

    if (state.tool === 'place') {
      let x, y, z;
      if (isBlock) {
        const [bx, by, bz] = key.split(',').map(Number);
        const n = h.face.normal;
        x = bx + Math.round(n.x);
        y = by + Math.round(n.y);
        z = bz + Math.round(n.z);
      } else {
        x = Math.floor(h.point.x);
        y = 0;
        z = Math.floor(h.point.z);
      }
      if (x < -AREA || x >= AREA || z < -AREA || z >= AREA || y < 0 || y >= MAXY) {
        sfx('wrong');
        toast('🚧 On construit sur l’herbe claire !');
        return;
      }
      const k = `${x},${y},${z}`;
      if (cells.has(k)) return;
      if (state.walking) return;
      snapshot();
      cells.set(k, state.color);
      sfx('place');
    } else if (isBlock && state.tool === 'remove') {
      snapshot();
      cells.delete(key);
      sfx('remove');
    } else if (isBlock && state.tool === 'paint') {
      if (cells.get(key) === state.color) return;
      snapshot();
      cells.set(key, state.color);
      sfx('pop');
    } else {
      return;
    }
    rebuild();
    store();
  }

  function setOrbitControls() {
    input.scheme = 'orbit';
    input.onTap = tap;
    input.onOrbit = (dx, dy) => {
      orbit.yaw -= dx * 0.008;
      orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + dy * 0.006, 0.15, 1.45);
    };
    input.onZoom = (f) => { orbit.dist = THREE.MathUtils.clamp(orbit.dist * f, 6, 55); };
  }

  // --- Promenade dans sa construction ---
  const P = createPlayer(scene);
  P.stepH = 1.05;
  const spawn = () => {
    P.pos.set(0, 0, AREA + 2);
    P.vel.set(0, 0, 0);
    P.facing = Math.PI;
  };
  spawn();
  syncAvatar(P, 0);

  const world = {
    boxesNear(x0, y0, z0, x1, y1, z1) {
      const out = [{ x0: -60, x1: 60, y0: -2, y1: 0, z0: -60, z1: 60 }];
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(MAXY, Math.floor(y1)); y++) {
        for (let z = Math.floor(z0); z <= Math.floor(z1); z++) {
          for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
            if (cells.has(`${x},${y},${z}`)) out.push({ x0: x, x1: x + 1, y0: y, y1: y + 1, z0: z, z1: z + 1 });
          }
        }
      }
      return out;
    }
  };

  const walkBtn = document.getElementById('buildWalk');
  function setWalking(w) {
    state.walking = w;
    resetInput();
    document.body.classList.toggle('build-walking', w);
    walkBtn.innerHTML = w ? '🔨<span>Construire</span>' : '🚶<span>Me promener</span>';
    if (w) {
      input.scheme = 'play';
      input.onTap = null;
      input.onOrbit = null;
      input.onZoom = null;
      spawn();
      cam.yaw = 0;
      cam.pitch = 0.35;
      cam.dist = 7;
      followCamera(P, 0, true);
      speak('Promène-toi dans ta construction !');
      toast('🚶 Promène-toi ! Touche 🔨 pour reconstruire.');
    } else {
      setOrbitControls();
      spawn();
      syncAvatar(P, 0);
      toast('🔨 À toi de construire !');
    }
    sfx('pop');
  }

  document.body.classList.add('building');
  setOrbitControls();
  toast('🧱 Choisis une couleur, puis touche l’herbe pour poser un bloc !', 3500);
  speak('Choisis une couleur, puis touche l’herbe pour poser un bloc. Glisse ton doigt pour tourner autour.');

  function update(dt) {
    if (state.walking) {
      if (!ui.busy) stepPlayer(P, world, dt);
      if (P.pos.y < -5) spawn();
      syncAvatar(P, dt);
      followCamera(P, dt, false, world);
      followSun(scene, P.pos);
    } else {
      syncAvatar(P, dt);
      placeOrbitCamera();
      followSun(scene, orbit.target);
    }
  }

  return {
    scene,
    update,
    player: P,
    dispose() {
      clearTimeout(saveTimer);
      save.build = [...cells.entries()].map(([k, c]) => [...k.split(',').map(Number), c]);
      persist();
      listeners.forEach((f) => f());
      document.body.classList.remove('building', 'build-walking');
      walkBtn.innerHTML = '🚶<span>Me promener</span>';
      input.scheme = 'play';
      input.onTap = input.onOrbit = input.onZoom = null;
    }
  };
}

// Petite maison de départ, à décorer
function stampHouse(cells) {
  const put = (x, y, z, c) => {
    if (x >= -AREA && x < AREA && z >= -AREA && z < AREA && y >= 0 && y < MAXY) cells.set(`${x},${y},${z}`, c);
  };
  const W = 0; // rouge
  for (let y = 0; y < 4; y++) {
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        const edge = x === -3 || x === 3 || z === -3 || z === 3;
        if (!edge) continue;
        const door = z === 3 && x === 0 && y < 2;
        const win = y === 1 && ((z === 3 && Math.abs(x) === 2) || (Math.abs(x) === 3 && z === 0));
        if (door) continue;
        put(x, y, z, win ? 14 : 13);
      }
    }
  }
  for (let s = 0; s < 4; s++) {
    for (let x = -4 + s; x <= 4 - s; x++) {
      for (let z = -4 + s; z <= 4 - s; z++) {
        if (s < 3 && x > -4 + s && x < 4 - s && z > -4 + s && z < 4 - s) continue;
        put(x, 4 + s, z, W);
      }
    }
  }
}
