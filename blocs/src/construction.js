// ============================================================================
// MODE CONSTRUCTION : poser / enlever / peindre / tracer / miroirs / blocs magiques
// ============================================================================
import {
  THREE, newScene, followSun, boxGeo, mat, save, persist, camera, renderer,
  createPlayer, stepPlayer, syncAvatar, followCamera, cam, input, sfx, speak,
  toast, ui, resetInput, cloudBlocks, captureAlbumPhoto, overlapsBox, ANIMALS, makeAnimal
} from './moteur.js';

export const BUILD_COLORS = [
  0xef4444, 0xf97316, 0xfacc15, 0x84cc16, 0x22c55e, 0x14b8a6,
  0x3b82f6, 0x8b5cf6, 0xec4899, 0xffffff, 0x9ca3af, 0x1f2937,
  0x92400e, 0xfde68a, 'glass',
  'bounce', 'light', 'water', 'leaves', 'gold', 'flower', 'door', 'confetti', 'roof'
];

const SPECIAL_META = {
  glass: { icon: '🪟', label: 'Vitre' },
  bounce: { icon: '🦘', label: 'Trampoline' },
  light: { icon: '💡', label: 'Lampe' },
  water: { icon: '💧', label: 'Eau' },
  leaves: { icon: '🌿', label: 'Feuilles' },
  gold: { icon: '🪙', label: 'Or' },
  flower: { icon: '🌸', label: 'Fleur' },
  door: { icon: '🚪', label: 'Porte' },
  confetti: { icon: '🎉', label: 'Fête' },
  roof: { icon: '🔺', label: 'Toit' }
};

const IDX_GLASS = 14;
const IDX_BOUNCE = 15;
const IDX_LIGHT = 16;
const IDX_WATER = 17;
const IDX_LEAVES = 18;
const IDX_GOLD = 19;
const IDX_FLOWER = 20;
const IDX_DOOR = 21;
const IDX_CONFETTI = 22;
const IDX_ROOF = 23;

const AREA = 12;   // de -12 à 11
const MAXY = 24;
const CAP = 3000;

