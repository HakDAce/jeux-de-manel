// ============================================================================
// MODE PETIT MONDE (AGRANDI 128×128 + MODIFIABLE EN JEU) :
// Grande île explorable ET personnalisable (arbres, maisons, barrières, ponts, blocs)
// ============================================================================
import {
  THREE, newScene, followSun, block, solidOf, mat, boxGeo, cloudBlocks, save, persist,
  camera, renderer, createPlayer, stepPlayer, syncAvatar, followCamera, cam, input,
  sfx, speak, toast, askQuestion, celebrate, spinBob, ui, overlapsBox, ANIMALS, makeAnimal
} from './moteur.js';

const SIZE = 128;
const HALF = SIZE / 2; // -64 .. 63 (plus de 5x plus grand qu'avant !)
const WATER = 0.45;
const TOTAL_GEMS = 24;
const TOTAL_CHESTS = 6;

const MONDE_ITEMS = [
  { id: 'tree', icon: '🌳', label: 'Arbre' },
  { id: 'palm', icon: '🌴', label: 'Palmier' },
  { id: 'house', icon: '🏠', label: 'Maison' },
  { id: 'fence', icon: '🚧', label: 'Barrière' },
  { id: 'plank', icon: '🪵', label: 'Pont' },
  { id: 'flower', icon: '🌸', label: 'Fleur' },
  { id: 'mushroom', icon: '🍄', label: 'Champi' },
  { id: 'bounce', icon: '🦘', label: 'Tremplin' },
  { id: 'lamp', icon: '💡', label: 'Lampe' },
  { id: 'portal', icon: '🌀', label: 'Portail' },
  { id: 'block', icon: '🟥', label: 'Rouge', color: 0xef4444 },
  { id: 'block', icon: '🟨', label: 'Jaune', color: 0xfacc15 },
  { id: 'block', icon: '🟦', label: 'Bleu', color: 0x3b82f6 },
  { id: 'block', icon: '🟩', label: 'Vert', color: 0x22c55e },
  { id: 'block', icon: '🟪', label: 'Violet', color: 0xa855f7 },
  { id: 'block', icon: '🟫', label: 'Bois', color: 0xb45309 }
];

// Hasard reproductible : l'île est la même à chaque partie
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(rand) {
  const G = 24;
  const v = [];
  for (let i = 0; i < G * G; i++) v.push(rand());
  const at = (x, z) => v[(((z % G) + G) % G) * G + (((x % G) + G) % G)];
  return (x, z) => {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const fx = x - xi;
    const fz = z - zi;
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);
    const a = at(xi, zi) + (at(xi + 1, zi) - at(xi, zi)) * sx;
    const b = at(xi, zi + 1) + (at(xi + 1, zi + 1) - at(xi, zi + 1)) * sx;
    return a + (b - a) * sz;
  };
}

function makeGem(color) {
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.45),
    new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 })
  );
  m.castShadow = true;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function makeChest() {
  const g = new THREE.Group();
  const base = block(0, 0.35, 0, 1.2, 0.7, 0.8, 0x92400e);
  const lid = new THREE.Group();
  lid.add(block(0, 0.15, 0.4, 1.24, 0.3, 0.84, 0xb45309));
  lid.add(block(0, 0.15, 0.83, 0.2, 0.24, 0.04, 0xfacc15, { plain: true }));
  lid.position.set(0, 0.7, -0.4);
  g.add(base, lid);
  g.userData.lid = lid;
  return g;
}

