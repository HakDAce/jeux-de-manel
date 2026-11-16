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
    currentTemplate: 'stitch',
    isPhotoTemplate: true,
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
    { hex: '#14b8a6', name: 'Turquoise Jasmine' },
    { hex: '#38bdf8', name: 'Bleu Stitch' },
    { hex: '#2563eb', name: 'Bleu Roi' },
    { hex: '#8b5cf6', name: 'Violet Raiponce' },
    { hex: '#d946ef', name: 'Rose Magique' },
    { hex: '#f43f5e', name: 'Rose Corail' },
    { hex: '#fdba74', name: 'Beige Peau Douce' },
    { hex: '#a16207', name: 'Marron Lion' },
    { hex: '#475569', name: 'Gris / Noir' },
    { hex: '#ffffff', name: 'Blanc Nuage' }
  ];

  const STICKERS = [
    '🦖', '🦕', '🦄', '🐉',
    '🌺', '👑', '⭐', '🌈',
    '🏰', '❄️', '💎', '💖',
    '🪄', '🦁', '🧞', '🌴'
  ];

  // Les 14 personnages envoyés + les 5 Dinos/Magie + Toile Libre
  const TEMPLATES = [
    { id: 'stitch', name: 'Stitch', imgKey: 'stitch' },
    { id: 'vaiana', name: 'Vaiana', imgKey: 'vaiana' },
    { id: 'maui', name: 'Maui', imgKey: 'maui' },
    { id: 'olaf', name: 'Olaf', imgKey: 'olaf' },
    { id: 'raiponce', name: 'Raiponce', imgKey: 'raiponce' },
    { id: 'mickey', name: 'Mickey', imgKey: 'mickey' },
    { id: 'winnie', name: 'Winnie', imgKey: 'winnie' },
    { id: 'bob', name: 'Bob', imgKey: 'bob' },
    { id: 'simba_nala', name: 'Simba & Nala', imgKey: 'simba_nala' },
    { id: 'roi_lion', name: 'Roi Lion', imgKey: 'roi_lion' },
    { id: 'timon_pumbaa', name: 'Timon & Pumbaa', imgKey: 'timon_pumbaa' },
    { id: 'jasmine', name: 'Jasmine', imgKey: 'jasmine' },
    { id: 'aladdin', name: 'Aladdin', imgKey: 'aladdin' },
    { id: 'jasmine_portrait', name: 'Princesse Jasmine', imgKey: 'jasmine_portrait' },
    { id: 'trex', name: 'Rexy Dino', emoji: '🦖' },
    { id: 'unicorn', name: 'Licorne', emoji: '🦄' },
    { id: 'diplo', name: 'Grand Diplo', emoji: '🦕' },
    { id: 'dragon', name: 'Petit Dragon', emoji: '🐉' },
    { id: 'tricera', name: 'Tricéra Fée', emoji: '🍄' },
    { id: 'blank', name: 'Toile Libre', emoji: '📄' }
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
      speak('Choisis ton personnage à gauche ! Utilise le pot magique pour remplir une zone, ou la baguette Vraie Couleur pour révéler les couleurs du dessin animé !');
      showToast('🗣️ Utilise le Pot 🪣 ou la Baguette 🪄 !');
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
  // 3. MODE 1 : COLORIAGE & DESSIN MAGIQUE (Héros Photo + Dinos Vectoriels)
  // ==========================================================================
  const paintCanvas = document.getElementById('paintCanvas');
  const ctx = paintCanvas.getContext('2d', { willReadFrequently: true });

  // Calque des contours noirs du coloriage
  const lineCanvas = document.createElement('canvas');
  lineCanvas.width = paintCanvas.width;
  lineCanvas.height = paintCanvas.height;
  const lineCtx = lineCanvas.getContext('2d', { willReadFrequently: true });

  // Calque de couleur de l'enfant (sous les traits noirs)
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = paintCanvas.width;
  colorCanvas.height = paintCanvas.height;
  const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

  // Calque de référence contenant l'image couleur originale du personnage
  // (utilisé pour guider intelligemment le Pot Magique et la Baguette Vraie Couleur !)
  const refCanvas = document.createElement('canvas');
  refCanvas.width = paintCanvas.width;
  refCanvas.height = paintCanvas.height;
  const refCtx = refCanvas.getContext('2d', { willReadFrequently: true });

  const modelPreviewCard = document.getElementById('modelPreviewCard');
  const modelPreviewImg = document.getElementById('modelPreviewImg');

  modelPreviewCard.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    modelPreviewCard.classList.toggle('zoomed');
    playSoundEffect('pop');
  });

  function compositeCanvas() {
    ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    ctx.drawImage(colorCanvas, 0, 0);
    if (state.currentTemplate !== 'blank') {
      ctx.drawImage(lineCanvas, 0, 0);
    }
  }

  function saveUndoState() {
    if (state.undoStack.length >= 12) {
      state.undoStack.shift();
    }
    state.undoStack.push(colorCtx.getImageData(0, 0, colorCanvas.width, colorCanvas.height));
  }

  function restoreUndoState() {
    if (state.undoStack.length === 0) {
      showToast('Rien à annuler !');
      return;
    }
    const prev = state.undoStack.pop();
    colorCtx.putImageData(prev, 0, 0);
    compositeCanvas();
    playSoundEffect('undo');
    showToast('↩️ Oups annulé !');
  }

  // --- Conversion Intelligente d'une Image de Personnage en Page de Coloriage ---
  function convertRefCanvasToColoringLines() {
    const w = refCanvas.width;
    const h = refCanvas.height;
    const src = refCtx.getImageData(0, 0, w, h).data;
    const outImg = lineCtx.createImageData(w, h);
    const dst = outImg.data;

    // Détection de contours multi-canal (Sobel R, G, B + Luminance)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;

        const tl = ((y - 1) * w + (x - 1)) * 4;
        const tc = ((y - 1) * w + x) * 4;
        const tr = ((y - 1) * w + (x + 1)) * 4;
        const ml = (y * w + (x - 1)) * 4;
        const mr = (y * w + (x + 1)) * 4;
        const bl = ((y + 1) * w + (x - 1)) * 4;
        const bc = ((y + 1) * w + x) * 4;
        const br = ((y + 1) * w + (x + 1)) * 4;

        let maxGrad = 0;
        for (let c = 0; c < 3; c++) {
          const gx =
            -src[tl + c] + src[tr + c] -
            2 * src[ml + c] + 2 * src[mr + c] -
            src[bl + c] + src[br + c];
          const gy =
            -src[tl + c] - 2 * src[tc + c] - src[tr + c] +
            src[bl + c] + 2 * src[bc + c] + src[br + c];
          const g = Math.sqrt(gx * gx + gy * gy);
          if (g > maxGrad) maxGrad = g;
        }

        const r = src[idx];
        const g = src[idx + 1];
        const b = src[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        let lineAlpha = 0;

        // 1. Traits noirs existants dans le dessin animé (ex: yeux, sourire, contours de Stitch/Mickey)
        if (lum < 62) {
          lineAlpha = Math.max(lineAlpha, Math.min(255, (68 - lum) * 4.2));
        }

        // 2. Contours entre deux zones de couleurs (ex: robe de Raiponce, chemise de Winnie, Vaiana)
        if (maxGrad > 42) {
          const edgeAlpha = Math.min(255, (maxGrad - 32) * 2.2);
          if (edgeAlpha > lineAlpha) lineAlpha = edgeAlpha;
        }

        if (lineAlpha > 20) {
          dst[idx] = 30;     // #1e1b4b
          dst[idx + 1] = 27;
          dst[idx + 2] = 75;
          dst[idx + 3] = Math.round(lineAlpha);
        }
      }
    }

    lineCtx.putImageData(outImg, 0, 0);
    // Cadre propre autour de la feuille
    lineCtx.strokeStyle = '#1e1b4b';
    lineCtx.lineWidth = 6;
    lineCtx.strokeRect(3, 3, w - 6, h - 6);
  }

  function loadCharacterImageTemplate(dataUrl, label) {
    state.isPhotoTemplate = true;
    state.undoStack = [];

    const img = new Image();
    img.onload = () => {
      // 1. Dessiner le personnage bien centré sur fond blanc dans refCanvas
      refCtx.fillStyle = '#ffffff';
      refCtx.fillRect(0, 0, refCanvas.width, refCanvas.height);

      const pad = 28;
      const availW = refCanvas.width - pad * 2;
      const availH = refCanvas.height - pad * 2;
      const scale = Math.min(availW / img.width, availH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (refCanvas.width - drawW) / 2;
      const dy = (refCanvas.height - drawH) / 2;

      refCtx.drawImage(img, dx, dy, drawW, drawH);

      // 2. Extraire automatiquement les contours de coloriage dans lineCanvas
      convertRefCanvasToColoringLines();

      // 3. Initialiser la feuille de coloriage en blanc
      colorCtx.fillStyle = '#ffffff';
      colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

      // 4. Afficher la miniature du Modèle Couleur en haut à gauche
      modelPreviewImg.src = dataUrl;
      modelPreviewCard.classList.add('visible');
      modelPreviewCard.classList.remove('zoomed');

      compositeCanvas();
    };
    img.src = dataUrl;
    if (label) {
      showToast(`🎨 Coloriage : ${label} !`);
    }
  }

  // --- Dessin des 5 Modèles Vectoriels Dinos & Magie ---
  function drawTemplateLines(templateId) {
    lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
    if (templateId === 'blank') return;

    lineCtx.strokeStyle = '#1e1b4b';
    lineCtx.fillStyle = '#1e1b4b';
    lineCtx.lineWidth = 7;
    lineCtx.lineCap = 'round';
    lineCtx.lineJoin = 'round';

    lineCtx.strokeRect(3, 3, lineCanvas.width - 6, lineCanvas.height - 6);

    if (templateId === 'trex') {
      drawTrexTemplate(lineCtx);
    } else if (templateId === 'unicorn') {
      drawUnicornTemplate(lineCtx);
    } else if (templateId === 'diplo') {
      drawDiploTemplate(lineCtx);
    } else if (templateId === 'dragon') {
      drawDragonTemplate(lineCtx);
    } else if (templateId === 'tricera') {
      drawTriceraTemplate(lineCtx);
    }
  }

  function drawCloud(c, x, y, scale = 1) {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    c.beginPath();
    c.moveTo(-60, 20);
    c.quadraticCurveTo(-75, -10, -40, -15);
    c.quadraticCurveTo(-25, -45, 10, -30);
    c.quadraticCurveTo(45, -45, 60, -10);
    c.quadraticCurveTo(85, -5, 70, 20);
    c.closePath();
    c.stroke();
    c.restore();
  }

  function drawStarShape(c, cx, cy, spikes, outerR, innerR) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    c.beginPath();
    c.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerR;
      y = cy + Math.sin(rot) * outerR;
      c.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      c.lineTo(x, y);
      rot += step;
    }
    c.lineTo(cx, cy - outerR);
    c.closePath();
    c.stroke();
  }

  function drawTrexTemplate(c) {
    c.beginPath();
    c.moveTo(3, 520);
    c.quadraticCurveTo(450, 480, 897, 530);
    c.stroke();

    c.beginPath();
    c.arc(110, 105, 55, 0, Math.PI * 2);
    c.stroke();

    drawCloud(c, 420, 95, 1.0);

    c.beginPath();
    c.moveTo(590, 512);
    c.lineTo(665, 290);
    c.lineTo(795, 290);
    c.lineTo(870, 528);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(665, 290);
    c.quadraticCurveTo(680, 360, 700, 355);
    c.quadraticCurveTo(730, 315, 745, 370);
    c.quadraticCurveTo(775, 370, 795, 290);
    c.closePath();
    c.stroke();

    drawCloud(c, 730, 210, 0.95);

    c.beginPath();
    c.moveTo(190, 440);
    c.quadraticCurveTo(70, 410, 65, 340);
    c.quadraticCurveTo(100, 350, 200, 370);
    c.quadraticCurveTo(210, 250, 260, 210);
    c.quadraticCurveTo(240, 120, 330, 115);
    c.lineTo(465, 125);
    c.quadraticCurveTo(510, 135, 500, 195);
    c.quadraticCurveTo(495, 240, 400, 245);
    c.quadraticCurveTo(455, 310, 435, 425);
    c.lineTo(445, 505);
    c.lineTo(375, 505);
    c.lineTo(370, 445);
    c.lineTo(310, 445);
    c.lineTo(305, 505);
    c.lineTo(235, 505);
    c.lineTo(235, 440);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(395, 250);
    c.quadraticCurveTo(335, 310, 350, 425);
    c.quadraticCurveTo(435, 420, 435, 340);
    c.closePath();
    c.stroke();
    c.beginPath();
    c.moveTo(352, 310); c.lineTo(432, 310);
    c.moveTo(348, 365); c.lineTo(436, 365);
    c.stroke();

    c.beginPath();
    c.moveTo(385, 285);
    c.quadraticCurveTo(445, 285, 440, 315);
    c.quadraticCurveTo(400, 325, 375, 310);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(295, 118);
    c.lineTo(285, 55);
    c.lineTo(330, 88);
    c.lineTo(360, 45);
    c.lineTo(390, 88);
    c.lineTo(430, 55);
    c.lineTo(415, 120);
    c.closePath();
    c.stroke();

    const spikes = [
      [[248, 220], [205, 195], [228, 260]],
      [[225, 270], [175, 255], [208, 320]],
      [[205, 330], [155, 320], [195, 370]]
    ];
    spikes.forEach((pts) => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      c.lineTo(pts[1][0], pts[1][1]);
      c.lineTo(pts[2][0], pts[2][1]);
      c.closePath();
      c.stroke();
    });

    c.beginPath();
    c.arc(365, 160, 22, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(372, 160, 9, 0, Math.PI * 2);
    c.fill();

    c.beginPath();
    c.moveTo(390, 205);
    c.quadraticCurveTo(445, 220, 485, 195);
    c.stroke();
  }

  function drawUnicornTemplate(c) {
    const radii = [380, 340, 300, 260];
    radii.forEach((r) => {
      c.beginPath();
      c.arc(450, 560, r, Math.PI, 0, false);
      c.stroke();
    });

    drawCloud(c, 140, 535, 1.35);
    drawCloud(c, 760, 535, 1.35);

    c.beginPath();
    c.moveTo(3, 560);
    c.lineTo(897, 560);
    c.stroke();

    drawStarShape(c, 150, 120, 5, 42, 20);
    drawStarShape(c, 760, 120, 5, 42, 20);
    drawStarShape(c, 450, 85, 5, 34, 16);

    c.beginPath();
    c.moveTo(350, 330);
    c.quadraticCurveTo(310, 390, 330, 450);
    c.lineTo(320, 545);
    c.lineTo(365, 545);
    c.lineTo(375, 460);
    c.lineTo(505, 460);
    c.lineTo(515, 545);
    c.lineTo(565, 545);
    c.lineTo(565, 430);
    c.quadraticCurveTo(590, 355, 525, 335);
    c.lineTo(410, 335);
    c.lineTo(385, 225);
    c.quadraticCurveTo(375, 175, 325, 185);
    c.quadraticCurveTo(255, 200, 255, 245);
    c.quadraticCurveTo(260, 285, 320, 280);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(295, 195);
    c.lineTo(220, 95);
    c.lineTo(335, 182);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(430, 355);
    c.quadraticCurveTo(450, 230, 565, 235);
    c.quadraticCurveTo(555, 290, 520, 300);
    c.quadraticCurveTo(560, 320, 510, 355);
    c.quadraticCurveTo(475, 380, 430, 355);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.arc(315, 230, 14, 0, Math.PI * 2);
    c.fill();
  }

  function drawDiploTemplate(c) {
    c.beginPath();
    c.moveTo(3, 520);
    c.quadraticCurveTo(300, 460, 600, 510);
    c.quadraticCurveTo(760, 535, 897, 495);
    c.stroke();

    c.beginPath();
    c.arc(780, 110, 58, 0, Math.PI * 2);
    c.stroke();

    drawCloud(c, 520, 100, 1.05);

    c.beginPath();
    c.moveTo(335, 130);
    c.quadraticCurveTo(420, 120, 425, 175);
    c.quadraticCurveTo(425, 215, 355, 205);
    c.quadraticCurveTo(340, 320, 385, 375);
    c.lineTo(385, 515);
    c.lineTo(320, 515);
    c.lineTo(315, 435);
    c.lineTo(215, 435);
    c.lineTo(210, 515);
    c.lineTo(145, 515);
    c.lineTo(145, 415);
    c.quadraticCurveTo(60, 415, 45, 335);
    c.quadraticCurveTo(95, 355, 155, 345);
    c.quadraticCurveTo(215, 265, 285, 330);
    c.quadraticCurveTo(280, 200, 295, 145);
    c.quadraticCurveTo(305, 130, 335, 130);
    c.closePath();
    c.stroke();

    [[215, 345, 28], [265, 375, 22], [175, 380, 18]].forEach(([x, y, r]) => {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
    });

    c.beginPath();
    c.arc(360, 160, 12, 0, Math.PI * 2);
    c.fill();
  }

  function drawDragonTemplate(c) {
    c.beginPath();
    c.moveTo(3, 525);
    c.lineTo(897, 525);
    c.stroke();

    c.beginPath();
    c.rect(75, 260, 130, 265);
    c.stroke();
    c.beginPath();
    c.moveTo(60, 260);
    c.lineTo(140, 130);
    c.lineTo(220, 260);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(410, 300);
    c.lineTo(275, 195);
    c.lineTo(255, 315);
    c.quadraticCurveTo(315, 295, 340, 345);
    c.quadraticCurveTo(375, 320, 410, 350);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(525, 300);
    c.lineTo(665, 195);
    c.lineTo(685, 315);
    c.quadraticCurveTo(625, 295, 595, 345);
    c.quadraticCurveTo(560, 320, 525, 350);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.ellipse(470, 395, 85, 120, 0, 0, Math.PI * 2);
    c.stroke();

    c.beginPath();
    c.ellipse(470, 410, 52, 90, 0, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(470, 225, 72, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#1e1b4b';

    c.beginPath();
    c.arc(442, 215, 11, 0, Math.PI * 2);
    c.arc(498, 215, 11, 0, Math.PI * 2);
    c.fill();

    drawStarShape(c, 640, 105, 5, 38, 18);
  }

  function drawTriceraTemplate(c) {
    c.beginPath();
    c.moveTo(3, 525);
    c.quadraticCurveTo(450, 495, 897, 525);
    c.stroke();

    c.beginPath();
    c.moveTo(115, 520);
    c.lineTo(130, 350);
    c.lineTo(190, 350);
    c.lineTo(205, 520);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(55, 355);
    c.quadraticCurveTo(160, 195, 265, 355);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.arc(465, 275, 115, Math.PI * 0.75, Math.PI * 2.15, false);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(530, 330);
    c.quadraticCurveTo(720, 310, 745, 420);
    c.lineTo(795, 445);
    c.lineTo(735, 465);
    c.lineTo(730, 515);
    c.lineTo(670, 515);
    c.lineTo(665, 465);
    c.lineTo(555, 465);
    c.lineTo(550, 515);
    c.lineTo(490, 515);
    c.lineTo(485, 420);
    c.closePath();
    c.stroke();

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(435, 315, 85, 65, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#1e1b4b';

    c.beginPath();
    c.arc(415, 305, 12, 0, Math.PI * 2);
    c.fill();
  }

  function loadTemplate(tpl) {
    state.currentTemplate = tpl.id;
    state.undoStack = [];

    if (tpl.imgKey && CHAR_IMGS[tpl.imgKey]) {
      loadCharacterImageTemplate(CHAR_IMGS[tpl.imgKey], tpl.name);
      return;
    }

    state.isPhotoTemplate = false;
    modelPreviewCard.classList.remove('visible');

    colorCtx.fillStyle = '#ffffff';
    colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    drawTemplateLines(tpl.id);
    compositeCanvas();
  }

  // --- Algorithme Pot Magique Guidé (Fonctionne sur les 14 Héros Photo ET les Dinos !) ---
  function hexToRgba(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
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

  function floodFillAt(startX, startY) {
    const w = colorCanvas.width;
    const h = colorCanvas.height;
    startX = Math.max(0, Math.min(w - 1, Math.floor(startX)));
    startY = Math.max(0, Math.min(h - 1, Math.floor(startY)));

    const lineData = lineCtx.getImageData(0, 0, w, h).data;
    const colorImg = colorCtx.getImageData(0, 0, w, h);
    const data = colorImg.data;
    const refData = state.isPhotoTemplate ? refCtx.getImageData(0, 0, w, h).data : null;

    const startIdx = (startY * w + startX) * 4;
    if (state.currentTemplate !== 'blank' && lineData[startIdx + 3] > 210) {
      return false;
    }

    let fillRgba;
    if (state.isRainbowColor) {
      state.rainbowHue = (state.rainbowHue + 45) % 360;
      fillRgba = hslToRgb(state.rainbowHue, 90, 60);
    } else {
      fillRgba = hexToRgba(state.currentColor);
    }

    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];

    const refR0 = refData ? refData[startIdx] : 0;
    const refG0 = refData ? refData[startIdx + 1] : 0;
    const refB0 = refData ? refData[startIdx + 2] : 0;

    if (
      Math.abs(targetR - fillRgba[0]) < 8 &&
      Math.abs(targetG - fillRgba[1]) < 8 &&
      Math.abs(targetB - fillRgba[2]) < 8
    ) {
      return false;
    }

    saveUndoState();

    const visited = new Uint8Array(w * h);
    const stack = [startX, startY];
    const hasLines = state.currentTemplate !== 'blank';

    function canFill(px, py) {
      if (px < 0 || px >= w || py < 0 || py >= h) return false;
      const pIdx = py * w + px;
      if (visited[pIdx]) return false;
      const idx4 = pIdx * 4;
      if (hasLines && lineData[idx4 + 3] > 185) return false;

      // Vérifier la cohérence sur colorCanvas
      const dr = Math.abs(data[idx4] - targetR);
      const dg = Math.abs(data[idx4 + 1] - targetG);
      const db = Math.abs(data[idx4 + 2] - targetB);
      if (dr + dg + db > 75) return false;

      // Si c'est une image de personnage, guider le remplissage grâce aux zones de couleur de l'image originale !
      if (refData) {
        const rdr = Math.abs(refData[idx4] - refR0);
        const rdg = Math.abs(refData[idx4 + 1] - refG0);
        const rdb = Math.abs(refData[idx4 + 2] - refB0);
        if (rdr + rdg + rdb > 120) return false;
      }

      return true;
    }

    while (stack.length > 0) {
      const y = stack.pop();
      const x = stack.pop();
      let lx = x;

      while (lx >= 0 && canFill(lx, y)) lx--;
      lx++;

      let rx = x;
      while (rx < w && canFill(rx, y)) rx++;
      rx--;

      let spanAbove = false;
      let spanBelow = false;

      for (let ix = lx; ix <= rx; ix++) {
        const pIdx = y * w + ix;
        visited[pIdx] = 1;
        const idx4 = pIdx * 4;
        data[idx4] = fillRgba[0];
        data[idx4 + 1] = fillRgba[1];
        data[idx4 + 2] = fillRgba[2];
        data[idx4 + 3] = 255;

        if (y > 0) {
          if (!spanAbove && canFill(ix, y - 1)) {
            stack.push(ix, y - 1);
            spanAbove = true;
          } else if (spanAbove && !canFill(ix, y - 1)) {
            spanAbove = false;
          }
        }
        if (y < h - 1) {
          if (!spanBelow && canFill(ix, y + 1)) {
            stack.push(ix, y + 1);
            spanBelow = true;
          } else if (spanBelow && !canFill(ix, y + 1)) {
            spanBelow = false;
          }
        }
      }
    }

    // Dilatation de 1 pixel sous les contours pour un rendu net sans bord blanc
    if (hasLines) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const pIdx = y * w + x;
          if (!visited[pIdx]) {
            if (visited[pIdx - 1] || visited[pIdx + 1] || visited[pIdx - w] || visited[pIdx + w]) {
              const idx4 = pIdx * 4;
              data[idx4] = fillRgba[0];
              data[idx4 + 1] = fillRgba[1];
              data[idx4 + 2] = fillRgba[2];
              data[idx4 + 3] = 255;
            }
          }
        }
      }
    }

    colorCtx.putImageData(colorImg, 0, 0);
    compositeCanvas();
    return true;
  }

  // --- Interactions Tactiles sur la Toile ---
  let isDrawing = false;
  let lastPt = null;

  function getCanvasCoords(e) {
    const rect = paintCanvas.getBoundingClientRect();
    const scaleX = paintCanvas.width / rect.width;
    const scaleY = paintCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      screenX: e.clientX,
      screenY: e.clientY
    };
  }

  paintCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    paintCanvas.setPointerCapture(e.pointerId);
    const pt = getCanvasCoords(e);

    if (state.currentTool === 'fill') {
      const filled = floodFillAt(pt.x, pt.y);
      if (filled) {
        playSoundEffect('fill');
        spawnFloatingBurst(pt.screenX, pt.screenY, ['✨', '🌟', '🎨']);
      } else {
        playSoundEffect('pop');
      }
      return;
    }

    if (state.currentTool === 'stamp') {
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
    isDrawing = true;
    lastPt = pt;
    drawStrokeStep(pt, pt);
  });

  paintCanvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    drawStrokeStep(lastPt, pt);
    lastPt = pt;
  });

  function stopDrawing() {
    isDrawing = false;
    lastPt = null;
  }

  paintCanvas.addEventListener('pointerup', stopDrawing);
  paintCanvas.addEventListener('pointercancel', stopDrawing);

  function drawStrokeStep(from, to) {
    colorCtx.save();
    colorCtx.lineCap = 'round';
    colorCtx.lineJoin = 'round';
    colorCtx.lineWidth = state.brushSize;

    if (state.currentTool === 'eraser') {
      colorCtx.strokeStyle = '#ffffff';
      colorCtx.beginPath();
      colorCtx.moveTo(from.x, from.y);
      colorCtx.lineTo(to.x, to.y);
      colorCtx.stroke();
    } else if (state.currentTool === 'magicreveal' && state.isPhotoTemplate) {
      // Baguette Magique : révèle les vraies couleurs originales du personnage sous le doigt !
      const pattern = colorCtx.createPattern(refCanvas, 'no-repeat');
      colorCtx.strokeStyle = pattern;
      colorCtx.lineWidth = state.brushSize * 1.45;
      colorCtx.beginPath();
      colorCtx.moveTo(from.x, from.y);
      colorCtx.lineTo(to.x, to.y);
      colorCtx.stroke();
    } else if (state.currentTool === 'rainbow' || state.isRainbowColor || state.currentTool === 'magicreveal') {
      state.rainbowHue = (state.rainbowHue + 7) % 360;
      colorCtx.strokeStyle = `hsl(${state.rainbowHue}, 92%, 56%)`;
      colorCtx.beginPath();
      colorCtx.moveTo(from.x, from.y);
      colorCtx.lineTo(to.x, to.y);
      colorCtx.stroke();
    } else {
      colorCtx.strokeStyle = state.currentColor;
      colorCtx.beginPath();
      colorCtx.moveTo(from.x, from.y);
      colorCtx.lineTo(to.x, to.y);
      colorCtx.stroke();
    }

    colorCtx.restore();
    compositeCanvas();
  }

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
        if (state.currentTool === 'eraser' || state.currentTool === 'magicreveal') {
          selectTool('fill');
        }
      });

      swatchesContainer.appendChild(btn);
    });

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        selectTool(btn.dataset.tool);
        if (btn.dataset.tool === 'magicreveal') {
          playSoundEffect('magic');
          showToast('🪄 Frotte le dessin avec ton doigt pour révéler ses vraies couleurs !');
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

    // Grille des 20 modèles + bouton Importer Photo
    const templateGrid = document.getElementById('templateGrid');
    const customInput = document.getElementById('customImageInput');

    // Bouton pour ajouter n'importe quelle nouvelle photo depuis la tablette
    const uploadCard = document.createElement('button');
    uploadCard.className = 'template-card';
    uploadCard.style.borderColor = '#a855f7';
    uploadCard.style.background = '#faf5ff';
    uploadCard.innerHTML = `<span class="tpl-emoji">➕</span><span>Ma Photo</span>`;
    uploadCard.addEventListener('Click', () => customInput.click());
    uploadCard.addEventListener('pointerdown', () => customInput.click());
    templateGrid.appendChild(uploadCard);

    customInput.addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.querySelectorAll('.template-card').forEach((c) => c.classList.remove('active'));
        uploadCard.classList.add('active');
        state.currentTemplate = 'custom';
        loadCharacterImageTemplate(reader.result, 'Ma Photo');
        playSoundEffect('magic');
      };
      reader.readAsDataURL(file);
    });

    TEMPLATES.forEach((tpl, idx) => {
      const card = document.createElement('button');
      card.className = 'template-card' + (idx === 0 ? ' active' : '');
      if (tpl.imgKey && CHAR_IMGS[tpl.imgKey]) {
        card.innerHTML = `<img class="tpl-thumb" src="${CHAR_IMGS[tpl.imgKey]}" alt="${tpl.name}" /><span>${tpl.name}</span>`;
      } else {
        card.innerHTML = `<span class="tpl-emoji">${tpl.emoji}</span><span>${tpl.name}</span>`;
      }
      card.addEventListener('pointerdown', () => {
        document.querySelectorAll('.template-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        loadTemplate(tpl);
        playSoundEffect('magic');
      });
      templateGrid.appendChild(card);
    });

    document.getElementById('undoBtn').addEventListener('pointerdown', restoreUndoState);
    document.getElementById('clearBtn').addEventListener('pointerdown', () => {
      saveUndoState();
      colorCtx.fillStyle = '#ffffff';
      colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
      compositeCanvas();
      playSoundEffect('undo');
      showToast('🔄 Dessin tout propre !');
    });
    document.getElementById('saveDrawingBtn').addEventListener('pointerdown', (e) => {
      saveCanvasToGallery(paintCanvas.toDataURL('image/png'), 'Coloriage Magique');
      spawnFloatingBurst(e.clientX, e.clientY, ['📸', '🌟', '🎉', '🦖']);
    });

    // Charger Stitch par défaut !
    loadTemplate(TEMPLATES[0]);
  }

  function selectTool(toolName) {
    state.currentTool = toolName;
    document.querySelectorAll('.tool-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tool === toolName);
    });
    const drawer = document.getElementById('stickerDrawer');
    drawer.classList.toggle('visible', toolName === 'stamp');
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
            <a href="${item.dataUrl}" download="atelier-magique-${item.id}.png" class="bg-chip" style="text-decoration:none;">⬇️</a>
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
