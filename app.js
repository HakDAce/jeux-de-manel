// ============================================================================
// DINO & MAGIE : L'ATELIER CRÉATIF (6-7 ANS)
// 100% Tactile - Sans dépendance externe - Web Audio & Synthèse Vocale
// ============================================================================

(() => {
  'use strict';

  // --- ÉTAT GLOBAL ---
  const state = {
    mode: 'coloring', // 'coloring' | 'world' | 'music' | 'gallery'
    soundEnabled: true,
    // Coloriage
    currentTool: 'fill', // 'fill' | 'brush' | 'rainbow' | 'stamp' | 'spray' | 'eraser'
    currentColor: '#22c55e',
    isRainbowColor: false,
    brushSize: 22,
    currentSticker: '🦖',
    currentTemplate: 'trex',
    rainbowHue: 0,
    undoStack: [],
    // Monde Magique
    worldBg: 'bg-jungle',
    worldDancing: false,
    actors: [],
    selectedActorId: null,
    // Musique
    instrument: 'piano', // 'piano' | 'marimba' | 'magic' | 'synth'
    activeBeat: null,    // null | 'jungle' | 'fairy'
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
    { hex: '#ef4444', name: 'Rouge Volcan' },
    { hex: '#f97316', name: 'Orange Feu' },
    { hex: '#facc15', name: 'Jaune Soleil' },
    { hex: '#84cc16', name: 'Vert Pomme' },
    { hex: '#22c55e', name: 'Vert Dino' },
    { hex: '#14b8a6', name: 'Turquoise Magique' },
    { hex: '#38bdf8', name: 'Bleu Ciel' },
    { hex: '#3b82f6', name: 'Bleu Océan' },
    { hex: '#8b5cf6', name: 'Violet Sorcier' },
    { hex: '#d946ef', name: 'Rose Licorne' },
    { hex: '#f43f5e', name: 'Rose Bonbon' },
    { hex: '#a16207', name: 'Marron Terre' },
    { hex: '#fbbf24', name: 'Or Royal' },
    { hex: '#475569', name: 'Gris Pierre' },
    { hex: '#ffffff', name: 'Blanc Nuage' }
  ];

  const STICKERS = [
    '🦖', '🦕', '🦄', '🐉',
    '🌋', '👑', '⭐', '🌈',
    '🏰', '🍄', '💎', '💖',
    '🪄', '🥚', '☄️', '🌴'
  ];

  const TEMPLATES = [
    { id: 'trex', name: 'Rexy Dino', emoji: '🦖' },
    { id: 'unicorn', name: 'Licorne', emoji: '🦄' },
    { id: 'diplo', name: 'Grand Diplo', emoji: '🦕' },
    { id: 'dragon', name: 'Petit Dragon', emoji: '🐉' },
    { id: 'tricera', name: 'Tricéra Fée', emoji: '🍄' },
    { id: 'blank', name: 'Toile Libre', emoji: '📄' }
  ];

  const WORLD_ITEMS = [
    { emoji: '🦖', label: 'T-Rex', sound: 'roar' },
    { emoji: '🦕', label: 'Diplo', sound: 'low' },
    { emoji: '🦄', label: 'Licorne', sound: 'magic' },
    { emoji: '🐉', label: 'Dragon', sound: 'fire' },
    { emoji: '🥚', label: 'Œuf Surprise', sound: 'egg' },
    { emoji: '🌋', label: 'Volcan', sound: 'volcano' },
    { emoji: '🏰', label: 'Château', sound: 'magic' },
    { emoji: '🌈', label: 'Arc-en-ciel', sound: 'magic' },
    { emoji: '🍄', label: 'Champignon', sound: 'pop' },
    { emoji: '👑', label: 'Couronne', sound: 'chime' },
    { emoji: '💎', label: 'Cristal', sound: 'chime' },
    { emoji: '🌴', label: 'Palmier', sound: 'pop' },
    { emoji: '☄️', label: 'Comète', sound: 'magic' },
    { emoji: '🧚', label: 'Petite Fée', sound: 'magic' }
  ];

  const PIANO_NOTES = [
    { note: 'Do', freq: 261.63, color: '#ef4444', icon: '🦖' },
    { note: 'Ré', freq: 293.66, color: '#f97316', icon: '🌋' },
    { note: 'Mi', freq: 329.63, color: '#eab308', icon: '⭐' },
    { note: 'Fa', freq: 349.23, color: '#22c55e', icon: '🦕' },
    { note: 'Sol', freq: 392.00, color: '#06b6d4', icon: '💎' },
    { note: 'La', freq: 440.00, color: '#3b82f6', icon: '🏰' },
    { note: 'Si', freq: 493.88, color: '#8b5cf6', icon: '🦄' },
    { note: 'Do+', freq: 523.25, color: '#ec4899', icon: '🐉' }
  ];

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
    } catch (_) {
      // Ignorer si non supporté
    }
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

  // Navigation entre les 4 écrans
  const modeTabs = document.querySelectorAll('.mode-tab');
  modeTabs.forEach((tab) => {
    tab.addEventListener('pointerdown', () => {
      const targetMode = tab.dataset.mode;
      switchMode(targetMode);
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
      showToast('🎨 Atelier Coloriage & Dessin !');
    } else if (newMode === 'world') {
      showToast('🏰 Crée ton Monde Dino Magique !');
    } else if (newMode === 'music') {
      showToast('🎹 L’Orchestre des Dinos !');
    } else if (newMode === 'gallery') {
      renderGallery();
      showToast('📸 Mon Album Magique !');
    }
  }

  // Boutons Barre du Haut
  document.getElementById('brandBtn').addEventListener('pointerdown', () => {
    playSoundEffect('roar');
    speak('Bienvenue dans Dino Magique !');
    showToast('🦖 Roaaar ! Amuse-toi bien ! ✨');
  });

  document.getElementById('voiceHelpBtn').addEventListener('pointerdown', () => {
    if (state.mode === 'coloring') {
      speak('Choisis une couleur à droite, puis touche le dessin avec le pot magique ou dessine avec ton doigt !');
      showToast('🗣️ Touche une zone pour la colorier !');
    } else if (state.mode === 'world') {
      speak('Touche les dinosaures en bas pour les ajouter, et glisse-les avec ton doigt ! Touche l’œuf pour le faire éclore !');
      showToast('🗣️ Glisse les dinos et touche l’œuf surprise !');
    } else if (state.mode === 'music') {
      speak('Joue du piano arc-en-ciel avec tes doigts et touche les dinosaures musiciens !');
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
  // 3. MODE 1 : COLORIAGE & DESSIN MAGIQUE (Double Calque + Flood Fill Rapide)
  // ==========================================================================
  const paintCanvas = document.getElementById('paintCanvas');
  const ctx = paintCanvas.getContext('2d', { willReadFrequently: true });

  // Calque invisible contenant uniquement les contours noirs du modèle
  const lineCanvas = document.createElement('canvas');
  lineCanvas.width = paintCanvas.width;
  lineCanvas.height = paintCanvas.height;
  const lineCtx = lineCanvas.getContext('2d', { willReadFrequently: true });

  // Calque invisible contenant uniquement la couleur de l'enfant (sous les traits noirs)
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = paintCanvas.width;
  colorCanvas.height = paintCanvas.height;
  const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

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

  // --- Dessin des 5 Modèles Vectoriels sur lineCanvas ---
  function drawTemplateLines(templateId) {
    lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
    if (templateId === 'blank') return;

    lineCtx.strokeStyle = '#1e1b4b';
    lineCtx.fillStyle = '#1e1b4b';
    lineCtx.lineWidth = 7;
    lineCtx.lineCap = 'round';
    lineCtx.lineJoin = 'round';

    // Cadre extérieur fermé pour que le ciel et le sol soient des zones fermées
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

  // Modèle 1 : Rexy le Roi T-Rex + Volcan + Soleil
  function drawTrexTemplate(c) {
    // Sol et colline
    c.beginPath();
    c.moveTo(3, 520);
    c.quadraticCurveTo(450, 480, 897, 530);
    c.stroke();

    // Soleil en haut à gauche
    c.beginPath();
    c.arc(110, 105, 55, 0, Math.PI * 2);
    c.stroke();

    // Nuage
    drawCloud(c, 420, 95, 1.0);

    // Volcan souriant à droite
    c.beginPath();
    c.moveTo(590, 512);
    c.lineTo(665, 290);
    c.lineTo(795, 290);
    c.lineTo(870, 528);
    c.closePath();
    c.stroke();

    // Coulée de lave sur le volcan (zone fermée)
    c.beginPath();
    c.moveTo(665, 290);
    c.quadraticCurveTo(680, 360, 700, 355);
    c.quadraticCurveTo(730, 315, 745, 370);
    c.quadraticCurveTo(775, 370, 795, 290);
    c.closePath();
    c.stroke();

    // Nuage de fumée du volcan
    drawCloud(c, 730, 210, 0.95);

    // Corps principal du T-Rex (grande forme fermée)
    c.beginPath();
    // Queue
    c.moveTo(190, 440);
    c.quadraticCurveTo(70, 410, 65, 340);
    c.quadraticCurveTo(100, 350, 200, 370);
    // Dos
    c.quadraticCurveTo(210, 250, 260, 210);
    // Tête et museau
    c.quadraticCurveTo(240, 120, 330, 115);
    c.lineTo(465, 125);
    c.quadraticCurveTo(510, 135, 500, 195);
    c.quadraticCurveTo(495, 240, 400, 245);
    // Cou et ventre rond
    c.quadraticCurveTo(455, 310, 435, 425);
    // Jambe droite
    c.lineTo(445, 505);
    c.lineTo(375, 505);
    c.lineTo(370, 445);
    // Entre-jambes
    c.lineTo(310, 445);
    // Jambe gauche
    c.lineTo(305, 505);
    c.lineTo(235, 505);
    c.lineTo(235, 440);
    c.closePath();
    c.stroke();

    // Ventre rayé du T-Rex (zone fermée à colorier)
    c.beginPath();
    c.moveTo(395, 250);
    c.quadraticCurveTo(335, 310, 350, 425);
    c.quadraticCurveTo(435, 420, 435, 340);
    c.closePath();
    c.stroke();
    // Lignes sur le ventre
    c.beginPath();
    c.moveTo(352, 310); c.lineTo(432, 310);
    c.moveTo(348, 365); c.lineTo(436, 365);
    c.stroke();

    // Petit bras mignon
    c.beginPath();
    c.moveTo(385, 285);
    c.quadraticCurveTo(445, 285, 440, 315);
    c.quadraticCurveTo(400, 325, 375, 310);
    c.closePath();
    c.stroke();

    // Couronne royale sur la tête du T-Rex
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

    // Crêtes dorsales (3 triangles fermés sur le dos)
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

    // Grand œil expressif et sourire
    c.beginPath();
    c.arc(365, 160, 22, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(372, 160, 9, 0, Math.PI * 2);
    c.fill();

    // Sourire + 2 petites dents rigolotes
    c.beginPath();
    c.moveTo(390, 205);
    c.quadraticCurveTo(445, 220, 485, 195);
    c.stroke();

    c.beginPath();
    c.moveTo(415, 209);
    c.lineTo(425, 230);
    c.lineTo(438, 211);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(450, 209);
    c.lineTo(460, 228);
    c.lineTo(472, 204);
    c.closePath();
    c.stroke();
  }

  // Modèle 2 : Stella la Licorne Ailée + Arc-en-ciel + Étoiles
  function drawUnicornTemplate(c) {
    // Grand Arc-en-ciel en arrière-plan (3 bandes fermées)
    const radii = [380, 340, 300, 260];
    radii.forEach((r) => {
      c.beginPath();
      c.arc(450, 560, r, Math.PI, 0, false);
      c.stroke();
    });

    // Deux gros nuages aux pieds de l'arc-en-ciel
    drawCloud(c, 140, 535, 1.35);
    drawCloud(c, 760, 535, 1.35);

    // Sol féerique
    c.beginPath();
    c.moveTo(3, 560);
    c.lineTo(897, 560);
    c.stroke();

    // Étoiles magiques dans le ciel
    drawStarShape(c, 150, 120, 5, 42, 20);
    drawStarShape(c, 760, 120, 5, 42, 20);
    drawStarShape(c, 450, 85, 5, 34, 16);

    // Corps de la Licorne
    c.beginPath();
    // Poitrail et jambes
    c.moveTo(350, 330);
    c.quadraticCurveTo(310, 390, 330, 450);
    c.lineTo(320, 545);
    c.lineTo(365, 545);
    c.lineTo(375, 460);
    // Ventre
    c.lineTo(505, 460);
    // Jambe arrière
    c.lineTo(515, 545);
    c.lineTo(565, 545);
    c.lineTo(565, 430);
    // Croupe et dos
    c.quadraticCurveTo(590, 355, 525, 335);
    c.lineTo(410, 335);
    // Cou et Tête
    c.lineTo(385, 225);
    c.quadraticCurveTo(375, 175, 325, 185);
    c.quadraticCurveTo(255, 200, 255, 245);
    c.quadraticCurveTo(260, 285, 320, 280);
    c.closePath();
    c.stroke();

    // Corne Magique torsadée
    c.beginPath();
    c.moveTo(295, 195);
    c.lineTo(220, 95);
    c.lineTo(335, 182);
    c.closePath();
    c.stroke();
    // Rayures sur la corne
    c.beginPath();
    c.moveTo(272, 165); c.lineTo(308, 155);
    c.moveTo(250, 135); c.lineTo(282, 128);
    c.stroke();

    // Crinière arc-en-ciel (3 mèches fermées)
    c.beginPath();
    c.moveTo(355, 185);
    c.quadraticCurveTo(435, 170, 425, 225);
    c.quadraticCurveTo(400, 240, 372, 225);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(372, 225);
    c.quadraticCurveTo(455, 225, 440, 275);
    c.quadraticCurveTo(410, 290, 385, 270);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(385, 270);
    c.quadraticCurveTo(465, 275, 445, 325);
    c.quadraticCurveTo(415, 335, 398, 315);
    c.closePath();
    c.stroke();

    // Aile féerique sur le dos
    c.beginPath();
    c.moveTo(430, 355);
    c.quadraticCurveTo(450, 230, 565, 235);
    c.quadraticCurveTo(555, 290, 520, 300);
    c.quadraticCurveTo(560, 320, 510, 355);
    c.quadraticCurveTo(475, 380, 430, 355);
    c.closePath();
    c.stroke();

    // Grande queue touffue (3 mèches à colorier)
    c.beginPath();
    c.moveTo(565, 365);
    c.quadraticCurveTo(680, 320, 690, 405);
    c.quadraticCurveTo(640, 425, 572, 395);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(572, 395);
    c.quadraticCurveTo(695, 405, 675, 475);
    c.quadraticCurveTo(615, 480, 565, 425);
    c.closePath();
    c.stroke();

    // Œil doux et sourire
    c.beginPath();
    c.arc(315, 230, 14, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(272, 260);
    c.quadraticCurveTo(295, 275, 315, 260);
    c.stroke();

    // Cœur sur la croupe
    c.beginPath();
    c.arc(515, 395, 12, Math.PI, 0, false);
    c.arc(539, 395, 12, Math.PI, 0, false);
    c.lineTo(527, 425);
    c.closePath();
    c.stroke();
  }

  // Modèle 3 : Diplo le Grand Dinosaure + Palmier + Soleil
  function drawDiploTemplate(c) {
    // Collines préhistoriques
    c.beginPath();
    c.moveTo(3, 520);
    c.quadraticCurveTo(300, 460, 600, 510);
    c.quadraticCurveTo(760, 535, 897, 495);
    c.stroke();

    // Soleil
    c.beginPath();
    c.arc(780, 110, 58, 0, Math.PI * 2);
    c.stroke();

    drawCloud(c, 520, 100, 1.05);

    // Palmier préhistorique à droite
    // Tronc
    c.beginPath();
    c.moveTo(715, 515);
    c.quadraticCurveTo(735, 370, 700, 265);
    c.lineTo(740, 265);
    c.quadraticCurveTo(780, 370, 765, 518);
    c.closePath();
    c.stroke();
    // 3 Palmes fermées
    c.beginPath();
    c.moveTo(720, 265);
    c.quadraticCurveTo(610, 210, 585, 275);
    c.quadraticCurveTo(655, 285, 720, 265);
    c.stroke();

    c.beginPath();
    c.moveTo(720, 265);
    c.quadraticCurveTo(720, 165, 825, 195);
    c.quadraticCurveTo(785, 255, 720, 265);
    c.stroke();

    c.beginPath();
    c.moveTo(720, 265);
    c.quadraticCurveTo(840, 240, 865, 315);
    c.quadraticCurveTo(785, 315, 720, 265);
    c.stroke();

    // Grand Diplodocus souriant
    c.beginPath();
    // Tête et long cou
    c.moveTo(335, 130);
    c.quadraticCurveTo(420, 120, 425, 175);
    c.quadraticCurveTo(425, 215, 355, 205);
    // Descente du cou jusqu'au poitrail
    c.quadraticCurveTo(340, 320, 385, 375);
    // Jambe avant
    c.lineTo(385, 515);
    c.lineTo(320, 515);
    c.lineTo(315, 435);
    // Ventre
    c.lineTo(215, 435);
    // Jambe arrière
    c.lineTo(210, 515);
    c.lineTo(145, 515);
    c.lineTo(145, 415);
    // Queue
    c.quadraticCurveTo(60, 415, 45, 335);
    c.quadraticCurveTo(95, 355, 155, 345);
    // Dos rond
    c.quadraticCurveTo(215, 265, 285, 330);
    // Remontée du cou
    c.quadraticCurveTo(280, 200, 295, 145);
    c.quadraticCurveTo(305, 130, 335, 130);
    c.closePath();
    c.stroke();

    // Taches rondes à colorier sur le dos du Diplo
    [[215, 345, 28], [265, 375, 22], [175, 380, 18]].forEach(([x, y, r]) => {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
    });

    // Œil et grand sourire
    c.beginPath();
    c.arc(360, 160, 12, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(365, 185);
    c.quadraticCurveTo(395, 198, 415, 182);
    c.stroke();
  }

  // Modèle 4 : Drako le Petit Dragon Magique + Château + Cristal
  function drawDragonTemplate(c) {
    // Sol
    c.beginPath();
    c.moveTo(3, 525);
    c.lineTo(897, 525);
    c.stroke();

    // Tour de Château Féerique à gauche
    c.beginPath();
    c.rect(75, 260, 130, 265);
    c.stroke();
    // Toit pointu du château
    c.beginPath();
    c.moveTo(60, 260);
    c.lineTo(140, 130);
    c.lineTo(220, 260);
    c.closePath();
    c.stroke();
    // Porte du château
    c.beginPath();
    c.moveTo(110, 525);
    c.lineTo(110, 430);
    c.arc(140, 430, 30, Math.PI, 0, false);
    c.lineTo(170, 525);
    c.closePath();
    c.stroke();

    // Cristaux magiques à droite
    c.beginPath();
    c.moveTo(730, 525);
    c.lineTo(715, 380);
    c.lineTo(755, 330);
    c.lineTo(790, 380);
    c.lineTo(775, 525);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(775, 525);
    c.lineTo(795, 410);
    c.lineTo(835, 380);
    c.lineTo(855, 425);
    c.lineTo(830, 525);
    c.closePath();
    c.stroke();

    // Ailes du Dragon (2 grandes ailes à colorier)
    // Aile gauche
    c.beginPath();
    c.moveTo(410, 300);
    c.lineTo(275, 195);
    c.lineTo(255, 315);
    c.quadraticCurveTo(315, 295, 340, 345);
    c.quadraticCurveTo(375, 320, 410, 350);
    c.closePath();
    c.stroke();

    // Aile droite
    c.beginPath();
    c.moveTo(525, 300);
    c.lineTo(665, 195);
    c.lineTo(685, 315);
    c.quadraticCurveTo(625, 295, 595, 345);
    c.quadraticCurveTo(560, 320, 525, 350);
    c.closePath();
    c.stroke();

    // Corps assis du bébé Dragon
    c.beginPath();
    c.ellipse(470, 395, 85, 120, 0, 0, Math.PI * 2);
    c.stroke();

    // Ventre strié du dragon
    c.beginPath();
    c.ellipse(470, 410, 52, 90, 0, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(422, 380); c.lineTo(518, 380);
    c.moveTo(418, 415); c.lineTo(522, 415);
    c.moveTo(424, 450); c.lineTo(516, 450);
    c.stroke();

    // Tête ronde du Dragon (dessinée en blanc puis contour pour masquer le haut du corps)
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(470, 225, 72, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#1e1b4b';

    // 2 Petites cornes sur la tête
    c.beginPath();
    c.moveTo(420, 170);
    c.lineTo(395, 105);
    c.lineTo(450, 155);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(520, 170);
    c.lineTo(545, 105);
    c.lineTo(490, 155);
    c.closePath();
    c.stroke();

    // Yeux et sourire du dragon
    c.beginPath();
    c.arc(442, 215, 11, 0, Math.PI * 2);
    c.arc(498, 215, 11, 0, Math.PI * 2);
    c.fill();

    c.beginPath();
    c.moveTo(435, 255);
    c.quadraticCurveTo(470, 280, 505, 255);
    c.stroke();

    // Étoile magique au-dessus
    drawStarShape(c, 640, 105, 5, 38, 18);
  }

  // Modèle 5 : Tricéra & Champignons Féeriques
  function drawTriceraTemplate(c) {
    // Sol
    c.beginPath();
    c.moveTo(3, 525);
    c.quadraticCurveTo(450, 495, 897, 525);
    c.stroke();

    // Grand Champignon Magique à gauche
    // Pied
    c.beginPath();
    c.moveTo(115, 520);
    c.lineTo(130, 350);
    c.lineTo(190, 350);
    c.lineTo(205, 520);
    c.closePath();
    c.stroke();
    // Chapeau
    c.beginPath();
    c.moveTo(55, 355);
    c.quadraticCurveTo(160, 195, 265, 355);
    c.closePath();
    c.stroke();
    // Pois sur le champignon
    [[125, 315, 20], [185, 300, 16], [155, 335, 14]].forEach(([x, y, r]) => {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
    });

    // Collerette décorative du Tricératops (grande roue festonnée)
    c.beginPath();
    c.arc(465, 275, 115, Math.PI * 0.75, Math.PI * 2.15, false);
    c.closePath();
    c.stroke();

    // Perles autour de la collerette
    [[385, 210, 16], [435, 180, 16], [495, 180, 16], [545, 215, 16]].forEach(([x, y, r]) => {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
    });

    // Corps du Tricératops
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

    // Tête du Tricératops (remplie en blanc pour cacher la base de la collerette)
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(435, 315, 85, 65, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#1e1b4b';

    // 3 Cornes à colorier
    // Petite corne du nez
    c.beginPath();
    c.moveTo(355, 295);
    c.lineTo(315, 245);
    c.lineTo(380, 275);
    c.closePath();
    c.stroke();
    // 2 grandes cornes du front
    c.beginPath();
    c.moveTo(410, 260);
    c.lineTo(350, 175);
    c.lineTo(440, 252);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(455, 255);
    c.lineTo(415, 170);
    c.lineTo(485, 255);
    c.closePath();
    c.stroke();

    // Œil et sourire
    c.beginPath();
    c.arc(415, 305, 12, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(365, 342);
    c.quadraticCurveTo(405, 365, 445, 342);
    c.stroke();

    drawCloud(c, 710, 110, 1.0);
    drawStarShape(c, 260, 110, 5, 35, 16);
  }

  function loadTemplate(templateId) {
    state.currentTemplate = templateId;
    state.undoStack = [];
    // Fond blanc propre sur colorCanvas
    colorCtx.fillStyle = '#ffffff';
    colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    drawTemplateLines(templateId);
    compositeCanvas();
  }

  // --- Algorithme Pot Magique (Scanline Flood Fill ultra-rapide et sans halo blanc) ---
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

    // Vérifier si l'enfant a touché directement sur un trait noir du modèle
    const startIdx = (startY * w + startX) * 4;
    if (state.currentTemplate !== 'blank' && lineData[startIdx + 3] > 140) {
      return false;
    }

    // Couleur de remplissage choisie
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
      if (hasLines && lineData[idx4 + 3] > 140) return false;
      const dr = Math.abs(data[idx4] - targetR);
      const dg = Math.abs(data[idx4 + 1] - targetG);
      const db = Math.abs(data[idx4 + 2] - targetB);
      return dr + dg + db < 65;
    }

    while (stack.length > 0) {
      const y = stack.pop();
      const x = stack.pop();
      let lx = x;

      while (lx >= 0 && canFill(lx, y)) {
        lx--;
      }
      lx++;

      let rx = x;
      while (rx < w && canFill(rx, y)) {
        rx++;
      }
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

    // Dilatation de 1 pixel sous les contours noirs pour éliminer tout liseré blanc d'anti-aliasing
    if (hasLines) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const pIdx = y * w + x;
          if (!visited[pIdx]) {
            if (
              visited[pIdx - 1] ||
              visited[pIdx + 1] ||
              visited[pIdx - w] ||
              visited[pIdx + w]
            ) {
              const idx4 = pIdx * 4;
              if (lineData[idx4 + 3] > 30) {
                data[idx4] = fillRgba[0];
                data[idx4 + 1] = fillRgba[1];
                data[idx4 + 2] = fillRgba[2];
                data[idx4 + 3] = 255;
              }
            }
          }
        }
      }
    }

    colorCtx.putImageData(colorImg, 0, 0);
    compositeCanvas();
    return true;
  }

  // --- Interactions Tactiles sur la Toile (Pot, Pinceau, Arc-en-ciel, Tampon, Paillettes, Gomme) ---
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
      colorCtx.font = `${state.brushSize * 2.4 + 28}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      colorCtx.textAlign = 'center';
      colorCtx.textBaseline = 'middle';
      colorCtx.fillText(state.currentSticker, pt.x, pt.y);
      colorCtx.restore();
      compositeCanvas();
      playSoundEffect('chime');
      spawnFloatingBurst(pt.screenX, pt.screenY, [state.currentSticker, '✨', '⭐']);
      return;
    }

    // Outils de tracé continu : brush, rainbow, spray, eraser
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
    } else if (state.currentTool === 'rainbow' || state.isRainbowColor) {
      state.rainbowHue = (state.rainbowHue + 7) % 360;
      colorCtx.strokeStyle = `hsl(${state.rainbowHue}, 92%, 56%)`;
      colorCtx.beginPath();
      colorCtx.moveTo(from.x, from.y);
      colorCtx.lineTo(to.x, to.y);
      colorCtx.stroke();
    } else if (state.currentTool === 'spray') {
      // Paillettes magiques
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * state.brushSize * 1.3;
        const sx = to.x + Math.cos(angle) * radius;
        const sy = to.y + Math.sin(angle) * radius;
        state.rainbowHue = (state.rainbowHue + 23) % 360;
        colorCtx.fillStyle = state.isRainbowColor
          ? `hsl(${state.rainbowHue}, 95%, 60%)`
          : state.currentColor;
        colorCtx.beginPath();
        colorCtx.arc(sx, sy, Math.random() * 4 + 2, 0, Math.PI * 2);
        colorCtx.fill();
      }
    } else {
      // Pinceau doux classique
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
    // Palette de couleurs
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
        // Si l'enfant était sur la gomme, repasser sur le pinceau ou le pot
        if (state.currentTool === 'eraser') {
          selectTool('fill');
        }
      });

      swatchesContainer.appendChild(btn);
    });

    // Outils
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        selectTool(btn.dataset.tool);
      });
    });

    // Tailles de pinceau
    document.querySelectorAll('.size-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.brushSize = parseInt(btn.dataset.size, 10);
        playSoundEffect('pop');
      });
    });

    // Tampons (Stickers)
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

    // Modèles de dessin
    const templateGrid = document.getElementById('templateGrid');
    TEMPLATES.forEach((tpl, idx) => {
      const card = document.createElement('button');
      card.className = 'template-card' + (idx === 0 ? ' active' : '');
      card.innerHTML = `<span class="tpl-emoji">${tpl.emoji}</span><span>${tpl.name}</span>`;
      card.addEventListener('pointerdown', () => {
        document.querySelectorAll('.template-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        loadTemplate(tpl.id);
        playSoundEffect('magic');
        showToast(`${tpl.emoji} Modèle : ${tpl.name}`);
      });
      templateGrid.appendChild(card);
    });

    // Boutons Oups / Recommencer / Sauvegarder
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
      saveCanvasToGallery(paintCanvas.toDataURL('image/png'), 'Dessin Magique');
      spawnFloatingBurst(e.clientX, e.clientY, ['📸', '🌟', '🎉', '🦖']);
    });

    loadTemplate('trex');
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
  // 4. MODE 2 : MON MONDE DINO MAGIQUE (Scène Interactive Tactile)
  // ==========================================================================
  const worldStage = document.getElementById('worldStage');
  const worldActorsLayer = document.getElementById('worldActorsLayer');

  function initWorldUI() {
    const tray = document.getElementById('worldTray');
    WORLD_ITEMS.forEach((item) => {
      const card = document.createElement('button');
      card.className = 'spawn-card';
      card.innerHTML = `<span class="spawn-emoji">${item.emoji}</span><span class="spawn-label">${item.label}</span>`;
      card.addEventListener('pointerdown', () => {
        spawnWorldActor(item.emoji, item.sound);
      });
      tray.appendChild(card);
    });

    // Choix du décor de fond
    document.querySelectorAll('.world-bg-picker .bg-chip').forEach((chip) => {
      chip.addEventListener('pointerdown', () => {
        document.querySelectorAll('.world-bg-picker .bg-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        worldStage.className = `world-stage ${chip.dataset.bg}`;
        state.worldBg = chip.dataset.bg;
        playSoundEffect('magic');
      });
    });

    // Bouton Faire Danser !
    const danceBtn = document.getElementById('worldDanceBtn');
    danceBtn.addEventListener('pointerdown', () => {
      state.worldDancing = !state.worldDancing;
      document.querySelectorAll('.world-actor').forEach((el) => {
        el.classList.toggle('dancing', state.worldDancing);
      });
      if (state.worldDancing) {
        playSoundEffect('magic');
        speak('Tout le monde danse !');
        showToast('💃 Youpi ! Les dinos dansent !');
      } else {
        playSoundEffect('pop');
      }
    });

    // Outils d'édition du personnage sélectionné
    document.getElementById('actorBiggerBtn').addEventListener('pointerdown', () => modifySelectedActor('scale', 0.22));
    document.getElementById('actorSmallerBtn').addEventListener('pointerdown', () => modifySelectedActor('scale', -0.22));
    document.getElementById('actorFlipBtn').addEventListener('pointerdown', () => modifySelectedActor('flip'));
    document.getElementById('actorDeleteBtn').addEventListener('pointerdown', () => modifySelectedActor('delete'));

    document.getElementById('worldSaveBtn').addEventListener('pointerdown', (e) => {
      captureWorldSnapshot();
      spawnFloatingBurst(e.clientX, e.clientY, ['📸', '🏰', '🦖', '🌟']);
    });

    // Ajouter 3 éléments au démarrage pour que la scène soit déjà vivante
    spawnWorldActor('🏰', 'magic', 22, 52, 1.35, true);
    spawnWorldActor('🦖', 'roar', 48, 68, 1.15, true);
    spawnWorldActor('🥚', 'egg', 72, 72, 1.0, true);
  }

  function spawnWorldActor(emoji, sound, xPct = null, yPct = null, scale = 1, silent = false) {
    const id = 'actor_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const actor = {
      id,
      emoji,
      sound,
      x: xPct !== null ? xPct : 25 + Math.random() * 50,
      y: yPct !== null ? yPct : 45 + Math.random() * 35,
      scale,
      flip: false
    };
    state.actors.push(actor);

    const el = document.createElement('div');
    el.className = 'world-actor' + (state.worldDancing ? ' dancing' : '');
    el.id = id;
    el.innerHTML = `<div class="actor-emoji">${actor.emoji}</div>`;
    updateActorDOM(actor, el);

    // Glisser-déposer tactile + interaction spéciale (Œuf qui éclot, Volcan qui crache des étoiles)
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
        // Interaction surprise quand l'enfant tapote un œuf ou un volcan !
        if (actor.emoji === '🥚') {
          const babies = ['🦖', '🦕', '🐉', '🦄'];
          actor.emoji = babies[Math.floor(Math.random() * babies.length)];
          actor.sound = 'magic';
          el.querySelector('.actor-emoji').textContent = actor.emoji;
          playSoundEffect('magic');
          speak('Oh ! L’œuf magique a éclos !');
          showToast(`🐣 Surprise ! Un bébé ${actor.emoji} est né !`);
          spawnFloatingBurst(e.clientX, e.clientY, ['🐣', '✨', '🌟', actor.emoji]);
        } else if (actor.emoji === '🌋') {
          playSoundEffect('volcano');
          spawnFloatingBurst(e.clientX, e.clientY - 30, ['🔥', '☄️', '✨', '🌋']);
        }
      }
    });

    worldActorsLayer.appendChild(el);
    selectActor(actor.id);
    if (!silent) {
      playSoundEffect(sound || 'pop');
    }
  }

  function updateActorDOM(actor, el = document.getElementById(actor.id)) {
    if (!el) return;
    el.style.left = `${actor.x}%`;
    el.style.top = `${actor.y}%`;
    const emojiEl = el.querySelector('.actor-emoji');
    const flipScale = actor.flip ? -actor.scale : actor.scale;
    emojiEl.style.transform = `scale(${flipScale}, ${actor.scale})`;
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

    // Dessiner le ciel et le sol selon state.worldBg
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

    // Soleil
    sCtx.fillStyle = '#fde047';
    sCtx.beginPath();
    sCtx.arc(790, 90, 48, 0, Math.PI * 2);
    sCtx.fill();

    // Dessiner tous les personnages
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    state.actors.forEach((a) => {
      sCtx.save();
      sCtx.translate((a.x / 100) * 900, (a.y / 100) * 600);
      sCtx.scale(a.flip ? -a.scale : a.scale, a.scale);
      sCtx.font = '72px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      sCtx.fillText(a.emoji, 0, 0);
      sCtx.restore();
    });

    saveCanvasToGallery(snap.toDataURL('image/png'), 'Monde Dino');
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

    // Sélection d'instrument
    document.querySelectorAll('.inst-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', () => {
        document.querySelectorAll('.inst-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.instrument = btn.dataset.inst;
        playInstrumentNote(523.25);
      });
    });

    // Les 4 Dinos Musiciens sur scène
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

    // Boucles rythmiques
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

    // Enregistreur de chanson
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
      showToast('🎶 Concert des Dinos en cours !');
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

    // Faire danser un dino musicien correspondant
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
      // Si quota atteint, garder les plus récents
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
            <a href="${item.dataUrl}" download="dino-magique-${item.id}.png" class="bg-chip" style="text-decoration:none;">⬇️</a>
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