export function startMonde({ onExit, hud, onStars }) {
  const scene = newScene(0x8fd3ff, 155);
  const rand = rng(20261117);
  const n1 = makeNoise(rng(7));
  const n2 = makeNoise(rng(11));

  // --- Relief du grand monde (Île principale + Montagne enneigée + Île au Trésor à l'Est) ---
  const H = new Int8Array(SIZE * SIZE);
  const idx = (x, z) => (z + HALF) * SIZE + (x + HALF);

  for (let z = -HALF; z < HALF; z++) {
    for (let x = -HALF; x < HALF; x++) {
      const dMain = Math.hypot((x + 6) * 1.05, z * 1.02) / 40;
      const base = n1(x / 12 + 50, z / 12 + 50) * 4.8 + n2(x / 5, z / 5) * 1.3;
      let h = Math.round((1 - dMain * dMain) * 4.5 + base - 1.6);

      const mDist = Math.hypot(x - 16, z + 24);
      if (mDist < 20 && dMain < 0.98) {
        h += Math.round((1 - mDist / 20) * 9.5);
      }

      if (x >= 29 && x <= 34) h = -1;

      const dTreas = Math.hypot(x - 47, z) / 14;
      if (dTreas < 1) {
        const th = Math.round((1 - dTreas * dTreas) * 3.2 + n2(x / 4, z / 4) * 1.2);
        h = Math.max(1, Math.min(5, th));
      } else if (x > 29) {
        h = -1;
      }

      if (dMain > 1 && dTreas >= 1) h = -1;
      H[idx(x, z)] = Math.max(-1, Math.min(14, h));
    }
  }

  for (let z = -5; z <= 12; z++) {
    for (let x = -6; x <= 6; x++) H[idx(x, z)] = 2;
  }
  for (let z = -8; z <= 15; z++) {
    for (let x = -9; x <= 9; x++) {
      if (Math.abs(x) <= 6 && z >= -5 && z <= 12) continue;
      const i = idx(x, z);
      H[i] = Math.max(1, Math.min(H[i], 3));
    }
  }

  for (let z = -2; z <= 2; z++) {
    for (let x = 25; x <= 28; x++) H[idx(x, z)] = 2;
    for (let x = 35; x <= 39; x++) H[idx(x, z)] = 2;
    for (let x = 29; x <= 34; x++) H[idx(x, z)] = -1;
  }

  for (let z = 10; z <= 26; z++) {
    for (let x = -33; x <= -17; x++) {
      const pd = Math.hypot(x + 25, z - 18);
      if (pd < 5.2) H[idx(x, z)] = 0;
      else if (pd < 7.5) H[idx(x, z)] = 1;
    }
  }

  const TRAMPOLINES = [
    { x: 11, z: -15 },
    { x: 14, z: -21 },
    { x: -17, z: 18 },
    { x: 42, z: -4 }
  ];
  TRAMPOLINES.forEach((tp) => {
    const ch = Math.max(2, H[idx(tp.x, tp.z)]);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        H[idx(tp.x + dx, tp.z + dz)] = ch;
      }
    }
  });

  const hAt = (x, z) => {
    const xi = Math.round(x);
    const zi = Math.round(z);
    if (xi < -HALF || xi >= HALF || zi < -HALF || zi >= HALF) return -1;
    return H[idx(xi, zi)];
  };

  // --- Terrain en blocs ---
  const count = SIZE * SIZE;
  const top = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), count);
  const under = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), count);
  const M = new THREE.Matrix4();
  const C = new THREE.Color();
  let k = 0;
  let kUnder = 0;
  for (let z = -HALF; z < HALF; z++) {
    for (let x = -HALF; x < HALF; x++) {
      const h = H[idx(x, z)];
      M.makeTranslation(x, h - 0.5, z);
      top.setMatrixAt(k, M);
      const shade = 0.9 + rand() * 0.14;
      if (h <= 1) C.setHex(0xfde68a);
      else if (h >= 10) C.setHex(0xf8fafc);
      else if (h >= 7) C.setHex(0xd1d5db);
      else C.setHex(0x4ade80);
      C.multiplyScalar(shade);
      top.setColorAt(k, C);
      k++;

      if (h >= 1) {
        const depth = h + 4;
        M.makeScale(1, depth, 1).setPosition(x, h - 1 - depth / 2, z);
        under.setMatrixAt(kUnder, M);
        C.setHex(h <= 1 ? 0xeab308 : 0x92400e).multiplyScalar(shade * 0.8);
        under.setColorAt(kUnder, C);
        kUnder++;
      }
    }
  }
  under.count = kUnder;
  top.receiveShadow = true;
  top.castShadow = false;
  under.receiveShadow = false;
  under.castShadow = false;
  [top, under].forEach((m) => { m.computeBoundingSphere(); scene.add(m); });

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(520, 520),
    new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER;
  scene.add(water);

  for (let i = 0; i < 24; i++) {
    const a = rand() * Math.PI * 2;
    const r = 40 + rand() * 55;
    scene.add(cloudBlocks(Math.cos(a) * r, 20 + rand() * 12, Math.sin(a) * r, 1.2 + rand() * 1.1));
  }

  // --- Objets solides & décors sauvages (arbres/rochers/champignons supprimables) ---
  const solids = [];
  const wildProps = new Map(); // propId -> { group, solid, meshes }
  const wildHitMeshes = [];

  const bridgeDeck = block(31.5, 1.85, 0, 8, 0.3, 3, 0xb45309);
  scene.add(bridgeDeck);
  solids.push(solidOf(bridgeDeck));
  for (let px = 28; px <= 35; px += 2) {
    [-1.35, 1.35].forEach((pz) => {
      const post = block(px, 2.5, pz, 0.28, 1.1, 0.28, 0x78350f);
      scene.add(post);
      solids.push(solidOf(post));
      if (px === 28 || px === 34) {
        scene.add(block(px, 3.2, pz, 0.36, 0.36, 0.36, 0xfde047, { emissive: 0xfacc15, emissiveIntensity: 0.8, plain: true }));
      }
    });
  }

  TRAMPOLINES.forEach((tp) => {
    const y = H[idx(tp.x, tp.z)];
    const pad = block(tp.x, y + 0.25, tp.z, 1.8, 0.5, 1.8, 0x06b6d4, { emissive: 0x0e7490, emissiveIntensity: 0.45 });
    const ring = block(tp.x, y + 0.52, tp.z, 1.2, 0.08, 1.2, 0xfde047, { plain: true, shadow: false });
    scene.add(pad, ring);
    solids.push(solidOf(pad, 'bounce'));
  });

  const RB = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0x8b5cf6];
  for (let i = -6; i <= 6; i++) {
    const ax = -25 + i;
    const ay = Math.round(7.5 - (i * i) / 6.5);
    RB.forEach((col, bi) => {
      scene.add(block(ax, ay + bi * 0.45, 18, 1, 0.45, 1.6, col, { plain: true }));
    });
  }

  const freeCell = (minH = 2, maxH = 8, filterFn = null) => {
    for (let tries = 0; tries < 700; tries++) {
      const x = Math.floor(rand() * (SIZE - 10)) - HALF + 5;
      const z = Math.floor(rand() * (SIZE - 10)) - HALF + 5;
      const h = hAt(x, z);
      if (h < minH || h > maxH) continue;
      if (Math.abs(x) <= 9 && z >= -8 && z <= 15) continue;
      if (x >= 25 && x <= 39 && Math.abs(z) <= 4) continue;
      if (filterFn && !filterFn(x, z, h)) continue;
      if (solids.some((b) => x >= b.x0 - 1.5 && x <= b.x1 + 1.5 && z >= b.z0 - 1.5 && z <= b.z1 + 1.5)) continue;
      return { x, z, h };
    }
    return { x: 0, z: 8, h: 2 };
  };

  const removedSet = new Set(save.worldRemoved);

  function addWildProp(id, group, solid) {
    group.traverse((ch) => {
      if (ch.isMesh) {
        ch.userData.wildPropId = id;
        wildHitMeshes.push(ch);
      }
    });
    wildProps.set(id, { group, solid });
    if (!removedSet.has(id)) {
      scene.add(group);
      if (solid) solids.push(solid);
    }
  }

  for (let i = 0; i < 82; i++) {
    const c = freeCell(2, 7);
    const isPalm = c.x > 33 || c.h === 2;
    const tall = (isPalm ? 3.5 : 2.5) + Math.round(rand() * 2.5);
    const g = new THREE.Group();
    const trunk = block(c.x, c.h + tall / 2, c.z, 0.8, tall, 0.8, 0x92400e);
    const leafColor = [0x16a34a, 0x22c55e, 0x15803d][i % 3];
    const leaves = block(c.x, c.h + tall + 0.9, c.z, 3, 2, 3, leafColor);
    const tip = block(c.x, c.h + tall + 2.4, c.z, 1.6, 1, 1.6, leafColor);
    g.add(trunk, leaves, tip);
    if (i % 5 === 0) {
      [[-0.9, 0.9], [1, -0.6], [0.4, 1.1]].forEach(([dx, dz]) =>
        g.add(block(c.x + dx, c.h + tall + 0.4, c.z + dz + 0.6, 0.35, 0.35, 0.35, 0xef4444, { plain: true }))
      );
    }
    addWildProp(`t${i}`, g, solidOf(trunk));
  }

  for (let i = 0; i < 16; i++) {
    const c = freeCell(2, 6, (x, z) => x < -10 && z < -8);
    const g = new THREE.Group();
    const stem = block(c.x, c.h + 0.85, c.z, 0.7, 1.7, 0.7, 0xfef3c7, { plain: true });
    const cap = block(c.x, c.h + 2.0, c.z, 2.2, 0.8, 2.2, i % 2 === 0 ? 0xef4444 : 0xa855f7, { plain: true });
    g.add(stem, cap);
    g.add(block(c.x - 0.5, c.h + 2.45, c.z + 0.4, 0.38, 0.15, 0.38, 0xffffff, { plain: true }));
    g.add(block(c.x + 0.5, c.h + 2.45, c.z - 0.4, 0.38, 0.15, 0.38, 0xffffff, { plain: true }));
    addWildProp(`m${i}`, g, solidOf(stem));
  }

  for (let i = 0; i < 22; i++) {
    const c = freeCell(1, 10);
    const g = new THREE.Group();
    const r = block(c.x, c.h + 0.4, c.z, 1.3, 0.8, 1.1, 0x9ca3af);
    g.add(r);
    addWildProp(`r${i}`, g, solidOf(r));
  }

  for (let i = 0; i < 95; i++) {
    const c = freeCell(2, 6);
    const col = [0xf472b6, 0xfde047, 0xffffff, 0xa78bfa][i % 4];
    scene.add(block(c.x, c.h + 0.35, c.z, 0.1, 0.5, 0.1, 0x16a34a, { plain: true, shadow: false }));
    scene.add(block(c.x, c.h + 0.65, c.z, 0.32, 0.22, 0.32, col, { plain: true, shadow: false }));
  }

  // Maison centrale (porte élargie à 2 blocs)
  const hx = 0;
  const hz = -1;
  const hy = 2;
  const wall = (x, z, w, d, h = 3.2, y = 0) => {
    const m = block(hx + x, hy + y + h / 2, hz + z, w, h, d, 0xfef3c7);
    scene.add(m);
    solids.push(solidOf(m));
  };
  wall(0, -2.3, 5.6, 0.4);
  wall(-2.6, 0, 0.4, 4.6);
  wall(2.6, 0, 0.4, 4.6);
  wall(-1.95, 2.3, 1.7, 0.4);
  wall(1.95, 2.3, 1.7, 0.4);
  wall(0, 2.3, 2.2, 0.4, 1, 2.2);
  const roof1 = block(hx, hy + 3.5, hz, 6.4, 0.6, 5.4, 0xef4444);
  const roof2 = block(hx, hy + 4.1, hz, 4.4, 0.6, 3.8, 0xdc2626);
  const roof3 = block(hx, hy + 4.7, hz, 2.4, 0.6, 2.2, 0xb91c1c);
  scene.add(roof1, roof2, roof3);
  solids.push(solidOf(roof1));
  scene.add(block(hx - 1.7, hy + 1.8, hz + 2.52, 0.85, 0.85, 0.06, 0x7dd3fc, { plain: true }));
  scene.add(block(hx + 1.7, hy + 1.8, hz + 2.52, 0.85, 0.85, 0.06, 0x7dd3fc, { plain: true }));

  // Limites du grand monde
  const lim = HALF - 1;
  solids.push(
    { x0: -lim - 2, x1: -lim, y0: -10, y1: 40, z0: -lim, z1: lim },
    { x0: lim, x1: lim + 2, y0: -10, y1: 40, z0: -lim, z1: lim },
    { x0: -lim, x1: lim, y0: -10, y1: 40, z0: -lim - 2, z1: -lim },
    { x0: -lim, x1: lim, y0: -10, y1: 40, z0: lim, z1: lim + 2 }
  );

  // =========================================================================
  // CONSTRUCTIONS PERSONNALISÉES DU JOUEUR SUR L'ÎLE (arbres, maisons, barrières...)
  // =========================================================================
  const editsRoot = new THREE.Group();
  scene.add(editsRoot);
  const editItems = new Map(); // id -> { data, group, solids, hitMeshes }
  let editHitMeshes = [];
  let editSolids = [];

  function buildFenceGroup(item, allList) {
    const g = new THREE.Group();
    const hasAt = (dx, dz) => allList.some((o) => o.type === 'fence' && o.x === item.x + dx && o.z === item.z + dz && Math.abs(o.y - item.y) <= 1);
    const post = block(0, 0.55, 0, 0.28, 1.1, 0.28, 0xd97706);
    const cap = block(0, 1.14, 0, 0.34, 0.1, 0.34, 0xfef3c7, { plain: true });
    g.add(post, cap);

    const rail = (w, d, ox, oz) => {
      g.add(block(ox, 0.85, oz, w, 0.16, d, 0xfef3c7, { plain: true }));
      g.add(block(ox, 0.45, oz, w, 0.16, d, 0xfef3c7, { plain: true }));
    };
    const l = hasAt(-1, 0);
    const r = hasAt(1, 0);
    const f = hasAt(0, 1);
    const b = hasAt(0, -1);
    if (l) rail(0.5, 0.14, -0.25, 0);
    if (r) rail(0.5, 0.14, 0.25, 0);
    if (f) rail(0.14, 0.5, 0, 0.25);
    if (b) rail(0.14, 0.5, 0, -0.25);
    if (!l && !r && !f && !b) rail(0.95, 0.14, 0, 0);
    return g;
  }

  function makeEditVisual(data, allList) {
    const g = new THREE.Group();
    g.position.set(data.x, data.y, data.z);
    const itemSolids = [];
    const addBox = (bx, by, bz, w, h, d, color, opts = {}, kind = 'solid') => {
      const m = block(bx, by, bz, w, h, d, color, opts);
      g.add(m);
      if (kind !== 'none') {
        itemSolids.push({
          x0: data.x + bx - w / 2, x1: data.x + bx + w / 2,
          y0: data.y + by - h / 2, y1: data.y + by + h / 2,
          z0: data.z + bz - d / 2, z1: data.z + bz + d / 2,
          kind
        });
      }
      return m;
    };

    switch (data.type) {
      case 'tree': {
        addBox(0, 1.5, 0, 0.75, 3, 0.75, 0x92400e);
        addBox(0, 3.6, 0, 2.8, 1.8, 2.8, 0x22c55e, {}, 'none');
        addBox(0, 5.0, 0, 1.6, 1.0, 1.6, 0x16a34a, {}, 'none');
        break;
      }
      case 'palm': {
        addBox(0, 2.25, 0, 0.6, 4.5, 0.6, 0xa16207);
        addBox(0, 4.7, 0, 3.2, 0.6, 1.2, 0x22c55e, {}, 'none');
        addBox(0, 4.7, 0, 1.2, 0.6, 3.2, 0x16a34a, {}, 'none');
        addBox(-0.35, 4.3, 0.35, 0.35, 0.35, 0.35, 0x78350f, { plain: true }, 'none');
        addBox(0.35, 4.3, -0.25, 0.35, 0.35, 0.35, 0x78350f, { plain: true }, 'none');
        break;
      }
      case 'house': {
        // Mini-maison visitable 5×4 avec porte large devant (z = +1.8)
        addBox(0, 0.08, 0, 4.8, 0.16, 3.8, 0xb45309); // plancher bas
        addBox(0, 1.5, -1.75, 4.8, 3.0, 0.35, 0xfef3c7); // mur fond
        addBox(-2.25, 1.5, 0, 0.35, 3.0, 3.5, 0xfef3c7); // mur gauche
        addBox(2.25, 1.5, 0, 0.35, 3.0, 3.5, 0xfef3c7);  // mur droite
        addBox(-1.6, 1.5, 1.75, 1.6, 3.0, 0.35, 0xfef3c7); // façade gauche
        addBox(1.6, 1.5, 1.75, 1.6, 3.0, 0.35, 0xfef3c7);  // façade droite
        addBox(0, 2.55, 1.75, 1.6, 0.9, 0.35, 0xfef3c7);   // linteau porte
        addBox(0, 3.3, 0, 5.4, 0.55, 4.5, 0xef4444);       // toit 1
        addBox(0, 3.85, 0, 3.6, 0.55, 3.0, 0xdc2626, {}, 'none');
        addBox(0, 4.4, 0, 1.8, 0.55, 1.6, 0xb91c1c, {}, 'none');
        addBox(-1.6, 1.6, 1.94, 0.75, 0.75, 0.08, 0x7dd3fc, { plain: true }, 'none');
        addBox(1.6, 1.6, 1.94, 0.75, 0.75, 0.08, 0x7dd3fc, { plain: true }, 'none');
        addBox(0, 2.7, -1.2, 0.45, 0.45, 0.45, 0xfde047, { emissive: 0xfacc15, emissiveIntensity: 0.9, plain: true }, 'none');
        break;
      }
      case 'fence': {
        g.add(buildFenceGroup(data, allList));
        // Hauteur collision 1.3 pour empêcher stepH=1.05 de grimper par-dessus en marchant
        itemSolids.push({
          x0: data.x - 0.45, x1: data.x + 0.45,
          y0: data.y, y1: data.y + 1.3,
          z0: data.z - 0.45, z1: data.z + 0.45,
          kind: 'solid'
        });
        break;
      }
      case 'plank': {
        addBox(0, 0.15, 0, 1.0, 0.3, 1.0, 0xb45309);
        break;
      }
      case 'flower': {
        const pCol = [0xf472b6, 0xa855f7, 0xfb7185, 0xf97316][Math.abs(data.x * 3 + data.z * 5) % 4];
        addBox(0, 0.08, 0, 0.5, 0.16, 0.5, 0x22c55e, { plain: true }, 'none');
        addBox(0, 0.35, 0, 0.14, 0.5, 0.14, 0x16a34a, { plain: true }, 'none');
        addBox(0, 0.65, 0, 0.5, 0.22, 0.5, pCol, { plain: true }, 'none');
        addBox(0, 0.72, 0, 0.22, 0.24, 0.22, 0xfde047, { plain: true }, 'none');
        break;
      }
      case 'mushroom': {
        addBox(0, 0.5, 0, 0.45, 1.0, 0.45, 0xfef3c7, { plain: true });
        addBox(0, 1.15, 0, 1.2, 0.5, 1.2, 0xef4444, { plain: true });
        addBox(-0.28, 1.42, 0.2, 0.25, 0.1, 0.25, 0xffffff, { plain: true }, 'none');
        addBox(0.28, 1.42, -0.2, 0.25, 0.1, 0.25, 0xffffff, { plain: true }, 'none');
        break;
      }
      case 'bounce': {
        addBox(0, 0.25, 0, 1.0, 0.5, 1.0, 0x06b6d4, { emissive: 0x0e7490, emissiveIntensity: 0.45 }, 'bounce');
        addBox(0, 0.52, 0, 0.68, 0.08, 0.68, 0xfde047, { plain: true, shadow: false }, 'none');
        break;
      }
      case 'lamp': {
        addBox(0, 0.9, 0, 0.26, 1.8, 0.26, 0x78350f);
        addBox(0, 2.0, 0, 0.55, 0.55, 0.55, 0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 1.0, plain: true });
        break;
      }
      case 'portal': {
        addBox(0, 0.08, 0, 1.5, 0.16, 1.5, 0x6d28d9, { emissive: 0x4c1d95, emissiveIntensity: 0.5 }, 'none');
        addBox(-0.6, 1.2, 0, 0.22, 2.2, 0.22, 0x8b5cf6, { emissive: 0x6d28d9, emissiveIntensity: 0.7 }, 'none');
        addBox(0.6, 1.2, 0, 0.22, 2.2, 0.22, 0x8b5cf6, { emissive: 0x6d28d9, emissiveIntensity: 0.7 }, 'none');
        addBox(0, 2.3, 0, 1.44, 0.24, 0.24, 0x8b5cf6, { emissive: 0x6d28d9, emissiveIntensity: 0.7 }, 'none');
        addBox(0, 1.2, 0, 1.0, 2.0, 0.08, 0xd8b4fe, { emissive: 0xa855f7, emissiveIntensity: 0.9, opacity: 0.65, plain: true }, 'none');
        break;
      }
      default: {
        // Bloc coloré 1×1×1
        addBox(0, 0.5, 0, 1.0, 1.0, 1.0, data.color || 0xef4444);
        break;
      }
    }

    g.traverse((ch) => {
      if (ch.isMesh) {
        ch.userData.editId = data.id;
        ch.userData.editData = data;
      }
    });
    return { group: g, solids: itemSolids };
  }

  function rebuildEdits() {
    editsRoot.clear();
    editItems.clear();
    editHitMeshes = [];
    editSolids = [];

    save.worldEdits.forEach((data) => {
      const vis = makeEditVisual(data, save.worldEdits);
      editsRoot.add(vis.group);
      vis.group.traverse((ch) => {
        if (ch.isMesh) editHitMeshes.push(ch);
      });
      vis.solids.forEach((s) => editSolids.push(s));
      editItems.set(data.id, { data, group: vis.group, solids: vis.solids });
    });
  }
  rebuildEdits();

  // --- 24 Gemmes réparties dans toutes les régions ---
  const GEM_COLORS = [0xef4444, 0x3b82f6, 0x22c55e, 0xa855f7, 0xf59e0b, 0xec4899];
  const gems = [];
  for (let i = 0; i < TOTAL_GEMS; i++) {
    let c;
    if (i < 4) c = freeCell(8, 14);
    else if (i < 8) c = freeCell(1, 5, (x) => x >= 35);
    else if (i < 12) c = freeCell(1, 2);
    else if (i < 16) c = freeCell(2, 6, (x, z) => x < -10 && z < -8);
    else if (i < 20) c = freeCell(1, 5, (x, z) => x < -10 && z > 8);
    else c = freeCell(2, 7);

    const g = makeGem(GEM_COLORS[i % GEM_COLORS.length]);
    const base = c.h + 1.1;
    g.position.set(c.x, base, c.z);
    g.userData = { id: `g${i}`, base };
    if (save.gems.includes(g.userData.id)) continue;
    scene.add(g);
    gems.push(g);
  }

  // --- 6 Coffres à calcul ---
  const chests = [];
  const chestFilters = [
    null,
    null,
    (x, z) => x < -12 && z < -10,
    (x, z) => x > 8 && z < -16,
    (x) => x >= 38,
    (x, z) => x < -14 && z > 10
  ];
  for (let i = 0; i < TOTAL_CHESTS; i++) {
    const c = freeCell(1, 12, chestFilters[i]);
    const ch = makeChest();
    ch.position.set(c.x, c.h, c.z);
    ch.rotation.y = rand() * Math.PI * 2;
    ch.userData.id = `c${i}`;
    ch.userData.open = save.chests.includes(ch.userData.id);
    if (ch.userData.open) ch.userData.lid.rotation.x = -1.9;
    scene.add(ch);
    solids.push({ x0: c.x - 0.6, x1: c.x + 0.6, y0: c.h, y1: c.h + 0.9, z0: c.z - 0.6, z1: c.z + 0.6 });
    chests.push(ch);
  }

  // --- 8 Animaux amis ---
  const animalFilters = [
    null,
    null,
    null,
    null,
    (x, z) => x < -12 && z > 8,
    (x, z) => x < -12 && z < -8,
    (x, z) => x > 6 && z < -10,
    (x) => x >= 36
  ];
  const animals = ANIMALS.map((a, i) => {
    const c = freeCell(2, 7, animalFilters[i]);
    const g = makeAnimal(a);
    g.position.set(c.x, c.h, c.z);
    scene.add(g);
    return { def: a, g, friend: save.friends.includes(a.id), target: null, wait: rand() * 2, phase: i, slot: 0 };
  });

  // --- Faisceau lumineux « 🧭 Indice » ---
  const beaconGroup = new THREE.Group();
  const beaconBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.75, 28, 12),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.45, depthWrite: false })
  );
  beaconBeam.position.y = 14;
  const beaconStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.9),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  beaconStar.position.y = 6;
  beaconGroup.add(beaconBeam, beaconStar);
  beaconGroup.visible = false;
  scene.add(beaconGroup);
  let beaconTimer = 0;

  function showNearestHint() {
    const candidates = [];
    gems.forEach((g) => candidates.push({ pos: g.position, label: 'une gemme 💎', say: 'une gemme' }));
    chests.forEach((ch) => { if (!ch.userData.open) candidates.push({ pos: ch.position, label: 'un coffre au trésor 🎁', say: 'un coffre au trésor' }); });
    animals.forEach((a) => { if (!a.friend) candidates.push({ pos: a.g.position, label: `${a.def.name} 🐾`, say: a.def.name }); });

    if (!candidates.length) {
      sfx('win');
      toast('🌟 Tu as déjà tout trouvé dans le Grand Monde !');
      speak('Bravo ! Tu as déjà trouvé tous les trésors !');
      return;
    }

    let best = candidates[0];
    let bestD = Infinity;
    candidates.forEach((c) => {
      const d = c.pos.distanceToSquared(P.pos);
      if (d < bestD) { bestD = d; best = c; }
    });

    beaconGroup.position.set(best.pos.x, best.pos.y, best.pos.z);
    beaconGroup.visible = true;
    beaconTimer = 10;
    sfx('light');
    toast(`🧭 Regarde la lumière dorée : ${best.label} t’attend !`, 3500);
    speak(`Regarde la grande lumière dorée ! Il y a ${best.say} !`);
  }

  // --- Joueur & Monde physique ---
  const P = createPlayer(scene);
  P.stepH = 1.05;
  const startPos = { x: 0, y: 2, z: 5.5 };

  const world = {
    boxesNear(x0, y0, z0, x1, y1, z1) {
      const out = [];
      for (let i = 0; i < solids.length; i++) {
        const b = solids[i];
        if (b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1 && b.z1 > z0 && b.z0 < z1) out.push(b);
      }
      for (let i = 0; i < editSolids.length; i++) {
        const b = editSolids[i];
        if (b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1 && b.z1 > z0 && b.z0 < z1) out.push(b);
      }
      for (let z = Math.round(z0); z <= Math.round(z1); z++) {
        for (let x = Math.round(x0); x <= Math.round(x1); x++) {
          const h = hAt(x, z);
          out.push({ x0: x - 0.5, x1: x + 0.5, y0: -6, y1: h, z0: z - 0.5, z1: z + 0.5 });
        }
      }
      return out;
    }
  };

  function surfaceHeightAt(gx, gz) {
    let h = Math.max(hAt(gx, gz), 0);
    for (let i = 0; i < editSolids.length; i++) {
      const b = editSolids[i];
      if (gx >= b.x0 && gx <= b.x1 && gz >= b.z0 && gz <= b.z1 && b.y1 > h && b.y1 < h + 2.5) {
        h = b.y1;
      }
    }
    return h;
  }

  function goHome(first = false) {
    P.pos.set(startPos.x, startPos.y, startPos.z);
    P.vel.set(0, 0, 0);
    P.facing = Math.PI;
    if (first) {
      cam.yaw = 0;
      cam.pitch = 0.45;
      cam.dist = 9;
    }
    animals.forEach((a) => {
      if (!a.friend) return;
      a.g.position.set(startPos.x + (a.slot - 2) * 1.3, startPos.y, startPos.z + 2.5);
    });
    syncAvatar(P, 0);
    followCamera(P, 0, true);
  }
  goHome(true);

  let friendCount = 0;
  animals.forEach((a) => {
    if (!a.friend) return;
    a.slot = friendCount++;
    a.g.position.set(startPos.x + (a.slot - 2) * 1.3, startPos.y, startPos.z + 2.5);
  });

  const chestsOpenCount = () => chests.filter((c) => c.userData.open).length;
  const hudText = () => hud(`💎 ${TOTAL_GEMS - gems.length}/${TOTAL_GEMS} · 🐾 ${friendCount}/${ANIMALS.length} · 🎁 ${chestsOpenCount()}/${TOTAL_CHESTS}`);
  hudText();
  speak('Bienvenue dans ton grand monde ! Tu peux explorer et même appuyer sur le marteau pour construire.');
  toast(`🏝️ Grand Monde : explore ou touche 🔨 pour construire !`, 3800);

  let finished = gems.length === 0 && friendCount === ANIMALS.length && chestsOpenCount() === TOTAL_CHESTS;
  function checkAll() {
    if (finished) return;
    if (gems.length === 0 && friendCount === ANIMALS.length && chestsOpenCount() === TOTAL_CHESTS) {
      finished = true;
      speak('Bravo Manel ! Tu as exploré tout le grand monde et trouvé tous les trésors !');
      celebrate({
        title: 'Grand monde terminé !',
        text: `Tu as trouvé les ${TOTAL_GEMS} gemmes, les ${TOTAL_CHESTS} coffres et les ${ANIMALS.length} animaux !`,
        stars: 3,
        buttons: [['🏝️ Continuer à explorer', () => {}, 'primary'], ['🏠 Menu', onExit]]
      });
    }
  }

  // =========================================================================
  // BARRE DE CONSTRUCTION EN JEU (🔨) : Poser, Enlever, Oups, Rétablir
  // =========================================================================
  let mondeBuildOn = false;
  let mondeTool = 'place'; // 'place' | 'remove'
  let selectedItemIdx = 0;
  const worldUndo = [];

  const itemsBar = document.getElementById('mondeItems');
  const buildBar = document.getElementById('mondeBuildBar');
  itemsBar.innerHTML = '';
  const itemBtns = [];
  MONDE_ITEMS.forEach((it, idx) => {
    const b = document.createElement('button');
    if (it.color) b.className = 'mb-color';
    if (idx === 0) b.classList.add('active');
    b.innerHTML = `${it.icon}<span>${it.label}</span>`;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      selectedItemIdx = idx;
      itemBtns.forEach((x, j) => x.classList.toggle('active', j === idx));
      setMondeTool('place');
      sfx('pop');
      toast(`${it.icon} Touche l’île pour poser : ${it.label}`);
    });
    itemsBar.appendChild(b);
    itemBtns.push(b);
  });

  function setMondeTool(t) {
    mondeTool = t;
    buildBar.querySelectorAll('[data-mtool]').forEach((b) => b.classList.toggle('active', b.dataset.mtool === t));
  }
  setMondeTool('place');

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function onWorldTap(clientX, clientY) {
    if (!mondeBuildOn || ui.busy) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);

    const targets = mondeTool === 'remove'
      ? [...editHitMeshes, ...wildHitMeshes.filter((m) => !removedSet.has(m.userData.wildPropId))]
      : [top, water, ...editHitMeshes];
    const hits = ray.intersectObjects(targets, false);
    if (!hits.length) return;
    const h = hits[0];

    if (mondeTool === 'remove') {
      if (h.object.userData.editId) {
        const eid = h.object.userData.editId;
        const idxEdit = save.worldEdits.findIndex((e) => e.id === eid);
        if (idxEdit !== -1) {
          const [removed] = save.worldEdits.splice(idxEdit, 1);
          worldUndo.push({ kind: 'delEdit', item: removed });
          if (worldUndo.length > 40) worldUndo.shift();
          rebuildEdits();
          persist();
          sfx('remove');
        }
        return;
      }
      if (h.object.userData.wildPropId) {
        const pid = h.object.userData.wildPropId;
        const prop = wildProps.get(pid);
        if (prop && !removedSet.has(pid)) {
          removedSet.add(pid);
          save.worldRemoved.push(pid);
          scene.remove(prop.group);
          if (prop.solid) {
            const si = solids.indexOf(prop.solid);
            if (si !== -1) solids.splice(si, 1);
          }
          worldUndo.push({ kind: 'delProp', propId: pid });
          if (worldUndo.length > 40) worldUndo.shift();
          persist();
          sfx('remove');
        }
        return;
      }
      return;
    }

    // Mode Poser
    const spec = MONDE_ITEMS[selectedItemIdx];
    let x, y, z;

    if (h.object.userData.editData) {
      const ed = h.object.userData.editData;
      const n = h.face.normal;
      let nx = 0, ny = 0, nz = 0;
      if (Math.abs(n.y) >= Math.abs(n.x) && Math.abs(n.y) >= Math.abs(n.z)) ny = Math.sign(n.y);
      else if (Math.abs(n.x) >= Math.abs(n.z)) nx = Math.sign(n.x);
      else nz = Math.sign(n.z);

      if (ed.type === 'house' || ed.type === 'tree' || ed.type === 'palm') {
        x = Math.round(h.point.x + nx * 0.5);
        z = Math.round(h.point.z + nz * 0.5);
        y = ny > 0 ? Math.round(h.point.y) : Math.max(1, hAt(x, z));
      } else {
        x = ed.x + nx;
        const stepH = ed.type === 'plank' ? 0.3 : ed.type === 'bounce' ? 0.5 : 1;
        y = Math.round((ed.y + (ny > 0 ? stepH : ny < 0 ? -1 : 0)) * 100) / 100;
        z = ed.z + nz;
      }
    } else {
      x = Math.round(h.point.x - h.face.normal.x * 0.05);
      z = Math.round(h.point.z - h.face.normal.z * 0.05);
      const gh = hAt(x, z);
      if (gh < 1) {
        if (spec.id === 'plank' || spec.id === 'block' || spec.id === 'bounce' || spec.id === 'lamp' || spec.id === 'fence') {
          y = 1;
        } else {
          sfx('wrong');
          toast('🌊 Sur l’eau, choisis Pont 🪵 ou un bloc !');
          return;
        }
      } else {
        y = gh;
      }
    }

    if (Math.abs(x) >= HALF - 2 || Math.abs(z) >= HALF - 2 || y < 0 || y > 22) {
      sfx('wrong');
      toast('🚧 Trop loin du bord !');
      return;
    }

    // Ne pas bloquer le joueur dans son propre bloc
    if (spec.id !== 'flower' && spec.id !== 'plank') {
      const box = spec.id === 'house'
        ? { x0: x - 2.4, x1: x + 2.4, y0: y, y1: y + 3.5, z0: z - 1.9, z1: z + 1.9 }
        : { x0: x - 0.45, x1: x + 0.45, y0: y, y1: y + 1, z0: z - 0.45, z1: z + 0.45 };
      if (overlapsBox(P.pos.x, P.pos.y, P.pos.z, box)) {
        sfx('wrong');
        toast('Recule un petit peu pour poser ici !');
        return;
      }
    }

    const newItem = {
      id: 'e_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      type: spec.id,
      x, y, z
    };
    if (spec.color) newItem.color = spec.color;

    save.worldEdits.push(newItem);
    worldUndo.push({ kind: 'addEdit', id: newItem.id });
    if (worldUndo.length > 40) worldUndo.shift();
    rebuildEdits();
    persist();
    sfx('place');
  }

  // Boutons HUD & Barre de construction
  document.body.classList.add('monde-mode');
  const buildToggleBtn = document.getElementById('mondeBuildBtn');
  const weatherBtn = document.getElementById('mondeWeatherBtn');
  const feedBtn = document.getElementById('mondeFeedBtn');
  const rideBtn = document.getElementById('mondeRideBtn');
  const hintBtn = document.getElementById('mondeHintBtn');
  const homeWorldBtn = document.getElementById('mondeHomeBtn');
  const undoBtn = document.getElementById('mondeUndoBtn');
  const resetBtn = document.getElementById('mondeResetBtn');

  // --- 2 Portails de départ (Village <-> Sommet de la Montagne Enneigée) ---
  const basePortals = [
    { x: 5, y: 2, z: 3, label: 'Village' },
    { x: 16, y: hAt(16, -24), z: -24, label: 'Sommet Enneigé' }
  ];
  basePortals.forEach((bp) => {
    const pv = makeEditVisual({ id: 'base_portal', type: 'portal', x: bp.x, y: bp.y, z: bp.z }, []);
    scene.add(pv.group);
  });
  let portalCooldown = 0;

  // --- Petit Bateau automatique quand on va sur l'eau ---
  const boatGroup = new THREE.Group();
  boatGroup.add(block(0, 0.15, 0, 1.4, 0.3, 2.2, 0x92400e));
  boatGroup.add(block(-0.65, 0.42, 0, 0.14, 0.3, 2.2, 0xb45309));
  boatGroup.add(block(0.65, 0.42, 0, 0.14, 0.3, 2.2, 0xb45309));
  boatGroup.add(block(0, 0.42, -1.03, 1.4, 0.3, 0.16, 0xb45309));
  boatGroup.add(block(0, 0.42, 1.03, 1.4, 0.3, 0.16, 0xb45309));
  boatGroup.add(block(0, 1.25, -0.2, 0.12, 1.8, 0.12, 0x78350f));
  boatGroup.add(block(0, 1.5, -0.1, 0.95, 1.0, 0.08, 0xffffff, { plain: true }));
  boatGroup.visible = false;
  scene.add(boatGroup);

  // --- Météo : Soleil ☀️ / Neige ❄️ / Nuit étoilée 🌠 ---
  let weather = 'sun'; // 'sun' | 'snow' | 'night'
  const snowGroup = new THREE.Group();
  const snowFlakes = [];
  const snowGeo = boxGeo(0.22, 0.22, 0.22);
  const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 85; i++) {
    const sf = new THREE.Mesh(snowGeo, snowMat);
    sf.position.set((Math.random() - 0.5) * 44, Math.random() * 18, (Math.random() - 0.5) * 44);
    snowGroup.add(sf);
    snowFlakes.push({ m: sf, vy: 2.6 + Math.random() * 1.8, phase: Math.random() * 6 });
  }
  snowGroup.visible = false;
  scene.add(snowGroup);

  const nightStarsGroup = new THREE.Group();
  const stGeo = boxGeo(0.45, 0.45, 0.45);
  const stMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (let i = 0; i < 70; i++) {
    const a = (i * 2.39996) % (Math.PI * 2);
    const r = 35 + (i % 8) * 7;
    const sm = new THREE.Mesh(stGeo, stMat);
    sm.position.set(Math.cos(a) * r, 26 + (i % 5) * 4, Math.sin(a) * r);
    nightStarsGroup.add(sm);
  }
  const shootingStar = new THREE.Mesh(boxGeo(1.2, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
  shootingStar.position.set(0, 32, -30);
  nightStarsGroup.add(shootingStar);
  nightStarsGroup.visible = false;
  scene.add(nightStarsGroup);

  const onWeather = (e) => {
    e.stopPropagation();
    const order = ['sun', 'snow', 'night'];
    weather = order[(order.indexOf(weather) + 1) % order.length];
    if (weather === 'sun') {
      scene.background.setHex(0x8fd3ff);
      scene.fog.color.setHex(0x8fd3ff);
      if (scene.userData.hemi) scene.userData.hemi.intensity = 1.6;
      if (scene.userData.sun) scene.userData.sun.intensity = 2.2;
      snowGroup.visible = false;
      nightStarsGroup.visible = false;
      if (weatherBtn) weatherBtn.textContent = '☀️';
      toast('☀️ Grand soleil sur l’île !');
    } else if (weather === 'snow') {
      scene.background.setHex(0xcbd5e1);
      scene.fog.color.setHex(0xcbd5e1);
      if (scene.userData.hemi) scene.userData.hemi.intensity = 1.5;
      if (scene.userData.sun) scene.userData.sun.intensity = 1.6;
      snowGroup.visible = true;
      nightStarsGroup.visible = false;
      if (weatherBtn) weatherBtn.textContent = '❄️';
      toast('❄️ Il neige sur toute l’île !');
    } else {
      scene.background.setHex(0x0f172a);
      scene.fog.color.setHex(0x0f172a);
      if (scene.userData.hemi) scene.userData.hemi.intensity = 0.65;
      if (scene.userData.sun) scene.userData.sun.intensity = 0.55;
      snowGroup.visible = false;
      nightStarsGroup.visible = true;
      if (weatherBtn) weatherBtn.textContent = '🌠';
      toast('🌠 Nuit d’étoiles filantes !');
    }
    sfx('light');
  };

  // --- Nourrir les animaux (🍎) : petits cœurs 3D + couronne dorée ---
  const heartParticles = [];
  const heartGeo = boxGeo(0.28, 0.28, 0.28);
  const heartMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

  const onFeed = (e) => {
    e.stopPropagation();
    const myFriends = animals.filter((a) => a.friend);
    const targetList = myFriends.length ? myFriends : animals;
    sfx('eat');
    targetList.forEach((a) => {
      if (!a.crowned) {
        a.crowned = true;
        const cr = block(0, 1.68 * a.def.size, 0.8 * a.def.size, 0.36 * a.def.size, 0.18 * a.def.size, 0.36 * a.def.size, 0xfacc15, { plain: true });
        a.g.add(cr);
      }
      a.g.position.y += 0.9;
      for (let i = 0; i < 4; i++) {
        const hm = new THREE.Mesh(heartGeo, heartMat);
        hm.position.set(
          a.g.position.x + (Math.random() - 0.5) * 0.9,
          a.g.position.y + 1.3 + Math.random() * 0.4,
          a.g.position.z + (Math.random() - 0.5) * 0.9
        );
        scene.add(hm);
        heartParticles.push({ m: hm, vy: 2.2 + Math.random() * 1.5, life: 1.3 });
      }
    });
    toast(myFriends.length ? '🍎 Miam ! Tes amis animaux te remercient 💖' : '🍎 Trouve un animal sur l’île pour qu’il devienne ton ami !');
    speak('Miam ! Tes animaux sont super contents !');
  };

  // --- Monter sur le dos d'un animal ami (🦖) ---
  let ridingAnimal = null;
  const onRide = (e) => {
    e.stopPropagation();
    if (ridingAnimal) {
      ridingAnimal = null;
      P.jumpV = 9.6;
      document.body.classList.remove('monde-riding');
      sfx('pop');
      toast('🚶 Tu marches à pied.');
      return;
    }
    const dinoFriend = animals.find((a) => a.friend && a.def.id === 'dino');
    const anyFriend = dinoFriend || animals.find((a) => a.friend) || animals.find((a) => a.def.id === 'dino');
    if (!anyFriend) return;
    anyFriend.friend = true;
    if (!save.friends.includes(anyFriend.def.id)) {
      anyFriend.slot = friendCount++;
      save.friends.push(anyFriend.def.id);
      persist();
      hudText();
    }
    ridingAnimal = anyFriend;
    P.jumpV = 12.2;
    document.body.classList.add('monde-riding');
    sfx('bounce');
    toast(`🦖 En selle sur ${ridingAnimal.def.name} ! Tu cours et sautes plus haut !`);
    speak(`En selle sur ${ridingAnimal.def.name} !`);
  };

  function setMondeBuild(on) {
    mondeBuildOn = on;
    document.body.classList.toggle('monde-building', on);
    input.onTap = on ? onWorldTap : null;
    sfx('pop');
    if (on) toast('🔨 Touche l’île pour ajouter des arbres, maisons ou barrières !', 3400);
  }

  const onToggleBuild = (e) => { e.stopPropagation(); setMondeBuild(!mondeBuildOn); };
  const onHint = (e) => { e.stopPropagation(); showNearestHint(); };
  const onGoHome = (e) => { e.stopPropagation(); goHome(false); sfx('pop'); toast('🏡 Retour à la maison !'); };

  const onUndo = (e) => {
    e.stopPropagation();
    if (!worldUndo.length) { toast('Rien à annuler !'); return; }
    const act = worldUndo.pop();
    if (act.kind === 'addEdit') {
      const i = save.worldEdits.findIndex((x) => x.id === act.id);
      if (i !== -1) save.worldEdits.splice(i, 1);
      rebuildEdits();
    } else if (act.kind === 'delEdit') {
      save.worldEdits.push(act.item);
      rebuildEdits();
    } else if (act.kind === 'delProp') {
      removedSet.delete(act.propId);
      const ri = save.worldRemoved.indexOf(act.propId);
      if (ri !== -1) save.worldRemoved.splice(ri, 1);
      const prop = wildProps.get(act.propId);
      if (prop) {
        scene.add(prop.group);
        if (prop.solid) solids.push(prop.solid);
      }
    }
    persist();
    sfx('remove');
  };

  let resetArmed = 0;
  const onReset = (e) => {
    e.stopPropagation();
    if (performance.now() - resetArmed > 2500) {
      resetArmed = performance.now();
      toast('⚠️ Touche encore pour remettre l’île d’origine');
      return;
    }
    save.worldEdits = [];
    save.worldRemoved = [];
    removedSet.clear();
    worldUndo.length = 0;
    wildProps.forEach((prop) => {
      if (!prop.group.parent) scene.add(prop.group);
      if (prop.solid && !solids.includes(prop.solid)) solids.push(prop.solid);
    });
    rebuildEdits();
    persist();
    sfx('fall');
    toast('🧹 L’île est redevenue comme au début !');
  };

  const toolHandlers = [];
  buildBar.querySelectorAll('[data-mtool]').forEach((b) => {
    const h = (e) => {
      e.stopPropagation();
      setMondeTool(b.dataset.mtool);
      sfx('pop');
      toast(b.dataset.mtool === 'place' ? '✨ Touche l’île pour poser !' : '⛏️ Touche un objet pour l’enlever !');
    };
    b.addEventListener('pointerdown', h);
    toolHandlers.push(() => b.removeEventListener('pointerdown', h));
  });

  if (buildToggleBtn) buildToggleBtn.addEventListener('pointerdown', onToggleBuild);
  if (weatherBtn) weatherBtn.addEventListener('pointerdown', onWeather);
  if (feedBtn) feedBtn.addEventListener('pointerdown', onFeed);
  if (rideBtn) rideBtn.addEventListener('pointerdown', onRide);
  if (hintBtn) hintBtn.addEventListener('pointerdown', onHint);
  if (homeWorldBtn) homeWorldBtn.addEventListener('pointerdown', onGoHome);
  if (undoBtn) undoBtn.addEventListener('pointerdown', onUndo);
  if (resetBtn) resetBtn.addEventListener('pointerdown', onReset);

  const tmp = new THREE.Vector3();
  function update(dt, t) {
    if (!ui.busy) {
      stepPlayer(P, world, dt);
      if (P.pos.y < -5) goHome(false);
    }

    // Petit Bateau automatique sur l'eau OU monture Dino / Animal
    const onWater = P.pos.y < WATER - 0.12;
    boatGroup.visible = onWater && !ridingAnimal;
    if (onWater && !ridingAnimal) {
      boatGroup.position.set(P.pos.x, WATER - 0.05, P.pos.z);
      boatGroup.rotation.y = P.facing;
      P.speed = 8.8;
    } else if (ridingAnimal) {
      P.speed = 9.2;
    } else {
      P.speed = 7.2;
    }

    syncAvatar(P, dt);
    if (ridingAnimal) {
      ridingAnimal.g.position.set(P.pos.x, P.pos.y, P.pos.z);
      ridingAnimal.g.rotation.y = P.facing;
      P.avatar.position.y = P.pos.y + 0.72 * ridingAnimal.def.size;
      const moveSpd = Math.hypot(P.vel.x, P.vel.z);
      const sw = moveSpd > 0.3 ? Math.sin(t * 14) * 0.55 : 0;
      ridingAnimal.g.userData.legs.forEach((l, i) => { l.rotation.x = i === 0 || i === 3 ? sw : -sw; });
    }

    followCamera(P, dt, false, world);
    followSun(scene, P.pos);
    water.position.y = WATER + Math.sin(t * 1.2) * 0.04;

    // Animation météo : Neige ❄️ & Étoiles filantes 🌠
    if (weather === 'snow') {
      snowGroup.position.set(P.pos.x, 0, P.pos.z);
      snowFlakes.forEach((sf) => {
        sf.m.position.y -= sf.vy * dt;
        sf.m.position.x += Math.sin(t * 1.5 + sf.phase) * 0.6 * dt;
        if (sf.m.position.y < 0) sf.m.position.y = 18;
      });
    } else if (weather === 'night') {
      nightStarsGroup.position.set(P.pos.x, 0, P.pos.z);
      const stCycle = (t * 18) % 60;
      shootingStar.position.set(-30 + stCycle, 34 - stCycle * 0.25, -28);
    }

    // Particules cœurs (🍎 Nourrir)
    for (let i = heartParticles.length - 1; i >= 0; i--) {
      const hp = heartParticles[i];
      hp.life -= dt;
      if (hp.life <= 0) {
        scene.remove(hp.m);
        heartParticles.splice(i, 1);
        continue;
      }
      hp.m.position.y += hp.vy * dt;
      hp.m.rotation.y += 4 * dt;
    }

    // Téléportation par Portails Magiques 🌀
    if (portalCooldown > 0) portalCooldown -= dt;
    else {
      const allPortals = [
        ...basePortals,
        ...save.worldEdits.filter((e) => e.type === 'portal')
      ];
      if (allPortals.length >= 2) {
        const hitIdx = allPortals.findIndex((pt) => Math.hypot(pt.x - P.pos.x, pt.z - P.pos.z) < 1.15 && Math.abs(pt.y - P.pos.y) < 1.8);
        if (hitIdx !== -1) {
          const dest = allPortals[(hitIdx + 1) % allPortals.length];
          P.pos.set(dest.x, dest.y + 0.1, dest.z + 1.4);
          P.vel.set(0, 0, 0);
          portalCooldown = 2.5;
          sfx('teleport');
          toast('🌀 Téléportation magique !');
        }
      }
    }

    if (beaconTimer > 0) {
      beaconTimer -= dt;
      beaconStar.rotation.y = t * 3;
      beaconStar.position.y = 5.5 + Math.sin(t * 4) * 0.6;
      if (beaconTimer <= 0) beaconGroup.visible = false;
    }

    const px = P.pos.x;
    const py = P.pos.y + 0.9;
    const pz = P.pos.z;

    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      spinBob(g, t, g.userData.base);
      if (Math.hypot(g.position.x - px, g.position.y - py, g.position.z - pz) < 1.35) {
        scene.remove(g);
        gems.splice(i, 1);
        save.gems.push(g.userData.id);
        persist();
        sfx('gem');
        beaconGroup.visible = false;
        beaconTimer = 0;
        const left = gems.length;
        toast(left ? `💎 Gemme trouvée ! Encore ${left}.` : '💎 Toutes les gemmes sont trouvées !');
        hudText();
        onStars();
        checkAll();
      }
    }

    chests.forEach((ch) => {
      const lid = ch.userData.lid;
      if (ch.userData.open) {
        if (lid.rotation.x > -1.9) lid.rotation.x -= dt * 3;
        return;
      }
      if (ch.userData.asking || ui.busy) return;
      if (Math.hypot(ch.position.x - px, ch.position.z - pz) < 1.9 && Math.abs(ch.position.y - P.pos.y) < 1.5) {
        ch.userData.asking = true;
        input.mx = 0;
        input.mz = 0;
        P.vel.set(0, 0, 0);
        askQuestion('🎁 Coffre au trésor : trouve la réponse !').then(() => {
          ch.userData.open = true;
          save.chests.push(ch.userData.id);
          persist();
          beaconGroup.visible = false;
          beaconTimer = 0;
          sfx('gem');
          toast('🎁 Le coffre s’ouvre : +3 étoiles !');
          hudText();
          onStars();
          checkAll();
        });
      }
    });

    animals.forEach((a) => {
      if (a === ridingAnimal) return;
      const g = a.g;
      let goal = null;
      let speed = 1.6;
      if (a.friend) {
        const ang = P.facing + Math.PI + (a.slot - (friendCount - 1) / 2) * 0.55;
        tmp.set(px + Math.sin(ang) * (2 + a.slot * 0.28), 0, pz + Math.cos(ang) * (2 + a.slot * 0.28));
        if (Math.hypot(tmp.x - g.position.x, tmp.z - g.position.z) > 0.8) goal = tmp;
        speed = 7.6;
      } else {
        a.wait -= dt;
        if (a.wait <= 0) {
          if (a.target) { a.target = null; a.wait = 1 + Math.random() * 2.5; }
          else {
            const r = 2 + Math.random() * 4;
            const ang = Math.random() * Math.PI * 2;
            const tx = g.position.x + Math.cos(ang) * r;
            const tz = g.position.z + Math.sin(ang) * r;
            if (hAt(tx, tz) >= 2) a.target = new THREE.Vector3(tx, 0, tz);
            a.wait = 3;
          }
        }
        goal = a.target;
        if (Math.hypot(g.position.x - px, g.position.z - pz) < 1.8 && Math.abs(g.position.y - P.pos.y) < 1.8) {
          a.friend = true;
          a.slot = friendCount++;
          save.friends.push(a.def.id);
          persist();
          beaconGroup.visible = false;
          beaconTimer = 0;
          sfx('friend');
          speak(`${a.def.name} est ton ami !`);
          toast(`🐾 ${a.def.name} est ton ami ! Il te suit.`);
          hudText();
          onStars();
          checkAll();
        }
      }
      let moving = false;
      if (goal) {
        const dx = goal.x - g.position.x;
        const dz = goal.z - g.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.15) {
          const st = Math.min(d, speed * Math.min(1, d / 1.5 + 0.3) * dt);
          const nx = g.position.x + (dx / d) * st;
          const nz = g.position.z + (dz / d) * st;
          const nh = hAt(nx, nz);
          if (a.friend || (nh >= 2 && Math.abs(nh - hAt(g.position.x, g.position.z)) <= 1)) {
            g.position.x = nx;
            g.position.z = nz;
            moving = true;
          } else {
            a.target = null;
          }
          let rd = Math.atan2(dx, dz) - g.rotation.y;
          rd = Math.atan2(Math.sin(rd), Math.cos(rd));
          g.rotation.y += rd * Math.min(1, 8 * dt);
        }
      }
      const gh = surfaceHeightAt(g.position.x, g.position.z);
      g.position.y += (gh - g.position.y) * Math.min(1, 12 * dt);
      const sw = moving ? Math.sin(t * 12 + a.phase) * 0.5 : 0;
      g.userData.legs.forEach((l, i) => { l.rotation.x = i === 0 || i === 3 ? sw : -sw; });
    });
  }

  return {
    scene,
    update,
    player: P,
    debug: { gems, chests, animals, hAt },
    dispose() {
      document.body.classList.remove('monde-mode', 'monde-building', 'monde-riding');
      input.onTap = null;
      if (buildToggleBtn) buildToggleBtn.removeEventListener('pointerdown', onToggleBuild);
      if (weatherBtn) weatherBtn.removeEventListener('pointerdown', onWeather);
      if (feedBtn) feedBtn.removeEventListener('pointerdown', onFeed);
      if (rideBtn) rideBtn.removeEventListener('pointerdown', onRide);
      if (hintBtn) hintBtn.removeEventListener('pointerdown', onHint);
      if (homeWorldBtn) homeWorldBtn.removeEventListener('pointerdown', onGoHome);
      if (undoBtn) undoBtn.removeEventListener('pointerdown', onUndo);
      if (resetBtn) resetBtn.removeEventListener('pointerdown', onReset);
      toolHandlers.forEach((fn) => fn());
    }
  };
}
