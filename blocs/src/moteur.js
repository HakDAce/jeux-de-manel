// ============================================================================
// MONDE DE BLOCS — moteur commun : rendu 3D, personnage, physique, commandes
// ============================================================================
import * as THREE from 'three';

export { THREE };

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------
export const canvas = document.getElementById('scene');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

export const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);

export function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// Scène neuve avec ciel, lumières et ombre qui suit le joueur
export function newScene(sky = 0x8fd3ff, fogFar = 140) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(sky, fogFar * 0.45, fogFar);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b8f5a, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const s = 22;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 90 });
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(sun.target);
  scene.userData.sun = sun;
  return scene;
}

export function followSun(scene, p) {
  const sun = scene.userData.sun;
  if (!sun) return;
  sun.position.set(p.x + 18, p.y + 30, p.z + 12);
  sun.target.position.set(p.x, p.y, p.z);
}

// ---------------------------------------------------------------------------
// Matériaux « briques » (texture à picots claire, teintée par la couleur)
// ---------------------------------------------------------------------------
function makeStudTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(0,0,0,0.10)';
  g.fillRect(0, 0, 64, 3);
  g.fillRect(0, 0, 3, 64);
  g.fillStyle = 'rgba(255,255,255,0.0)';
  g.strokeStyle = 'rgba(0,0,0,0.07)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(33, 33, 14, 0, Math.PI * 2);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const STUD = makeStudTexture();

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = `${color}|${opts.emissive || ''}|${opts.opacity || ''}|${opts.plain ? 1 : 0}`;
  if (!matCache.has(key)) {
    const m = new THREE.MeshLambertMaterial({
      color,
      map: opts.plain ? null : STUD,
      emissive: opts.emissive || 0x000000,
      transparent: !!opts.opacity,
      opacity: opts.opacity || 1
    });
    matCache.set(key, m);
  }
  return matCache.get(key);
}