export function startConstruction({ onExit, hud }) {
  const scene = newScene(0x9fdcff, 160);
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const cl = cloudBlocks(Math.cos(a) * 45, 18 + (i % 3) * 4, Math.sin(a) * 45, 1.4);
    clouds.push(cl);
    scene.add(cl);
  }

  // Étoiles et Lune (visibles en mode Nuit)
  const nightGroup = new THREE.Group();
  const starGeo = boxGeo(0.45, 0.45, 0.45);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (let i = 0; i < 65; i++) {
    const a = (i * 2.39996) % (Math.PI * 2);
    const r = 28 + (i % 7) * 6;
    const m = new THREE.Mesh(starGeo, starMat);
    m.position.set(Math.cos(a) * r, 24 + (i % 5) * 4.5, Math.sin(a) * r);
    nightGroup.add(m);
  }
  const moon = new THREE.Mesh(boxGeo(3.2, 3.2, 3.2), new THREE.MeshBasicMaterial({ color: 0xfef9c3 }));
  moon.position.set(-34, 34, -36);
  nightGroup.add(moon);
  nightGroup.visible = false;
  scene.add(nightGroup);

  const nightLight = new THREE.PointLight(0xfde047, 0, 26);
  nightLight.position.set(0, 6, 0);
  scene.add(nightLight);

  // Sol : grande prairie + plateau de construction
  const meadow = new THREE.Mesh(new THREE.BoxGeometry(120, 1, 120), new THREE.MeshLambertMaterial({ color: 0x65c466 }));
  meadow.position.y = -0.52;
  meadow.receiveShadow = true;
  scene.add(meadow);
  const plate = new THREE.Mesh(boxGeo(AREA * 2, 1, AREA * 2), mat(0x86efac));
  plate.position.y = -0.5;
  plate.receiveShadow = true;
  scene.add(plate);

  // Ligne repère du mode Miroir (centrée sur x = 0.5)
  const mirrorLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, AREA * 2),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.75 })
  );
  mirrorLine.position.set(0.5, 0.03, 0);
  mirrorLine.visible = false;
  scene.add(mirrorLine);

  // Géométrie spécifique pour Toit pointu (alignée sur la grille 1x1)
  const roofGeo = new THREE.ConeGeometry(0.707, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const bounceGeo = boxGeo(0.98, 0.56, 0.98);
  const waterGeo = boxGeo(1, 0.85, 1);
  const cubeGeo = boxGeo(1, 1, 1);

  const lampMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.55 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.48 });
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });

  // Blocs instanciés (pour les formes simples) et groupes interactifs (Fleurs, Portes)
  const cells = new Map(); // "x,y,z" -> indice dans BUILD_COLORS
  const meshes = BUILD_COLORS.map((c, idx) => {
    if (c === 'flower' || c === 'door') return null;
    let geo = cubeGeo;
    let material;
    if (c === 'glass') material = glassMat;
    else if (c === 'bounce') { geo = bounceGeo; material = mat(0x06b6d4, { emissive: 0x0e7490, emissiveIntensity: 0.45 }); }
    else if (c === 'light') material = lampMat;
    else if (c === 'water') { geo = waterGeo; material = waterMat; }
    else if (c === 'leaves') material = mat(0x15803d);
    else if (c === 'gold') material = mat(0xfbbf24, { emissive: 0x92400e, emissiveIntensity: 0.35 });
    else if (c === 'confetti') material = mat(0xec4899, { emissive: 0xbe185d, emissiveIntensity: 0.35 });
    else if (c === 'roof') { geo = roofGeo; material = mat(0xef4444); }
    else material = mat(c);

    const m = new THREE.InstancedMesh(geo, material, CAP);
    m.count = 0;
    m.castShadow = c !== 'glass' && c !== 'water';
    m.receiveShadow = true;
    m.userData.keys = [];
    m.userData.colorIdx = idx;
    scene.add(m);
    return m;
  });

  const specialRoot = new THREE.Group();
  scene.add(specialRoot);
  const specialMap = new Map(); // key -> { group, type, pivot?, open? }
  let specialHitMeshes = [];

  function makeSpecialBlock(key, ci) {
    const g = new THREE.Group();
    const [x, y, z] = key.split(',').map(Number);
    g.position.set(x, y, z);

    const tag = (mesh) => {
      mesh.userData.cellKey = key;
      specialHitMeshes.push(mesh);
      return mesh;
    };

    if (ci === IDX_FLOWER) {
      const tuft = tag(new THREE.Mesh(boxGeo(0.55, 0.14, 0.55), mat(0x22c55e, { plain: true })));
      tuft.position.set(0.5, 0.07, 0.5);
      const stem = tag(new THREE.Mesh(boxGeo(0.14, 0.52, 0.14), mat(0x16a34a, { plain: true })));
      stem.position.set(0.5, 0.36, 0.5);
      const petalColor = [0xf472b6, 0xa855f7, 0xfb7185, 0xf97316][Math.abs(x * 3 + z * 5) % 4];
      const petals = tag(new THREE.Mesh(boxGeo(0.52, 0.24, 0.52), mat(petalColor, { plain: true })));
      petals.position.set(0.5, 0.68, 0.5);
      petals.castShadow = true;
      const center = tag(new THREE.Mesh(boxGeo(0.24, 0.28, 0.24), mat(0xfde047, { plain: true })));
      center.position.set(0.5, 0.72, 0.5);
      g.add(tuft, stem, petals, center);
      return { group: g, type: 'flower' };
    }

    // Porte automatique sur charnière
    const postL = tag(new THREE.Mesh(boxGeo(0.12, 1, 0.24), mat(0x78350f)));
    postL.position.set(0.06, 0.5, 0.5);
    const postR = tag(new THREE.Mesh(boxGeo(0.12, 1, 0.24), mat(0x78350f)));
    postR.position.set(0.94, 0.5, 0.5);
    const topBar = tag(new THREE.Mesh(boxGeo(1, 0.12, 0.24), mat(0x78350f)));
    topBar.position.set(0.5, 0.94, 0.5);

    const pivot = new THREE.Group();
    pivot.position.set(0.12, 0, 0.5);
    const panel = tag(new THREE.Mesh(boxGeo(0.76, 0.88, 0.16), mat(0xb45309)));
    panel.position.set(0.38, 0.44, 0);
    panel.castShadow = true;
    const knob = tag(new THREE.Mesh(boxGeo(0.12, 0.12, 0.24), mat(0xfacc15, { plain: true })));
    knob.position.set(0.64, 0.46, 0);
    pivot.add(panel, knob);

    g.add(postL, postR, topBar, pivot);
    return { group: g, type: 'door', pivot, open: false };
  }

  const M = new THREE.Matrix4();
  const lampPositions = [];

  function rebuild() {
    const prevOpen = new Set();
    specialMap.forEach((sp, k) => { if (sp.open) prevOpen.add(k); });

    meshes.forEach((m) => { if (m) { m.count = 0; m.userData.keys = []; } });
    specialRoot.clear();
    specialMap.clear();
    specialHitMeshes = [];
    lampPositions.length = 0;

    cells.forEach((ci, key) => {
      if (ci < 0 || ci >= BUILD_COLORS.length) return;
      const [x, y, z] = key.split(',').map(Number);
      if (ci === IDX_LIGHT) lampPositions.push(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
      if (ci === IDX_FLOWER || ci === IDX_DOOR) {
        const sp = makeSpecialBlock(key, ci);
        if (sp.type === 'door' && prevOpen.has(key)) {
          sp.open = true;
          sp.pivot.rotation.y = -Math.PI * 0.48;
        }
        specialRoot.add(sp.group);
        specialMap.set(key, sp);
        return;
      }
      const m = meshes[ci];
      if (!m || m.count >= CAP) return;
      const yOff = ci === IDX_BOUNCE ? 0.28 : ci === IDX_WATER ? 0.425 : 0.5;
      M.makeTranslation(x + 0.5, y + yOff, z + 0.5);
      m.setMatrixAt(m.count, M);
      m.userData.keys.push(key);
      m.count++;
    });

    meshes.forEach((m) => { if (m) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); } });
    hud(`🧱 ${cells.size} bloc${cells.size > 1 ? 's' : ''}`);
  }

  // --- Gestion des 3 emplacements de sauvegarde & Mode Jour/Nuit ---
  const state = {
    tool: 'place',      // 'place' | 'remove' | 'paint' | 'pick'
    color: 0,
    shape: 'single',    // 'single' | 'drag' | 'pillar'
    mirror: false,
    night: false,
    walking: false
  };

  function applyDayNight(isNight) {
    state.night = !!isNight;
    const sky = state.night ? 0x0f172a : 0x9fdcff;
    scene.background.setHex(sky);
    scene.fog.color.setHex(sky);
    if (scene.userData.hemi) scene.userData.hemi.intensity = state.night ? 0.55 : 1.6;
    if (scene.userData.sun) scene.userData.sun.intensity = state.night ? 0.45 : 2.2;
    lampMat.emissiveIntensity = state.night ? 1.35 : 0.55;
    nightGroup.visible = state.night;
    clouds.forEach((c) => { c.visible = !state.night; });
    nightLight.intensity = state.night && lampPositions.length > 0 ? 1.8 : 0;
    const btn = document.getElementById('buildDayNightBtn');
    if (btn) btn.textContent = state.night ? '🌙' : '☀️';
  }

  function loadSlot(slotIdx) {
    save.activeSlot = slotIdx;
    cells.clear();
    const raw = save.builds[slotIdx];
    const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.blocks) ? raw.blocks : []);
    list.forEach(([x, y, z, c]) => {
      if (inBounds(x, y, z)) cells.set(`${x},${y},${z}`, c);
    });
    applyDayNight(raw && !Array.isArray(raw) ? !!raw.night : false);
    rebuild();
  }

  let saveTimer = null;
  function flushSave() {
    clearTimeout(saveTimer);
    const blocks = [...cells.entries()].map(([k, c]) => [...k.split(',').map(Number), c]);
    save.builds[save.activeSlot] = {
      name: `Monde ${save.activeSlot + 1}`,
      blocks,
      night: state.night
    };
    if (save.activeSlot === 0) save.build = blocks;
    persist();
  }
  function store() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 350);
  }

  const undo = [];
  function snapshot() {
    undo.push(new Map(cells));
    if (undo.length > 40) undo.shift();
  }

  function inBounds(x, y, z) {
    return x >= -AREA && x < AREA && z >= -AREA && z < AREA && y >= 0 && y < MAXY;
  }

  loadSlot(save.activeSlot);

  // --- Aperçu « Bloc Fantôme » ---
  const ghostMatOk = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, depthWrite: false });
  const ghostMatBad = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.48, depthWrite: false });
  const ghostWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(boxGeo(1.03, 1.03, 1.03)),
    new THREE.LineBasicMaterial({ color: 0x1e1b4b })
  );
  const ghostA = new THREE.Mesh(boxGeo(1.01, 1.01, 1.01), ghostMatOk);
  ghostA.add(ghostWire);
  const ghostB = new THREE.Mesh(boxGeo(1.01, 1.01, 1.01), ghostMatOk);
  ghostB.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo(1.03, 1.03, 1.03)), new THREE.LineBasicMaterial({ color: 0xf59e0b })));
  ghostA.visible = false;
  ghostB.visible = false;
  scene.add(ghostA, ghostB);

  function hideGhosts() {
    ghostA.visible = false;
    ghostB.visible = false;
  }

  // --- Interface Outils & Palette ---
  const toolbar = document.getElementById('buildBar');
  const palette = document.getElementById('buildPalette');
  palette.innerHTML = '';

  const colorButtons = [];
  BUILD_COLORS.forEach((c, i) => {
    if (i === IDX_BOUNCE) {
      const sep = document.createElement('div');
      sep.className = 'bp-sep';
      palette.appendChild(sep);
    }
    const b = document.createElement('button');
    b.className = 'bp-color' + (i === 0 ? ' active' : '');
    if (typeof c === 'string') {
      const meta = SPECIAL_META[c];
      b.classList.add(c === 'glass' ? 'glass' : 'special');
      b.textContent = meta.icon;
      b.title = meta.label;
    } else {
      b.style.background = `#${c.toString(16).padStart(6, '0')}`;
    }
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      selectColor(i);
      if (state.tool === 'remove' || state.tool === 'pick') setTool('place');
      sfx('pop');
      if (typeof c === 'string') toast(`${SPECIAL_META[c].icon} ${SPECIAL_META[c].label}`);
    });
    palette.appendChild(b);
    colorButtons.push(b);
  });

  function selectColor(i) {
    state.color = i;
    colorButtons.forEach((x, idx) => x.classList.toggle('active', idx === i));
  }

  function setTool(t) {
    state.tool = t;
    toolbar.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('active', x.dataset.tool === t));
    hideGhosts();
  }

  const listeners = [];
  const on = (id, ev, fn) => {
    const el = document.getElementById(id);
    if (!el) return;
    const h = (e) => { e.stopPropagation(); fn(e); };
    el.addEventListener(ev, h);
    listeners.push(() => el.removeEventListener(ev, h));
  };

  toolbar.querySelectorAll('[data-tool]').forEach((el) => {
    const h = (e) => {
      e.stopPropagation();
      setTool(el.dataset.tool);
      sfx('pop');
      toast({
        place: '🧱 Touche pour poser un bloc',
        remove: '⛏️ Touche un bloc pour l’enlever',
        paint: '🖌️ Touche un bloc pour le peindre',
        pick: '💧 Touche un bloc pour copier sa couleur'
      }[el.dataset.tool]);
    };
    el.addEventListener('pointerdown', h);
    listeners.push(() => el.removeEventListener('pointerdown', h));
  });
  setTool('place');

  const modeBtn = document.getElementById('buildModeBtn');
  const SHAPE_LABELS = {
    single: ['👆', '1 bloc', '👆 Pose 1 bloc par clic'],
    drag: ['〰️', 'Glisser', '〰️ Glisse ton doigt pour tracer !'],
    pillar: ['🗼', 'Pile ×3', '🗼 Pose 3 blocs d’un coup !']
  };
  function updateModeBtn() {
    const [ic, lbl] = SHAPE_LABELS[state.shape];
    modeBtn.innerHTML = `${ic}<span>${lbl}</span>`;
    modeBtn.classList.toggle('on', state.shape !== 'single');
  }
  updateModeBtn();

  on('buildModeBtn', 'pointerdown', () => {
    const order = ['single', 'drag', 'pillar'];
    state.shape = order[(order.indexOf(state.shape) + 1) % order.length];
    updateModeBtn();
    sfx('pop');
    toast(SHAPE_LABELS[state.shape][2]);
  });

  const mirrorBtn = document.getElementById('buildMirrorBtn');
  mirrorBtn.classList.remove('on');
  on('buildMirrorBtn', 'pointerdown', () => {
    state.mirror = !state.mirror;
    mirrorBtn.classList.toggle('on', state.mirror);
    mirrorLine.visible = state.mirror && !state.walking;
    hideGhosts();
    sfx('pop');
    toast(state.mirror ? '🪞 Symétrie activée !' : '🪞 Symétrie arrêtée');
  });

  on('buildUndo', 'pointerdown', () => {
    if (!undo.length) { toast('Rien à annuler !'); return; }
    const prev = undo.pop();
    cells.clear();
    prev.forEach((v, k) => cells.set(k, v));
    rebuild();
    store();
    sfx('remove');
  });

  let clearArmed = 0;
  on('buildClear', 'pointerdown', () => {
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

  // --- Modèles prêts à décorer ---
  const modelsModal = document.getElementById('modelsModal');
  const modelsGrid = document.getElementById('modelsGrid');
  const TEMPLATES = [
    { id: 'house', emoji: '🏠', name: 'Maison', fn: stampHouse },
    { id: 'castle', emoji: '🏰', name: 'Château', fn: stampCastle },
    { id: 'rocket', emoji: '🚀', name: 'Fusée', fn: stampRocket },
    { id: 'dino', emoji: '🦖', name: 'Dino Géant', fn: stampDino },
    { id: 'bridge', emoji: '🌈', name: 'Pont & Lac', fn: stampBridge }
  ];
  modelsGrid.innerHTML = '';
  TEMPLATES.forEach((tpl) => {
    const b = document.createElement('button');
    b.className = 'model-btn';
    b.innerHTML = `<span class="m-emoji">${tpl.emoji}</span><span>${tpl.name}</span>`;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      modelsModal.classList.remove('show');
      ui.busy = false;
      snapshot();
      tpl.fn(cells);
      rebuild();
      store();
      sfx('checkpoint');
      toast(`${tpl.emoji} ${tpl.name} ajouté ! (↩️ Oups pour annuler)`);
    });
    modelsGrid.appendChild(b);
  });

  on('buildModels', 'pointerdown', () => {
    ui.busy = true;
    modelsModal.classList.add('show');
    sfx('pop');
  });
  on('modelsClose', 'pointerdown', () => {
    modelsModal.classList.remove('show');
    ui.busy = false;
    sfx('pop');
  });

  // --- 3 Emplacements de Sauvegarde ---
  const slotsModal = document.getElementById('slotsModal');
  const slotsList = document.getElementById('slotsList');

  function openSlotsModal() {
    flushSave();
    slotsList.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const raw = save.builds[i];
      const count = Array.isArray(raw) ? raw.length : (raw && Array.isArray(raw.blocks) ? raw.blocks.length : 0);
      const isNight = raw && !Array.isArray(raw) && raw.night;
      const b = document.createElement('button');
      b.className = 'slot-card' + (save.activeSlot === i ? ' active' : '');
      b.innerHTML = `<span>${save.activeSlot === i ? '⭐ ' : ''}Monde ${i + 1} ${isNight ? '🌙' : '☀️'}</span><span>🧱 ${count} blocs</span>`;
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        slotsModal.classList.remove('show');
        ui.busy = false;
        if (save.activeSlot !== i) {
          undo.length = 0;
          loadSlot(i);
          persist();
          toast(`💾 Monde ${i + 1} ouvert !`);
        }
        sfx('pop');
      });
      slotsList.appendChild(b);
    }
    ui.busy = true;
    slotsModal.classList.add('show');
    sfx('pop');
  }

  on('buildSlotBtn', 'pointerdown', openSlotsModal);
  on('slotsClose', 'pointerdown', () => {
    slotsModal.classList.remove('show');
    ui.busy = false;
    sfx('pop');
  });

  on('buildDayNightBtn', 'pointerdown', () => {
    applyDayNight(!state.night);
    store();
    sfx('light');
    toast(state.night ? '🌙 Nuit étoilée ! Pose des lampes 💡' : '☀️ Grand soleil !');
  });

  on('buildPhotoBtn', 'pointerdown', () => {
    const wasA = ghostA.visible;
    const wasB = ghostB.visible;
    const wasM = mirrorLine.visible;
    hideGhosts();
    mirrorLine.visible = false;
    captureAlbumPhoto(scene, state.night ? 'Monde Nuit 3D' : 'Construction 3D');
    ghostA.visible = wasA;
    ghostB.visible = wasB;
    mirrorLine.visible = wasM;
  });

  on('buildWalk', 'pointerdown', () => setWalking(!state.walking));

  // --- Caméra en orbite + Boutons rapides ---
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

  on('camLeftBtn', 'pointerdown', () => { orbit.yaw += Math.PI / 4; sfx('pop'); });
  on('camRightBtn', 'pointerdown', () => { orbit.yaw -= Math.PI / 4; sfx('pop'); });
  on('camCenterBtn', 'pointerdown', () => {
    orbit.target.set(0, 2, 0);
    orbit.dist = 26;
    orbit.pitch = 0.75;
    sfx('pop');
    toast('🎯 Vue recentrée !');
  });

  // --- Raycast & Actions sur les blocs ---
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function raycastTarget(clientX, clientY, blocksOnly = false) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets = blocksOnly ? [] : [plate];
    meshes.forEach((m) => { if (m && m.count > 0) targets.push(m); });
    if (specialHitMeshes.length) targets.push(...specialHitMeshes);
    const hits = ray.intersectObjects(targets, false);
    if (!hits.length) return null;
    const h = hits[0];
    const isBlock = h.object !== plate;
    if (!isBlock) {
      if (h.face.normal.y < 0.5) return null;
      let x = Math.floor(h.point.x - h.face.normal.x * 0.01);
      let z = Math.floor(h.point.z - h.face.normal.z * 0.01);
      if (x === AREA && h.point.x <= AREA + 0.05) x = AREA - 1;
      if (z === AREA && h.point.z <= AREA + 0.05) z = AREA - 1;
      return { isBlock: false, key: null, coords: [x, 0, z], valid: inBounds(x, 0, z) };
    }
    const key = h.object.userData.keys ? h.object.userData.keys[h.instanceId] : h.object.userData.cellKey;
    if (!key) return null;
    const [bx, by, bz] = key.split(',').map(Number);
    const n = h.face.normal;
    let nx = 0, ny = 0, nz = 0;
    if (Math.abs(n.y) >= Math.abs(n.x) && Math.abs(n.y) >= Math.abs(n.z)) ny = Math.sign(n.y);
    else if (Math.abs(n.x) >= Math.abs(n.z)) nx = Math.sign(n.x);
    else nz = Math.sign(n.z);
    const px = bx + nx;
    const py = by + ny;
    const pz = bz + nz;
    return {
      isBlock: true,
      key,
      blockCoords: [bx, by, bz],
      coords: [px, py, pz],
      valid: state.tool === 'place' ? inBounds(px, py, pz) : true
    };
  }

  function updateGhost(clientX, clientY) {
    if (ui.busy || state.walking) { hideGhosts(); return; }
    const t = raycastTarget(clientX, clientY, state.tool !== 'place');
    if (!t) { hideGhosts(); return; }
    if (state.tool === 'place') {
      const [x, y, z] = t.coords;
      ghostA.material = t.valid ? ghostMatOk : ghostMatBad;
      ghostA.position.set(x + 0.5, y + 0.5, z + 0.5);
      ghostA.visible = true;
      if (state.mirror && t.valid && -x !== x && inBounds(-x, y, z)) {
        ghostB.material = ghostMatOk;
        ghostB.position.set(-x + 0.5, y + 0.5, z + 0.5);
        ghostB.visible = true;
      } else {
        ghostB.visible = false;
      }
    } else if (t.isBlock) {
      const [bx, by, bz] = t.blockCoords;
      ghostA.material = state.tool === 'remove' ? ghostMatBad : ghostMatOk;
      ghostA.position.set(bx + 0.5, by + 0.5, bz + 0.5);
      ghostA.visible = true;
      ghostB.visible = false;
    } else {
      hideGhosts();
    }
  }

  function applyCellAction(x, y, z, action, doMirror = state.mirror) {
    let changed = false;
    const coordsList = [[x, y, z]];
    if (doMirror && -x !== x && inBounds(-x, y, z)) {
      coordsList.push([-x, y, z]);
    }
    coordsList.forEach(([cx, cy, cz]) => {
      if (!inBounds(cx, cy, cz)) return;
      const k = `${cx},${cy},${cz}`;
      if (action === 'place') {
        if (!cells.has(k)) {
          cells.set(k, state.color);
          changed = true;
        }
      } else if (action === 'remove') {
        if (cells.delete(k)) changed = true;
      } else if (action === 'paint') {
        if (cells.has(k) && cells.get(k) !== state.color) {
          cells.set(k, state.color);
          changed = true;
        }
      }
    });
    return changed;
  }

  function tap(clientX, clientY) {
    if (ui.busy || state.walking) return;
    const t = raycastTarget(clientX, clientY, state.tool !== 'place');
    if (!t) return;

    if (state.tool === 'pick') {
      if (!t.isBlock || !cells.has(t.key)) return;
      selectColor(cells.get(t.key));
      setTool('place');
      sfx('pop');
      toast('💧 Couleur copiée !');
      return;
    }

    if (state.tool === 'place') {
      const [x, y, z] = t.coords;
      if (!t.valid) {
        sfx('wrong');
        toast('🚧 On construit sur l’herbe claire !');
        return;
      }
      const heights = state.shape === 'pillar' ? [0, 1, 2] : [0];
      const snapBefore = new Map(cells);
      let any = false;
      for (const dy of heights) {
        if (!inBounds(x, y + dy, z)) break;
        if (dy > 0 && cells.has(`${x},${y + dy},${z}`)) break;
        if (applyCellAction(x, y + dy, z, 'place')) any = true;
      }
      if (!any) return;
      undo.push(snapBefore);
      if (undo.length > 40) undo.shift();
      sfx('place');
    } else if (t.isBlock && (state.tool === 'remove' || state.tool === 'paint')) {
      const [bx, by, bz] = t.blockCoords;
      const snapBefore = new Map(cells);
      if (!applyCellAction(bx, by, bz, state.tool)) return;
      undo.push(snapBefore);
      if (undo.length > 40) undo.shift();
      sfx(state.tool === 'remove' ? 'remove' : 'pop');
    } else {
      return;
    }

    rebuild();
    store();
    updateGhost(clientX, clientY);
  }

  // --- Mode Glisser / Tracer en continu (〰️) ---
  let dragSnap = null;
  let dragChanged = false;
  let dragY = 0;
  const dragSeen = new Set();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const dragHit = new THREE.Vector3();

  function dragStart(clientX, clientY) {
    if (ui.busy || state.walking || state.shape !== 'drag' || state.tool === 'pick') return false;
    const t = raycastTarget(clientX, clientY, state.tool !== 'place');
    if (!t) return false;
    dragSnap = new Map(cells);
    dragChanged = false;
    dragSeen.clear();

    if (state.tool === 'place') {
      if (!t.valid) return false;
      dragY = t.coords[1];
      dragPlane.constant = -dragY;
      const k = t.coords.join(',');
      dragSeen.add(k);
      if (applyCellAction(t.coords[0], t.coords[1], t.coords[2], 'place')) {
        dragChanged = true;
        sfx('place');
        rebuild();
      }
      return true;
    }

    if (t.isBlock) {
      dragSeen.add(t.key);
      if (applyCellAction(t.blockCoords[0], t.blockCoords[1], t.blockCoords[2], state.tool)) {
        dragChanged = true;
        sfx(state.tool === 'remove' ? 'remove' : 'pop');
        rebuild();
      }
      return true;
    }
    return false;
  }

  function dragMove(clientX, clientY) {
    if (!dragSnap) return;
    if (state.tool === 'place') {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(dragPlane, dragHit)) return;
      const x = Math.floor(dragHit.x);
      const z = Math.floor(dragHit.z);
      if (!inBounds(x, dragY, z)) return;
      const k = `${x},${dragY},${z}`;
      if (dragSeen.has(k)) return;
      dragSeen.add(k);
      if (applyCellAction(x, dragY, z, 'place')) {
        dragChanged = true;
        sfx('place');
        rebuild();
      }
      updateGhost(clientX, clientY);
      return;
    }

    const t = raycastTarget(clientX, clientY, true);
    if (!t || !t.isBlock || dragSeen.has(t.key)) return;
    dragSeen.add(t.key);
    if (applyCellAction(t.blockCoords[0], t.blockCoords[1], t.blockCoords[2], state.tool)) {
      dragChanged = true;
      sfx(state.tool === 'remove' ? 'remove' : 'pop');
      rebuild();
    }
  }

  function dragEnd() {
    if (dragSnap && dragChanged) {
      undo.push(dragSnap);
      if (undo.length > 40) undo.shift();
      store();
    }
    dragSnap = null;
    dragChanged = false;
    dragSeen.clear();
  }

  function setOrbitControls() {
    input.scheme = 'orbit';
    input.onTap = tap;
    input.onHover = updateGhost;
    input.onDragStart = dragStart;
    input.onDragMove = dragMove;
    input.onDragEnd = dragEnd;
    input.onOrbit = (dx, dy) => {
      orbit.yaw -= dx * 0.008;
      orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + dy * 0.006, 0.15, 1.45);
    };
    input.onPan = (dx, dy) => {
      const s = orbit.dist * 0.0018;
      const rx = Math.cos(orbit.yaw), rz = -Math.sin(orbit.yaw);
      const fx = -Math.sin(orbit.yaw), fz = -Math.cos(orbit.yaw);
      orbit.target.x = THREE.MathUtils.clamp(orbit.target.x - (rx * dx - fx * dy) * s, -AREA, AREA);
      orbit.target.z = THREE.MathUtils.clamp(orbit.target.z - (rz * dx - fz * dy) * s, -AREA, AREA);
    };
    input.onZoom = (f) => { orbit.dist = THREE.MathUtils.clamp(orbit.dist * f, 6, 55); };
  }

  // --- Promenade, Animaux amis, Portes, Eau & Blocs Fête ---
  const P = createPlayer(scene);
  P.stepH = 1.05;
  const spawn = () => {
    P.pos.set(0, 0, AREA + 2);
    P.vel.set(0, 0, 0);
    P.facing = Math.PI;
  };
  spawn();
  syncAvatar(P, 0);

  // Animaux amis adoptés dans "Petit monde"
  const friendsGroup = new THREE.Group();
  scene.add(friendsGroup);
  let walkAnimals = [];
  function spawnFriendAnimals() {
    friendsGroup.clear();
    walkAnimals = [];
    const friendDefs = ANIMALS.filter((a) => save.friends.includes(a.id));
    friendDefs.forEach((def, i) => {
      const g = makeAnimal(def);
      g.position.set(-2 + i * 1.3, 0, AREA + 3.5);
      friendsGroup.add(g);
      walkAnimals.push({ def, g, slot: i, phase: i * 1.3 });
    });
  }

  function surfaceYAt(gx, gz) {
    const x = Math.floor(gx);
    const z = Math.floor(gz);
    if (x < -AREA || x >= AREA || z < -AREA || z >= AREA) return 0;
    for (let y = MAXY - 1; y >= 0; y--) {
      const ci = cells.get(`${x},${y},${z}`);
      if (ci !== undefined && ci !== IDX_WATER && ci !== IDX_FLOWER) {
        return y + (ci === IDX_BOUNCE ? 0.56 : 1);
      }
    }
    return 0;
  }

  const world = {
    boxesNear(x0, y0, z0, x1, y1, z1) {
      const out = [{ x0: -60, x1: 60, y0: -2, y1: 0, z0: -60, z1: 60 }];
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(MAXY, Math.floor(y1)); y++) {
        for (let z = Math.floor(z0); z <= Math.floor(z1); z++) {
          for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
            const k = `${x},${y},${z}`;
            const ci = cells.get(k);
            if (ci === undefined) continue;
            if (ci === IDX_WATER || ci === IDX_FLOWER) continue;
            if (ci === IDX_DOOR) {
              const sp = specialMap.get(k);
              if (sp && sp.open) continue;
            }
            if (ci === IDX_BOUNCE) {
              out.push({ x0: x, x1: x + 1, y0: y, y1: y + 0.56, z0: z, z1: z + 1, kind: 'bounce' });
            } else {
              out.push({
                x0: x, x1: x + 1, y0: y, y1: y + 1, z0: z, z1: z + 1,
                kind: ci === IDX_CONFETTI ? 'confetti' : 'solid',
                key: k
              });
            }
          }
        }
      }
      return out;
    }
  };

  // Particules confettis 3D
  const particles = [];
  const partGeo = boxGeo(0.18, 0.18, 0.18);
  const partColors = [0xef4444, 0xfacc15, 0x22c55e, 0x3b82f6, 0xec4899, 0xa855f7];
  const confettiCooldown = new Map();
  function burstConfetti(cx, cy, cz) {
    sfx('confetti');
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(partGeo, mat(partColors[i % partColors.length], { plain: true }));
      m.position.set(cx + (Math.random() - 0.5) * 0.6, cy + 0.3, cz + (Math.random() - 0.5) * 0.6);
      scene.add(m);
      particles.push({
        m,
        vx: (Math.random() - 0.5) * 6,
        vy: 5 + Math.random() * 5,
        vz: (Math.random() - 0.5) * 6,
        life: 1.4
      });
    }
  }

  // Poser / casser un bloc devant soi pendant la promenade
  on('walkPlaceBtn', 'pointerdown', () => {
    const tx = Math.floor(P.pos.x + Math.sin(P.facing) * 1.4);
    const ty = Math.max(0, Math.round(P.pos.y));
    const tz = Math.floor(P.pos.z + Math.cos(P.facing) * 1.4);
    if (!inBounds(tx, ty, tz)) { sfx('wrong'); toast('🚧 Trop loin du plateau !'); return; }
    if (overlapsBox(P.pos.x, P.pos.y, P.pos.z, { x0: tx, x1: tx + 1, y0: ty, y1: ty + 1, z0: tz, z1: tz + 1 })) {
      sfx('wrong');
      return;
    }
    const k = `${tx},${ty},${tz}`;
    if (cells.has(k)) return;
    snapshot();
    cells.set(k, state.color);
    rebuild();
    store();
    sfx('place');
  });

  on('walkBreakBtn', 'pointerdown', () => {
    const tx = Math.floor(P.pos.x + Math.sin(P.facing) * 1.35);
    const ty = Math.max(0, Math.round(P.pos.y));
    const tz = Math.floor(P.pos.z + Math.cos(P.facing) * 1.35);
    const k = cells.has(`${tx},${ty + 1},${tz}`) ? `${tx},${ty + 1},${tz}` : (cells.has(`${tx},${ty},${tz}`) ? `${tx},${ty},${tz}` : null);
    if (!k) return;
    snapshot();
    cells.delete(k);
    rebuild();
    store();
    sfx('remove');
  });

  on('walkRespawnBtn', 'pointerdown', () => {
    spawn();
    sfx('pop');
    toast('🚪 Retour à l’entrée !');
  });

  const walkBtn = document.getElementById('buildWalk');
  function setWalking(w) {
    state.walking = w;
    resetInput();
    hideGhosts();
    document.body.classList.toggle('build-walking', w);
    mirrorLine.visible = state.mirror && !w;
    walkBtn.innerHTML = w ? '🔨<span>Construire</span>' : '🚶<span>Me promener</span>';
    if (w) {
      input.scheme = 'play';
      input.onTap = input.onOrbit = input.onPan = input.onZoom = input.onHover = input.onDragStart = input.onDragMove = input.onDragEnd = null;
      spawn();
      spawnFriendAnimals();
      cam.yaw = 0;
      cam.pitch = 0.35;
      cam.dist = 7;
      followCamera(P, 0, true);
      if (walkAnimals.length) {
        speak('Promène-toi dans ta construction avec tes amis !');
        toast(`🚶 Promène-toi avec tes ${walkAnimals.length} amis !`);
      } else {
        speak('Promène-toi dans ta construction !');
        toast('🚶 Promène-toi ! Touche 🔨 pour reconstruire.');
      }
    } else {
      friendsGroup.clear();
      walkAnimals = [];
      specialMap.forEach((sp) => {
        if (sp.type === 'door') { sp.open = false; sp.pivot.rotation.y = 0; }
      });
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
  speak('Choisis une couleur, puis touche l’herbe pour poser un bloc.');

  let wasInWater = false;
  const tmp = new THREE.Vector3();

  function update(dt, t) {
    // Particules confettis 3D
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        scene.remove(pt.m);
        particles.splice(i, 1);
        continue;
      }
      pt.vy -= 14 * dt;
      pt.m.position.x += pt.vx * dt;
      pt.m.position.y += pt.vy * dt;
      pt.m.position.z += pt.vz * dt;
      pt.m.rotation.x += 6 * dt;
      pt.m.rotation.y += 8 * dt;
    }

    // Lumière nocturne douce centrée sur les lampes / joueur
    if (state.night && lampPositions.length > 0) {
      nightLight.intensity = 1.8 + Math.sin(t * 3) * 0.15;
      let best = lampPositions[0];
      if (state.walking) {
        let bestD = Infinity;
        for (const lp of lampPositions) {
          const d = lp.distanceToSquared(P.pos);
          if (d < bestD) { bestD = d; best = lp; }
        }
      }
      nightLight.position.copy(best).add(new THREE.Vector3(0, 1.2, 0));
    }

    if (state.walking) {
      const inWater = cells.get(`${Math.floor(P.pos.x)},${Math.floor(P.pos.y + 0.35)},${Math.floor(P.pos.z)}`) === IDX_WATER;
      if (inWater && !wasInWater) sfx('splash');
      wasInWater = inWater;
      P.speed = inWater ? 3.5 : 6;

      if (!ui.busy) stepPlayer(P, world, dt);
      if (P.pos.y < -5) spawn();

      // Bloc Fête 🎉
      if (P.onGround && P.ground && P.ground.kind === 'confetti') {
        const now = performance.now();
        const prev = confettiCooldown.get(P.ground.key) || 0;
        if (now - prev > 1600) {
          confettiCooldown.set(P.ground.key, now);
          burstConfetti(P.pos.x, P.pos.y + 0.5, P.pos.z);
        }
      }

      // Portes automatiques & fleurs qui bougent doucement
      specialMap.forEach((sp, key) => {
        if (sp.type === 'door') {
          const [dx, dy, dz] = key.split(',').map(Number);
          const dist = Math.hypot(P.pos.x - (dx + 0.5), P.pos.y - dy, P.pos.z - (dz + 0.5));
          const wantOpen = dist < 2.4;
          if (wantOpen && !sp.open) sfx('door');
          sp.open = wantOpen;
          const targetRot = wantOpen ? -Math.PI * 0.48 : 0;
          sp.pivot.rotation.y += (targetRot - sp.pivot.rotation.y) * Math.min(1, 10 * dt);
        } else if (sp.type === 'flower') {
          sp.group.rotation.z = Math.sin(t * 2 + sp.group.position.x) * 0.05;
        }
      });

      // Animaux amis qui suivent Manel
      walkAnimals.forEach((a) => {
        const g = a.g;
        const ang = P.facing + Math.PI + (a.slot - (walkAnimals.length - 1) / 2) * 0.6;
        tmp.set(P.pos.x + Math.sin(ang) * (2.1 + a.slot * 0.3), 0, P.pos.z + Math.cos(ang) * (2.1 + a.slot * 0.3));
        const dx = tmp.x - g.position.x;
        const dz = tmp.z - g.position.z;
        const d = Math.hypot(dx, dz);
        let moving = false;
        if (d > 0.85) {
          const st = Math.min(d, 5.8 * dt);
          const nx = g.position.x + (dx / d) * st;
          const nz = g.position.z + (dz / d) * st;
          const ny = surfaceYAt(nx, nz);
          if (Math.abs(ny - g.position.y) <= 1.2) {
            g.position.x = nx;
            g.position.z = nz;
            moving = true;
          }
          let rd = Math.atan2(dx, dz) - g.rotation.y;
          rd = Math.atan2(Math.sin(rd), Math.cos(rd));
          g.rotation.y += rd * Math.min(1, 8 * dt);
        }
        const gy = surfaceYAt(g.position.x, g.position.z);
        g.position.y += (gy - g.position.y) * Math.min(1, 10 * dt);
        const sw = moving ? Math.sin(t * 12 + a.phase) * 0.5 : 0;
        g.userData.legs.forEach((l, i) => { l.rotation.x = i === 0 || i === 3 ? sw : -sw; });
      });

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
      flushSave();
      listeners.forEach((f) => f());
      ['modelsModal', 'slotsModal'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
      });
      ui.busy = false;
      document.body.classList.remove('building', 'build-walking');
      walkBtn.innerHTML = '🚶<span>Me promener</span>';
      input.scheme = 'play';
      input.onTap = input.onOrbit = input.onPan = input.onZoom = input.onHover = input.onDragStart = input.onDragMove = input.onDragEnd = null;
    }
  };
}

