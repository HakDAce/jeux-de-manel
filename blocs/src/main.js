// ============================================================================
// MONDE DE BLOCS — menu, écrans et boucle de jeu
// ============================================================================
import {
  THREE, renderer, camera, newScene, block, save, persist, totalStars, makeAvatar,
  sfx, speak, toast, input, readKeyboard, resetInput, showPlayControls, setSound, soundOn,
  HATS, SHIRTS, PANTS, SKINS, ui, cloudBlocks
} from './moteur.js';
import { startParcours, LEVELS } from './parcours.js';
import { startMonde } from './monde.js';
import { startConstruction } from './construction.js';

const $ = (id) => document.getElementById(id);
const hudEl = $('hudText');
const hud = (txt) => { hudEl.textContent = txt; };

// ---------------------------------------------------------------------------
// Scène du menu : le personnage sur un podium
// ---------------------------------------------------------------------------
function makeMenuScene() {
  const scene = newScene(0x9fdcff, 80);
  const ground = block(0, -0.5, 0, 40, 1, 40, 0x86efac);
  scene.add(ground);
  scene.add(block(0, 0.25, 0, 3, 0.5, 3, 0xfde047));
  [[-6, -6], [6, -7], [-8, 2], [8, 3]].forEach(([x, z], i) => {
    scene.add(block(x, 1.5, z, 0.8, 3, 0.8, 0x92400e));
    scene.add(block(x, 3.6, z, 3, 2, 3, [0x22c55e, 0x16a34a][i % 2]));
  });
  scene.add(cloudBlocks(-7, 9, -12, 1.4), cloudBlocks(8, 11, -14, 1.2));
  let avatar = makeAvatar();
  avatar.position.y = 0.5;
  scene.add(avatar);
  return {
    scene,
    refresh() {
      scene.remove(avatar);
      avatar = makeAvatar();
      avatar.position.y = 0.5;
      scene.add(avatar);
    },
    update(dt, t) {
      avatar.rotation.y = Math.sin(t * 0.6) * 0.7;
      avatar.userData.armR.rotation.x = -0.4 + Math.sin(t * 3) * 0.4;
      const wide = window.innerWidth > window.innerHeight;
      camera.position.set(wide ? -2.2 : 0, 2.2, 5.6);
      camera.lookAt(wide ? -2.2 : 0, 1.3, 0);
      // personnage décalé à droite sur grand écran (le menu est à gauche)
      avatar.position.x = wide ? 0.4 : 0;
      avatar.position.z = wide ? 0 : -1.5;
      avatar.position.y = 0.5;
    }
  };
}

const menu = makeMenuScene();
let current = menu;
let screen = 'menu';

function showScreen(name) {
  screen = name;
  ['menu', 'levels', 'perso'].forEach((s) => $(s).classList.toggle('show', s === name));
  document.body.classList.toggle('in-game', name === 'game');
  showPlayControls(name === 'game');
  if (name !== 'game') {
    if (current !== menu && current.dispose) current.dispose();
    current = menu;
    resetInput();
    input.scheme = 'play';
  }
  refreshStars();
}

function refreshStars() {
  document.querySelectorAll('.star-total').forEach((el) => { el.textContent = `⭐ ${totalStars()}`; });
}

function startGame(make) {
  sfx('pop');
  if (current !== menu && current.dispose) current.dispose();
  resetInput();
  input.scheme = 'play';
  showScreen('game');
  current = make();
}

// ---------------------------------------------------------------------------
// Récompenses : chapeaux débloqués avec les étoiles
// ---------------------------------------------------------------------------
let knownUnlocked = HATS.filter((h) => h.cost <= totalStars()).length;
function onStars() {
  refreshStars();
  const n = HATS.filter((h) => h.cost <= totalStars()).length;
  if (n > knownUnlocked) {
    const hat = HATS[n - 1];
    setTimeout(() => {
      toast(`🎉 Nouveau dans Mon perso : ${hat.label} !`, 3500);
      speak(`Bravo ! Tu as débloqué : ${hat.label}`);
    }, 2400);
  }
  knownUnlocked = n;
}