// Boîte dont la texture se répète à chaque unité (comme des briques)
const geoCache = new Map();
export function boxGeo(w, h, d) {
  const key = `${w}|${h}|${d}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * sizes[f][0], uv.getY(i) * sizes[f][1]);
    }
  }
  geoCache.set(key, g);
  return g;
}

// Bloc centré en (x, y, z)
export function block(x, y, z, w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(boxGeo(w, h, d), opts.material || mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = opts.shadow !== false;
  m.receiveShadow = true;
  return m;
}

// Boîte de collision à partir d'un bloc
export function solidOf(mesh, kind = 'solid') {
  const p = mesh.position;
  const s = mesh.geometry.parameters;
  return {
    x0: p.x - s.width / 2, x1: p.x + s.width / 2,
    y0: p.y - s.height / 2, y1: p.y + s.height / 2,
    z0: p.z - s.depth / 2, z1: p.z + s.depth / 2,
    kind, mesh
  };
}

// Petit nuage en blocs
export function cloudBlocks(x, y, z, s = 1) {
  const g = new THREE.Group();
  const white = mat(0xffffff, { plain: true });
  [[0, 0, 0, 4, 1.2, 2.4], [1.4, 0.7, 0.2, 2.4, 1.2, 2], [-1.2, 0.5, -0.2, 2, 1, 1.8]].forEach(([a, b, c, w, h, d]) => {
    const m = new THREE.Mesh(boxGeo(w * s, h * s, d * s), white);
    m.position.set(a * s, b * s, c * s);
    g.add(m);
  });
  g.position.set(x, y, z);
  return g;
}

// ---------------------------------------------------------------------------
// Sauvegarde
// ---------------------------------------------------------------------------
const SAVE_KEY = 'manel_monde_blocs_v1';
export const save = (() => {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (_) {}
  data.levels = data.levels || {};
  data.gems = data.gems || [];
  data.friends = data.friends || [];
  data.chests = data.chests || [];
  data.outfit = Object.assign({ shirt: '#3b82f6', pants: '#1e3a8a', skin: '#f5c9a0', hair: '#3f2a1d', hat: 'none' }, data.outfit || {});
  data.build = data.build || null;
  return data;
})();
export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {}
}
export function totalStars() {
  let n = save.gems.length + save.chests.length * 3;
  Object.values(save.levels).forEach((l) => { n += (l.coins || 0) + (l.done ? 3 : 0); });
  return n;
}

// ---------------------------------------------------------------------------
// Sons et voix
// ---------------------------------------------------------------------------
let actx = null;
export let soundOn = true;
export function setSound(on) { soundOn = on; }
function tone(freq, dur, type = 'sine', vol = 0.18, delay = 0, slide = 0) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (_) {}
}
export function sfx(name) {
  switch (name) {
    case 'jump': tone(380, 0.16, 'square', 0.07, 0, 300); break;
    case 'coin': tone(988, 0.08, 'square', 0.08); tone(1319, 0.2, 'square', 0.08, 0.08); break;
    case 'gem': [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.14, 'triangle', 0.12, i * 0.07)); break;
    case 'checkpoint': [523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, i * 0.09)); break;
    case 'bounce': tone(220, 0.3, 'sine', 0.2, 0, 500); break;
    case 'fall': tone(500, 0.45, 'sawtooth', 0.07, 0, -380); break;
    case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.15, i * 0.12)); break;
    case 'wrong': tone(200, 0.25, 'square', 0.08); tone(160, 0.3, 'square', 0.08, 0.15); break;
    case 'place': tone(300, 0.07, 'square', 0.07, 0, -120); break;
    case 'remove': tone(180, 0.1, 'triangle', 0.12, 0, -90); break;
    case 'pop': tone(660, 0.07, 'sine', 0.12); break;
    case 'friend': [659, 784, 659, 988].forEach((f, i) => tone(f, 0.13, 'sine', 0.15, i * 0.1)); break;
    default: break;
  }
}
export function speak(text) {
  if (!soundOn || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 0.95;
    u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Interface : message, question, fête
// ---------------------------------------------------------------------------
const toastEl = document.getElementById('toast');
let toastTimer = null;
export function toast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

export const ui = { busy: false };

// Pose une question à choix (calcul) : résout true quand la bonne réponse est touchée
export function askQuestion(title) {
  const q = makeCalc();
  const box = document.getElementById('question');
  box.querySelector('.q-title').textContent = title;
  box.querySelector('.q-calc').textContent = `${q.text} = ?`;
  const answers = box.querySelector('.q-answers');
  answers.innerHTML = '';
  ui.busy = true;
  box.classList.add('show');
  speak(q.say);
  return new Promise((resolve) => {
    q.choices.forEach((c) => {
      const b = document.createElement('button');
      b.textContent = c;
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (c === q.answer) {
          b.classList.add('good');
          sfx('checkpoint');
          speak('Bravo !');
          setTimeout(() => {
            box.classList.remove('show');
            ui.busy = false;
            resolve(true);
          }, 600);
        } else {
          b.classList.add('bad');
          sfx('wrong');
          speak('Essaie encore !');
        }
      });
      answers.appendChild(b);
    });
  });
}

function makeCalc() {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  let a, b, answer, text, say;
  if (Math.random() < 0.6) {
    a = r(1, 10); b = r(1, 10); answer = a + b; text = `${a} + ${b}`; say = `${a} plus ${b}`;
  } else {
    a = r(5, 18); b = r(1, Math.min(9, a)); answer = a - b; text = `${a} − ${b}`; say = `${a} moins ${b}`;
  }
  const set = new Set([answer]);
  while (set.size < 3) {
    const v = answer + r(-3, 3);
    if (v >= 0) set.add(v);
  }
  return { text, say: `Combien font ${say} ?`, answer, choices: [...set].sort(() => Math.random() - 0.5) };
}

export function celebrate({ title, text, stars = 3, buttons }) {
  const box = document.getElementById('celebrate');
  box.querySelector('.c-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
  box.querySelector('.c-title').textContent = title;
  box.querySelector('.c-text').textContent = text;
  const row = box.querySelector('.c-buttons');
  row.innerHTML = '';
  buttons.forEach(([label, fn, cls]) => {
    const b = document.createElement('button');
    b.className = cls || '';
    b.textContent = label;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      box.classList.remove('show');
      ui.busy = false;
      sfx('pop');
      fn();
    });
    row.appendChild(b);
  });
  ui.busy = true;
  box.classList.add('show');
  sfx('win');
}

// ---------------------------------------------------------------------------
// Personnage en blocs
// ---------------------------------------------------------------------------
function faceTexture(skin) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = skin;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#1e1b4b';
  g.fillRect(17, 22, 8, 11);
  g.fillRect(39, 22, 8, 11);
  g.fillStyle = '#ffffff';
  g.fillRect(19, 24, 3, 3);
  g.fillRect(41, 24, 3, 3);
  g.strokeStyle = '#1e1b4b';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(32, 36, 10, 0.25 * Math.PI, 0.75 * Math.PI);
  g.stroke();
  g.fillStyle = 'rgba(244,114,182,0.55)';
  g.fillRect(9, 36, 8, 5);
  g.fillRect(47, 36, 8, 5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

export const HATS = [
  { id: 'none', label: 'Rien', cost: 0 },
  { id: 'cap', label: 'Casquette', cost: 0 },
  { id: 'hair', label: 'Couettes', cost: 0 },
  { id: 'cat', label: 'Oreilles de chat', cost: 10 },
  { id: 'crown', label: 'Couronne', cost: 25 },
  { id: 'dino', label: 'Crête de dino', cost: 40 },
  { id: 'unicorn', label: 'Corne de licorne', cost: 60 }
];
export const SHIRTS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#a855f7', '#14b8a6', '#ffffff', '#1f2937'];
export const PANTS = ['#1e3a8a', '#374151', '#7c2d12', '#be185d', '#065f46', '#f9fafb', '#6d28d9'];
export const SKINS = ['#f5c9a0', '#e8b48a', '#c68b59', '#8d5524', '#5c3a1e'];

export function makeAvatar(o = save.outfit) {
  const root = new THREE.Group();
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const skin = lam(o.skin);
  const shirt = lam(o.shirt);
  const pants = lam(o.pants);
  const part = (w, h, d, m) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.castShadow = true;
    return mesh;
  };
  const pivot = (x, y, z, child, dy) => {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    child.position.y = dy;
    p.add(child);
    root.add(p);
    return p;
  };
  const legL = pivot(-0.16, 0.72, 0, part(0.3, 0.72, 0.32, pants), -0.36);
  const legR = pivot(0.16, 0.72, 0, part(0.3, 0.72, 0.32, pants), -0.36);
  const torso = part(0.66, 0.72, 0.36, shirt);
  torso.position.y = 1.08;
  root.add(torso);
  const armL = pivot(-0.45, 1.4, 0, part(0.24, 0.7, 0.28, skin), -0.3);
  const armR = pivot(0.45, 1.4, 0, part(0.24, 0.7, 0.28, skin), -0.3);
  [armL, armR].forEach((a) => {
    const sleeve = part(0.26, 0.26, 0.3, shirt);
    sleeve.position.y = -0.08;
    a.add(sleeve);
  });
  const headMats = [skin, skin, skin, skin, new THREE.MeshLambertMaterial({ map: faceTexture(o.skin) }), skin];
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMats);
  head.castShadow = true;
  head.position.y = 1.72;
  root.add(head);

  // Cheveux de base
  const hair = lam(o.hair);
  const top = part(0.54, 0.14, 0.54, hair);
  top.position.y = 0.27;
  head.add(top);
  const back = part(0.54, 0.38, 0.1, hair);
  back.position.set(0, 0.06, -0.24);
  head.add(back);

  // Accessoire
  const add = (w, h, d, c, x, y, z, rz = 0) => {
    const m = part(w, h, d, lam(c));
    m.position.set(x, y, z);
    m.rotation.z = rz;
    head.add(m);
    return m;
  };
  switch (o.hat) {
    case 'cap':
      add(0.56, 0.16, 0.56, o.shirt, 0, 0.34, 0);
      add(0.5, 0.06, 0.26, o.shirt, 0, 0.28, 0.36);
      break;
    case 'hair':
      add(0.16, 0.34, 0.16, o.hair, -0.36, 0.08, -0.1);
      add(0.16, 0.34, 0.16, o.hair, 0.36, 0.08, -0.1);
      add(0.1, 0.1, 0.1, '#f472b6', -0.36, 0.28, -0.1);
      add(0.1, 0.1, 0.1, '#f472b6', 0.36, 0.28, -0.1);
      break;
    case 'cat':
      add(0.16, 0.2, 0.08, o.hair, -0.18, 0.42, 0, 0.25);
      add(0.16, 0.2, 0.08, o.hair, 0.18, 0.42, 0, -0.25);
      add(0.08, 0.1, 0.09, '#f9a8d4', -0.18, 0.41, 0.01, 0.25);
      add(0.08, 0.1, 0.09, '#f9a8d4', 0.18, 0.41, 0.01, -0.25);
      break;
    case 'crown':
      add(0.5, 0.12, 0.5, '#facc15', 0, 0.38, 0);
      [-0.18, 0, 0.18].forEach((x) => add(0.1, 0.14, 0.1, '#facc15', x, 0.5, 0.2));
      add(0.08, 0.08, 0.04, '#ef4444', 0, 0.38, 0.26);
      break;
    case 'dino':
      [0.16, 0, -0.16, -0.3].forEach((z, i) => add(0.08, 0.22 - i * 0.03, 0.12, '#22c55e', 0, 0.42 - i * 0.02, z));
      break;
    case 'unicorn': {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 6), lam('#fde047'));
      horn.position.set(0, 0.46, 0.14);
      horn.rotation.x = 0.35;
      head.add(horn);
      add(0.12, 0.14, 0.1, '#f9a8d4', -0.2, 0.36, 0);
      add(0.12, 0.14, 0.1, '#c4b5fd', 0.2, 0.36, 0);
      break;
    }
    default: break;
  }

  root.userData = { legL, legR, armL, armR, head, phase: 0 };
  return root;
}

export function animateAvatar(av, speed, dt, inAir) {
  const u = av.userData;
  if (inAir) {
    u.armL.rotation.x = THREE.MathUtils.lerp(u.armL.rotation.x, -2.6, 0.2);
    u.armR.rotation.x = THREE.MathUtils.lerp(u.armR.rotation.x, -2.6, 0.2);
    u.legL.rotation.x = THREE.MathUtils.lerp(u.legL.rotation.x, 0.4, 0.2);
    u.legR.rotation.x = THREE.MathUtils.lerp(u.legR.rotation.x, -0.3, 0.2);
    return;
  }
  u.phase += dt * speed * 2.2;
  const a = Math.sin(u.phase) * Math.min(1, speed / 5) * 0.9;
  u.legL.rotation.x = a;
  u.legR.rotation.x = -a;
  u.armL.rotation.x = -a;
  u.armR.rotation.x = a;
}

// ---------------------------------------------------------------------------
// Commandes : joystick (moitié gauche), caméra (moitié droite), saut
// ---------------------------------------------------------------------------
export const input = {
  mx: 0, mz: 0,           // joystick (-1..1)
  jumpQueued: 0,          // saut demandé (tampon en secondes)
  scheme: 'play',         // 'play' | 'orbit'
  onTap: null,            // (clientX, clientY) en mode orbite
  onOrbit: null,          // (dx, dy) en mode orbite
  onZoom: null            // (facteur)
};
export const cam = { yaw: 0, pitch: 0.42, dist: 8, target: new THREE.Vector3() };

const touchLayer = document.getElementById('touch');
const stickBase = document.getElementById('stick');
const stickKnob = document.getElementById('stickKnob');
const jumpBtn = document.getElementById('jumpBtn');
const ptrs = new Map();
let stickId = null;
let stickOrigin = null;
let pinchDist = 0;

function setStickVisual(x, y, kx, ky) {
  stickBase.style.left = `${x}px`;
  stickBase.style.top = `${y}px`;
  stickKnob.style.transform = `translate(${kx}px, ${ky}px)`;
}

function resetStick() {
  stickId = null;
  input.mx = 0;
  input.mz = 0;
  stickBase.classList.remove('active');
  stickBase.style.left = '';
  stickBase.style.top = '';
  stickKnob.style.transform = '';
}

function camPointers() {
  return [...ptrs.entries()].filter(([id]) => id !== stickId).map(([, p]) => p);
}

touchLayer.addEventListener('pointerdown', (e) => {
  if (ui.busy) return;
  e.preventDefault();
  try { touchLayer.setPointerCapture(e.pointerId); } catch (_) {}
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() });
  if (input.scheme === 'play' && stickId === null && e.clientX < window.innerWidth * 0.45) {
    stickId = e.pointerId;
    stickOrigin = { x: e.clientX, y: e.clientY };
    stickBase.classList.add('active');
    setStickVisual(e.clientX, e.clientY, 0, 0);
  }
  const cp = camPointers();
  if (cp.length === 2) pinchDist = Math.hypot(cp[0].x - cp[1].x, cp[0].y - cp[1].y);
});

touchLayer.addEventListener('pointermove', (e) => {
  const p = ptrs.get(e.pointerId);
  if (!p) return;
  e.preventDefault();
  const dx = e.clientX - p.x;
  const dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (e.pointerId === stickId) {
    const R = 55;
    let kx = e.clientX - stickOrigin.x;
    let ky = e.clientY - stickOrigin.y;
    const l = Math.hypot(kx, ky);
    if (l > R) { kx = (kx / l) * R; ky = (ky / l) * R; }
    input.mx = kx / R;
    input.mz = ky / R;
    setStickVisual(stickOrigin.x, stickOrigin.y, kx, ky);
    return;
  }
  const cp = camPointers();
  if (cp.length >= 2) {
    const d = Math.hypot(cp[0].x - cp[1].x, cp[0].y - cp[1].y);
    if (pinchDist > 0) {
      const f = pinchDist / Math.max(20, d);
      if (input.scheme === 'orbit' && input.onZoom) input.onZoom(f);
      else cam.dist = THREE.MathUtils.clamp(cam.dist * f, 4, 16);
    }
    pinchDist = d;
    p.moved = true;
    return;
  }
  if (Math.abs(e.clientX - p.x0) + Math.abs(e.clientY - p.y0) > 10) p.moved = true;
  if (input.scheme === 'orbit' && input.onOrbit) input.onOrbit(dx, dy);
  else {
    cam.yaw -= dx * 0.008;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.005, 0.05, 1.25);
  }
});

function endPtr(e) {
  const p = ptrs.get(e.pointerId);
  ptrs.delete(e.pointerId);
  if (e.pointerId === stickId) resetStick();
  if (camPointers().length < 2) pinchDist = 0;
  if (p && !p.moved && input.scheme === 'orbit' && input.onTap && e.type === 'pointerup' && performance.now() - p.t0 < 600 && ptrs.size === 0) {
    input.onTap(e.clientX, e.clientY);
  }
}
touchLayer.addEventListener('pointerup', endPtr);
touchLayer.addEventListener('pointercancel', endPtr);
touchLayer.addEventListener('wheel', (e) => {
  e.preventDefault();
  const f = e.deltaY > 0 ? 1.1 : 0.9;
  if (input.scheme === 'orbit' && input.onZoom) input.onZoom(f);
  else cam.dist = THREE.MathUtils.clamp(cam.dist * f, 4, 16);
}, { passive: false });

jumpBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  input.jumpQueued = 0.15;
  jumpBtn.classList.add('pressed');
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => jumpBtn.addEventListener(t, () => jumpBtn.classList.remove('pressed')));

// Clavier (pour jouer aussi sur ordinateur)
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (ui.busy) return;
  keys.add(e.code);
  if (e.code === 'Space') { input.jumpQueued = 0.15; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
export function readKeyboard(dt) {
  if (stickId !== null) return;
  let x = 0;
  let z = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) z -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) z += 1;
  if (keys.has('KeyQ')) cam.yaw += dt * 2;
  if (keys.has('KeyE')) cam.yaw -= dt * 2;
  const l = Math.hypot(x, z) || 1;
  input.mx = x / l;
  input.mz = z / l;
}

export function resetInput() {
  ptrs.clear();
  resetStick();
  input.jumpQueued = 0;
  keys.clear();
}

// ---------------------------------------------------------------------------
// Joueur : déplacement et collisions (boîtes alignées)
// ---------------------------------------------------------------------------
const R = 0.32;    // demi-largeur
const HGT = 1.9;   // hauteur
const EPS = 1e-4;

export function createPlayer(scene) {
  const avatar = makeAvatar();
  scene.add(avatar);
  return {
    avatar,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    facing: 0,
    onGround: false,
    ground: null,
    coyote: 0,
    speed: 6,
    jumpV: 9.6,
    stepH: 0.4,
    dead: false
  };
}

export function rebuildAvatar(player, scene) {
  const old = player.avatar;
  player.avatar = makeAvatar();
  player.avatar.position.copy(old.position);
  player.avatar.rotation.copy(old.rotation);
  scene.remove(old);
  scene.add(player.avatar);
}

function overlaps(px, py, pz, b) {
  return px - R < b.x1 - EPS && px + R > b.x0 + EPS &&
    py < b.y1 - EPS && py + HGT > b.y0 + EPS &&
    pz - R < b.z1 - EPS && pz + R > b.z0 + EPS;
}

// world.boxesNear(x0, y0, z0, x1, y1, z1) -> liste de boîtes solides
export function stepPlayer(P, world, dt) {
  // Direction voulue, relative à la caméra
  const fx = -Math.sin(cam.yaw);
  const fz = -Math.cos(cam.yaw);
  // avant = (fx, fz), droite = (-fz, fx)
  const wx = fx * -input.mz + -fz * input.mx;
  const wz = fz * -input.mz + fx * input.mx;
  const mag = Math.min(1, Math.hypot(wx, wz));
  const tx = wx * P.speed;
  const tz = wz * P.speed;
  const acc = P.onGround ? 14 : 7;
  P.vel.x += (tx - P.vel.x) * Math.min(1, acc * dt);
  P.vel.z += (tz - P.vel.z) * Math.min(1, acc * dt);
  if (mag > 0.1) {
    const want = Math.atan2(wx, wz);
    let d = want - P.facing;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    P.facing += d * Math.min(1, 12 * dt);
  }

  // Saut
  input.jumpQueued = Math.max(0, input.jumpQueued - dt);
  P.coyote = P.onGround ? 0.12 : Math.max(0, P.coyote - dt);
  if (input.jumpQueued > 0 && P.coyote > 0) {
    P.vel.y = P.jumpV;
    P.coyote = 0;
    input.jumpQueued = 0;
    P.onGround = false;
    sfx('jump');
  }

  // Plateforme mobile : on suit son déplacement
  if (P.onGround && P.ground && P.ground.delta) {
    P.pos.x += P.ground.delta.x;
    P.pos.y += P.ground.delta.y;
    P.pos.z += P.ground.delta.z;
  }

  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  for (let s = 0; s < n; s++) substep(P, world, h);
}

function substep(P, world, h) {
  P.vel.y = Math.max(-28, P.vel.y - 26 * h);
  const p = P.pos;
  const boxes = world.boxesNear(p.x - 2, p.y - 2, p.z - 2, p.x + 2, p.y + HGT + 2, p.z + 2);
  const wasGround = P.onGround;

  // Axe X puis Z (avec petite marche automatique)
  for (const axis of ['x', 'z']) {
    const v = P.vel[axis] * h;
    if (!v) continue;
    p[axis] += v;
    for (const b of boxes) {
      if (!overlaps(p.x, p.y, p.z, b)) continue;
      const up = b.y1 - p.y;
      if (wasGround && up > 0 && up <= P.stepH && !boxes.some((o) => o !== b && overlaps(p.x, b.y1 + EPS, p.z, o))) {
        p.y = b.y1 + EPS;
        continue;
      }
      if (axis === 'x') p.x = v > 0 ? b.x0 - R - EPS : b.x1 + R + EPS;
      else p.z = v > 0 ? b.z0 - R - EPS : b.z1 + R + EPS;
      P.vel[axis] = 0;
    }
  }

  // Axe Y
  p.y += P.vel.y * h;
  P.onGround = false;
  for (const b of boxes) {
    if (!overlaps(p.x, p.y, p.z, b)) continue;
    if (P.vel.y <= 0) {
      p.y = b.y1;
      P.onGround = true;
      P.ground = b;
      P.vel.y = 0;
      if (b.kind === 'bounce') {
        P.vel.y = 17;
        P.onGround = false;
        sfx('bounce');
      }
    } else {
      p.y = b.y0 - HGT - EPS;
      P.vel.y = 0;
    }
  }
  if (!P.onGround) {
    // Toujours posé ? (petit test juste en dessous)
    for (const b of boxes) {
      if (P.vel.y <= 0 && overlaps(p.x, p.y - 0.02, p.z, b) && b.y1 <= p.y + 0.021) {
        P.onGround = true;
        P.ground = b;
        break;
      }
    }
  }
  if (!P.onGround) P.ground = null;
}

export function syncAvatar(P, dt) {
  P.avatar.position.copy(P.pos);
  P.avatar.rotation.y = P.facing;
  animateAvatar(P.avatar, Math.hypot(P.vel.x, P.vel.z), dt, !P.onGround);
}

// Caméra qui suit le joueur (vue à la 3e personne).
// Si un mur ou une colline est entre la caméra et le joueur, la caméra se rapproche.
let camDistNow = 8;
export function followCamera(P, dt, snap = false, world = null) {
  const goal = new THREE.Vector3(P.pos.x, P.pos.y + 1.5, P.pos.z);
  if (snap) cam.target.copy(goal);
  else cam.target.lerp(goal, Math.min(1, 10 * dt));
  const cp = Math.cos(cam.pitch);
  const dir = new THREE.Vector3(Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp);
  let dist = cam.dist;
  if (world) {
    const tg = cam.target;
    const boxes = world.boxesNear(
      tg.x - cam.dist - 1, tg.y - 2, tg.z - cam.dist - 1,
      tg.x + cam.dist + 1, tg.y + cam.dist + 1, tg.z + cam.dist + 1
    );
    const inside = (x, y, z) => boxes.some((b) => x > b.x0 - 0.2 && x < b.x1 + 0.2 && y > b.y0 - 0.2 && y < b.y1 + 0.2 && z > b.z0 - 0.2 && z < b.z1 + 0.2);
    for (let d = 1; d <= cam.dist; d += 0.35) {
      if (inside(tg.x + dir.x * d, tg.y + dir.y * d, tg.z + dir.z * d)) { dist = Math.max(1.2, d - 0.5); break; }
    }
  }
  camDistNow = snap || dist < camDistNow ? dist : camDistNow + (dist - camDistNow) * Math.min(1, 4 * dt);
  camera.position.copy(cam.target).addScaledVector(dir, camDistNow);
  camera.lookAt(cam.target);
}

export function showPlayControls(on) {
  document.body.classList.toggle('playing', on);
}

// Petit objet qui tourne et flotte (pièce, gemme)
export function spinBob(obj, t, base) {
  obj.rotation.y = t * 2.2;
  obj.position.y = base + Math.sin(t * 3 + obj.position.x) * 0.15;
}
