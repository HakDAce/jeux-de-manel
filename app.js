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

  // Images personnelles (photos) proposées dans « Mes images »
  const PHOTO_TEMPLATES = [
    { name: 'Stitch', imgKey: 'stitch' },
    { name: 'Vaiana', imgKey: 'vaiana' },
    { name: 'Maui', imgKey: 'maui' },
    { name: 'Olaf', imgKey: 'olaf' },
    { name: 'Raiponce', imgKey: 'raiponce' },
    { name: 'Mickey', imgKey: 'mickey' },
    { name: 'Winnie', imgKey: 'winnie' },
    { name: 'Bob', imgKey: 'bob' },
    { name: 'Simba & Nala', imgKey: 'simba_nala' },
    { name: 'Roi Lion', imgKey: 'roi_lion' },
    { name: 'Timon & Pumbaa', imgKey: 'timon_pumbaa' },
    { name: 'Jasmine', imgKey: 'jasmine' },
    { name: 'Aladdin', imgKey: 'aladdin' },
    { name: 'Princesse Jasmine', imgKey: 'jasmine_portrait' }
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
      speak('Touche le bouton Dessins pour choisir ton coloriage. Choisis une couleur à droite, puis touche une zone avec le pot magique. Quand tout est colorié, tu gagnes des étoiles !');
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
  // 3. MODE 1 : COLORIAGE (dessins au trait + zones magiques)
  // ==========================================================================
  const W = 900;
  const H = 650;
  const N = W * H;
  const LINE_RGB = [30, 27, 75];

  const PAGES = window.COLORING_PAGES || [];
  const CATS = window.COLORING_CATEGORIES || [];
  const PHOTO_PAGES = PHOTO_TEMPLATES.filter((t) => CHAR_IMGS[t.imgKey]);
  const DONE_KEY = 'manel_coloriages_finis_v1';

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
  const [refCanvas, refCtx] = makeLayer();     // modèle en couleurs (baguette)
  const [maskCanvas, maskCtx] = makeLayer();   // zone autorisée pour le pinceau
  const [strokeCanvas, strokeCtx] = makeLayer();

  // La feuille garde ses proportions (pas de dessin écrasé) quelle que soit la tablette
  const canvasWrapper = document.getElementById('canvasWrapper');
  function fitCanvas() {
    const r = canvasWrapper.getBoundingClientRect();
    const availW = r.width - 16;
    const availH = r.height - 16;
    if (availW <= 0 || availH <= 0) return;
    const sc = Math.min(availW / W, availH / H);
    paintCanvas.style.width = `${Math.floor(W * sc)}px`;
    paintCanvas.style.height = `${Math.floor(H * sc)}px`;
  }
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(canvasWrapper);
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

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
  let refData = null;
  const pageMemory = {};

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  function compositeCanvas() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(colorCanvas, 0, 0);
    if (currentPage && currentPage.kind !== 'blank') ctx.drawImage(lineCanvas, 0, 0);
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
    const [t, tc] = makeLayer();
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
    zones = { labels, owner, sizes, big: big.filter((L) => L !== largest), touched: new Uint8Array(sizes.length) };
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

  // --- Motifs (pois, rayures, étoiles, cœurs) ---
  const TILE = 44;
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
    } else if (pattern === 'stars') {
      c.font = '18px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('★', 11, 12);
      c.fillText('★', 33, 34);
    } else if (pattern === 'hearts') {
      c.font = '17px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('♥', 11, 12);
      c.fillText('♥', 33, 34);
    }
    return c.getImageData(0, 0, TILE, TILE).data;
  }

  function currentRgb() {
    if (state.isRainbowColor) {
      state.rainbowHue = (state.rainbowHue + 47) % 360;
      return hslToRgb(state.rainbowHue, 90, 60);
    }
    return hexToRgba(state.currentColor);
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

  // --- Pot magique : remplit toute la zone touchée ---
  function fillZone(L, mode) {
    if (!L) return false;
    saveUndoState();
    const img = colorCtx.getImageData(0, 0, W, H);
    const d = img.data;
    const { labels, owner } = zones;
    const rgb = mode === 'model' ? null : currentRgb();
    const tile = mode === 'model' || state.pattern === 'none' ? null : makePatternTile(rgb, state.pattern);

    for (let p = 0; p < N; p++) {
      if (labels[p] !== L && !(labels[p] === 0 && owner[p] === L)) continue;
      const i = p * 4;
      if (mode === 'model') {
        d[i] = refData[i]; d[i + 1] = refData[i + 1]; d[i + 2] = refData[i + 2];
      } else if (tile) {
        const t = (((p / W) | 0) % TILE * TILE + (p % W) % TILE) * 4;
        d[i] = tile[t]; d[i + 1] = tile[t + 1]; d[i + 2] = tile[t + 2];
      } else {
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
      }
      d[i + 3] = 255;
    }
    colorCtx.putImageData(img, 0, 0);
    zones.touched[L] = 1;
    compositeCanvas();
    scheduleProgress();
    return true;
  }

  // Page blanche : remplissage simple de la tache de couleur touchée
  function floodFillBlank(sx, sy) {
    sx = Math.floor(sx);
    sy = Math.floor(sy);
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
    return true;
  }

  // --- Progression et fête quand le dessin est fini ---
  let progressTimer = null;
  function scheduleProgress() {
    clearTimeout(progressTimer);
    progressTimer = setTimeout(updateProgress, 250);
  }

  function updateProgress() {
    if (!zones || !zones.big.length) {
      progressPill.classList.remove('visible');
      return;
    }
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
    const pct = done / total;
    const stars = Math.round(pct * 5);
    progressPill.innerHTML = `<span class="pp-stars">${'★'.repeat(stars)}<span class="pp-off">${'★'.repeat(5 - stars)}</span></span><span class="pp-num">${Math.round(pct * 100)} %</span>`;
    progressPill.classList.add('visible');
    if (pct >= 0.85 && !celebrated) {
      celebrated = true;
      setTimeout(celebrate, 400);
    }
  }

  function getDoneSet() {
    try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]')); } catch (_) { return new Set(); }
  }

  function markDone(id) {
    const s = getDoneSet();
    s.add(id);
    try { localStorage.setItem(DONE_KEY, JSON.stringify([...s])); } catch (_) {}
  }

  const celebrateOverlay = document.getElementById('celebrateOverlay');
  function celebrate() {
    if (currentPage) markDone(currentPage.key);
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

  document.getElementById('celebrateSave').addEventListener('pointerdown', () => {
    saveCanvasToGallery(paintCanvas.toDataURL('image/jpeg', 0.88), currentPage ? currentPage.name : 'Coloriage');
    celebrateOverlay.classList.remove('visible');
  });
  document.getElementById('celebrateClose').addEventListener('pointerdown', () => {
    celebrateOverlay.classList.remove('visible');
    playSoundEffect('pop');
  });

  // --- Photo -> coloriage par zones (posterisation) ---
  function photoToColoring(img) {
    refCtx.fillStyle = '#ffffff';
    refCtx.fillRect(0, 0, W, H);
    const pad = 20;
    const sc = Math.min((W - pad * 2) / img.width, (H - pad * 2) / img.height);
    const dw = img.width * sc;
    const dh = img.height * sc;
    refCtx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const src = refCtx.getImageData(0, 0, W, H);
    const d = src.data;

    // 1. Réduire l'image à 8 couleurs (k-moyennes sur un échantillon)
    const K = 8;
    const sample = [];
    for (let s = 0; s < 5000; s++) {
      const p = ((Math.random() * N) | 0) * 4;
      sample.push([d[p], d[p + 1], d[p + 2]]);
    }
    const centers = [sample[0]];
    while (centers.length < K) {
      let best = sample[0];
      let bestD = -1;
      for (const px of sample) {
        let m = Infinity;
        for (const c of centers) m = Math.min(m, (px[0] - c[0]) ** 2 + (px[1] - c[1]) ** 2 + (px[2] - c[2]) ** 2);
        if (m > bestD) { bestD = m; best = px; }
      }
      centers.push(best.slice());
    }
    const nearest = (r, g, b) => {
      let bi = 0;
      let bd = Infinity;
      for (let k = 0; k < K; k++) {
        const c = centers[k];
        const dd = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
        if (dd < bd) { bd = dd; bi = k; }
      }
      return bi;
    };
    for (let it = 0; it < 8; it++) {
      const acc = centers.map(() => [0, 0, 0, 0]);
      for (const px of sample) {
        const k = nearest(px[0], px[1], px[2]);
        acc[k][0] += px[0]; acc[k][1] += px[1]; acc[k][2] += px[2]; acc[k][3]++;
      }
      acc.forEach((a, k) => { if (a[3]) centers[k] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
    }
    let idx = new Uint8Array(N);
    for (let p = 0; p < N; p++) idx[p] = nearest(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);

    // 2. Lisser (filtre majoritaire) pour supprimer les petits détails
    const cnt = new Int32Array(K);
    for (let pass = 0; pass < 3; pass++) {
      const out = new Uint8Array(N);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          cnt.fill(0);
          for (let dy = -2; dy <= 2; dy++) {
            const yy = Math.min(H - 1, Math.max(0, y + dy));
            for (let dx = -2; dx <= 2; dx++) {
              const xx = Math.min(W - 1, Math.max(0, x + dx));
              cnt[idx[yy * W + xx]]++;
            }
          }
          let bk = 0;
          for (let k = 1; k < K; k++) if (cnt[k] > cnt[bk]) bk = k;
          out[y * W + x] = bk;
        }
      }
      idx = out;
    }

    // 3. Modèle aux couleurs à plat + traits entre les zones
    const lineImg = lineCtx.createImageData(W, H);
    const l = lineImg.data;
    for (let p = 0; p < N; p++) {
      const c = centers[idx[p]];
      d[p * 4] = c[0]; d[p * 4 + 1] = c[1]; d[p * 4 + 2] = c[2];
      const x = p % W;
      const edge = (x < W - 1 && idx[p] !== idx[p + 1]) || (p < N - W && idx[p] !== idx[p + W]);
      if (edge) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const q = p + dy * W + dx;
            if (q < 0 || q >= N) continue;
            l[q * 4] = LINE_RGB[0]; l[q * 4 + 1] = LINE_RGB[1]; l[q * 4 + 2] = LINE_RGB[2]; l[q * 4 + 3] = 255;
          }
        }
      }
    }
    refCtx.putImageData(src, 0, 0);
    lineCtx.putImageData(lineImg, 0, 0);
  }

  // --- Chargement d'un dessin ---
  function rememberCurrentPage() {
    if (currentPage) {
      pageMemory[currentPage.key] = {
        img: colorCtx.getImageData(0, 0, W, H),
        touched: zones ? zones.touched : null,
        celebrated
      };
    }
  }

  async function openPage(page) {
    rememberCurrentPage();
    currentPage = page;
    state.undoStack = [];
    zones = null;
    refData = null;
    lineCtx.clearRect(0, 0, W, H);
    progressPill.classList.remove('visible');
    modelPreviewCard.classList.remove('visible', 'zoomed');
    document.getElementById('currentPageName').textContent = page.name;

    try {
      if (page.kind === 'line') {
        const [lineImg, modelImg] = await Promise.all([loadImage(page.lineUrl), loadImage(page.modelUrl)]);
        if (currentPage !== page) return;
        imageToLines(lineImg);
        refCtx.drawImage(modelImg, 0, 0, W, H);
        modelPreviewImg.src = page.modelUrl;
        modelPreviewCard.classList.add('visible');
      } else if (page.kind === 'photo') {
        showToast('⏳ Je prépare ton coloriage...');
        const img = await loadImage(page.src);
        if (currentPage !== page) return;
        await new Promise((r) => setTimeout(r, 30));
        photoToColoring(img);
        modelPreviewImg.src = page.src;
        modelPreviewCard.classList.add('visible');
      }
    } catch (_) {
      showToast('Oups, ce dessin ne veut pas s’ouvrir !');
    }

    if (page.kind !== 'blank') {
      computeZones();
      refData = refCtx.getImageData(0, 0, W, H).data;
    }

    const mem = pageMemory[page.key];
    if (mem) {
      colorCtx.putImageData(mem.img, 0, 0);
      if (zones && mem.touched) zones.touched = mem.touched;
      celebrated = mem.celebrated;
    } else {
      whitePaper();
      celebrated = false;
    }
    compositeCanvas();
    updateProgress();
    if (page.speak) speak(page.speak);
  }

  // --- Interactions tactiles sur la toile ---
  let isDrawing = false;
  let lastPt = null;
  let clipActive = false;

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

  paintCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    paintCanvas.setPointerCapture(e.pointerId);
    const pt = getCanvasCoords(e);
    const tool = state.currentTool;

    if (tool === 'fill' || (tool === 'magicreveal' && zones)) {
      let ok;
      if (zones) {
        ok = fillZone(zoneAt(pt.x, pt.y), tool === 'magicreveal' ? 'model' : 'color');
      } else {
        ok = floodFillBlank(pt.x, pt.y);
      }
      if (ok) {
        playSoundEffect(tool === 'magicreveal' ? 'magic' : 'fill');
        spawnFloatingBurst(pt.screenX, pt.screenY, ['✨', '🌟', '🎨']);
      } else {
        playSoundEffect('pop');
      }
      return;
    }

    if (tool === 'stamp') {
      saveUndoState();
      colorCtx.save();
      colorCtx.font = `${state.brushSize * 2.2 + 28}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      colorCtx.textAlign = 'center';
      colorCtx.textBaseline = 'middle';
      colorCtx.fillText(state.currentSticker, pt.x, pt.y);
      colorCtx.restore();
      compositeCanvas();
      playSoundEffect('chime');
      spawnFloatingBurst(pt.screenX, pt.screenY, [state.currentSticker, '✨', '⭐']);
      return;
    }

    saveUndoState();
    prepareClip(pt);
    isDrawing = true;
    lastPt = pt;
    drawStrokeStep(pt, pt);
  });

  paintCanvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) {
      const pt = getCanvasCoords(ev);
      drawStrokeStep(lastPt, pt);
      lastPt = pt;
    }
  });

  function stopDrawing() {
    if (isDrawing) scheduleProgress();
    isDrawing = false;
    lastPt = null;
    clipActive = false;
  }

  paintCanvas.addEventListener('pointerup', stopDrawing);
  paintCanvas.addEventListener('pointercancel', stopDrawing);

  function drawStrokeStep(from, to) {
    let style;
    if (state.currentTool === 'eraser') {
      style = '#ffffff';
    } else if (state.currentTool === 'rainbow' || state.isRainbowColor || state.currentTool === 'magicreveal') {
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
  const customInput = document.getElementById('customImageInput');
  let pickerCat = 'all';

  const ALL_PAGES = [
    ...PAGES.map((p) => ({ ...p, key: p.id, kind: 'line', thumb: p.lineUrl })),
    { key: 'blank', name: 'Page blanche', kind: 'blank', cat: 'libre', emoji: '📄', speak: 'Page blanche, dessine ce que tu veux !' },
    ...PHOTO_PAGES.map((t) => ({ key: `photo-${t.imgKey}`, name: t.name, kind: 'photo', cat: 'photos', src: CHAR_IMGS[t.imgKey], thumb: CHAR_IMGS[t.imgKey], speak: t.name }))
  ];

  function renderPicker() {
    const cats = [{ id: 'all', label: 'Tout', emoji: '⭐' }, ...CATS, { id: 'photos', label: 'Mes images', emoji: '📷' }];
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

    const done = getDoneSet();
    pickerGrid.innerHTML = '';
    let list;
    if (pickerCat === 'all') list = ALL_PAGES.filter((p) => p.kind !== 'photo');
    else if (pickerCat === 'photos') list = ALL_PAGES.filter((p) => p.kind === 'photo');
    else list = ALL_PAGES.filter((p) => p.cat === pickerCat);

    if (pickerCat === 'photos') {
      const up = document.createElement('button');
      up.className = 'picker-card picker-upload';
      up.innerHTML = `<div class="pc-thumb pc-emoji">➕</div><div class="pc-name">Ma photo</div>`;
      up.addEventListener('pointerdown', () => customInput.click());
      pickerGrid.appendChild(up);
    }

    list.forEach((p) => {
      const card = document.createElement('button');
      card.className = 'picker-card' + (currentPage && currentPage.key === p.key ? ' active' : '');
      const thumb = p.thumb
        ? `<img class="pc-thumb ${p.kind === 'photo' ? 'pc-photo' : ''}" src="${p.thumb}" alt="" draggable="false" />`
        : `<div class="pc-thumb pc-emoji">${p.emoji}</div>`;
      const badge = done.has(p.key) ? '<span class="pc-done">⭐</span>' : '';
      const started = pageMemory[p.key] ? '<span class="pc-started">🖍️</span>' : '';
      card.innerHTML = `${thumb}${badge}${started}<div class="pc-name">${p.name}</div>`;
      card.addEventListener('pointerup', () => {
        closePicker();
        playSoundEffect('magic');
        openPage(p);
      });
      pickerGrid.appendChild(card);
    });
  }

  function openPicker() {
    renderPicker();
    pickerOverlay.classList.add('visible');
    playSoundEffect('pop');
  }

  function closePicker() {
    pickerOverlay.classList.remove('visible');
  }

  document.getElementById('openPickerBtn').addEventListener('pointerdown', openPicker);
  document.getElementById('pickerClose').addEventListener('pointerdown', closePicker);

  customInput.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      closePicker();
      openPage({ key: `upload-${Date.now()}`, name: 'Ma photo', kind: 'photo', src: reader.result });
      playSoundEffect('magic');
    };
    reader.readAsDataURL(file);
    customInput.value = '';
  });

  // --- Initialisation des contrôles du Mode Coloriage ---
  function initColoringUI() {
    const swatchesContainer = document.getElementById('colorSwatches');
    PALETTE.forEach((col) => {
      const btn = document.createElement('button');
      btn.className = 'color-swatch';
      btn.title = col.name;
      if (col.hex === 'RAINBOW') {
        btn.classList.add('rainbow-swatch');
        btn.textContent = '✨';
      } else {
        btn.style.backgroundColor = col.hex;
        if (col.hex === state.currentColor) btn.classList.add('active');
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
        showToast(state.pattern === 'none' ? '🪣 Couleur unie' : '✨ Le pot remplit avec des motifs !');
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
      compositeCanvas();
      updateProgress();
      playSoundEffect('undo');
      showToast('🔄 Dessin tout propre !');
    });
    document.getElementById('saveDrawingBtn').addEventListener('pointerdown', (e) => {
      saveCanvasToGallery(paintCanvas.toDataURL('image/jpeg', 0.88), currentPage ? currentPage.name : 'Coloriage');
      spawnFloatingBurst(e.clientX, e.clientY, ['📸', '🌟', '🎉', '🦖']);
    });

    // Premier dessin + ouverture du choix
    openPage(ALL_PAGES[0]).then(() => setTimeout(openPicker, 300));
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

  function spawnWorldActor(item, xPct = null, yPct = null, scale = 1, silent = false) {
    const id = 'actor_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const imgSrc = item.imgKey && CHAR_IMGS[item.imgKey] ? CHAR_IMGS[item.imgKey] : null;

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
        sCtx.drawImage(im, -55, -55, 110, 110);
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
})();