// ---------------------------------------------------------------------------
// 5 Modèles de départ à décorer
// ---------------------------------------------------------------------------
function clearCenter(cells, rx, rz) {
  for (let y = 0; y < MAXY; y++) {
    for (let x = -rx; x <= rx; x++) {
      for (let z = -rz; z <= rz; z++) cells.delete(`${x},${y},${z}`);
    }
  }
}

function putSafe(cells, x, y, z, c) {
  if (x >= -AREA && x < AREA && z >= -AREA && z < AREA && y >= 0 && y < MAXY) {
    cells.set(`${x},${y},${z}`, c);
  }
}

function stampHouse(cells) {
  clearCenter(cells, 5, 5);
  // Plancher en bois + petit parvis
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) putSafe(cells, x, 0, z, 12);
  }
  putSafe(cells, 0, 0, 4, 13);
  putSafe(cells, 1, 0, 4, 13);
  putSafe(cells, -2, 0, 4, IDX_FLOWER);
  putSafe(cells, 3, 0, 4, IDX_FLOWER);

  // Murs avec porte large de 2 blocs (x = 0, 1) + fenêtres + lampes
  for (let y = 1; y <= 4; y++) {
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        const edge = x === -3 || x === 3 || z === -3 || z === 3;
        if (!edge) continue;
        const doorSpot = z === 3 && (x === 0 || x === 1) && y <= 2;
        if (doorSpot) {
          putSafe(cells, x, y, z, IDX_DOOR);
          continue;
        }
        const win = (y === 2 || y === 3) && ((z === 3 && Math.abs(x) === 2) || (Math.abs(x) === 3 && Math.abs(z) <= 1));
        putSafe(cells, x, y, z, win ? IDX_GLASS : 13);
      }
    }
  }
  putSafe(cells, -2, 3, -2, IDX_LIGHT);
  putSafe(cells, 2, 3, -2, IDX_LIGHT);

  // Toit en pyramide rouge
  for (let s = 0; s < 4; s++) {
    for (let x = -4 + s; x <= 4 - s; x++) {
      for (let z = -4 + s; z <= 4 - s; z++) {
        if (s < 3 && x > -4 + s && x < 4 - s && z > -4 + s && z < 4 - s) continue;
        putSafe(cells, x, 5 + s, z, s === 3 ? IDX_ROOF : 0);
      }
    }
  }
}

