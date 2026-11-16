// ============================================================================
// DINO & HÉROS MAGIQUES : L'ATELIER CRÉATIF (6-7 ANS)
// 100% Tactile - Personnages intégrés + Dinos - Web Audio & Synthèse Vocale
// ============================================================================

(() => {
  'use strict';

  const CHAR_IMGS = window.CHARACTER_IMAGES || {};

  // --- ÉTAT GLOBAL ---
  const state = {
    mode: 'coloring', // 'coloring' | 'world' | 'music' | 'gallery'
    soundEnabled: true,
    // Coloriage
    currentTool: 'fill', // 'fill' | 'brush' | 'magicreveal' | 'rainbow' | 'stamp' | 'eraser'
    currentColor: '#38bdf8',
    isRainbowColor: false,
    brushSize: 26,
    currentSticker: '🦖',
    pattern: 'none', // 'none' | 'dots' | 'stripes' | 'stars' | 'hearts'
    guard: true, // le pinceau ne déborde pas de la zone
    playMode: 'free', // 'free' | 'num' (numéros) | 'calc' (calculs)
    numSel: 1,
    rainbowHue: 0,
    undoStack: [],
    // Monde Magique
    worldBg: 'bg-jungle',
    worldDancing: false,
    actors: [],
    selectedActorId: null,
    // Musique
    instrument: 'piano',
    activeBeat: null,
    beatInterval: null,
    isRecording: false,
    recordedNotes: [],
    recordStartTime: 0,
    // Galerie
    gallery: []
  };

  // Palette de 16 couleurs vives + 1 couleur Arc-en-ciel magique
  const PALETTE = [
    { hex: 'RAINBOW', name: 'Arc-en-ciel Magique' },
    { hex: '#ef4444', name: 'Rouge' },
    { hex: '#f97316', name: 'Orange' },
    { hex: '#facc15', name: 'Jaune Soleil' },
    { hex: '#84cc16', name: 'Vert Pomme' },
    { hex: '#22c55e', name: 'Vert' },
    { hex: '#14b8a6', name: 'Turquoise' },
    { hex: '#38bdf8', name: 'Bleu Ciel' },
    { hex: '#2563eb', name: 'Bleu Roi' },
    { hex: '#8b5cf6', name: 'Violet' },
    { hex: '#d946ef', name: 'Rose Magique' },
    { hex: '#f43f5e', name: 'Rose Corail' },
    { hex: '#fdba74', name: 'Beige' },
    { hex: '#a16207', name: 'Marron' },
    { hex: '#475569', name: 'Gris / Noir' },
    { hex: '#ffffff', name: 'Blanc Nuage' }
  ];

  const STICKERS = [
    '🦖', '🦕', '🦄', '🐉',
    '🌺', '👑', '⭐', '🌈',
    '🏰', '❄️', '💎', '💖',
    '🪄', '🦁', '🧞', '🌴'
  ];

  const WORLD_ITEMS = [
    { imgKey: 'stitch', label: 'Stitch', sound: 'magic' },
    { imgKey: 'vaiana', label: 'Vaiana', sound: 'magic' },
    { imgKey: 'maui', label: 'Maui', sound: 'roar' },
    { imgKey: 'olaf', label: 'Olaf', sound: 'pop' },
    { imgKey: 'raiponce', label: 'Raiponce', sound: 'chime' },
    { imgKey: 'mickey', label: 'Mickey', sound: 'pop' },
    { imgKey: 'winnie', label: 'Winnie', sound: 'low' },
    { imgKey: 'bob', label: 'Bob', sound: 'pop' },
    { imgKey: 'simba_nala', label: 'Simba & Nala', sound: 'roar' },
    { imgKey: 'roi_lion', label: 'Roi Lion', sound: 'roar' },
    { imgKey: 'timon_pumbaa', label: 'Timon & Pumbaa', sound: 'low' },
    { imgKey: 'jasmine', label: 'Jasmine', sound: 'chime' },
    { imgKey: 'aladdin', label: 'Aladdin', sound: 'magic' },
    { emoji: '🦖', label: 'T-Rex', sound: 'roar' },
    { emoji: '🦕', label: 'Diplo', sound: 'low' },
    { emoji: '🦄', label: 'Licorne', sound: 'magic' },
    { emoji: '🐉', label: 'Dragon', sound: 'fire' },
    { emoji: '🥚', label: 'Œuf Surprise', sound: 'egg' },
    { emoji: '🌋', label: 'Volcan', sound: 'volcano' },
    { emoji: '🏰', label: 'Château', sound: 'magic' },
    { emoji: '🌈', label: 'Arc-en-ciel', sound: 'magic' }
  ];

  const PIANO_NOTES = [
    { note: 'Do', freq: 261.63, color: '#ef4444', icon: '🦖' },
    { note: 'Ré', freq: 293.66, color: '#f97316', icon: '🦁' },
    { note: 'Mi', freq: 329.63, color: '#eab308', icon: '⭐' },
    { note: 'Fa', freq: 349.23, color: '#22c55e', icon: '🦕' },
    { note: 'Sol', freq: 392.00, color: '#06b6d4', icon: '❄️' },
    { note: 'La', freq: 440.00, color: '#3b82f6', icon: '🏰' },
    { note: 'Si', freq: 493.88, color: '#8b5cf6', icon: '🦄' },
    { note: 'Do+', freq: 523.25, color: '#ec4899', icon: '🌺' }
  ];

  // Cache d'images préchargées
  const loadedImages = {};

  // ==========================================================================
  // 1. MOTEUR AUDIO & VOIX (Web Audio API + SpeechSynthesis)
  // ==========================================================================
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function speak(text) {
    if (!state.soundEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'fr-FR';
      utter.rate = 1.0;
      utter.pitch = 1.15;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  function playTone(freq, duration = 0.25, type = 'sine', volume = 0.22, slideFreq = null) {
    if (!state.soundEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playSoundEffect(effect) {
    if (!state.soundEnabled) return;
    switch (effect) {
      case 'pop':
        playTone(420, 0.1, 'sine', 0.25, 780);
        break;
      case 'fill':
        playTone(392, 0.12, 'triangle', 0.22);
        setTimeout(() => playTone(523.25, 0.15, 'triangle', 0.22), 55);
        setTimeout(() => playTone(659.25, 0.2, 'triangle', 0.22), 110);
        break;
      case 'magic':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          setTimeout(() => playTone(f, 0.22, 'sine', 0.18), i * 55);
        });
        break;
      case 'chime':
        playTone(880, 0.25, 'sine', 0.2, 1320);
        break;
      case 'undo':
        playTone(500, 0.18, 'triangle', 0.22, 260);
        break;
      case 'roar':
        playTone(150, 0.35, 'sawtooth', 0.2, 85);
        setTimeout(() => playTone(190, 0.25, 'sawtooth', 0.18, 110), 140);
        break;
      case 'low':
        playTone(180, 0.4, 'triangle', 0.28, 240);
        break;
      case 'fire':
        playTone(320, 0.25, 'sawtooth', 0.16, 640);
        break;
      case 'egg':
        playTone(440, 0.1, 'square', 0.15, 880);
        setTimeout(() => playTone(660, 0.15, 'square', 0.15, 1100), 120);
        break;
      case 'volcano':
        playTone(120, 0.45, 'sawtooth', 0.22, 60);
        break;
      case 'camera':
        playTone(1200, 0.06, 'square', 0.15);
        setTimeout(() => playSoundEffect('magic'), 90);
        break;
    }
  }

  function playInstrumentNote(freq) {
    if (!state.soundEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    const inst = state.instrument;
    if (inst === 'piano') {
      playTone(freq, 0.55, 'triangle', 0.3);
      playTone(freq * 2, 0.25, 'sine', 0.08);
    } else if (inst === 'marimba') {
      playTone(freq, 0.28, 'sine', 0.35);
      playTone(freq * 4, 0.07, 'sine', 0.12);
    } else if (inst === 'magic') {
      playTone(freq, 0.7, 'sine', 0.22);
      setTimeout(() => playTone(freq * 1.5, 0.5, 'sine', 0.12), 60);
      setTimeout(() => playTone(freq * 2, 0.45, 'triangle', 0.1), 120);
    } else if (inst === 'synth') {
      playTone(freq, 0.38, 'sawtooth', 0.16, freq * 1.03);
      playTone(freq * 0.5, 0.38, 'square', 0.12);
    }
  }

  // ==========================================================================
  // 2. INTERFACE COMMUNE (Toast, Particules, Navigation)
  // ==========================================================================
  const toastEl = document.getElementById('toastMsg');
  let toastTimeout = null;

  function showToast(msg) {
    toastEl.textContent = msg;
    // En coloriage, le message reste dans la feuille : il ne cache ni les couleurs ni les outils
    const sheet = document.getElementById('canvasWrapper');
    const r = sheet ? sheet.getBoundingClientRect() : null;
    if (r && r.width > 0 && r.height > 0) {
      toastEl.style.left = `${r.left + r.width / 2}px`;
      toastEl.style.bottom = `${Math.max(12, window.innerHeight - r.bottom + 64)}px`;
      toastEl.style.maxWidth = `${r.width - 24}px`;
    } else {
      toastEl.style.left = '';
      toastEl.style.bottom = '';
      toastEl.style.maxWidth = '';
    }
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2200);
  }

  function spawnFloatingBurst(x, y, emojis = ['⭐', '✨', '💖', '🌟']) {
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      el.className = 'floating-note';
      el.textContent = emojis[i % emojis.length];
      const offsetX = (Math.random() - 0.5) * 80;
      const offsetY = (Math.random() - 0.5) * 40;
      el.style.left = `${x + offsetX}px`;
      el.style.top = `${y + offsetY}px`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }
  }

  const modeTabs = document.querySelectorAll('.mode-tab');
  modeTabs.forEach((tab) => {
    tab.addEventListener('pointerdown', () => {
      switchMode(tab.dataset.mode);
    });
  });

  function switchMode(newMode) {
    state.mode = newMode;
    modeTabs.forEach((t) => t.classList.toggle('active', t.dataset.mode === newMode));
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const activeScreen = document.getElementById(`screen-${newMode}`);
    if (activeScreen) activeScreen.classList.add('active');

    playSoundEffect('pop');

    if (newMode !== 'music' && state.activeBeat) {
      stopBackgroundBeat();
    }

    if (newMode === 'coloring') {
      showToast('🎨 Atelier Coloriage & Héros !');
    } else if (newMode === 'world') {
      showToast('🏰 Crée ton Monde Magique !');
    } else if (newMode === 'music') {
      showToast('🎹 L’Orchestre Magique !');
    } else if (newMode === 'gallery') {
      renderGallery();
      showToast('📸 Mon Album Magique !');
    }
  }

  document.getElementById('brandBtn').addEventListener('pointerdown', () => {
    playSoundEffect('magic');
    speak('Bienvenue dans ton Atelier Magique !');
    showToast('🦖 Amuse-toi bien avec tes héros préférés ! ✨');
  });

  document.getElementById('voiceHelpBtn').addEventListener('pointerdown', () => {
    if (state.mode === 'coloring') {
      speak(state.playMode === 'free' ? 'Touche le bouton Dessins pour choisir ton coloriage. Choisis une couleur à droite, puis touche une zone avec le pot magique. Avec deux doigts, tu peux agrandir le dessin.' : 'Choisis un numéro à droite, puis touche les zones qui ont le même numéro.');
      showToast('🗣️ Choisis un dessin, une couleur, puis touche une zone !');
    } else if (state.mode === 'world') {
      speak('Touche tes héros ou les dinosaures en bas pour les ajouter dans ton monde, et fais-les danser !');
      showToast('🗣️ Touche un héros en bas pour l’ajouter !');
    } else if (state.mode === 'music') {
      speak('Joue du piano arc-en-ciel avec tes doigts !');
      showToast('🗣️ Touche les grandes touches colorées !');
    } else {
      speak('Voici toutes tes belles créations enregistrées !');
    }
  });

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  soundToggleBtn.addEventListener('pointerdown', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggleBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !state.soundEnabled);
    if (state.soundEnabled) {
      playSoundEffect('pop');
      showToast('🔊 Son activé');
    } else {
      stopBackgroundBeat();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      showToast('🔇 Son coupé');
    }
  });

  document.getElementById('fullscreenBtn').addEventListener('pointerdown', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  // ==========================================================================
  // 3. MODE 1 : COLORIAGE (dessins au trait, zones, numéros, sauvegarde)
  // ==========================================================================
  const W = 900;
  const H = 650;
  const N = W * H;
  const LINE_RGB = [30, 27, 75];

  const PAGES = window.COLORING_PAGES || [];
  const CATS = window.COLORING_CATEGORIES || [];
  const DONE_KEY = 'manel_coloriages_finis_v1';
  const STARTED_KEY = 'manel_coloriages_commences_v1';
  const LAST_KEY = 'manel_dernier_dessin_v1';
  const MODE_KEY = 'manel_mode_jeu_v1';

  // Déblocage : les premiers dessins sont ouverts, chaque dessin fini en ouvre d'autres
  const FREE_PAGES = 8;
  const PAGES_PER_DONE = 2;

  // --- Mémoire de la tablette (IndexedDB) : dessins en cours et autocollants ---
  const Store = (() => {
    let dbPromise = null;
    function db() {
      if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
          try {
            const rq = indexedDB.open('manel_coloriage', 1);
            rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
            rq.onsuccess = () => resolve(rq.result);
            rq.onerror = () => reject(rq.error);
          } catch (e) {
            reject(e);
          }
        });
      }
      return dbPromise;
    }
    const run = (mode, fn) =>
      db()
        .then((d) => new Promise((resolve, reject) => {
          const rq = fn(d.transaction('kv', mode).objectStore('kv'));
          rq.onsuccess = () => resolve(rq.result);
          rq.onerror = () => reject(rq.error);
        }))
        .catch(() => undefined);
    return {
      get: (k) => run('readonly', (s) => s.get(k)),
      set: (k, v) => run('readwrite', (s) => s.put(v, k)),
      del: (k) => run('readwrite', (s) => s.delete(k))
    };
  })();

  function readSet(key) {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch (_) { return new Set(); }
  }
  function writeSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify([...set])); } catch (_) {}
  }

  const paintCanvas = document.getElementById('paintCanvas');
  const ctx = paintCanvas.getContext('2d', { willReadFrequently: true });

  function makeLayer() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return [c, c.getContext('2d', { willReadFrequently: true })];
  }

  const [lineCanvas, lineCtx] = makeLayer();   // traits noirs (transparents ailleurs)
  const [colorCanvas, colorCtx] = makeLayer(); // couleurs de l'enfant
  const [refCanvas, refCtx] = makeLayer();     // modèle en couleurs
  const [maskCanvas, maskCtx] = makeLayer();   // zone autorisée pour le pinceau
  const [strokeCanvas, strokeCtx] = makeLayer();

  // --- Taille de la feuille + zoom à deux doigts ---
  const canvasWrapper = document.getElementById('canvasWrapper');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const view = { s: 1, tx: 0, ty: 0, w: W, h: H };

  function applyView() {
    view.s = Math.max(1, Math.min(4, view.s));
    view.tx = Math.min(0, Math.max(-(view.s - 1) * view.w, view.tx));
    view.ty = Math.min(0, Math.max(-(view.s - 1) * view.h, view.ty));
    paintCanvas.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`;
    zoomResetBtn.classList.toggle('visible', view.s > 1.02);
  }

  function resetView() {
    view.s = 1;
    view.tx = 0;
    view.ty = 0;
    applyView();
  }

  function fitCanvas() {
    const r = canvasWrapper.getBoundingClientRect();
    const availW = r.width - 16;
    const availH = r.height - 16;
    if (availW <= 0 || availH <= 0) return;
    const sc = Math.min(availW / W, availH / H);
    view.w = Math.floor(W * sc);
    view.h = Math.floor(H * sc);
    paintCanvas.style.width = `${view.w}px`;
    paintCanvas.style.height = `${view.h}px`;
    resetView();
  }
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(canvasWrapper);
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  zoomResetBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    resetView();
    playSoundEffect('pop');
  });

  const modelPreviewCard = document.getElementById('modelPreviewCard');
  const modelPreviewImg = document.getElementById('modelPreviewImg');
  const progressPill = document.getElementById('progressPill');

  modelPreviewCard.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    modelPreviewCard.classList.toggle('zoomed');
    playSoundEffect('pop');
  });

  // Zones fermées de la page : labels[p] > 0 = numéro de zone, 0 = trait
  let zones = null;
  let currentPage = null;
  let celebrated = false;
  const pageMemory = {};

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  function numberMode() {
    return state.playMode !== 'free' && zones && zones.numColors.length > 0;
  }

  function compositeCanvas() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(colorCanvas, 0, 0);
    if (currentPage && currentPage.kind !== 'blank') ctx.drawImage(lineCanvas, 0, 0);
    if (numberMode()) drawNumbers();
  }

  function saveUndoState() {
    if (state.undoStack.length >= 15) state.undoStack.shift();
    state.undoStack.push(colorCtx.getImageData(0, 0, W, H));
  }

  function restoreUndoState() {
    if (state.undoStack.length === 0) {
      showToast('Rien à annuler !');
      return;
    }
    colorCtx.putImageData(state.undoStack.pop(), 0, 0);
    refreshNumDone();
    compositeCanvas();
    playSoundEffect('undo');
    showToast('↩️ Oups annulé !');
    scheduleProgress();
  }

  function whitePaper() {
    colorCtx.fillStyle = '#ffffff';
    colorCtx.fillRect(0, 0, W, H);
  }

  // --- Dessin au trait (SVG blanc) -> calque de traits transparent ---
  function imageToLines(img) {
    const [, tc] = makeLayer();
    tc.fillStyle = '#ffffff';
    tc.fillRect(0, 0, W, H);
    tc.drawImage(img, 0, 0, W, H);
    const d = tc.getImageData(0, 0, W, H).data;
    const out = lineCtx.createImageData(W, H);
    const o = out.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      o[i] = LINE_RGB[0];
      o[i + 1] = LINE_RGB[1];
      o[i + 2] = LINE_RGB[2];
      o[i + 3] = Math.max(0, Math.min(255, (255 - lum) * 1.3));
    }
    lineCtx.putImageData(out, 0, 0);
  }

  // --- Repérage des zones fermées (une seule fois par dessin) ---
  function computeZones() {
    const a = lineCtx.getImageData(0, 0, W, H).data;
    const labels = new Int32Array(N);
    for (let p = 0; p < N; p++) labels[p] = a[p * 4 + 3] < 110 ? -1 : 0;

    const sizes = [0];
    const stack = new Int32Array(N);
    let next = 1;
    for (let p = 0; p < N; p++) {
      if (labels[p] !== -1) continue;
      let sp = 0;
      let size = 0;
      stack[sp++] = p;
      labels[p] = next;
      while (sp) {
        const q = stack[--sp];
        size++;
        const x = q % W;
        if (x > 0 && labels[q - 1] === -1) { labels[q - 1] = next; stack[sp++] = q - 1; }
        if (x < W - 1 && labels[q + 1] === -1) { labels[q + 1] = next; stack[sp++] = q + 1; }
        if (q >= W && labels[q - W] === -1) { labels[q - W] = next; stack[sp++] = q - W; }
        if (q < N - W && labels[q + W] === -1) { labels[q + W] = next; stack[sp++] = q + W; }
      }
      sizes.push(size);
      next++;
    }

    // Les pixels du trait sont rattachés à la zone voisine : la couleur passe
    // sous le trait, sans liseré blanc.
    const owner = new Int32Array(N);
    let frontier = [];
    for (let p = 0; p < N; p++) {
      if (labels[p] !== 0) continue;
      const x = p % W;
      const n =
        (x > 0 && labels[p - 1] > 0 && labels[p - 1]) ||
        (x < W - 1 && labels[p + 1] > 0 && labels[p + 1]) ||
        (p >= W && labels[p - W] > 0 && labels[p - W]) ||
        (p < N - W && labels[p + W] > 0 && labels[p + W]) || 0;
      if (n) { owner[p] = n; frontier.push(p); }
    }
    for (let step = 0; step < 6 && frontier.length; step++) {
      const nf = [];
      for (const p of frontier) {
        const x = p % W;
        const L = owner[p];
        const tryPx = (q) => {
          if (labels[q] === 0 && owner[q] === 0) { owner[q] = L; nf.push(q); }
        };
        if (x > 0) tryPx(p - 1);
        if (x < W - 1) tryPx(p + 1);
        if (p >= W) tryPx(p - W);
        if (p < N - W) tryPx(p + W);
      }
      frontier = nf;
    }

    // Zones qui comptent pour la progression (on ignore les miettes et le fond)
    const big = [];
    let largest = 0;
    for (let L = 1; L < sizes.length; L++) {
      if (sizes[L] >= 350) big.push(L);
      if (sizes[L] > sizes[largest]) largest = L;
    }
    zones = {
      labels, owner, sizes, largest,
      big: big.filter((L) => L !== largest),
      touched: new Uint8Array(sizes.length)
    };
    computeNumbers();
  }

  // --- Coloriage par numéros : centre, couleur du modèle et numéro de chaque zone ---
  function computeNumbers() {
    const { labels, sizes, largest } = zones;
    const len = sizes.length;
    const ref = refCtx.getImageData(0, 0, W, H).data;

    // Distance au trait le plus proche (pour placer le numéro au milieu de la zone)
    const dist = new Uint16Array(N);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (labels[p] <= 0) continue;
        if (x === 0 || y === 0) { dist[p] = 1; continue; }
        dist[p] = Math.min(dist[p - 1], dist[p - W]) + 1;
      }
    }
    for (let y = H - 1; y >= 0; y--) {
      for (let x = W - 1; x >= 0; x--) {
        const p = y * W + x;
        if (labels[p] <= 0) continue;
        if (x === W - 1 || y === H - 1) { dist[p] = 1; continue; }
        const m = Math.min(dist[p + 1], dist[p + W]) + 1;
        if (m < dist[p]) dist[p] = m;
      }
    }
    const best = new Uint16Array(len);
    const bestP = new Int32Array(len);
    for (let p = 0; p < N; p++) {
      const L = labels[p];
      if (L > 0 && dist[p] > best[L]) { best[L] = dist[p]; bestP[L] = p; }
    }
    // Recentrer : moyenne des points les plus "au milieu"
    const sx = new Float64Array(len);
    const sy = new Float64Array(len);
    const sn = new Int32Array(len);
    for (let p = 0; p < N; p++) {
      const L = labels[p];
      if (L > 0 && dist[p] >= best[L] * 0.82) { sx[L] += p % W; sy[L] += (p / W) | 0; sn[L]++; }
    }
    for (let L = 1; L < len; L++) {
      if (!sn[L]) continue;
      const q = Math.round(sy[L] / sn[L]) * W + Math.round(sx[L] / sn[L]);
      if (labels[q] === L && dist[q] >= best[L] * 0.7) { bestP[L] = q; best[L] = dist[q]; }
    }

    const modelRgb = new Uint8Array(len * 3).fill(255);
    const num = new Uint8Array(len);
    const auto = new Uint8Array(len);
    const numColors = [];
    const index = new Map();
    for (let L = 1; L < len; L++) {
      const i = bestP[L] * 4;
      const r = ref[i], g = ref[i + 1], b = ref[i + 2];
      if (L === largest || Math.min(r, g, b) > 232) continue; // fond et zones blanches
      modelRgb[L * 3] = r; modelRgb[L * 3 + 1] = g; modelRgb[L * 3 + 2] = b;
      if (sizes[L] < 350 || best[L] < 9) { auto[L] = 1; continue; } // trop petit pour un numéro
      const key = (r << 16) | (g << 8) | b;
      if (!index.has(key)) { index.set(key, numColors.length); numColors.push([r, g, b]); }
      num[L] = index.get(key) + 1;
    }
    Object.assign(zones, { center: bestP, radius: best, modelRgb, num, auto, numColors, done: new Uint8Array(len) });
  }

  function refreshNumDone() {
    if (!zones || !zones.numColors.length) return;
    const d = colorCtx.getImageData(0, 0, W, H).data;
    const { num, center, numColors, done } = zones;
    for (let L = 1; L < num.length; L++) {
      if (!num[L]) continue;
      const c = numColors[num[L] - 1];
      const i = center[L] * 4;
      done[L] = Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2]) < 12 ? 1 : 0;
    }
  }

  function calcText(n, L) {
    const h = (L * 2654435761) >>> 0;
    if (n >= 2 && (h & 1)) {
      const a = 1 + ((h >>> 3) % (n - 1));
      return `${a}+${n - a}`;
    }
    const b = 1 + ((h >>> 5) % 4);
    return `${n + b}-${b}`;
  }

  function drawNumbers() {
    const { num, center, radius, done } = zones;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#1e1b4b';
    for (let L = 1; L < num.length; L++) {
      if (!num[L] || done[L]) continue;
      const r = radius[L];
      let text = String(num[L]);
      let size = Math.min(38, r * (text.length > 1 ? 0.95 : 1.2));
      if (state.playMode === 'calc' && r >= 19) {
        text = calcText(num[L], L);
        size = Math.min(28, r * (text.length > 3 ? 0.62 : 0.72));
      }
      size = Math.max(12, size);
      ctx.font = `900 ${size}px "Segoe UI", system-ui, sans-serif`;
      ctx.lineWidth = Math.max(3, size / 5);
      const x = center[L] % W;
      const y = ((center[L] / W) | 0) + 1;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  function zoneAt(x, y) {
    if (!zones) return 0;
    x = Math.max(0, Math.min(W - 1, Math.floor(x)));
    y = Math.max(0, Math.min(H - 1, Math.floor(y)));
    const p = y * W + x;
    if (zones.labels[p] > 0) return zones.labels[p];
    // L'enfant a touché un trait : on prend la zone la plus proche
    for (let r = 1; r <= 14; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const L = zones.labels[yy * W + xx];
          if (L > 0 && zones.sizes[L] > 30) return L;
        }
      }
    }
    return 0;
  }

  // --- Motifs du pot (pois, rayures, étoiles, cœurs, dégradé, paillettes) ---
  const TILE = 44;
  const TILE_PATTERNS = new Set(['dots', 'stripes', 'stars', 'hearts']);
  function makePatternTile(rgb, pattern) {
    const t = document.createElement('canvas');
    t.width = TILE;
    t.height = TILE;
    const c = t.getContext('2d', { willReadFrequently: true });
    c.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    c.fillRect(0, 0, TILE, TILE);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    if (pattern === 'dots') {
      [[11, 11], [33, 33]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); });
    } else if (pattern === 'stripes') {
      c.lineWidth = 8;
      for (let k = -TILE; k <= TILE * 2; k += 22) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k - TILE, TILE); c.stroke(); }
    } else {
      c.font = '18px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const ch = pattern === 'stars' ? '★' : '♥';
      c.fillText(ch, 11, 12);
      c.fillText(ch, 33, 34);
    }
    return c.getImageData(0, 0, TILE, TILE).data;
  }

  function hexToRgba(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
  }

  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4)), 255];
  }

  function currentRgb() {
    if (state.isRainbowColor) {
      state.rainbowHue = (state.rainbowHue + 47) % 360;
      return hslToRgb(state.rainbowHue, 90, 60);
    }
    return hexToRgba(state.currentColor);
  }

  // Peint toutes les zones cochées dans sel[]. mode 'model' = couleur du modèle.
  function paintZones(sel, mode, rgb) {
    const img = colorCtx.getImageData(0, 0, W, H);
    const d = img.data;
    const { labels, owner, modelRgb } = zones;
    const pat = mode === 'model' ? 'none' : state.pattern;
    const tile = TILE_PATTERNS.has(pat) ? makePatternTile(rgb, pat) : null;

    let y0 = H;
    let y1 = 0;
    if (pat === 'gradient') {
      for (let p = 0; p < N; p++) {
        if (sel[labels[p] || owner[p]]) {
          const y = (p / W) | 0;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    const span = Math.max(1, y1 - y0);

    for (let p = 0; p < N; p++) {
      const L = labels[p] || owner[p];
      if (!sel[L]) continue;
      const i = p * 4;
      const x = p % W;
      const y = (p / W) | 0;
      let r, g, b;
      if (mode === 'model') {
        r = modelRgb[L * 3]; g = modelRgb[L * 3 + 1]; b = modelRgb[L * 3 + 2];
      } else if (tile) {
        const t = ((y % TILE) * TILE + (x % TILE)) * 4;
        r = tile[t]; g = tile[t + 1]; b = tile[t + 2];
      } else if (pat === 'gradient') {
        const k = 0.72 * (1 - (y - y0) / span);
        r = rgb[0] + (255 - rgb[0]) * k; g = rgb[1] + (255 - rgb[1]) * k; b = rgb[2] + (255 - rgb[2]) * k;
      } else if (pat === 'glitter') {
        let h = Math.imul(x >> 1, 73856093) ^ Math.imul(y >> 1, 19349663);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        const v = ((h ^ (h >>> 16)) >>> 0) % 100;
        const k = v < 7 ? 0.9 : v < 15 ? 0.5 : v < 21 ? -0.22 : 0;
        if (k >= 0) { r = rgb[0] + (255 - rgb[0]) * k; g = rgb[1] + (255 - rgb[1]) * k; b = rgb[2] + (255 - rgb[2]) * k; }
        else { r = rgb[0] * (1 + k); g = rgb[1] * (1 + k); b = rgb[2] * (1 + k); }
      } else {
        r = rgb[0]; g = rgb[1]; b = rgb[2];
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
    colorCtx.putImageData(img, 0, 0);
  }

  // --- Pot magique : remplit toute la zone touchée ---
  function fillZone(L, mode) {
    if (!L) return false;
    saveUndoState();
    const sel = new Uint8Array(zones.sizes.length);
    sel[L] = 1;
    paintZones(sel, mode, mode === 'model' ? null : currentRgb());
    zones.touched[L] = 1;
    refreshNumDone();
    compositeCanvas();
    scheduleProgress();
    return true;
  }

  // Page blanche : remplissage simple de la tache de couleur touchée
  function floodFillBlank(sx, sy) {
    sx = Math.max(0, Math.min(W - 1, Math.floor(sx)));
    sy = Math.max(0, Math.min(H - 1, Math.floor(sy)));
    const img = colorCtx.getImageData(0, 0, W, H);
    const d = img.data;
    const s = (sy * W + sx) * 4;
    const tr = d[s], tg = d[s + 1], tb = d[s + 2];
    const rgb = currentRgb();
    if (Math.abs(tr - rgb[0]) + Math.abs(tg - rgb[1]) + Math.abs(tb - rgb[2]) < 12) return false;
    saveUndoState();
    const seen = new Uint8Array(N);
    const stack = [sy * W + sx];
    while (stack.length) {
      const p = stack.pop();
      if (seen[p]) continue;
      seen[p] = 1;
      const i = p * 4;
      if (Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) > 90) continue;
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
      const x = p % W;
      if (x > 0) stack.push(p - 1);
      if (x < W - 1) stack.push(p + 1);
      if (p >= W) stack.push(p - W);
      if (p < N - W) stack.push(p + W);
    }
    colorCtx.putImageData(img, 0, 0);
    compositeCanvas();
    scheduleProgress();
    return true;
  }

  // --- Sauvegarde automatique du dessin en cours ---
  let saveTimer = null;
  let dirty = false;

  function scheduleSave() {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 700);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    if (!dirty || !currentPage) return;
    dirty = false;
    const rec = {
      png: colorCanvas.toDataURL('image/png'),
      touched: zones ? Array.from(zones.touched) : null,
      celebrated
    };
    pageMemory[currentPage.key] = rec;
    Store.set(`page:${currentPage.key}`, rec);
    const started = readSet(STARTED_KEY);
    started.add(currentPage.key);
    writeSet(STARTED_KEY, started);
  }

  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

  // --- Progression et fête quand le dessin est fini ---
  let progressTimer = null;
  function scheduleProgress() {
    scheduleSave();
    clearTimeout(progressTimer);
    progressTimer = setTimeout(updateProgress, 250);
  }

  function updateProgress() {
    if (!zones || !zones.big.length) {
      progressPill.classList.remove('visible');
      return;
    }
    let pct;
    let finished;
    if (numberMode()) {
      let total = 0;
      let done = 0;
      for (let L = 1; L < zones.num.length; L++) {
        if (zones.num[L]) { total++; done += zones.done[L]; }
      }
      pct = total ? done / total : 0;
      finished = done === total;
      refreshNumberSwatches();
    } else {
      const d = colorCtx.getImageData(0, 0, W, H).data;
      const counts = new Int32Array(zones.sizes.length);
      const { labels } = zones;
      for (let p = 0; p < N; p++) {
        const L = labels[p];
        if (L > 0) {
          const i = p * 4;
          if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) counts[L]++;
        }
      }
      const total = zones.big.length;
      const done = zones.big.filter((L) => zones.touched[L] || counts[L] > zones.sizes[L] * 0.5).length;
      pct = done / total;
      finished = pct >= 0.85;
    }
    const stars = Math.round(pct * 5);
    progressPill.innerHTML = `<span class="pp-stars">${'★'.repeat(stars)}<span class="pp-off">${'★'.repeat(5 - stars)}</span></span><span class="pp-num">${Math.round(pct * 100)} %</span>`;
    progressPill.classList.add('visible');
    if (finished && !celebrated) {
      celebrated = true;
      scheduleSave();
      setTimeout(celebrate, 400);
    }
  }

  // --- Déblocage des dessins ---
  function unlockedCount(doneSet) {
    const doneLines = LINE_PAGES.filter((p) => doneSet.has(p.key)).length;
    return FREE_PAGES + PAGES_PER_DONE * doneLines;
  }

  // --- Autocollants : chaque dessin fini devient un personnage de « Mon Monde » ---
  const myStickers = new Map();

  function makeSticker() {
    const c = document.createElement('canvas');
    c.width = 360;
    c.height = 260;
    const cc = c.getContext('2d');
    cc.drawImage(colorCanvas, 0, 0, 360, 260);
    cc.drawImage(lineCanvas, 0, 0, 360, 260);
    return c.toDataURL('image/jpeg', 0.86);
  }

  const celebrateOverlay = document.getElementById('celebrateOverlay');
  function celebrate() {
    const extra = [];
    if (currentPage && currentPage.kind === 'line') {
      const doneSet = readSet(DONE_KEY);
      const before = unlockedCount(doneSet);
      doneSet.add(currentPage.key);
      writeSet(DONE_KEY, doneSet);
      const after = unlockedCount(doneSet);
      const fresh = LINE_PAGES.slice(before, after).map((p) => p.name);
      if (fresh.length) extra.push(`🔓 Nouveau${fresh.length > 1 ? 'x' : ''} dessin${fresh.length > 1 ? 's' : ''} : ${fresh.join(' et ')} !`);

      const url = makeSticker();
      myStickers.set(currentPage.key, { name: currentPage.name, url });
      Store.set(`sticker:${currentPage.key}`, url);
      refreshStickerTray();
      extra.push('🏰 Ton dessin est maintenant un autocollant dans Mon Monde !');
    }
    document.getElementById('celebrateExtra').innerHTML = extra.map((t) => `<div>${t}</div>`).join('');

    playSoundEffect('magic');
    setTimeout(() => playSoundEffect('fill'), 350);
    speak('Bravo Manel ! Ton coloriage est magnifique !');
    celebrateOverlay.classList.add('visible');
    const rain = celebrateOverlay.querySelector('.confetti-rain');
    rain.innerHTML = '';
    const emojis = ['⭐', '🌟', '✨', '💖', '🎉', '🌈', '🦄', '🦖'];
    for (let i = 0; i < 36; i++) {
      const e = document.createElement('span');
      e.textContent = emojis[i % emojis.length];
      e.style.left = `${Math.random() * 100}%`;
      e.style.animationDelay = `${Math.random() * 1.2}s`;
      e.style.fontSize = `${1.4 + Math.random() * 1.6}rem`;
      rain.appendChild(e);
    }
  }

  function exportDrawing() {
    const [c, cc] = makeLayer();
    cc.drawImage(colorCanvas, 0, 0);
    if (currentPage && currentPage.kind !== 'blank') cc.drawImage(lineCanvas, 0, 0);
    return c.toDataURL('image/jpeg', 0.88);
  }

  document.getElementById('celebrateSave').addEventListener('pointerdown', () => {
    saveCanvasToGallery(exportDrawing(), currentPage ? currentPage.name : 'Coloriage');
    celebrateOverlay.classList.remove('visible');
  });
  document.getElementById('celebrateClose').addEventListener('pointerdown', () => {
    celebrateOverlay.classList.remove('visible');
    playSoundEffect('pop');
  });

  // --- Chargement d'un dessin ---
  async function openPage(page) {
    saveNow();
    currentPage = page;
    state.undoStack = [];
    zones = null;
    lineCtx.clearRect(0, 0, W, H);
    progressPill.classList.remove('visible');
    modelPreviewCard.classList.remove('visible', 'zoomed');
    document.getElementById('currentPageName').textContent = page.name;
    resetView();
    try { localStorage.setItem(LAST_KEY, page.key); } catch (_) {}

    if (page.kind === 'line') {
      try {
        const [lineImg, modelImg] = await Promise.all([loadImage(page.lineUrl), loadImage(page.modelUrl)]);
        if (currentPage !== page) return;
        imageToLines(lineImg);
        refCtx.drawImage(modelImg, 0, 0, W, H);
        modelPreviewImg.src = page.modelUrl;
        modelPreviewCard.classList.add('visible');
        computeZones();
      } catch (_) {
        showToast('Oups, ce dessin ne veut pas s’ouvrir !');
      }
    }

    const mem = pageMemory[page.key] || (await Store.get(`page:${page.key}`));
    if (currentPage !== page) return;
    whitePaper();
    celebrated = false;
    if (mem && mem.png) {
      try {
        const im = await loadImage(mem.png);
        if (currentPage !== page) return;
        colorCtx.drawImage(im, 0, 0);
        if (zones && mem.touched) zones.touched.set(mem.touched.slice(0, zones.touched.length));
        celebrated = !!mem.celebrated;
        pageMemory[page.key] = mem;
      } catch (_) {}
    }

    if (state.playMode !== 'free' && !(zones && zones.numColors.length)) setPlayMode('free', true);
    applyPlayMode();
    compositeCanvas();
    updateProgress();
    if (page.speak) speak(page.speak);
  }

  // --- Modes de jeu : libre, numéros, calculs ---
  const coloringLayout = document.querySelector('.coloring-layout');
  const swatchesContainer = document.getElementById('colorSwatches');

  function autoFillSmallZones() {
    const d = colorCtx.getImageData(0, 0, W, H).data;
    const sel = new Uint8Array(zones.sizes.length);
    let any = false;
    for (let L = 1; L < sel.length; L++) {
      if (!zones.auto[L]) continue;
      const i = zones.center[L] * 4;
      if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) { sel[L] = 1; any = true; }
    }
    if (any) {
      paintZones(sel, 'model', null);
      scheduleSave();
    }
  }

  function applyPlayMode() {
    const on = numberMode();
    coloringLayout.classList.toggle('num-mode', on);
    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.play === state.playMode));
    document.getElementById('paletteLabel').textContent = on ? 'Numéros' : 'Couleurs';
    if (on) {
      autoFillSmallZones();
      refreshNumDone();
      const { num, done } = zones;
      const open = (n) => num.some((v, L) => v === n && !done[L]);
      if (!state.numSel || state.numSel > zones.numColors.length || !open(state.numSel)) {
        state.numSel = 1;
        for (let n = 1; n <= zones.numColors.length; n++) { if (open(n)) { state.numSel = n; break; } }
      }
    }
    renderPalette();
  }

  function setPlayMode(mode, silent) {
    if (mode !== 'free' && !(zones && zones.numColors.length)) {
      if (!silent) showToast('🔢 Choisis d’abord un dessin !');
      return;
    }
    state.playMode = mode;
    try { localStorage.setItem(MODE_KEY, mode); } catch (_) {}
    applyPlayMode();
    compositeCanvas();
    updateProgress();
    if (silent) return;
    playSoundEffect('magic');
    if (mode === 'num') {
      speak('Choisis un numéro à droite, puis touche les zones qui ont le même numéro.');
      showToast('🔢 Choisis un numéro, puis touche sa zone !');
    } else if (mode === 'calc') {
      speak('Fais le calcul dans ta tête, choisis le numéro du résultat, puis touche la zone.');
      showToast('➕ Fais le calcul, puis choisis le résultat !');
    } else {
      showToast('🎨 Coloriage libre !');
    }
  }

  function refreshNumberSwatches() {
    if (!numberMode()) return;
    const { num, done } = zones;
    swatchesContainer.querySelectorAll('.num-swatch').forEach((btn) => {
      const n = Number(btn.dataset.num);
      const finished = !num.some((v, L) => v === n && !done[L]);
      btn.classList.toggle('finished', finished);
      btn.textContent = finished ? '✓' : String(n);
      btn.classList.toggle('active', n === state.numSel);
    });
  }

  function renderPalette() {
    swatchesContainer.innerHTML = '';
    if (numberMode()) {
      zones.numColors.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.className = 'color-swatch num-swatch';
        btn.dataset.num = String(idx + 1);
        btn.style.backgroundColor = `rgb(${c[0]},${c[1]},${c[2]})`;
        btn.style.color = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 150 ? '#1e1b4b' : '#ffffff';
        btn.addEventListener('pointerdown', () => {
          state.numSel = idx + 1;
          refreshNumberSwatches();
          playSoundEffect('pop');
        });
        swatchesContainer.appendChild(btn);
      });
      refreshNumberSwatches();
      return;
    }
    PALETTE.forEach((col) => {
      const btn = document.createElement('button');
      btn.className = 'color-swatch';
      btn.title = col.name;
      if (col.hex === 'RAINBOW') {
        btn.classList.add('rainbow-swatch');
        btn.textContent = '✨';
        if (state.isRainbowColor) btn.classList.add('active');
      } else {
        btn.style.backgroundColor = col.hex;
        if (!state.isRainbowColor && col.hex === state.currentColor) btn.classList.add('active');
      }
      btn.addEventListener('pointerdown', () => {
        document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
        btn.classList.add('active');
        if (col.hex === 'RAINBOW') {
          state.isRainbowColor = true;
          playSoundEffect('magic');
          showToast('🌈 Couleur Magique Arc-en-ciel !');
        } else {
          state.isRainbowColor = false;
          state.currentColor = col.hex;
          playSoundEffect('pop');
        }
        document.querySelectorAll('.pattern-btn').forEach((b) => b.style.setProperty('--pc', state.isRainbowColor ? '#a855f7' : state.currentColor));
        if (state.currentTool === 'eraser' || state.currentTool === 'magicreveal') selectTool('fill');
      });
      swatchesContainer.appendChild(btn);
    });
  }

  function numberTap(pt) {
    const L = zoneAt(pt.x, pt.y);
    const n = L ? zones.num[L] : 0;
    if (!n || zones.done[L]) {
      playSoundEffect('pop');
      return;
    }
    if (n !== state.numSel) {
      playSoundEffect('undo');
      showToast(state.playMode === 'calc' ? '🤔 Refais le calcul dans ta tête !' : '🤔 Regarde bien le numéro !');
      paintCanvas.classList.remove('shake');
      void paintCanvas.offsetWidth;
      paintCanvas.classList.add('shake');
      return;
    }
    fillZone(L, 'model');
    playSoundEffect('fill');
    spawnFloatingBurst(pt.screenX, pt.screenY, ['✨', '🌟', '👍']);
    if (!zones.num.some((v, K) => v === n && !zones.done[K])) {
      const next = zones.numColors.findIndex((_, i) => zones.num.some((v, K) => v === i + 1 && !zones.done[K]));
      if (next >= 0) {
        state.numSel = next + 1;
        showToast(`👏 Le ${n} est fini ! On passe au ${next + 1}.`);
      }
      refreshNumberSwatches();
    }
  }

  // --- Interactions tactiles sur la toile (1 doigt = colorier, 2 doigts = zoom) ---
  let isDrawing = false;
  let lastPt = null;
  let clipActive = false;
  const pointers = new Map();
  let pinch = null;
  let pendingTap = null;
  let afterPinch = false;

  function getCanvasCoords(e) {
    const rect = paintCanvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
      screenX: e.clientX,
      screenY: e.clientY
    };
  }

  function prepareClip(pt) {
    clipActive = false;
    if (!zones || !state.guard) return;
    const L = zoneAt(pt.x, pt.y);
    if (!L) return;
    const m = maskCtx.createImageData(W, H);
    const md = m.data;
    const { labels, owner } = zones;
    for (let p = 0; p < N; p++) {
      if (labels[p] === L || (labels[p] === 0 && owner[p] === L)) md[p * 4 + 3] = 255;
    }
    maskCtx.putImageData(m, 0, 0);
    clipActive = true;
  }

  function isTapTool() {
    const tool = state.currentTool;
    return numberMode() || tool === 'fill' || tool === 'stamp' || (tool === 'magicreveal' && zones);
  }

  function doTap(pt) {
    if (numberMode()) {
      numberTap(pt);
      return;
    }
    const tool = state.currentTool;
    if (tool === 'stamp') {
      saveUndoState();
      colorCtx.save();
      colorCtx.font = `${state.brushSize * 2.2 + 28}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      colorCtx.textAlign = 'center';
      colorCtx.textBaseline = 'middle';
      colorCtx.fillText(state.currentSticker, pt.x, pt.y);
      colorCtx.restore();
      compositeCanvas();
      scheduleProgress();
      playSoundEffect('chime');
      spawnFloatingBurst(pt.screenX, pt.screenY, [state.currentSticker, '✨', '⭐']);
      return;
    }
    const ok = zones
      ? fillZone(zoneAt(pt.x, pt.y), tool === 'magicreveal' ? 'model' : 'color')
      : floodFillBlank(pt.x, pt.y);
    if (ok) {
      playSoundEffect(tool === 'magicreveal' ? 'magic' : 'fill');
      spawnFloatingBurst(pt.screenX, pt.screenY, ['✨', '🌟', '🎨']);
    } else {
      playSoundEffect('pop');
    }
  }

  function startPinch() {
    // Un trait commencé par le premier doigt est annulé
    if (isDrawing && state.undoStack.length) {
      colorCtx.putImageData(state.undoStack.pop(), 0, 0);
      compositeCanvas();
    }
    isDrawing = false;
    lastPt = null;
    clipActive = false;
    pendingTap = null;
    const [a, b] = [...pointers.values()];
    const rect = paintCanvas.getBoundingClientRect();
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    pinch = {
      d0: Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)),
      s0: view.s,
      baseX: rect.left - view.tx,
      baseY: rect.top - view.ty,
      lx: (mx - rect.left) / view.s,
      ly: (my - rect.top) / view.s
    };
  }

  paintCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { paintCanvas.setPointerCapture(e.pointerId); } catch (_) {}
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      startPinch();
      return;
    }
    if (pointers.size > 2 || afterPinch) return;

    const pt = getCanvasCoords(e);
    if (isTapTool()) {
      pendingTap = { id: e.pointerId, pt };
      return;
    }
    saveUndoState();
    prepareClip(pt);
    isDrawing = true;
    lastPt = pt;
    drawStrokeStep(pt, pt);
  });

  paintCanvas.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      e.preventDefault();
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      view.s = Math.max(1, Math.min(4, (pinch.s0 * d) / pinch.d0));
      view.tx = (a.x + b.x) / 2 - pinch.baseX - view.s * pinch.lx;
      view.ty = (a.y + b.y) / 2 - pinch.baseY - view.s * pinch.ly;
      applyView();
      return;
    }
    if (!isDrawing) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of evs.length ? evs : [e]) {
      const pt = getCanvasCoords(ev);
      drawStrokeStep(lastPt, pt);
      lastPt = pt;
    }
  });

  function endPointer(e, cancelled) {
    pointers.delete(e.pointerId);
    if (pinch) {
      pinch = null;
      afterPinch = pointers.size > 0;
      return;
    }
    if (afterPinch) {
      afterPinch = pointers.size > 0;
      return;
    }
    if (pendingTap && pendingTap.id === e.pointerId) {
      const tap = pendingTap;
      pendingTap = null;
      if (!cancelled) doTap(tap.pt);
      return;
    }
    if (isDrawing) scheduleProgress();
    isDrawing = false;
    lastPt = null;
    clipActive = false;
  }

  paintCanvas.addEventListener('pointerup', (e) => endPointer(e, false));
  paintCanvas.addEventListener('pointercancel', (e) => endPointer(e, true));

  function drawStrokeStep(from, to) {
    let style;
    if (state.currentTool === 'eraser') {
      style = '#ffffff';
    } else if (state.isRainbowColor || state.currentTool === 'magicreveal') {
      state.rainbowHue = (state.rainbowHue + 7) % 360;
      style = `hsl(${state.rainbowHue}, 92%, 56%)`;
    } else {
      style = state.currentColor;
    }

    const lw = state.brushSize;
    const target = clipActive ? strokeCtx : colorCtx;
    const bx = Math.max(0, Math.floor(Math.min(from.x, to.x) - lw));
    const by = Math.max(0, Math.floor(Math.min(from.y, to.y) - lw));
    const bw = Math.min(W - bx, Math.ceil(Math.abs(to.x - from.x) + lw * 2 + 2));
    const bh = Math.min(H - by, Math.ceil(Math.abs(to.y - from.y) + lw * 2 + 2));
    if (bw <= 0 || bh <= 0) return;
    if (clipActive) strokeCtx.clearRect(bx, by, bw, bh);

    target.save();
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.lineWidth = lw;
    target.strokeStyle = style;
    target.beginPath();
    target.moveTo(from.x, from.y);
    target.lineTo(to.x + 0.01, to.y);
    target.stroke();
    target.restore();

    if (clipActive) {
      strokeCtx.globalCompositeOperation = 'destination-in';
      strokeCtx.drawImage(maskCanvas, bx, by, bw, bh, bx, by, bw, bh);
      strokeCtx.globalCompositeOperation = 'source-over';
      colorCtx.drawImage(strokeCanvas, bx, by, bw, bh, bx, by, bw, bh);
    }
    compositeCanvas();
  }

  // --- Choix du dessin (grand écran avec miniatures) ---
  const pickerOverlay = document.getElementById('pickerOverlay');
  const pickerGrid = document.getElementById('pickerGrid');
  const pickerCats = document.getElementById('pickerCats');
  let pickerCat = 'all';

  const LINE_PAGES = PAGES.map((p) => ({ ...p, key: p.id, kind: 'line', thumb: p.lineUrl }));
  const BLANK_PAGE = { key: 'blank', name: 'Page blanche', kind: 'blank', cat: 'libre', emoji: '📄', speak: 'Page blanche, dessine ce que tu veux !' };
  const ALL_PAGES = [...LINE_PAGES, BLANK_PAGE];

  function renderPicker() {
    const cats = [{ id: 'all', label: 'Tout', emoji: '⭐' }, ...CATS];
    pickerCats.innerHTML = '';
    cats.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'picker-cat' + (c.id === pickerCat ? ' active' : '');
      b.innerHTML = `<span>${c.emoji}</span> ${c.label}`;
      b.addEventListener('pointerdown', () => {
        pickerCat = c.id;
        playSoundEffect('pop');
        renderPicker();
      });
      pickerCats.appendChild(b);
    });

    const done = readSet(DONE_KEY);
    const started = readSet(STARTED_KEY);
    const open = unlockedCount(done);
    const doneLines = LINE_PAGES.filter((p) => done.has(p.key)).length;
    document.getElementById('pickerStars').textContent = `⭐ ${doneLines} / ${LINE_PAGES.length}`;

    pickerGrid.innerHTML = '';
    const list = pickerCat === 'all' ? ALL_PAGES : ALL_PAGES.filter((p) => p.cat === pickerCat);
    list.forEach((p) => {
      const idx = LINE_PAGES.indexOf(p);
      const locked = idx >= open;
      const card = document.createElement('button');
      card.className = 'picker-card' + (currentPage && currentPage.key === p.key ? ' active' : '') + (locked ? ' locked' : '');
      const thumb = p.thumb
        ? `<img class="pc-thumb" src="${p.thumb}" alt="" draggable="false" />`
        : `<div class="pc-thumb pc-emoji">${p.emoji}</div>`;
      let badges = '';
      let label = p.name;
      if (locked) {
        const need = Math.ceil((idx + 1 - FREE_PAGES) / PAGES_PER_DONE) - doneLines;
        badges = '<span class="pc-lock">🔒</span>';
        label = `Finis encore ${need} dessin${need > 1 ? 's' : ''}`;
      } else {
        if (done.has(p.key)) badges += '<span class="pc-done">⭐</span>';
        else if (started.has(p.key)) badges += '<span class="pc-started">🖍️</span>';
      }
      card.innerHTML = `${thumb}${badges}<div class="pc-name">${label}</div>`;
      card.addEventListener('pointerup', () => {
        if (locked) {
          playSoundEffect('undo');
          showToast('🔒 Finis un autre dessin pour ouvrir celui-ci !');
          return;
        }
        closePicker();
        playSoundEffect('magic');
        openPage(p);
      });
      pickerGrid.appendChild(card);
    });
  }

  function openPicker() {
    saveNow();
    renderPicker();
    pickerOverlay.classList.add('visible');
    playSoundEffect('pop');
  }

  function closePicker() {
    pickerOverlay.classList.remove('visible');
  }

  document.getElementById('openPickerBtn').addEventListener('pointerdown', openPicker);
  document.getElementById('pickerClose').addEventListener('pointerdown', closePicker);

  // --- Impression du dessin vierge (pour colorier aux feutres) ---
  document.getElementById('printBtn').addEventListener('click', () => {
    if (!currentPage || currentPage.kind !== 'line') {
      showToast('🖨️ Ouvre d’abord un dessin !');
      return;
    }
    const img = document.getElementById('printImg');
    img.onload = () => window.print();
    img.src = currentPage.lineUrl;
    if (img.complete) window.print();
  });

  // --- Initialisation des contrôles du Mode Coloriage ---
  function initColoringUI() {
    renderPalette();

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => setPlayMode(btn.dataset.play));
    });

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        selectTool(btn.dataset.tool);
        if (btn.dataset.tool === 'magicreveal') {
          playSoundEffect('magic');
          showToast(zones ? '🪄 Touche une zone : elle prend la couleur du modèle !' : '🪄 Dessine en arc-en-ciel !');
        } else if (btn.dataset.tool === 'brush' && zones && state.guard) {
          showToast('🖌️ Ton pinceau ne déborde pas !');
        }
      });
    });

    document.querySelectorAll('.size-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.brushSize = parseInt(btn.dataset.size, 10);
        playSoundEffect('pop');
      });
    });

    document.querySelectorAll('.pattern-btn').forEach((btn) => {
      btn.style.setProperty('--pc', state.currentColor);
      btn.addEventListener('pointerdown', () => {
        document.querySelectorAll('.pattern-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.pattern = btn.dataset.pattern;
        if (state.currentTool !== 'fill') selectTool('fill');
        playSoundEffect('pop');
        showToast(state.pattern === 'none' ? '🪣 Couleur unie' : '✨ Le pot remplit avec un motif !');
      });
    });

    const guardBtn = document.getElementById('guardBtn');
    const refreshGuard = () => {
      guardBtn.classList.toggle('on', state.guard);
      guardBtn.querySelector('.guard-state').textContent = state.guard ? 'OUI' : 'NON';
    };
    guardBtn.addEventListener('pointerdown', () => {
      state.guard = !state.guard;
      refreshGuard();
      playSoundEffect('pop');
      showToast(state.guard ? '🛡️ Le pinceau reste dans la zone' : '🖌️ Le pinceau peut déborder');
    });
    refreshGuard();

    const stickerGrid = document.getElementById('stickerGrid');
    STICKERS.forEach((st, idx) => {
      const item = document.createElement('button');
      item.className = 'sticker-item' + (idx === 0 ? ' active' : '');
      item.textContent = st;
      item.addEventListener('pointerdown', () => {
        document.querySelectorAll('.sticker-item').forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        state.currentSticker = st;
        playSoundEffect('pop');
      });
      stickerGrid.appendChild(item);
    });

    document.getElementById('undoBtn').addEventListener('pointerdown', restoreUndoState);
    document.getElementById('clearBtn').addEventListener('pointerdown', () => {
      saveUndoState();
      whitePaper();
      celebrated = false;
      if (zones) zones.touched.fill(0);
      if (numberMode()) autoFillSmallZones();
      refreshNumDone();
      compositeCanvas();
      scheduleSave();
      updateProgress();
      if (currentPage) {
        const started = readSet(STARTED_KEY);
        started.delete(currentPage.key);
        writeSet(STARTED_KEY, started);
      }
      playSoundEffect('undo');
      showToast('🔄 Dessin tout propre !');
    });
    document.getElementById('saveDrawingBtn').addEventListener('pointerdown', (e) => {
      saveCanvasToGallery(exportDrawing(), currentPage ? currentPage.name : 'Coloriage');
      spawnFloatingBurst(e.clientX, e.clientY, ['📸', '🌟', '🎉', '🦖']);
    });

    // Autocollants déjà gagnés
    const done = readSet(DONE_KEY);
    Promise.all(LINE_PAGES.filter((p) => done.has(p.key)).map((p) =>
      Store.get(`sticker:${p.key}`).then((url) => { if (url) myStickers.set(p.key, { name: p.name, url }); })
    )).then(refreshStickerTray);

    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === 'num' || m === 'calc') state.playMode = m;
    } catch (_) {}

    // On rouvre le dernier dessin ; la première fois, on propose le choix
    let last = null;
    try { last = localStorage.getItem(LAST_KEY); } catch (_) {}
    const lastPage = ALL_PAGES.find((p) => p.key === last);
    if (lastPage) openPage(lastPage);
    else openPage(ALL_PAGES[0]).then(() => setTimeout(openPicker, 300));
  }

  function selectTool(toolName) {
    state.currentTool = toolName;
    document.querySelectorAll('.tool-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tool === toolName);
    });
    document.getElementById('stickerDrawer').classList.toggle('visible', toolName === 'stamp');
    playSoundEffect('pop');
  }

  // ==========================================================================
  // 4. MODE 2 : MON MONDE DINO & HÉROS (Scène Interactive Tactile)
  // ==========================================================================
  const worldStage = document.getElementById('worldStage');
  const worldActorsLayer = document.getElementById('worldActorsLayer');

  function initWorldUI() {
    const tray = document.getElementById('worldTray');
    refreshStickerTray();
    WORLD_ITEMS.forEach((item) => {
      const card = document.createElement('button');
      card.className = 'spawn-card';
      if (item.imgKey && CHAR_IMGS[item.imgKey]) {
        card.innerHTML = `<img class="spawn-thumb" src="${CHAR_IMGS[item.imgKey]}" alt="${item.label}" /><span class="spawn-label">${item.label}</span>`;
      } else {
        card.innerHTML = `<span class="spawn-emoji">${item.emoji}</span><span class="spawn-label">${item.label}</span>`;
      }
      card.addEventListener('pointerdown', () => {
        spawnWorldActor(item);
      });
      tray.appendChild(card);
    });

    document.querySelectorAll('.world-bg-picker .bg-chip').forEach((chip) => {
      chip.addEventListener('pointerdown', () => {
        document.querySelectorAll('.world-bg-picker .bg-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        worldStage.className = `world-stage ${chip.dataset.bg}`;
        state.worldBg = chip.dataset.bg;
        playSoundEffect('magic');
      });
    });

    const danceBtn = document.getElementById('worldDanceBtn');
    danceBtn.addEventListener('pointerdown', () => {
      state.worldDancing = !state.worldDancing;
      document.querySelectorAll('.world-actor').forEach((el) => {
        el.classList.toggle('dancing', state.worldDancing);
      });
      if (state.worldDancing) {
        playSoundEffect('magic');
        speak('Tout le monde danse !');
        showToast('💃 Youpi ! Tout le monde danse !');
      } else {
        playSoundEffect('pop');
      }
    });

    document.getElementById('actorBiggerBtn').addEventListener('pointerdown', () => modifySelectedActor('scale', 0.22));
    document.getElementById('actorSmallerBtn').addEventListener('pointerdown', () => modifySelectedActor('scale', -0.22));
    document.getElementById('actorFlipBtn').addEventListener('pointerdown', () => modifySelectedActor('flip'));
    document.getElementById('actorDeleteBtn').addEventListener('pointerdown', () => modifySelectedActor('delete'));

    document.getElementById('worldSaveBtn').addEventListener('pointerdown', (e) => {
      captureWorldSnapshot();
      spawnFloatingBurst(e.clientX, e.clientY, ['📸', '🏰', '🦖', '🌟']);
    });

    // Personnages présents au démarrage
    spawnWorldActor({ imgKey: 'stitch', label: 'Stitch', sound: 'magic' }, 28, 65, 1.05, true);
    spawnWorldActor({ emoji: '🦖', label: 'T-Rex', sound: 'roar' }, 54, 68, 1.15, true);
    spawnWorldActor({ emoji: '🥚', label: 'Œuf Surprise', sound: 'egg' }, 76, 72, 1.0, true);
  }

  // Les coloriages finis de l'enfant, en tête du tiroir
  function refreshStickerTray() {
    const tray = document.getElementById('worldTray');
    tray.querySelectorAll('.sticker-card').forEach((c) => c.remove());
    const first = tray.firstChild;
    myStickers.forEach((st, key) => {
      const imgKey = `sticker-${key}`;
      const im = new Image();
      im.src = st.url;
      loadedImages[imgKey] = im;
      const card = document.createElement('button');
      card.className = 'spawn-card sticker-card';
      card.innerHTML = `<img class="spawn-thumb" src="${st.url}" alt="" /><span class="spawn-label">⭐ ${st.name}</span>`;
      card.addEventListener('pointerdown', () => {
        spawnWorldActor({ imgKey, src: st.url, label: st.name, sound: 'magic' });
      });
      tray.insertBefore(card, first);
    });
  }

  function spawnWorldActor(item, xPct = null, yPct = null, scale = 1, silent = false) {
    const id = 'actor_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const imgSrc = item.src || (item.imgKey && CHAR_IMGS[item.imgKey] ? CHAR_IMGS[item.imgKey] : null);

    if (imgSrc && !loadedImages[item.imgKey]) {
      const im = new Image();
      im.src = imgSrc;
      loadedImages[item.imgKey] = im;
    }

    const actor = {
      id,
      emoji: item.emoji || null,
      imgKey: item.imgKey || null,
      imgSrc,
      sound: item.sound || 'pop',
      x: xPct !== null ? xPct : 25 + Math.random() * 50,
      y: yPct !== null ? yPct : 45 + Math.random() * 35,
      scale,
      flip: false
    };
    state.actors.push(actor);

    const el = document.createElement('div');
    el.className = 'world-actor' + (state.worldDancing ? ' dancing' : '');
    el.id = id;
    if (actor.imgSrc) {
      el.innerHTML = `<img class="actor-img" src="${actor.imgSrc}" alt="" />`;
    } else {
      el.innerHTML = `<div class="actor-emoji">${actor.emoji}</div>`;
    }
    updateActorDOM(actor, el);

    let startX = 0;
    let startY = 0;
    let moved = false;

    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      selectActor(actor.id);
      startX = e.clientX;
      startY = e.clientY;
      moved = false;
      playSoundEffect(actor.sound || 'pop');
    });

    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;

      const rect = worldStage.getBoundingClientRect();
      actor.x = Math.max(6, Math.min(94, ((e.clientX - rect.left) / rect.width) * 100));
      actor.y = Math.max(12, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
      updateActorDOM(actor, el);
    });

    el.addEventListener('pointerup', (e) => {
      if (!moved) {
        if (actor.emoji === '🥚') {
          const surprises = ['stitch', 'olaf', 'winnie', 'simba_nala'];
          const pick = surprises[Math.floor(Math.random() * surprises.length)];
          if (CHAR_IMGS[pick]) {
            actor.emoji = null;
            actor.imgKey = pick;
            actor.imgSrc = CHAR_IMGS[pick];
            el.innerHTML = `<img class="actor-img" src="${actor.imgSrc}" alt="" />`;
            updateActorDOM(actor, el);
          } else {
            actor.emoji = '🦖';
            el.querySelector('.actor-emoji').textContent = '🦖';
          }
          playSoundEffect('magic');
          speak('Oh ! L’œuf magique a éclos !');
          showToast('🐣 Surprise ! Regarde qui est sorti de l’œuf !');
          spawnFloatingBurst(e.clientX, e.clientY, ['🐣', '✨', '🌟', '🎉']);
        } else if (actor.emoji === '🌋') {
          playSoundEffect('volcano');
          spawnFloatingBurst(e.clientX, e.clientY - 30, ['🔥', '☄️', '✨', '🌋']);
        }
      }
    });

    worldActorsLayer.appendChild(el);
    selectActor(actor.id);
    if (!silent) {
      playSoundEffect(actor.sound || 'pop');
    }
  }

  function updateActorDOM(actor, el = document.getElementById(actor.id)) {
    if (!el) return;
    el.style.left = `${actor.x}%`;
    el.style.top = `${actor.y}%`;
    const inner = el.querySelector('.actor-emoji, .actor-img');
    if (inner) {
      const flipScale = actor.flip ? -actor.scale : actor.scale;
      inner.style.transform = `scale(${flipScale}, ${actor.scale})`;
    }
  }

  function selectActor(id) {
    state.selectedActorId = id;
    document.querySelectorAll('.world-actor').forEach((el) => {
      el.classList.toggle('selected', el.id === id);
    });
  }

  function modifySelectedActor(action, delta = 0) {
    const actor = state.actors.find((a) => a.id === state.selectedActorId);
    if (!actor) {
      showToast('Touche d’abord un personnage !');
      return;
    }
    if (action === 'scale') {
      actor.scale = Math.max(0.55, Math.min(2.4, actor.scale + delta));
      updateActorDOM(actor);
      playSoundEffect('pop');
    } else if (action === 'flip') {
      actor.flip = !actor.flip;
      updateActorDOM(actor);
      playSoundEffect('pop');
    } else if (action === 'delete') {
      const el = document.getElementById(actor.id);
      if (el) el.remove();
      state.actors = state.actors.filter((a) => a.id !== actor.id);
      state.selectedActorId = state.actors.length ? state.actors[state.actors.length - 1].id : null;
      selectActor(state.selectedActorId);
      playSoundEffect('undo');
    }
  }

  function captureWorldSnapshot() {
    const snap = document.createElement('canvas');
    snap.width = 900;
    snap.height = 600;
    const sCtx = snap.getContext('2d');

    const grad = sCtx.createLinearGradient(0, 0, 0, 600);
    if (state.worldBg === 'bg-magic') {
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(0.6, '#fbcfe8');
      grad.addColorStop(0.6, '#a7f3d0');
      grad.addColorStop(1, '#34d399');
    } else if (state.worldBg === 'bg-night') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.6, '#4338ca');
      grad.addColorStop(0.6, '#065f46');
      grad.addColorStop(1, '#064e3b');
    } else if (state.worldBg === 'bg-volcano') {
      grad.addColorStop(0, '#fb923c');
      grad.addColorStop(0.58, '#fde047');
      grad.addColorStop(0.58, '#84cc16');
      grad.addColorStop(1, '#3f6212');
    } else {
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.58, '#bae6fd');
      grad.addColorStop(0.58, '#4ade80');
      grad.addColorStop(1, '#16a34a');
    }
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 900, 600);

    sCtx.fillStyle = '#fde047';
    sCtx.beginPath();
    sCtx.arc(790, 90, 48, 0, Math.PI * 2);
    sCtx.fill();

    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    state.actors.forEach((a) => {
      sCtx.save();
      sCtx.translate((a.x / 100) * 900, (a.y / 100) * 600);
      sCtx.scale(a.flip ? -a.scale : a.scale, a.scale);
      if (a.imgKey && loadedImages[a.imgKey]) {
        const im = loadedImages[a.imgKey];
        const k = im.naturalWidth ? Math.min(110 / im.naturalWidth, 110 / im.naturalHeight) : 0;
        if (k) sCtx.drawImage(im, (-im.naturalWidth * k) / 2, (-im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
      } else if (a.emoji) {
        sCtx.font = '72px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        sCtx.fillText(a.emoji, 0, 0);
      }
      sCtx.restore();
    });

    saveCanvasToGallery(snap.toDataURL('image/png'), 'Monde Magique');
  }

  // ==========================================================================
  // 5. MODE 3 : L'ORCHESTRE DES DINOS (Musique Tactile & Glissando)
  // ==========================================================================
  function initMusicUI() {
    const pianoContainer = document.getElementById('pianoContainer');

    PIANO_NOTES.forEach((n, index) => {
      const key = document.createElement('button');
      key.className = 'piano-key';
      key.style.background = n.color;
      key.dataset.index = index;
      key.innerHTML = `<span class="key-icon">${n.icon}</span><span class="key-name">${n.note}</span>`;

      key.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        triggerPianoKey(index, key, e.clientX, e.clientY);
      });

      key.addEventListener('pointerenter', (e) => {
        if (e.buttons === 1 || e.pressure > 0) {
          triggerPianoKey(index, key, e.clientX, e.clientY);
        }
      });

      pianoContainer.appendChild(key);
    });

    document.querySelectorAll('.inst-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        document.querySelectorAll('.inst-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.instrument = btn.dataset.inst;
        playInstrumentNote(523.25);
      });
    });

    document.querySelectorAll('.dino-musician').forEach((musician) => {
      musician.addEventListener('pointerdown', (e) => {
        musician.classList.add('playing');
        setTimeout(() => musician.classList.remove('playing'), 500);
        const member = musician.dataset.member;
        if (member === 'rex') {
          playSoundEffect('roar');
        } else if (member === 'unicorn') {
          playSoundEffect('magic');
        } else if (member === 'diplo') {
          playSoundEffect('fill');
        } else {
          playSoundEffect('fire');
        }
        spawnFloatingBurst(e.clientX, e.clientY, ['🎵', '🎶', '✨', '🌟']);
      });
    });

    document.querySelectorAll('.beat-btn[data-beat]').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        const beat = btn.dataset.beat;
        if (state.activeBeat === beat) {
          stopBackgroundBeat();
        } else {
          startBackgroundBeat(beat, btn);
        }
      });
    });

    const recordBtn = document.getElementById('recordSongBtn');
    const playBtn = document.getElementById('playSongBtn');

    recordBtn.addEventListener('pointerdown', () => {
      if (!state.isRecording) {
        state.isRecording = true;
        state.recordedNotes = [];
        state.recordStartTime = performance.now();
        recordBtn.classList.add('active');
        recordBtn.textContent = '⏹️ Stop';
        showToast('🔴 J’écoute ta chanson ! Joue des notes !');
      } else {
        state.isRecording = false;
        recordBtn.classList.remove('active');
        recordBtn.textContent = '🔴 Enregistrer';
        if (state.recordedNotes.length > 0) {
          playBtn.style.display = 'flex';
          showToast('🎵 Chanson enregistrée ! Touche ▶️ Écouter !');
          speak('Bravo ! Touche Écouter pour entendre ta chanson !');
        }
      }
    });

    playBtn.addEventListener('pointerdown', () => {
      if (state.recordedNotes.length === 0) return;
      showToast('🎶 Concert Magique en cours !');
      const keys = document.querySelectorAll('.piano-key');
      state.recordedNotes.forEach((item) => {
        setTimeout(() => {
          const keyEl = keys[item.index];
          const rect = keyEl.getBoundingClientRect();
          triggerPianoKey(item.index, keyEl, rect.left + rect.width / 2, rect.top, false);
        }, item.time);
      });
    });
  }

  function triggerPianoKey(index, keyEl, clientX, clientY, recordable = true) {
    const noteObj = PIANO_NOTES[index];
    if (!noteObj) return;

    playInstrumentNote(noteObj.freq);
    keyEl.classList.add('pressed');
    setTimeout(() => keyEl.classList.remove('pressed'), 180);

    const musicians = document.querySelectorAll('.dino-musician');
    const m = musicians[index % musicians.length];
    if (m) {
      m.classList.add('playing');
      setTimeout(() => m.classList.remove('playing'), 260);
    }

    spawnFloatingBurst(clientX, clientY, ['🎵', '🎶', noteObj.icon]);

    if (recordable && state.isRecording) {
      state.recordedNotes.push({
        index,
        time: Math.min(15000, performance.now() - state.recordStartTime)
      });
    }
  }

  function startBackgroundBeat(beatName, btnEl) {
    stopBackgroundBeat();
    state.activeBeat = beatName;
    btnEl.classList.add('active');

    let step = 0;
    const jungleFreqs = [130.81, 196.0, 164.81, 196.0, 146.83, 220.0, 196.0, 164.81];
    const fairyFreqs = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0, 783.99];

    state.beatInterval = setInterval(() => {
      if (!state.soundEnabled) return;
      const list = beatName === 'jungle' ? jungleFreqs : fairyFreqs;
      const f = list[step % list.length];
      playTone(f, 0.22, beatName === 'jungle' ? 'triangle' : 'sine', 0.14);

      const musicians = document.querySelectorAll('.dino-musician');
      musicians.forEach((m, idx) => {
        m.classList.toggle('playing', idx === step % musicians.length);
      });
      step++;
    }, 320);
  }

  function stopBackgroundBeat() {
    if (state.beatInterval) {
      clearInterval(state.beatInterval);
      state.beatInterval = null;
    }
    state.activeBeat = null;
    document.querySelectorAll('.beat-btn[data-beat]').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.dino-musician').forEach((m) => m.classList.remove('playing'));
  }

  // ==========================================================================
  // 6. MODE 4 : MON ALBUM MAGIQUE (Galerie & Téléchargement)
  // ==========================================================================
  const STORAGE_KEY = 'dino_magique_gallery_v1';

  function loadGalleryFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state.gallery = JSON.parse(raw);
      }
    } catch (_) {
      state.gallery = [];
    }
    updateGalleryBadge();
  }

  function saveGalleryToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.gallery.slice(0, 20)));
    } catch (_) {
      state.gallery = state.gallery.slice(0, 8);
    }
    updateGalleryBadge();
  }

  function updateGalleryBadge() {
    const badge = document.getElementById('galleryCount');
    if (badge) badge.textContent = state.gallery.length;
  }

  function saveCanvasToGallery(dataUrl, title) {
    state.gallery.unshift({
      id: Date.now(),
      title,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dataUrl
    });
    saveGalleryToStorage();
    playSoundEffect('camera');
    speak('Magnifique ! Ton dessin est dans ton album !');
    showToast('📸 Sauvegardé dans Mon Album ! 🌟');
  }

  function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';

    if (state.gallery.length === 0) {
      grid.innerHTML = `
        <div class="empty-gallery" style="grid-column: 1 / -1; padding: 40px;">
          <div style="font-size: 4rem;">🦖🎨</div>
          <h3>Ton album est encore vide !</h3>
          <p>Touche le bouton <strong>📸 Garder !</strong> quand tu fais un coloriage ou un monde magique.</p>
        </div>
      `;
      return;
    }

    state.gallery.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.innerHTML = `
        <img src="${item.dataUrl}" alt="${item.title}" />
        <div class="gallery-card-footer">
          <span style="font-weight:800; font-size:0.85rem;">${item.title} (${item.date})</span>
          <div style="display:flex; gap:6px;">
            <a href="${item.dataUrl}" download="atelier-magique-${item.id}.${item.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png'}" class="bg-chip" style="text-decoration:none;">⬇️</a>
            <button class="bg-chip btn-del-img" style="background:#fee2e2;">🗑️</button>
          </div>
        </div>
      `;
      card.querySelector('.btn-del-img').addEventListener('pointerdown', () => {
        state.gallery = state.gallery.filter((g) => g.id !== item.id);
        saveGalleryToStorage();
        renderGallery();
        playSoundEffect('undo');
      });
      grid.appendChild(card);
    });
  }

  document.getElementById('clearGalleryBtn').addEventListener('pointerdown', () => {
    state.gallery = [];
    saveGalleryToStorage();
    renderGallery();
    playSoundEffect('undo');
    showToast('Album vidé !');
  });

  // ==========================================================================
  // DÉMARRAGE DE L'APPLICATION
  // ==========================================================================
  loadGalleryFromStorage();
  initColoringUI();
  initWorldUI();
  initMusicUI();

  // Mode hors-ligne : le jeu reste disponible sans internet après la première visite
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
