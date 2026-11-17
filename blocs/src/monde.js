// ============================================================================
// MODE PETIT MONDE : une île à explorer (gemmes, animaux amis, coffres)
// ============================================================================
import {
  THREE, newScene, followSun, block, solidOf, mat, cloudBlocks, save, persist,
  createPlayer, stepPlayer, syncAvatar, followCamera, cam, input, sfx, speak,
  toast, askQuestion, celebrate, spinBob, ui, ANIMALS, makeAnimal
} from './moteur.js';

const SIZE = 56;
const HALF = SIZE / 2;
const WATER = 0.45;

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
  const G = 16;
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
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 }));
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
  const scene = newScene(0x8fd3ff, 110);
  const rand = rng(20261116);
  const n1 = makeNoise(rng(7));
  const n2 = makeNoise(rng(11));

  // --- Relief de l'île ---
  const H = new Int8Array(SIZE * SIZE);
  const idx = (x, z) => (z + HALF) * SIZE + (x + HALF);
  for (let z = -HALF; z < HALF; z++) {
    for (let x = -HALF; x < HALF; x++) {
      const d = Math.hypot(x, z * 1.1) / (HALF - 3);
      const base = n1(x / 8 + 50, z / 8 + 50) * 4.5 + n2(x / 3.5, z / 3.5) * 1.3;
      let h = Math.round((1 - d * d) * 4.2 + base - 1.6);
      if (d > 1) h = -1;
      H[idx(x, z)] = Math.max(-1, Math.min(9, h));
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
  const hAt = (x, z) => {
    const xi = Math.round(x);
    const zi = Math.round(z);
    if (xi < -HALF || xi >= HALF || zi < -HALF || zi >= HALF) return -1;
    return H[idx(xi, zi)];
  };

  // --- Terrain en blocs (2 maillages instanciés : surface + sous-sol) ---
  const count = SIZE * SIZE;
  const top = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), count);
  const under = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), count);
  const M = new THREE.Matrix4();
  const C = new THREE.Color();
  let k = 0;
  for (let z = -HALF; z < HALF; z++) {
    for (let x = -HALF; x < HALF; x++) {
      const h = H[idx(x, z)];
      M.makeTranslation(x, h - 0.5, z);
      top.setMatrixAt(k, M);
      const shade = 0.9 + rand() * 0.15;
      if (h <= 1) C.setHex(0xfde68a);
      else if (h >= 7) C.setHex(0xd1d5db);
      else C.setHex(0x4ade80);
      C.multiplyScalar(shade);
      top.setColorAt(k, C);
      const depth = h + 4;
      M.makeScale(1, depth, 1).setPosition(x, h - 1 - depth / 2, z);
      under.setMatrixAt(k, M);
      C.setHex(h <= 1 ? 0xeab308 : 0x92400e).multiplyScalar(shade * 0.8);
      under.setColorAt(k, C);
      k++;
    }
  }
  [top, under].forEach((m) => { m.receiveShadow = true; m.castShadow = true; m.computeBoundingSphere(); scene.add(m); });

  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER;
  scene.add(water);
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2;
    const r = 30 + rand() * 40;
    scene.add(cloudBlocks(Math.cos(a) * r, 16 + rand() * 10, Math.sin(a) * r, 1 + rand()));
  }

  // --- Objets solides : arbres, maison ---
  const solids = [];
  const freeCell = (minH = 2, maxH = 7) => {
    for (let tries = 0; tries < 500; tries++) {
      const x = Math.floor(rand() * (SIZE - 8)) - HALF + 4;
      const z = Math.floor(rand() * (SIZE - 8)) - HALF + 4;
      const h = hAt(x, z);
      if (h < minH || h > maxH) continue;
      if (Math.abs(x) <= 9 && z >= -8 && z <= 15) continue;
      if (solids.some((b) => Math.abs((b.x0 + b.x1) / 2 - x) < 2.5 && Math.abs((b.z0 + b.z1) / 2 - z) < 2.5)) continue;
      return { x, z, h };
    }
    return { x: 0, z: 0, h: 2 };
  };

  for (let i = 0; i < 34; i++) {
    const c = freeCell(2, 6);
    const tall = 2.5 + Math.round(rand() * 2);
    const trunk = block(c.x, c.h + tall / 2, c.z, 0.8, tall, 0.8, 0x92400e);
    const leafColor = [0x16a34a, 0x22c55e, 0x15803d][i % 3];
    const leaves = block(c.x, c.h + tall + 0.9, c.z, 3, 2, 3, leafColor);
    const tip = block(c.x, c.h + tall + 2.4, c.z, 1.6, 1, 1.6, leafColor);
    scene.add(trunk, leaves, tip);
    solids.push(solidOf(trunk));
    if (i % 4 === 0) {
      [[-0.9, 0.9], [1, -0.6], [0.4, 1.1]].forEach(([dx, dz]) => scene.add(block(c.x + dx, c.h + tall + 0.4, c.z + dz + 0.6, 0.35, 0.35, 0.35, 0xef4444, { plain: true })));
    }
  }
  for (let i = 0; i < 10; i++) {
    const c = freeCell(1, 8);
    const r = block(c.x, c.h + 0.4, c.z, 1.3, 0.8, 1.1, 0x9ca3af);
    scene.add(r);
    solids.push(solidOf(r));
  }
  for (let i = 0; i < 40; i++) {
    const c = freeCell(2, 6);
    const col = [0xf472b6, 0xfde047, 0xffffff, 0xa78bfa][i % 4];
    scene.add(block(c.x, c.h + 0.35, c.z, 0.1, 0.5, 0.1, 0x16a34a, { plain: true, shadow: false }));
    scene.add(block(c.x, c.h + 0.65, c.z, 0.32, 0.22, 0.32, col, { plain: true, shadow: false }));
  }

  // Maison
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
  wall(-1.85, 2.3, 1.9, 0.4);
  wall(1.85, 2.3, 1.9, 0.4);
  wall(0, 2.3, 1.8, 0.4, 1, 2.2);
  const roof1 = block(hx, hy + 3.5, hz, 6.4, 0.6, 5.4, 0xef4444);
  const roof2 = block(hx, hy + 4.1, hz, 4.4, 0.6, 3.8, 0xdc2626);
  const roof3 = block(hx, hy + 4.7, hz, 2.4, 0.6, 2.2, 0xb91c1c);
  scene.add(roof1, roof2, roof3);
  solids.push(solidOf(roof1));
  scene.add(block(hx - 1.5, hy + 1.8, hz + 2.52, 0.9, 0.9, 0.06, 0x7dd3fc, { plain: true }));
  scene.add(block(hx + 1.5, hy + 1.8, hz + 2.52, 0.9, 0.9, 0.06, 0x7dd3fc, { plain: true }));

  const lim = HALF - 1;
  solids.push(
    { x0: -lim - 2, x1: -lim, y0: -10, y1: 40, z0: -lim, z1: lim },
    { x0: lim, x1: lim + 2, y0: -10, y1: 40, z0: -lim, z1: lim },
    { x0: -lim, x1: lim, y0: -10, y1: 40, z0: -lim - 2, z1: -lim },
    { x0: -lim, x1: lim, y0: -10, y1: 40, z0: lim, z1: lim + 2 }
  );

  // --- Gemmes ---
  const GEM_COLORS = [0xef4444, 0x3b82f6, 0x22c55e, 0xa855f7, 0xf59e0b, 0xec4899];
  const gems = [];
  for (let i = 0; i < 12; i++) {
    const c = i < 3 ? freeCell(6, 9) : i < 6 ? freeCell(1, 1) : freeCell(2, 5);
    const g = makeGem(GEM_COLORS[i % GEM_COLORS.length]);
    const base = c.h + 1.1;
    g.position.set(c.x, base, c.z);
    g.userData = { id: `g${i}`, base };
    if (save.gems.includes(g.userData.id)) continue;
    scene.add(g);
    gems.push(g);
  }

  // --- Coffres à calcul ---
  const chests = [];
  for (let i = 0; i < 3; i++) {
    const c = freeCell(2, 6);
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

  // --- Animaux ---
  const animals = ANIMALS.map((a, i) => {
    const c = freeCell(2, 5);
    const g = makeAnimal(a);
    g.position.set(c.x, c.h, c.z);
    scene.add(g);
    return { def: a, g, friend: save.friends.includes(a.id), target: null, wait: rand() * 2, phase: i, slot: 0 };
  });

  // --- Joueur ---
  const P = createPlayer(scene);
  P.stepH = 1.05;
  const startPos = { x: 0, y: 2, z: 5.5 };

  const world = {
    boxesNear(x0, y0, z0, x1, y1, z1) {
      const out = solids.filter((b) => b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1 && b.z1 > z0 && b.z0 < z1);
      for (let z = Math.round(z0); z <= Math.round(z1); z++) {
        for (let x = Math.round(x0); x <= Math.round(x1); x++) {
          const h = hAt(x, z);
          out.push({ x0: x - 0.5, x1: x + 0.5, y0: -6, y1: h, z0: z - 0.5, z1: z + 0.5 });
        }
      }
      return out;
    }
  };

  P.pos.set(startPos.x, startPos.y, startPos.z);
  P.facing = Math.PI;
  cam.yaw = 0;
  cam.pitch = 0.45;
  cam.dist = 9;
  syncAvatar(P, 0);
  followCamera(P, 0, true);

  let friendCount = 0;
  animals.forEach((a) => {
    if (!a.friend) return;
    a.slot = friendCount++;
    a.g.position.set(startPos.x + (a.slot - 2) * 1.5, startPos.y, startPos.z + 2.5);
  });

  const hudText = () => hud(`💎 ${12 - gems.length}/12 · 🐾 ${friendCount}/${ANIMALS.length} · 🎁 ${save.chests.length}/3`);
  hudText();
  speak('Bienvenue sur ton île ! Trouve les gemmes, les coffres et les animaux.');
  toast('🏝️ Trouve 12 gemmes, 3 coffres et 5 animaux !', 3500);

  let finished = 12 - gems.length === 12 && friendCount === ANIMALS.length && save.chests.length === 3;
  function checkAll() {
    if (finished) return;
    if (gems.length === 0 && friendCount === ANIMALS.length && save.chests.length === 3) {
      finished = true;
      speak('Bravo Manel ! Tu as trouvé tous les trésors de l’île !');
      celebrate({
        title: 'Île terminée !',
        text: 'Tu as trouvé toutes les gemmes, tous les coffres et tous les animaux !',
        stars: 3,
        buttons: [['🏝️ Continuer à explorer', () => {}, 'primary'], ['🏠 Menu', onExit]]
      });
    }
  }

  const tmp = new THREE.Vector3();
  function update(dt, t) {
    if (!ui.busy) {
      stepPlayer(P, world, dt);
      if (P.pos.y < -5) { P.pos.set(startPos.x, startPos.y, startPos.z); P.vel.set(0, 0, 0); }
    }
    P.speed = P.pos.y < WATER - 0.2 ? 3.5 : 6;
    syncAvatar(P, dt);
    followCamera(P, dt, false, world);
    followSun(scene, P.pos);
    water.position.y = WATER + Math.sin(t * 1.2) * 0.04;

    const px = P.pos.x;
    const py = P.pos.y + 0.9;
    const pz = P.pos.z;

    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      spinBob(g, t, g.userData.base);
      if (Math.hypot(g.position.x - px, g.position.y - py, g.position.z - pz) < 1.3) {
        scene.remove(g);
        gems.splice(i, 1);
        save.gems.push(g.userData.id);
        persist();
        sfx('gem');
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
          sfx('gem');
          toast('🎁 Le coffre s’ouvre : +3 étoiles !');
          hudText();
          onStars();
          checkAll();
        });
      }
    });

    animals.forEach((a) => {
      const g = a.g;
      let goal = null;
      let speed = 1.6;
      if (a.friend) {
        const ang = P.facing + Math.PI + (a.slot - (friendCount - 1) / 2) * 0.55;
        tmp.set(px + Math.sin(ang) * (2 + a.slot * 0.3), 0, pz + Math.cos(ang) * (2 + a.slot * 0.3));
        if (Math.hypot(tmp.x - g.position.x, tmp.z - g.position.z) > 0.8) goal = tmp;
        speed = 6.5;
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
        if (Math.hypot(g.position.x - px, g.position.z - pz) < 1.7 && Math.abs(g.position.y - P.pos.y) < 1.6) {
          a.friend = true;
          a.slot = friendCount++;
          save.friends.push(a.def.id);
          persist();
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
      const gh = Math.max(hAt(g.position.x, g.position.z), 0);
      g.position.y += (gh - g.position.y) * Math.min(1, 12 * dt);
      const sw = moving ? Math.sin(t * 12 + a.phase) * 0.5 : 0;
      g.userData.legs.forEach((l, i) => { l.rotation.x = i === 0 || i === 3 ? sw : -sw; });
    });
  }

  return { scene, update, player: P, debug: { gems, chests, animals, hAt }, dispose() {} };
}
