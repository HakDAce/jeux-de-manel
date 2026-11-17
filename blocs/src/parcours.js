// ============================================================================
// MODE PARCOURS (obby) : sauter de plateforme en plateforme jusqu'au drapeau
// ============================================================================
import {
  THREE, newScene, followSun, block, solidOf, mat, cloudBlocks, save, persist,
  createPlayer, stepPlayer, syncAvatar, followCamera, cam, input, sfx, speak,
  toast, askQuestion, celebrate, spinBob, ui
} from './moteur.js';

// ---------------------------------------------------------------------------
// Les niveaux : chaque étape est relative à la précédente
// [dx, dy, dz, largeur, profondeur, options]
// options : coin, cp (point de sauvegarde), finish, bounce (trampoline),
//           lava (brûlant), move: [axe, amplitude, vitesse], gate (porte à calcul)
// ---------------------------------------------------------------------------
export const LEVELS = [
  {
    name: 'Premiers sauts', emoji: '🌱', sky: 0x8fd3ff, colors: [0x4ade80, 0x22c55e, 0x86efac],
    steps: [
      [0, 0, -6, 3, 3, { coin: 1 }],
      [0, 0.5, -4.5, 3, 3, { coin: 1 }],
      [2.5, 0.5, -4, 3, 3, {}],
      [0, 1, -4.5, 3, 3, { coin: 1 }],
      [-2.5, 0, -4, 3, 3, {}],
      [0, 0, -5.5, 5, 5, { cp: 1 }],
      [0, 1, -5, 3, 3, { coin: 1 }],
      [0, 0, -4.5, 2.5, 2.5, {}],
      [2, 1, -4, 2.5, 2.5, { coin: 1 }],
      [0, 0, -4.5, 3, 3, {}],
      [0, 0, -6, 6, 6, { finish: 1 }]
    ]
  },
  {
    name: 'Escaliers et trampolines', emoji: '🪜', sky: 0x9ee6ff, colors: [0x60a5fa, 0x3b82f6, 0x93c5fd],
    steps: [
      [0, 0.8, -4.5, 3, 2, { coin: 1 }],
      [0, 0.8, -2.5, 3, 2, {}],
      [0, 0.8, -2.5, 3, 2, {}],
      [0, 0.8, -2.5, 3, 2, { coin: 1 }],
      [0, 0, -4, 4, 4, { cp: 1 }],
      [0, 0, -4.5, 3, 3, { bounce: 1 }],
      [0, 5, -5, 4, 4, { coin: 1 }],
      [0, 0, -5, 1.4, 6, {}],
      [0, 0, -5.5, 4, 4, { cp: 1 }],
      [3.5, -1, 0, 2.5, 2.5, { coin: 1 }],
      [3.5, -1, 0, 2.5, 2.5, {}],
      [0, 0, -4.5, 3, 3, { bounce: 1 }],
      [0, 4.5, -5, 3, 3, { coin: 1 }],
      [-4, 0, -2, 1.4, 1.4, {}],
      [-3, 0, -3, 3, 3, {}],
      [0, 0, -5.5, 6, 6, { finish: 1 }]
    ]
  },
  {
    name: 'Plateformes qui bougent', emoji: '🌋', sky: 0xffc89e, lavaSea: true, colors: [0xa78bfa, 0x8b5cf6, 0xc4b5fd],
    steps: [
      [0, 0, -5.5, 3, 3, { coin: 1 }],
      [0, 0, -5.5, 3, 3, { move: ['x', 3, 0.8] }],
      [0, 0, -5.5, 4, 4, { cp: 1 }],
      [0, 0, -5, 2.5, 2.5, { coin: 1 }],
      [0, 0, -4.5, 3, 3, { move: ['y', 1.5, 0.9] }],
      [0, 1.5, -5, 3, 3, {}],
      [0, 0, -5.5, 3, 3, { move: ['x', 3.5, 0.7], coin: 1 }],
      [0, 0, -5.5, 4, 4, { cp: 1 }],
      [0, 0, -4, 5, 2, { lava: 1 }],
      [0, 0, -3, 4, 2.5, { coin: 1 }],
      [0, 0, -5, 3, 3, { move: ['z', 1.5, 0.8] }],
      [0, 0, -5.5, 3, 3, { move: ['x', 3, 1] }],
      [0, 0, -5.5, 6, 6, { finish: 1 }]
    ]
  },
  {
    name: 'Portes magiques', emoji: '🔢', sky: 0xbfe9ff, colors: [0xfb923c, 0xf97316, 0xfdba74],
    steps: [
      [0, 0, -5.5, 4, 4, { coin: 1 }],
      [0, 0, -5, 4, 5, { gate: 1 }],
      [0, 0, -5.5, 3, 3, {}],
      [3, 1, -3, 2.5, 2.5, { coin: 1 }],
      [-3, 1, -3, 2.5, 2.5, {}],
      [3, 1, -3, 2.5, 2.5, { coin: 1 }],
      [0, 0, -4.5, 4, 4, { cp: 1 }],
      [0, 0, -4, 1.2, 4, {}],
      [0, 0, -4, 1.2, 4, { coin: 1 }],
      [0, 0, -4.5, 4, 5, { gate: 1 }],
      [0, 0, -5, 3, 3, { bounce: 1 }],
      [0, 4.5, -5, 4, 4, { coin: 1 }],
      [0, 0, -4.5, 4, 2, { lava: 1 }],
      [0, 0, -3, 4, 3, { cp: 1 }],
      [0, 0, -5.5, 6, 6, { finish: 1 }]
    ]
  },
  {
    name: 'Château dans les nuages', emoji: '🏰', sky: 0xd8c8ff, lavaSea: false, colors: [0xf472b6, 0xec4899, 0xf9a8d4],
    steps: [
      [0, 0.5, -5, 3, 3, { coin: 1 }],
      [0, 0, -5.5, 3, 3, { move: ['x', 3, 0.8] }],
      [0, 0, -5.5, 4, 4, { cp: 1 }],
      [0, 0, -4.5, 3, 3, { bounce: 1 }],
      [0, 5, -5, 3, 3, { coin: 1 }],
      [0, 0, -4, 1.2, 4, {}],
      [0, 0, -4.5, 4, 5, { gate: 1 }],
      [0, 0, -5.5, 3, 3, { move: ['y', 1.6, 0.8] }],
      [0, 1.6, -5, 3, 3, { coin: 1 }],
      [0, 0, -5, 4, 4, { cp: 1 }],
      [3, 0.8, -3, 2.5, 2.5, {}],
      [-3, 0.8, -3, 2.5, 2.5, { coin: 1 }],
      [3, 0.8, -3, 2.5, 2.5, {}],
      [0, 0, -5.5, 3, 3, { move: ['x', 3.5, 0.9], coin: 1 }],
      [0, 0, -5.5, 4, 5, { gate: 1 }],
      [0, 0, -6, 7, 7, { finish: 1, castle: 1 }]
    ]
  },
  {
    name: 'Lune Magique (Sauts géants)', emoji: '🌙', sky: 0x0f172a, lowGravity: true, colors: [0x38bdf8, 0x818cf8, 0xc084fc],
    steps: [
      [0, 1.5, -7, 3.5, 3.5, { coin: 1 }],
      [2.5, 2, -7.5, 3, 3, { coin: 1 }],
      [-2.5, 2, -7.5, 3, 3, {}],
      [0, 0, -7, 4.5, 4.5, { cp: 1 }],
      [0, 1.5, -7.5, 3, 3, { move: ['x', 3.5, 0.8], coin: 1 }],
      [0, 2, -8, 3, 3, {}],
      [0, 0, -6.5, 4, 5, { gate: 1 }],
      [0, 0, -6, 3, 3, { bounce: 1 }],
      [0, 6.5, -8, 3.5, 3.5, { coin: 1 }],
      [0, 0, -7, 4.5, 4.5, { cp: 1 }],
      [3.5, 1.5, -6.5, 3, 3, { coin: 1 }],
      [-3.5, 1.5, -6.5, 3, 3, {}],
      [0, 2, -8, 7, 7, { finish: 1, castle: 1 }]
    ]
  },
  {
    name: 'Bateau Pirate', emoji: '🏴‍☠️', sky: 0x38bdf8, lavaSea: false, colors: [0xb45309, 0x92400e, 0xd97706],
    steps: [
      [0, 0, -5.5, 4, 6, { coin: 1 }],
      [0, 0.5, -5.5, 2, 5, {}],
      [0, 0.5, -5.5, 5, 5, { cp: 1 }],
      [0, 0, -5, 3, 3, { bounce: 1 }],
      [0, 4.5, -5.5, 4, 6, { coin: 1 }],
      [0, 0, -5.5, 3, 3, { move: ['x', 3.5, 0.85], coin: 1 }],
      [0, 0, -5.5, 4, 5, { gate: 1 }],
      [0, 0, -5.5, 4.5, 4.5, { cp: 1 }],
      [3, 0.8, -4, 3, 3, { coin: 1 }],
      [-3, 0.8, -4, 3, 3, {}],
      [0, 0.8, -5, 3, 3, { bounce: 1 }],
      [0, 4.8, -5.5, 4, 5, { gate: 1 }],
      [0, 0, -6, 7, 7, { finish: 1, castle: 1 }]
    ]
  }
];