function stampCastle(cells) {
  clearCenter(cells, 6, 6);
  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      const wall = Math.abs(x) === 5 || Math.abs(z) === 5;
      if (!wall) continue;
      const gate = z === 5 && (x === 0 || x === 1);
      for (let y = 0; y < 4; y++) {
        if (gate && y < 2) {
          putSafe(cells, x, y, z, IDX_DOOR);
          continue;
        }
        putSafe(cells, x, y, z, gate && y === 3 ? IDX_GOLD : 10);
      }
      if ((x + z) % 2 === 0) putSafe(cells, x, 4, z, 10);
    }
  }
  [[-5, -5], [5, -5], [-5, 5], [5, 5]].forEach(([tx, tz]) => {
    for (let y = 0; y < 7; y++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && y > 4) continue;
          putSafe(cells, tx + dx, y, tz + dz, y === 6 ? IDX_LIGHT : 7);
        }
      }
    }
    putSafe(cells, tx, 7, tz, IDX_ROOF);
  });
  putSafe(cells, 0, 0, 0, IDX_BOUNCE);
  putSafe(cells, 0, 0, -3, IDX_CONFETTI);
}

function stampRocket(cells) {
  clearCenter(cells, 4, 4);
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) putSafe(cells, x, 0, z, 10);
  }
  putSafe(cells, -2, 0, 2, IDX_BOUNCE);
  putSafe(cells, 2, 0, 2, IDX_BOUNCE);

  // Flammes / réacteurs
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([fx, fz]) => {
    putSafe(cells, fx * 2, 1, fz * 2, 0);
    putSafe(cells, fx * 2, 2, fz * 2, 0);
  });
  putSafe(cells, 0, 1, 0, 1);
  putSafe(cells, 0, 2, 0, IDX_LIGHT);

  // Corps blanc + hublots bleus
  for (let y = 3; y <= 10; y++) {
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const isWin = (y === 6 || y === 7) && x === 0 && z === 1;
        putSafe(cells, x, y, z, isWin ? IDX_GLASS : (y === 3 || y === 10 ? 0 : 9));
      }
    }
  }
  putSafe(cells, 0, 11, 0, 0);
  putSafe(cells, 0, 12, 0, IDX_ROOF);
}