// ---------------------------------------------------------------------------
// Menu principal
// ---------------------------------------------------------------------------
$('playParcours').addEventListener('click', () => { renderLevels(); showScreen('levels'); sfx('pop'); });
$('playMonde').addEventListener('click', () => startGame(() => startMonde({ onExit: () => showScreen('menu'), hud, onStars })));
$('playBuild').addEventListener('click', () => startGame(() => startConstruction({ onExit: () => showScreen('menu'), hud })));
$('openPerso').addEventListener('click', () => { renderPerso(); showScreen('perso'); sfx('pop'); });
document.querySelectorAll('.back-menu').forEach((b) => b.addEventListener('click', () => { sfx('pop'); showScreen('menu'); }));
$('homeBtn').addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (ui.busy && !document.querySelector('#celebrate.show')) return;
  $('celebrate').classList.remove('show');
  ui.busy = false;
  showScreen('menu');
});
$('soundBtn').addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  setSound(!soundOn);
  $('soundBtn').textContent = soundOn ? '🔊' : '🔇';
  if (!soundOn && window.speechSynthesis) window.speechSynthesis.cancel();
});

// --- Choix du niveau ---
function levelOpen(i) {
  return i === 0 || (save.levels[i] && save.levels[i].done);
}
function renderLevels() {
  const list = $('levelList');
  list.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const rec = save.levels[i + 1];
    const open = levelOpen(i);
    const b = document.createElement('button');
    b.className = 'level-card' + (open ? '' : ' locked') + (rec && rec.done ? ' done' : '');
    b.innerHTML = `<span class="lv-num">${open ? L.emoji : '🔒'}</span>
      <span class="lv-name">${i + 1}. ${L.name}</span>
      <span class="lv-info">${rec && rec.done ? `✅ 🪙 ${rec.coins}` : open ? 'À jouer !' : 'Finis le niveau d’avant'}</span>`;
    b.addEventListener('click', () => {
      if (!open) { sfx('wrong'); toast('🔒 Finis d’abord le niveau précédent !'); return; }
      playLevel(i);
    });
    list.appendChild(b);
  });
}
function playLevel(i) {
  startGame(() => startParcours(i, {
    hud,
    onExit: () => showScreen('menu'),
    onNext: (n) => { onStars(); playLevel(n); }
  }));
}

// --- Mon perso ---
function renderPerso() {
  const stars = totalStars();
  const swatches = (el, colors, field) => {
    const box = $(el);
    box.innerHTML = '';
    colors.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'swatch' + (save.outfit[field] === c ? ' active' : '');
      b.style.background = c;
      b.addEventListener('click', () => {
        save.outfit[field] = c;
        persist();
        menu.refresh();
        sfx('pop');
        renderPerso();
      });
      box.appendChild(b);
    });
  };
  swatches('shirtColors', SHIRTS, 'shirt');
  swatches('pantsColors', PANTS, 'pants');
  swatches('skinColors', SKINS, 'skin');
  swatches('hairColors', ['#3f2a1d', '#111827', '#a16207', '#facc15', '#ea580c', '#f472b6', '#8b5cf6'], 'hair');
  const hats = $('hatList');
  hats.innerHTML = '';
  HATS.forEach((h) => {
    const locked = h.cost > stars;
    const b = document.createElement('button');
    b.className = 'hat' + (save.outfit.hat === h.id ? ' active' : '') + (locked ? ' locked' : '');
    b.innerHTML = locked ? `🔒 ${h.label}<small>⭐ ${h.cost}</small>` : h.label;
    b.addEventListener('click', () => {
      if (locked) {
        sfx('wrong');
        toast(`🔒 Il te faut ${h.cost} étoiles (tu en as ${stars}).`);
        return;
      }
      save.outfit.hat = h.id;
      persist();
      menu.refresh();
      sfx('pop');
      renderPerso();
    });
    hats.appendChild(b);
  });
}

// ---------------------------------------------------------------------------
// Boucle de jeu
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let t = 0;
function frame() {
  requestAnimationFrame(frame);
  if (document.hidden) { clock.getDelta(); return; }
  const dt = Math.min(0.05, clock.getDelta());
  t += dt;
  if (input.scheme === 'play' && !ui.busy) readKeyboard(dt);
  current.update(dt, t);
  renderer.render(current.scene, camera);
}

window.__blocs = { get current() { return current; } };
showScreen('menu');
frame();
document.getElementById('loading').remove();

// Mode hors-ligne (le service worker de l'Atelier couvre aussi ce dossier)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('../sw.js').catch(() => {}));
}