const GOLD = 0xfacc15;

export function startParcours(levelIdx, { onExit, onNext, hud }) {
  const L = LEVELS[levelIdx];
  const scene = newScene(L.sky, 120);
  const solids = [];
  const movers = [];
  const coins = [];
  const gates = [];
  const checkpoints = [];
  let finishBox = null;

  // --- Construction du niveau ---
  const cur = new THREE.Vector3(0, 0, 0);
  const addPlat = (x, top, z, w, d, color, kind = 'solid') => {
    const m = block(x, top - 0.3, z, w, 0.6, d, color, kind === 'lava' ? { emissive: 0x9a3412 } : {});
    scene.add(m);
    const b = solidOf(m, kind);
    solids.push(b);
    return b;
  };

  // Départ
  const start = addPlat(0, 0, 0, 6, 6, 0xe5e7eb);

  let lastCp = { x: 0, y: 0, z: 0 };
  checkpoints.push({ box: start, pos: { x: 0, y: 0, z: 0 }, on: true });

  L.steps.forEach(([dx, dy, dz, w, d, o], i) => {
    cur.x += dx;
    cur.y += dy;
    cur.z += dz;
    const color = o.finish ? 0xfde047 : o.cp ? 0xe5e7eb : o.bounce ? 0x22d3ee : o.lava ? 0xf97316 : L.colors[i % L.colors.length];
    const kind = o.bounce ? 'bounce' : o.lava ? 'lava' : 'solid';
    const b = addPlat(cur.x, cur.y, cur.z, w, d, color, kind);

    if (o.bounce) {
      const spring = block(cur.x, cur.y + 0.08, cur.z, w * 0.7, 0.16, d * 0.7, 0x0891b2, { plain: true });
      scene.add(spring);
    }
    if (o.lava) {
      // bords praticables avant et après la lave
      addPlat(cur.x, cur.y, cur.z + d / 2 + 0.6, w, 1.2, L.colors[0]);
    }
    if (o.move) {
      const [axis, range, speed] = o.move;
      movers.push({ box: b, mesh: b.mesh, base: cur.clone(), axis, range, speed, phase: i, delta: new THREE.Vector3() });
      b.delta = new THREE.Vector3();
    }
    if (o.coin) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 20), new THREE.MeshLambertMaterial({ color: GOLD, emissive: 0x7c5a00 }));
      c.rotation.x = Math.PI / 2;
      const holder = new THREE.Group();
      holder.add(c);
      holder.position.set(cur.x, cur.y + 1.3, cur.z);
      holder.userData = { base: cur.y + 1.3, mover: o.move ? movers[movers.length - 1] : null, taken: false };
      scene.add(holder);
      coins.push(holder);
    }
    if (o.cp) {
      const pad = block(cur.x, cur.y + 0.06, cur.z, 1.6, 0.12, 1.6, 0x9ca3af, { plain: true });
      scene.add(pad);
      const pole = block(cur.x + w / 2 - 0.4, cur.y + 1.25, cur.z, 0.12, 2.5, 0.12, 0xffffff, { plain: true });
      const flag = block(cur.x + w / 2 - 0.4 - 0.45, cur.y + 2.2, cur.z, 0.8, 0.5, 0.06, 0x9ca3af, { plain: true });
      scene.add(pole, flag);
      checkpoints.push({ box: b, pos: { x: cur.x, y: cur.y, z: cur.z }, on: false, pad, flag });
    }
    if (o.gate) {
      const wall = block(cur.x, cur.y + 2.5, cur.z - d / 2 + 0.3, w + 2, 5, 0.6, 0x6366f1, { emissive: 0x1e1b4b });
      scene.add(wall);
      const sb = solidOf(wall);
      solids.push(sb);
      const q = makeLabel('?', '#ffffff', '#4338ca');
      q.position.set(cur.x, cur.y + 2.6, cur.z - d / 2 + 0.62);
      scene.add(q);
      gates.push({ wall, box: sb, label: q, open: false, asking: false, z: cur.z - d / 2 });
    }
    if (o.finish) {
      finishBox = b;
      const arch = new THREE.Group();
      [[-w / 2 + 0.4], [w / 2 - 0.4]].forEach(([x]) => arch.add(block(x, 2, 0, 0.5, 4, 0.5, 0xffffff)));
      arch.add(block(0, 4.2, 0, w, 0.5, 0.5, 0xef4444));
      const banner = makeLabel('🏁 ARRIVÉE', '#1e1b4b', '#fde047', 4.5, 1);
      banner.position.set(0, 4.2, 0.3);
      arch.add(banner);
      arch.position.set(cur.x, cur.y, cur.z - d / 2 + 0.6);
      scene.add(arch);
      if (o.castle) {
        const cz = cur.z - d / 2 - 2.5;
        const base = block(cur.x, cur.y - 0.3, cz, 9, 0.6, 5, 0xf9a8d4);
        const body = block(cur.x, cur.y + 3, cz, 6, 6, 3, 0xfbcfe8);
        scene.add(base, body);
        solids.push(solidOf(base), solidOf(body));
        [-3.4, 3.4].forEach((x) => {
          const tower = block(cur.x + x, cur.y + 4.5, cz, 1.8, 9, 1.8, 0xf472b6);
          scene.add(tower);
          solids.push(solidOf(tower));
          const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 4), mat(0x8b5cf6, { plain: true }));
          roof.position.set(cur.x + x, cur.y + 10.2, cz);
          roof.rotation.y = Math.PI / 4;
          scene.add(roof);
        });
        scene.add(block(cur.x, cur.y + 1.4, cz + 1.55, 1.6, 2.8, 0.1, 0x7c2d12, { plain: true }));
      }
    }
  });

  // Décor : nuages et mer de lave ou de nuages
  for (let i = 0; i < 26; i++) {
    const z = 10 - Math.random() * (Math.abs(cur.z) + 40);
    const x = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 30);
    scene.add(cloudBlocks(x, -4 + Math.random() * 22, z, 0.8 + Math.random() * 1.2));
  }
  const seaY = L.lavaSea ? -5 : -9;
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshLambertMaterial({ color: L.lavaSea ? 0xf97316 : 0xbfdbfe, emissive: L.lavaSea ? 0xc2410c : 0x3b82f6, emissiveIntensity: L.lavaSea ? 1 : 0.25 })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, seaY, cur.z / 2);
  scene.add(sea);
  const killY = seaY + (L.lavaSea ? 0.5 : 2);

  // --- Joueur ---
  const P = createPlayer(scene);
  P.stepH = 0.35;
  if (L.lowGravity) {
    P.gravity = 13;
    P.jumpV = 10.6;
  }
  const world = {
    boxesNear(x0, y0, z0, x1, y1, z1) {
      return solids.filter((b) => b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1 && b.z1 > z0 && b.z0 < z1);
    }
  };

  let respawnPt = lastCp;
  function respawn(first) {
    P.pos.set(respawnPt.x, respawnPt.y + 0.05, respawnPt.z);
    P.vel.set(0, 0, 0);
    P.facing = Math.PI;
    if (first) {
      cam.yaw = 0;
      cam.pitch = 0.42;
      cam.dist = 8;
    }
    syncAvatar(P, 0);
    followCamera(P, 0, true);
  }
  respawn(true);

  let got = 0;
  let falls = 0;
  let won = false;
  let flash = 0;
  const totalCoins = coins.length;

  const updateHud = () => hud(`${L.emoji} Niveau ${levelIdx + 1} · 🪙 ${got}/${totalCoins}`);
  updateHud();
  speak(`Niveau ${levelIdx + 1}. ${L.name}. Va jusqu'au drapeau d'arrivée !`);
  toast(`${L.emoji} ${L.name} : va jusqu'à l'arrivée !`, 3000);

  function die() {
    falls++;
    sfx('fall');
    flash = 1;
    respawn(false);
    if (falls === 3) toast('💡 Astuce : saute juste avant le bord !', 3000);
  }

  function win() {
    won = true;
    const prev = save.levels[levelIdx + 1] || {};
    save.levels[levelIdx + 1] = { done: true, coins: Math.max(prev.coins || 0, got) };
    persist();
    const stars = 1 + (got >= totalCoins / 2 ? 1 : 0) + (got === totalCoins ? 1 : 0);
    speak('Bravo Manel ! Tu as réussi le niveau !');
    const buttons = [];
    if (levelIdx + 1 < LEVELS.length) buttons.push(['▶️ Niveau suivant', () => onNext(levelIdx + 1), 'primary']);
    buttons.push(['🔁 Rejouer', () => onNext(levelIdx)]);
    buttons.push(['🏠 Menu', onExit]);
    celebrate({ title: 'Bravo !', text: `Niveau ${levelIdx + 1} réussi avec ${got} pièce${got > 1 ? 's' : ''} sur ${totalCoins} !`, stars, buttons });
  }

  // --- Boucle ---
  function update(dt, t) {
    // Plateformes mobiles
    movers.forEach((m) => {
      const old = m.mesh.position.clone();
      const off = Math.sin(t * m.speed + m.phase) * m.range;
      const np = m.base.clone();
      np[m.axis] += off;
      np.y -= 0.3;
      m.mesh.position.copy(np);
      const dlt = np.clone().sub(old);
      m.box.delta.copy(dlt);
      m.box.x0 += dlt.x; m.box.x1 += dlt.x;
      m.box.y0 += dlt.y; m.box.y1 += dlt.y;
      m.box.z0 += dlt.z; m.box.z1 += dlt.z;
    });

    if (!ui.busy && !won) {
      stepPlayer(P, world, dt);
      if (P.pos.y < killY || (P.onGround && P.ground && P.ground.kind === 'lava')) die();
    }
    syncAvatar(P, dt);
    followCamera(P, dt, false, world);
    followSun(scene, P.pos);

    const cx = P.pos.x;
    const cy = P.pos.y + 0.9;
    const cz = P.pos.z;

    coins.forEach((c) => {
      if (c.userData.taken) return;
      if (c.userData.mover) {
        const mp = c.userData.mover.mesh.position;
        c.position.x = mp.x;
        c.position.z = mp.z;
        c.userData.base = mp.y + 0.3 + 1.3;
      }
      spinBob(c, t, c.userData.base);
      if (Math.hypot(c.position.x - cx, c.position.y - cy, c.position.z - cz) < 1.2) {
        c.userData.taken = true;
        c.visible = false;
        got++;
        sfx('coin');
        updateHud();
      }
    });

    checkpoints.forEach((cp) => {
      if (cp.on || !P.onGround || P.ground !== cp.box) return;
      checkpoints.forEach((o) => { o.on = false; });
      cp.on = true;
      respawnPt = cp.pos;
      cp.pad.material = mat(0x22c55e, { plain: true });
      cp.flag.material = mat(0x22c55e, { plain: true });
      sfx('checkpoint');
      toast('🚩 Point de sauvegarde !');
    });

    gates.forEach((g) => {
      if (g.open) {
        if (g.wall.position.y > -6) {
          g.wall.position.y -= dt * 6;
          g.label.position.y -= dt * 6;
        }
        return;
      }
      if (!g.asking && Math.abs(P.pos.z - g.z) < 1.6 && Math.abs(P.pos.x - g.wall.position.x) < 4 && P.pos.y > g.box.y0 - 1) {
        g.asking = true;
        input.mx = 0;
        input.mz = 0;
        P.vel.set(0, 0, 0);
        askQuestion('🔒 Porte magique : trouve la réponse !').then(() => {
          g.open = true;
          solids.splice(solids.indexOf(g.box), 1);
          toast('🔓 La porte s’ouvre !');
        });
      }
    });

    if (!won && finishBox && P.onGround && P.ground === finishBox) win();

    if (flash > 0) {
      flash = Math.max(0, flash - dt * 2.5);
      document.getElementById('flash').style.opacity = String(flash * 0.6);
    }
  }

  return {
    scene,
    update,
    player: P,
    debug: { finishBox, gates, checkpoints, coins },
    dispose() {
      document.getElementById('flash').style.opacity = '0';
    }
  };
}

// Panneau de texte (sprite plat)
export function makeLabel(text, color, bg, w = 1.6, h = 1.2) {
  const c = document.createElement('canvas');
  c.width = Math.round(128 * (w / h));
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = color;
  g.font = '900 86px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 4, c.width - 16);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
  return m;
}