function stampDino(cells) {
  clearCenter(cells, 6, 6);
  // Pattes
  for (let y = 0; y < 3; y++) {
    putSafe(cells, -2, y, 0, 4); putSafe(cells, -2, y, 1, 4);
    putSafe(cells, 2, y, 0, 4); putSafe(cells, 2, y, 1, 4);
  }
  // Corps
  for (let y = 3; y <= 6; y++) {
    for (let x = -2; x <= 2; x++) {
      for (let z = -1; z <= 2; z++) putSafe(cells, x, y, z, z === -1 && Math.abs(x) <= 1 ? 3 : 4);
    }
  }
  // Queue
  putSafe(cells, 0, 4, 3, 4); putSafe(cells, 0, 5, 3, 4);
  putSafe(cells, 0, 4, 4, 4); putSafe(cells, 0, 4, 5, 3);
  // Cou et tête + couronne d'or
  for (let y = 7; y <= 10; y++) {
    for (let x = -1; x <= 1; x++) {
      for (let z = -3; z <= 0; z++) {
        if (y === 8 && z === -3) continue; // bouche ouverte
        putSafe(cells, x, y, z, 4);
      }
    }
  }
  putSafe(cells, -1, 9, -2, 9);
  putSafe(cells, 1, 9, -2, 9);
  putSafe(cells, -1, 10, -2, 11);
  putSafe(cells, 1, 10, -2, 11);
  putSafe(cells, 0, 11, -1, IDX_GOLD);
  // Crête dorsale + trampoline d'accès
  for (let i = 0; i < 4; i++) putSafe(cells, 0, 7 + i, i, IDX_GOLD);
  putSafe(cells, -4, 0, 0, IDX_BOUNCE);
}

function stampBridge(cells) {
  clearCenter(cells, 8, 5);
  for (let x = -7; x <= 7; x++) {
    for (let z = -3; z <= 3; z++) putSafe(cells, x, 0, z, IDX_WATER);
  }
  const rainbow = [0, 1, 2, 4, 6, 7, 8];
  for (let x = -6; x <= 6; x++) {
    const h = Math.max(0, Math.round(3 - (x * x) / 14));
    const col = rainbow[Math.abs(x + 6) % rainbow.length];
    for (let z = -1; z <= 1; z++) {
      putSafe(cells, x, h, z, col);
      if (h > 0 && Math.abs(x) === 5) putSafe(cells, x, h + 1, z, col);
    }
  }
  [[-7, -3], [7, -3], [-7, 3], [7, 3]].forEach(([x, z]) => {
    putSafe(cells, x, 0, z, 12);
    putSafe(cells, x, 1, z, 12);
    putSafe(cells, x, 2, z, IDX_LEAVES);
    putSafe(cells, x, 3, z, IDX_LIGHT);
  });
  putSafe(cells, -7, 0, 2, IDX_FLOWER);
  putSafe(cells, 7, 0, 2, IDX_FLOWER);
}
