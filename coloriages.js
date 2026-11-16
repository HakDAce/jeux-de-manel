// ============================================================================
// COLORIAGES ORIGINAUX — dessins vectoriels au trait (900 x 650)
// Chaque forme a une couleur "modèle" (pour la baguette Vraie Couleur).
// Le jeu en tire automatiquement la version à colorier (traits noirs, zones blanches).
// Classe "ink" = forme qui reste noire (pupilles, narines...).
// ============================================================================
(() => {
  'use strict';

  const INK = '#1e1b4b';

  // ---------- Petits outils de dessin ----------
  const r1 = (n) => Math.round(n * 10) / 10;

  function star(cx, cy, R, fill = '#fde047', r = R * 0.48, sw = 5) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? R : r;
      pts.push(`${r1(cx + Math.cos(a) * rr)},${r1(cy + Math.sin(a) * rr)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke-width="${sw}"/>`;
  }

  function heart(cx, cy, s, fill = '#fb7185', sw = 5) {
    return `<path d="M${cx} ${cy + s * 0.9} C${cx - s * 1.4} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.1} ${cx} ${cy - s * 0.35} C${cx + s * 0.7} ${cy - s * 1.1} ${cx + s * 1.4} ${cy - s * 0.1} ${cx} ${cy + s * 0.9} Z" fill="${fill}" stroke-width="${sw}"/>`;
  }

  function cloud(x, y, s = 1, fill = '#e0f2fe') {
    return `<path transform="translate(${x} ${y}) scale(${s})" d="M-70 25 Q-95 25 -92 2 Q-90 -20 -62 -18 Q-55 -50 -20 -48 Q5 -70 35 -50 Q70 -55 72 -22 Q100 -18 95 8 Q92 28 65 25 Z" fill="${fill}" stroke-width="${6 / s}"/>`;
  }

  function sun(x, y, r = 50) {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      rays += `M${r1(x + Math.cos(a) * (r + 14))} ${r1(y + Math.sin(a) * (r + 14))} L${r1(x + Math.cos(a) * (r + 34))} ${r1(y + Math.sin(a) * (r + 34))} `;
    }
    return `<path d="${rays}" fill="none" stroke-width="6"/>` +
      `<circle cx="${x}" cy="${y}" r="${r}" fill="#fde047"/>`;
  }

  function flower(cx, cy, r, petal = '#f472b6', center = '#facc15', stemTo = null) {
    let s = '';
    if (stemTo) {
      s += `<path d="M${cx - 5} ${cy} L${cx - 5} ${stemTo} L${cx + 5} ${stemTo} L${cx + 5} ${cy} Z" fill="#4ade80" stroke-width="5"/>`;
      s += `<path d="M${cx + 5} ${(cy + stemTo) / 2 + 10} Q${cx + 40} ${(cy + stemTo) / 2 - 20} ${cx + 55} ${(cy + stemTo) / 2 - 5} Q${cx + 35} ${(cy + stemTo) / 2 + 25} ${cx + 5} ${(cy + stemTo) / 2 + 22} Z" fill="#22c55e" stroke-width="5"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      s += `<circle cx="${r1(cx + Math.cos(a) * r * 0.9)}" cy="${r1(cy + Math.sin(a) * r * 0.9)}" r="${r1(r * 0.62)}" fill="${petal}" stroke-width="5"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.55)}" fill="${center}" stroke-width="5"/>`;
    return s;
  }

  function eye(cx, cy, r = 18) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>` +
      `<circle class="ink" cx="${cx + r * 0.25}" cy="${cy + r * 0.1}" r="${r1(r * 0.55)}" fill="${INK}" stroke-width="2"/>` +
      `<circle cx="${r1(cx + r * 0.42)}" cy="${r1(cy - r * 0.15)}" r="${r1(r * 0.18)}" fill="#ffffff" stroke="none"/>`;
  }

  function ground(y = 545, fill = '#86efac') {
    return `<path d="M-10 ${y} Q225 ${y - 30} 450 ${y} T910 ${y - 5} L910 660 L-10 660 Z" fill="${fill}"/>`;
  }

  function grassTufts(list) {
    return list.map(([x, y]) => `<path d="M${x - 14} ${y} L${x - 8} ${y - 18} L${x - 2} ${y} M${x} ${y} L${x + 6} ${y - 24} L${x + 12} ${y}" fill="none" stroke-width="5"/>`).join('');
  }

  function bubbles(list) {
    return list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e0f2fe" stroke-width="5"/>`).join('');
  }

  // ---------- LES DESSINS ----------
  const PAGES = [];

  // 1. REXY LE T-REX
  PAGES.push({
    id: 'trex', name: 'Rexy le T-Rex', cat: 'dinos', speak: 'Rexy le T-Rex',
    svg: () => [
      sun(110, 105, 48),
      cloud(330, 95, 1),
      `<path d="M600 545 L690 330 L770 330 L860 545 Z" fill="#a8a29e"/>`,
      `<path d="M690 330 Q700 380 715 372 Q730 405 745 368 Q760 380 770 330 Z" fill="#f97316"/>`,
      cloud(735, 250, 0.75, '#e5e7eb'),
      ground(),
      // piques du dos (derrière le corps)
      `<path d="M318 252 L302 196 L352 236 Z" fill="#fb923c"/>`,
      `<path d="M268 270 L236 222 L296 252 Z" fill="#fb923c"/>`,
      `<path d="M226 302 L180 268 L246 286 Z" fill="#fb923c"/>`,
      `<path d="M194 343 L142 322 L210 330 Z" fill="#fb923c"/>`,
      `<path d="M138 362 L92 360 L148 342 Z" fill="#fb923c"/>`,
      // jambe arrière (derrière)
      `<path d="M372 440 Q380 500 372 540 L436 540 Q440 490 430 430 Z" fill="#16a34a"/>`,
      // corps + queue
      `<path d="M270 476 Q190 478 150 438 Q100 400 40 352 Q120 372 196 352 Q222 268 318 246 Q404 232 430 300 Q456 380 432 446 Q412 484 362 484 Z" fill="#4ade80"/>`,
      // ventre
      `<path d="M352 300 Q412 296 422 360 Q428 430 388 466 Q338 468 330 420 Q320 340 352 300 Z" fill="#fef08a"/>`,
      `<path d="M330 352 Q376 360 424 346 M327 404 Q376 414 422 398" fill="none" stroke-width="5"/>`,
      // jambe avant
      `<path d="M262 430 Q250 500 240 545 L318 545 Q318 498 330 452 Z" fill="#4ade80"/>`,
      `<path d="M240 545 Q246 528 262 530 Q268 518 282 528 Q292 516 304 530 Q314 528 318 545 Z" fill="#ffffff" stroke-width="5"/>`,
      // petit bras
      `<path d="M424 330 Q466 330 478 356 Q470 364 456 356 Q452 372 440 366 Q436 356 418 352 Z" fill="#4ade80" stroke-width="6"/>`,
      // tête
      `<path d="M318 252 Q300 158 404 140 Q500 126 540 178 Q568 222 530 252 Q484 278 410 274 Q344 284 318 252 Z" fill="#4ade80"/>`,
      `<path d="M410 240 Q470 258 536 236" fill="none" stroke-width="6"/>`,
      `<path d="M436 246 L444 262 L454 249 M466 252 L474 268 L484 252 M496 249 L504 263 L512 245" fill="#ffffff" stroke-width="4"/>`,
      eye(430, 190, 24),
      `<circle class="ink" cx="524" cy="184" r="5" fill="${INK}" stroke-width="2"/>`,
      `<ellipse cx="470" cy="222" rx="16" ry="10" fill="#fda4af" stroke-width="4"/>`,
      `<circle cx="360" cy="214" r="10" fill="#22c55e" stroke-width="4"/><circle cx="380" cy="244" r="7" fill="#22c55e" stroke-width="4"/>`,
      grassTufts([[90, 590], [520, 600], [600, 575], [840, 600]])
    ].join('')
  });

  // 2. GRAND DIPLO
  PAGES.push({
    id: 'diplo', name: 'Grand Diplo', cat: 'dinos', speak: 'Grand Diplo le diplodocus',
    svg: () => [
      sun(800, 95, 45),
      cloud(140, 90, 0.9),
      cloud(420, 70, 0.7),
      ground(548),
      // palmier
      `<path d="M800 548 Q812 430 794 310 L820 306 Q836 430 830 548 Z" fill="#d97706"/>`,
      `<path d="M800 324 L828 318 M798 380 L826 376 M802 440 L830 436 M804 500 L830 498" fill="none" stroke-width="5"/>`,
      `<path d="M806 310 Q740 260 690 300 Q750 280 806 310 Z" fill="#22c55e"/>`,
      `<path d="M806 310 Q860 250 905 290 Q850 275 806 310 Z" fill="#22c55e"/>`,
      `<path d="M806 310 Q770 230 720 222 Q790 250 806 310 Z" fill="#4ade80"/>`,
      `<path d="M806 310 Q840 222 892 218 Q830 250 806 310 Z" fill="#4ade80"/>`,
      `<circle cx="796" cy="318" r="13" fill="#92400e" stroke-width="5"/><circle cx="820" cy="322" r="13" fill="#92400e" stroke-width="5"/>`,
      // pattes arrière
      `<path d="M330 430 L330 535 Q330 544 340 544 L378 544 Q388 544 388 535 L388 440 Z" fill="#0d9488"/>`,
      `<path d="M520 420 L520 535 Q520 544 530 544 L568 544 Q578 544 578 535 L578 420 Z" fill="#0d9488"/>`,
      // corps + queue + cou
      `<path d="M250 470 Q140 466 30 396 Q120 410 200 376 Q240 304 340 298 Q440 292 498 318 Q552 250 586 150 Q600 112 636 104 L676 134 Q648 228 618 330 Q604 420 540 456 Q420 480 250 470 Z" fill="#2dd4bf"/>`,
      // taches
      `<circle cx="320" cy="345" r="20" fill="#a3e635" stroke-width="5"/>`,
      `<circle cx="388" cy="328" r="15" fill="#a3e635" stroke-width="5"/>`,
      `<circle cx="446" cy="356" r="18" fill="#a3e635" stroke-width="5"/>`,
      `<circle cx="262" cy="384" r="13" fill="#a3e635" stroke-width="5"/>`,
      `<circle cx="560" cy="250" r="12" fill="#a3e635" stroke-width="5"/>`,
      `<circle cx="590" cy="190" r="10" fill="#a3e635" stroke-width="5"/>`,
      // ventre
      `<path d="M300 466 Q420 420 560 448" fill="none" stroke-width="5"/>`,
      // pattes avant
      `<path d="M262 440 L262 540 Q262 550 274 550 L316 550 Q328 550 328 540 L328 450 Z" fill="#2dd4bf"/>`,
      `<path d="M460 440 L460 540 Q460 550 472 550 L514 550 Q526 550 526 540 L526 440 Z" fill="#2dd4bf"/>`,
      `<path d="M266 550 Q266 534 280 534 Q292 534 292 550 M296 550 Q296 534 310 534 Q324 534 324 550" fill="#ffffff" stroke-width="4"/>`,
      `<path d="M464 550 Q464 534 478 534 Q490 534 490 550 M494 550 Q494 534 508 534 Q522 534 522 550" fill="#ffffff" stroke-width="4"/>`,
      // tête
      `<ellipse cx="670" cy="116" rx="62" ry="40" transform="rotate(-8 670 116)" fill="#2dd4bf"/>`,
      eye(676, 104, 15),
      `<path d="M700 136 Q716 142 726 126" fill="none" stroke-width="5"/>`,
      `<ellipse cx="664" cy="134" rx="11" ry="7" fill="#fda4af" stroke-width="4"/>`,
      `<circle class="ink" cx="722" cy="104" r="4" fill="${INK}" stroke-width="2"/>`,
      grassTufts([[120, 600], [420, 610], [660, 580], [880, 610]])
    ].join('')
  });

  // 3. TRICÉRA
  PAGES.push({
    id: 'tricera', name: 'Tricéra', cat: 'dinos', speak: 'Tricéra le tricératops',
    svg: () => {
      // collerette festonnée
      let frill = '';
      const cx = 540, cy = 318, R = 112, n = 9;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * 0.55 + (i * Math.PI * 1.25) / n;
        frill += (i === 0 ? 'M' : 'L') + r1(cx + Math.cos(a) * R) + ' ' + r1(cy + Math.sin(a) * R) + ' ';
      }
      let scallop = 'M' + r1(cx + Math.cos(Math.PI * 0.55) * R) + ' ' + r1(cy + Math.sin(Math.PI * 0.55) * R) + ' ';
      for (let i = 1; i <= n; i++) {
        const a0 = Math.PI * 0.55 + ((i - 0.5) * Math.PI * 1.25) / n;
        const a1 = Math.PI * 0.55 + (i * Math.PI * 1.25) / n;
        scallop += `Q${r1(cx + Math.cos(a0) * (R + 34))} ${r1(cy + Math.sin(a0) * (R + 34))} ${r1(cx + Math.cos(a1) * R)} ${r1(cy + Math.sin(a1) * R)} `;
      }
      scallop += `L${cx + 40} ${cy + 40} Z`;
      return [
        sun(110, 100, 46),
        cloud(780, 90, 0.9),
        ground(),
        flower(110, 470, 26, '#f472b6', '#facc15', 560),
        flower(820, 480, 24, '#60a5fa', '#facc15', 560),
        // pattes arrière
        `<path d="M220 440 L220 530 Q220 540 232 540 L272 540 Q284 540 284 530 L284 450 Z" fill="#7c3aed"/>`,
        `<path d="M400 440 L400 530 Q400 540 412 540 L452 540 Q464 540 464 530 L464 450 Z" fill="#7c3aed"/>`,
        // corps + queue
        `<path d="M180 470 Q110 460 60 400 Q120 418 168 398 Q200 300 330 286 Q450 278 500 350 Q526 410 496 466 Q470 486 420 486 L230 486 Q190 486 180 470 Z" fill="#a78bfa"/>`,
        `<circle cx="300" cy="340" r="22" fill="#c4b5fd" stroke-width="5"/>`,
        `<circle cx="372" cy="326" r="16" fill="#c4b5fd" stroke-width="5"/>`,
        `<circle cx="236" cy="380" r="14" fill="#c4b5fd" stroke-width="5"/>`,
        `<circle cx="410" cy="384" r="18" fill="#c4b5fd" stroke-width="5"/>`,
        // collerette
        `<path d="${scallop}" fill="#f472b6"/>`,
        `<circle cx="484" cy="246" r="13" fill="#fde047" stroke-width="5"/>`,
        `<circle cx="540" cy="226" r="13" fill="#fde047" stroke-width="5"/>`,
        `<circle cx="596" cy="240" r="13" fill="#fde047" stroke-width="5"/>`,
        `<circle cx="452" cy="300" r="12" fill="#fde047" stroke-width="5"/>`,
        // pattes avant
        `<path d="M250 450 L250 540 Q250 552 264 552 L306 552 Q318 552 318 540 L318 460 Z" fill="#a78bfa"/>`,
        `<path d="M428 450 L428 540 Q428 552 442 552 L484 552 Q496 552 496 540 L496 450 Z" fill="#a78bfa"/>`,
        // tête
        `<path d="M500 340 Q510 262 604 268 Q690 276 730 336 Q748 376 712 394 Q648 414 572 404 Q504 392 500 340 Z" fill="#a78bfa"/>`,
        // cornes
        `<path d="M560 282 Q556 222 588 196 Q586 246 594 280 Z" fill="#fef9c3"/>`,
        `<path d="M612 276 Q622 214 660 194 Q648 244 644 282 Z" fill="#fef9c3"/>`,
        `<path d="M690 300 Q706 266 734 256 Q728 292 714 316 Z" fill="#fef9c3"/>`,
        eye(612, 318, 17),
        `<path d="M652 376 Q684 390 716 368" fill="none" stroke-width="6"/>`,
        `<ellipse cx="640" cy="352" rx="14" ry="9" fill="#fda4af" stroke-width="4"/>`,
        grassTufts([[180, 600], [560, 600], [700, 580]])
      ].join('');
    }
  });

  // 4. BÉBÉ DINO DANS L'ŒUF
  PAGES.push({
    id: 'oeuf', name: 'Bébé Dino', cat: 'dinos', speak: 'Le bébé dinosaure',
    svg: () => [
      star(110, 110, 38, '#fde047'),
      star(790, 120, 32, '#fde047'),
      star(700, 230, 22, '#fde047'),
      star(170, 260, 24, '#fde047'),
      heart(250, 140, 26, '#fb7185'),
      heart(640, 120, 22, '#fb7185'),
      ground(560, '#bbf7d0'),
      // bébé dino (derrière la coquille)
      `<path d="M388 420 Q376 320 398 262 Q414 186 484 180 Q566 178 576 244 Q582 292 528 302 Q506 312 506 420 Z" fill="#86efac"/>`,
      `<path d="M400 262 Q392 240 372 236 Q374 262 396 278 Z" fill="#fb923c" stroke-width="5"/>`,
      `<path d="M396 300 Q380 286 362 292 Q374 314 394 318 Z" fill="#fb923c" stroke-width="5"/>`,
      eye(462, 236, 24),
      `<path d="M510 272 Q534 284 556 266" fill="none" stroke-width="6"/>`,
      `<ellipse cx="510" cy="254" rx="13" ry="8" fill="#fda4af" stroke-width="4"/>`,
      `<circle class="ink" cx="560" cy="226" r="4.5" fill="${INK}" stroke-width="2"/>`,
      // chapeau de coquille
      `<path d="M424 196 Q470 132 534 186 L522 200 L508 184 L494 202 L480 184 L466 202 L452 186 L438 204 Z" fill="#fef3c7"/>`,
      `<circle cx="474" cy="162" r="7" fill="#7dd3fc" stroke-width="4"/>`,
      // coquille du bas
      `<path d="M300 380 L340 352 L376 388 L414 348 L452 390 L492 350 L532 390 L570 352 L604 384 Q620 520 452 540 Q284 520 300 380 Z" fill="#fef3c7"/>`,
      `<circle cx="370" cy="450" r="17" fill="#7dd3fc" stroke-width="5"/>`,
      `<circle cx="452" cy="482" r="21" fill="#7dd3fc" stroke-width="5"/>`,
      `<circle cx="538" cy="440" r="16" fill="#7dd3fc" stroke-width="5"/>`,
      // petites mains
      `<ellipse cx="404" cy="380" rx="20" ry="14" fill="#86efac" stroke-width="5"/>`,
      `<ellipse cx="514" cy="380" rx="20" ry="14" fill="#86efac" stroke-width="5"/>`,
      // nid
      `<path d="M200 500 Q452 470 704 500 Q716 590 452 608 Q188 590 200 500 Z" fill="#d6a35c"/>`,
      `<path d="M240 520 Q300 545 360 528 M400 548 Q460 566 520 546 M560 526 Q620 548 670 520 M280 570 Q340 586 400 576 M500 578 Q560 588 620 570" fill="none" stroke-width="5"/>`
    ].join('')
  });

  // 5. LICORNE
  PAGES.push({
    id: 'licorne', name: 'Licorne', cat: 'magie', speak: 'La licorne magique',
    svg: () => [
      // arc-en-ciel
      `<path d="M120 470 A330 330 0 0 1 780 470 Z" fill="#f87171"/>`,
      `<path d="M165 470 A285 285 0 0 1 735 470 Z" fill="#fb923c"/>`,
      `<path d="M210 470 A240 240 0 0 1 690 470 Z" fill="#fde047"/>`,
      `<path d="M255 470 A195 195 0 0 1 645 470 Z" fill="#4ade80"/>`,
      `<path d="M300 470 A150 150 0 0 1 600 470 Z" fill="#60a5fa"/>`,
      `<path d="M345 470 A105 105 0 0 1 555 470 Z" fill="#ffffff"/>`,
      cloud(150, 450, 1.1, '#ffffff'),
      cloud(760, 450, 1.1, '#ffffff'),
      star(80, 90, 30, '#fde047'),
      star(830, 80, 26, '#fde047'),
      star(460, 50, 20, '#fde047'),
      ground(560, '#bbf7d0'),
      // pattes arrière
      `<path d="M440 470 L440 548 L480 548 L480 470 Z" fill="#e9d5ff"/>`,
      `<path d="M600 470 L600 548 L640 548 L640 470 Z" fill="#e9d5ff"/>`,
      `<path d="M438 548 L482 548 L482 568 L438 568 Z" fill="#a855f7" stroke-width="5"/>`,
      `<path d="M598 548 L642 548 L642 568 L598 568 Z" fill="#a855f7" stroke-width="5"/>`,
      // queue
      `<path d="M680 380 Q770 350 786 420 Q800 470 768 506 Q770 460 738 450 Q752 418 700 410 Z" fill="#f0abfc"/>`,
      `<path d="M700 410 Q740 416 742 450 Q712 440 694 430 Z" fill="#93c5fd" stroke-width="5"/>`,
      // corps
      `<path d="M400 400 Q400 340 480 334 L630 334 Q706 338 704 410 Q704 470 640 478 L470 478 Q402 472 400 400 Z" fill="#ffffff"/>`,
      heart(620, 400, 20, '#f472b6'),
      // pattes avant
      `<path d="M420 450 L420 556 L462 556 L462 450 Z" fill="#ffffff"/>`,
      `<path d="M570 450 L570 556 L612 556 L612 450 Z" fill="#ffffff"/>`,
      `<path d="M418 556 L464 556 L464 578 L418 578 Z" fill="#a855f7" stroke-width="5"/>`,
      `<path d="M568 556 L614 556 L614 578 L568 578 Z" fill="#a855f7" stroke-width="5"/>`,
      // cou + tête
      `<path d="M490 360 Q470 290 440 246 Q410 196 352 196 Q290 198 272 244 Q262 282 306 292 Q346 298 376 288 Q396 330 410 380 Z" fill="#ffffff"/>`,
      `<ellipse cx="292" cy="266" rx="34" ry="28" fill="#fbcfe8"/>`,
      `<circle class="ink" cx="280" cy="262" r="5" fill="${INK}" stroke-width="2"/>`,
      `<path d="M286 286 Q300 294 314 286" fill="none" stroke-width="5"/>`,
      `<path d="M340 232 Q354 246 370 234" fill="none" stroke-width="6"/>`,
      `<path d="M342 240 L334 252 M354 245 L352 258 M366 240 L372 252" fill="none" stroke-width="4"/>`,
      `<ellipse cx="352" cy="270" rx="13" ry="8" fill="#fda4af" stroke-width="4"/>`,
      // oreille
      `<path d="M392 202 L404 160 L418 208 Z" fill="#fbcfe8" stroke-width="6"/>`,
      // corne
      `<path d="M352 200 L330 112 L378 194 Z" fill="#fde047" stroke-width="6"/>`,
      `<path d="M344 172 L366 166 M338 146 L356 142" fill="none" stroke-width="4"/>`,
      // crinière
      `<path d="M386 196 Q436 168 462 214 Q500 228 488 270 Q522 296 500 330 Q530 356 506 372 L478 356 Q462 290 420 236 Z" fill="#f0abfc"/>`,
      `<path d="M440 210 Q470 236 462 262 Q484 280 476 306 L458 300 Q448 262 428 236 Z" fill="#93c5fd" stroke-width="5"/>`,
      `<path d="M370 196 Q350 170 372 156 Q392 166 398 196 Z" fill="#c4b5fd" stroke-width="5"/>`
    ].join('')
  });

  // 6. PETIT DRAGON
  PAGES.push({
    id: 'dragon', name: 'Petit Dragon', cat: 'magie', speak: 'Le petit dragon',
    svg: () => [
      `<circle cx="790" cy="100" r="50" fill="#fef9c3"/>`,
      `<circle cx="772" cy="88" r="10" fill="#fde68a" stroke-width="4"/><circle cx="804" cy="118" r="7" fill="#fde68a" stroke-width="4"/>`,
      star(110, 90, 28, '#fde047'),
      star(220, 170, 18, '#fde047'),
      star(660, 60, 20, '#fde047'),
      // tour de château
      `<path d="M70 560 L70 330 L190 330 L190 560 Z" fill="#cbd5e1"/>`,
      `<path d="M60 330 L60 300 L82 300 L82 315 L104 315 L104 300 L126 300 L126 315 L148 315 L148 300 L170 300 L170 315 L200 315 L200 300 L200 330 Z" fill="#94a3b8"/>`,
      `<path d="M110 420 Q130 390 150 420 L150 470 L110 470 Z" fill="#fde047"/>`,
      ground(560, '#86efac'),
      // queue
      `<path d="M560 500 Q690 520 720 440 Q740 390 700 370 Q726 420 690 460 Q650 490 560 470 Z" fill="#fb7185"/>`,
      `<path d="M700 370 L690 330 L740 360 L716 380 Z" fill="#fde047"/>`,
      // ailes
      `<path d="M370 330 Q280 230 250 160 Q300 190 330 180 Q320 230 350 240 Q350 280 390 300 Z" fill="#c084fc"/>`,
      `<path d="M530 330 Q620 230 650 160 Q600 190 570 180 Q580 230 550 240 Q550 280 510 300 Z" fill="#c084fc"/>`,
      // corps
      `<path d="M450 310 Q560 310 580 440 Q590 530 450 536 Q310 530 320 440 Q340 310 450 310 Z" fill="#fb7185"/>`,
      `<path d="M450 350 Q520 352 530 440 Q534 510 450 514 Q366 510 370 440 Q380 352 450 350 Z" fill="#fef08a"/>`,
      `<path d="M378 398 Q450 412 522 398 M370 450 Q450 464 530 450 M380 494 Q450 508 520 494" fill="none" stroke-width="5"/>`,
      // pieds
      `<ellipse cx="380" cy="540" rx="52" ry="26" fill="#fb7185"/>`,
      `<ellipse cx="520" cy="540" rx="52" ry="26" fill="#fb7185"/>`,
      `<path d="M346 548 L346 562 M372 552 L372 566 M398 550 L398 564 M502 550 L502 564 M528 552 L528 566 M554 548 L554 562" fill="none" stroke-width="5"/>`,
      // bras
      `<path d="M340 380 Q300 410 320 440 Q340 440 360 410 Z" fill="#fb7185" stroke-width="6"/>`,
      `<path d="M560 380 Q600 410 580 440 Q560 440 540 410 Z" fill="#fb7185" stroke-width="6"/>`,
      // cornes
      `<path d="M390 150 Q370 100 380 80 Q404 110 414 140 Z" fill="#fde047"/>`,
      `<path d="M510 150 Q530 100 520 80 Q496 110 486 140 Z" fill="#fde047"/>`,
      // tête
      `<path d="M450 120 Q560 120 560 220 Q560 300 450 304 Q340 300 340 220 Q340 120 450 120 Z" fill="#fb7185"/>`,
      `<ellipse cx="450" cy="262" rx="70" ry="38" fill="#fda4af"/>`,
      `<circle class="ink" cx="430" cy="254" r="6" fill="${INK}" stroke-width="2"/><circle class="ink" cx="470" cy="254" r="6" fill="${INK}" stroke-width="2"/>`,
      `<path d="M420 280 Q450 296 480 280" fill="none" stroke-width="5"/>`,
      eye(410, 196, 22),
      eye(492, 196, 22),
      // petites piques de la tête
      `<path d="M430 122 L450 96 L470 122 Z" fill="#fde047" stroke-width="5"/>`,
      // fumée
      cloud(620, 250, 0.45, '#e5e7eb'),
      cloud(680, 215, 0.32, '#e5e7eb')
    ].join('')
  });

  // 7. PRINCESSE ÉTOILE (personnage original)
  PAGES.push({
    id: 'princesse', name: 'Princesse Étoile', cat: 'magie', speak: 'La princesse Étoile',
    svg: () => [
      cloud(150, 90, 0.9, '#ffffff'),
      // château
      `<path d="M560 560 L560 280 L860 280 L860 560 Z" fill="#fbcfe8"/>`,
      `<path d="M540 300 L540 180 L620 180 L620 300 Z" fill="#f9a8d4"/>`,
      `<path d="M800 300 L800 180 L880 180 L880 300 Z" fill="#f9a8d4"/>`,
      `<path d="M530 182 L580 90 L630 182 Z" fill="#a78bfa"/>`,
      `<path d="M790 182 L840 90 L890 182 Z" fill="#a78bfa"/>`,
      `<path d="M580 90 L580 54 L612 66 L580 76" fill="#fb7185" stroke-width="5"/>`,
      `<path d="M840 90 L840 54 L872 66 L840 76" fill="#fb7185" stroke-width="5"/>`,
      `<path d="M670 560 L670 470 Q710 420 750 470 L750 560 Z" fill="#c084fc"/>`,
      `<path d="M566 220 Q580 204 594 220 L594 254 L566 254 Z" fill="#fde047" stroke-width="5"/>`,
      `<path d="M826 220 Q840 204 854 220 L854 254 L826 254 Z" fill="#fde047" stroke-width="5"/>`,
      `<path d="M650 340 Q664 322 678 340 L678 380 L650 380 Z" fill="#fde047" stroke-width="5"/>`,
      `<path d="M742 340 Q756 322 770 340 L770 380 L742 380 Z" fill="#fde047" stroke-width="5"/>`,
      ground(565),
      flower(80, 530, 22, '#f472b6', '#facc15', 600),
      flower(500, 560, 18, '#60a5fa', '#facc15', 610),
      // cheveux (derrière)
      `<path d="M210 230 Q190 112 300 104 Q410 112 392 230 Q420 340 380 400 L340 330 L262 330 L222 400 Q182 340 210 230 Z" fill="#a16207"/>`,
      // robe
      `<path d="M250 330 L350 330 L374 410 L226 410 Z" fill="#c084fc"/>`,
      `<path d="M226 410 L374 410 L452 560 Q300 600 148 560 Z" fill="#f0abfc"/>`,
      `<path d="M148 560 Q170 530 196 560 Q222 530 248 562 Q274 532 300 564 Q326 532 352 562 Q378 530 404 560 Q430 530 452 560 Q300 600 148 560 Z" fill="#c084fc" stroke-width="5"/>`,
      star(300, 470, 22, '#fde047'),
      star(226, 512, 14, '#fde047'),
      star(376, 512, 14, '#fde047'),
      // bras
      `<path d="M250 340 Q206 380 196 430 Q212 440 222 430 Q234 390 262 370 Z" fill="#fcd7b6" stroke-width="6"/>`,
      `<path d="M350 340 Q392 360 412 330 Q420 316 432 322 Q424 360 396 384 Q370 394 340 372 Z" fill="#fcd7b6" stroke-width="6"/>`,
      `<circle cx="252" cy="338" r="22" fill="#e9d5ff" stroke-width="6"/>`,
      `<circle cx="348" cy="338" r="22" fill="#e9d5ff" stroke-width="6"/>`,
      // baguette magique
      `<path d="M424 322 L466 230 L476 234 L434 326 Z" fill="#fef3c7" stroke-width="5"/>`,
      star(474, 214, 30, '#fde047'),
      // cou + tête
      `<path d="M284 290 L316 290 L316 334 L284 334 Z" fill="#fcd7b6" stroke-width="6"/>`,
      `<circle cx="300" cy="226" r="72" fill="#fcd7b6"/>`,
      // frange
      `<path d="M228 220 Q228 146 300 144 Q372 146 372 220 Q348 190 324 200 Q302 176 280 200 Q254 190 228 220 Z" fill="#a16207"/>`,
      // couronne
      `<path d="M252 158 L246 104 L274 128 L300 90 L326 128 L354 104 L348 158 Q300 146 252 158 Z" fill="#fde047"/>`,
      `<circle cx="300" cy="134" r="9" fill="#fb7185" stroke-width="4"/>`,
      `<circle cx="268" cy="142" r="6" fill="#60a5fa" stroke-width="4"/><circle cx="332" cy="142" r="6" fill="#60a5fa" stroke-width="4"/>`,
      // visage
      `<ellipse class="ink" cx="274" cy="232" rx="9" ry="12" fill="${INK}" stroke-width="2"/>`,
      `<ellipse class="ink" cx="326" cy="232" rx="9" ry="12" fill="${INK}" stroke-width="2"/>`,
      `<circle cx="277" cy="227" r="3.5" fill="#ffffff" stroke="none"/><circle cx="329" cy="227" r="3.5" fill="#ffffff" stroke="none"/>`,
      `<path d="M284 266 Q300 278 316 266" fill="none" stroke-width="5"/>`,
      `<ellipse cx="256" cy="258" rx="12" ry="8" fill="#fda4af" stroke-width="4"/>`,
      `<ellipse cx="344" cy="258" rx="12" ry="8" fill="#fda4af" stroke-width="4"/>`
    ].join('')
  });

  // 8. SIRÈNE DES COQUILLAGES (personnage original)
  PAGES.push({
    id: 'sirene', name: 'Sirène', cat: 'mer', speak: 'La petite sirène des coquillages',
    svg: () => [
      bubbles([[120, 90, 16], [150, 150, 10], [700, 80, 18], [740, 140, 11], [600, 200, 9], [820, 260, 14]]),
      // algues
      `<path d="M60 600 Q30 520 70 460 Q100 400 70 340 Q120 400 100 460 Q80 520 100 600 Z" fill="#22c55e"/>`,
      `<path d="M820 600 Q790 510 830 450 Q860 390 830 320 Q890 390 866 460 Q846 520 860 600 Z" fill="#4ade80"/>`,
      // sable
      `<path d="M-10 580 Q225 555 450 580 T910 572 L910 660 L-10 660 Z" fill="#fde68a"/>`,
      // rocher
      `<path d="M240 590 Q220 470 330 450 Q430 430 520 456 Q620 480 610 590 Z" fill="#94a3b8"/>`,
      `<path d="M300 520 Q340 500 380 520 M470 510 Q510 492 550 514" fill="none" stroke-width="5"/>`,
      // étoile de mer + coquillage
      star(700, 600, 34, '#fb923c', 16),
      `<path d="M140 620 Q140 572 180 566 Q220 572 220 620 Z" fill="#f9a8d4"/>`,
      `<path d="M160 620 L172 574 M180 620 L180 568 M200 620 L188 574" fill="none" stroke-width="4"/>`,
      // cheveux (derrière)
      `<path d="M330 220 Q316 110 420 104 Q520 110 506 220 Q540 300 512 380 Q490 330 470 310 L370 310 Q350 330 326 380 Q300 300 330 220 Z" fill="#8b5cf6"/>`,
      // queue
      `<path d="M376 380 Q360 460 410 500 Q470 540 560 520 Q640 500 680 440 L700 470 Q650 540 560 548 Q440 560 380 500 Q336 450 350 380 Z" fill="#2dd4bf"/>`,
      `<path d="M368 400 Q392 380 420 400 M372 440 Q400 420 430 444 M410 488 Q440 468 470 494 M480 512 Q510 494 540 516 M560 508 Q590 490 616 504" fill="none" stroke-width="5"/>`,
      `<path d="M680 440 Q720 380 780 400 Q740 430 712 468 Q760 480 790 530 Q730 520 700 470 Z" fill="#14b8a6"/>`,
      // corps
      `<path d="M378 300 L462 300 Q478 340 470 390 L366 390 Q358 340 378 300 Z" fill="#fcd7b6"/>`,
      `<path d="M362 386 Q420 404 474 386 L476 410 Q420 428 360 410 Z" fill="#a7f3d0" stroke-width="5"/>`,
      // coquillages
      `<path d="M376 340 Q376 312 400 312 Q420 312 420 340 Z" fill="#f9a8d4" stroke-width="5"/>`,
      `<path d="M420 340 Q420 312 442 312 Q464 312 464 340 Z" fill="#f9a8d4" stroke-width="5"/>`,
      // bras
      `<path d="M380 316 Q330 340 320 384 Q336 392 344 380 Q352 352 388 340 Z" fill="#fcd7b6" stroke-width="6"/>`,
      `<path d="M460 316 Q510 330 524 372 Q510 382 500 372 Q490 346 456 340 Z" fill="#fcd7b6" stroke-width="6"/>`,
      // tête
      `<path d="M404 262 L436 262 L436 304 L404 304 Z" fill="#fcd7b6" stroke-width="6"/>`,
      `<circle cx="420" cy="208" r="66" fill="#fcd7b6"/>`,
      `<path d="M354 204 Q356 136 420 134 Q486 136 486 204 Q460 170 436 186 Q416 160 396 182 Q370 172 354 204 Z" fill="#8b5cf6"/>`,
      `<path d="M470 150 Q500 130 504 160 Q520 176 494 184 Q476 180 470 150 Z" fill="#fb7185" stroke-width="5"/>`,
      `<ellipse class="ink" cx="396" cy="214" rx="8" ry="11" fill="${INK}" stroke-width="2"/>`,
      `<ellipse class="ink" cx="444" cy="214" rx="8" ry="11" fill="${INK}" stroke-width="2"/>`,
      `<circle cx="399" cy="209" r="3" fill="#ffffff" stroke="none"/><circle cx="447" cy="209" r="3" fill="#ffffff" stroke="none"/>`,
      `<path d="M406 244 Q420 256 434 244" fill="none" stroke-width="5"/>`,
      `<ellipse cx="380" cy="238" rx="11" ry="7" fill="#fda4af" stroke-width="4"/>`,
      `<ellipse cx="460" cy="238" rx="11" ry="7" fill="#fda4af" stroke-width="4"/>`,
      // petit poisson ami
      `<path d="M610 250 Q650 214 700 250 Q650 286 610 250 Z" fill="#fde047"/>`,
      `<path d="M700 250 L730 226 L730 274 Z" fill="#fb923c"/>`,
      `<circle class="ink" cx="630" cy="246" r="5" fill="${INK}" stroke-width="2"/>`
    ].join('')
  });

  // 9. CHATON ET PELOTE
  PAGES.push({
    id: 'chat', name: 'Chaton', cat: 'animaux', speak: 'Le chaton et sa pelote',
    svg: () => [
      // fenêtre
      `<path d="M580 60 L840 60 L840 300 L580 300 Z" fill="#bae6fd"/>`,
      `<path d="M710 60 L710 300 M580 180 L840 180" fill="none" stroke-width="7"/>`,
      `<circle cx="650" cy="120" r="30" fill="#fde047" stroke-width="5"/>`,
      // tapis
      `<ellipse cx="420" cy="560" rx="380" ry="70" fill="#fca5a5"/>`,
      `<ellipse cx="420" cy="560" rx="300" ry="46" fill="#fde68a"/>`,
      // queue
      `<path d="M520 500 Q640 500 640 410 Q640 360 600 360 Q620 400 610 430 Q590 470 520 470 Z" fill="#fb923c"/>`,
      `<path d="M612 380 L638 386 M622 426 L640 440" fill="none" stroke-width="5"/>`,
      // corps
      `<path d="M330 330 Q300 400 300 470 Q300 540 420 544 Q540 540 540 470 Q540 400 510 330 Z" fill="#fb923c"/>`,
      `<path d="M380 380 Q420 360 460 380 Q480 450 460 520 Q420 534 380 520 Q360 450 380 380 Z" fill="#ffedd5"/>`,
      // pattes
      `<ellipse cx="370" cy="540" rx="40" ry="24" fill="#fb923c"/>`,
      `<ellipse cx="470" cy="540" rx="40" ry="24" fill="#fb923c"/>`,
      `<path d="M356 548 L356 560 M376 550 L376 562 M456 550 L456 562 M476 548 L476 560" fill="none" stroke-width="4"/>`,
      // oreilles
      `<path d="M300 210 L290 90 L380 150 Z" fill="#fb923c"/>`,
      `<path d="M540 210 L550 90 L460 150 Z" fill="#fb923c"/>`,
      `<path d="M310 180 L306 120 L356 154 Z" fill="#fda4af" stroke-width="5"/>`,
      `<path d="M530 180 L534 120 L484 154 Z" fill="#fda4af" stroke-width="5"/>`,
      // tête
      `<path d="M420 130 Q560 130 566 240 Q570 340 420 346 Q270 340 274 240 Q280 130 420 130 Z" fill="#fb923c"/>`,
      `<path d="M400 134 L408 176 L420 134 M432 134 L440 172 L448 136" fill="none" stroke-width="5"/>`,
      `<path d="M274 230 L314 236 M276 266 L314 262 M566 230 L526 236 M564 266 L526 262" fill="none" stroke-width="5"/>`,
      `<ellipse cx="420" cy="290" rx="64" ry="42" fill="#ffedd5"/>`,
      eye(368, 230, 26),
      eye(472, 230, 26),
      `<path d="M408 270 L432 270 L420 284 Z" fill="#fb7185" stroke-width="5"/>`,
      `<path d="M420 284 Q408 304 394 296 M420 284 Q432 304 446 296" fill="none" stroke-width="5"/>`,
      `<path d="M370 288 L320 280 M370 300 L322 306 M470 288 L520 280 M470 300 L518 306" fill="none" stroke-width="4"/>`,
      // pelote
      `<circle cx="200" cy="480" r="72" fill="#60a5fa"/>`,
      `<path d="M140 440 Q200 470 262 440 M132 480 Q200 510 268 480 M148 524 Q200 550 252 524 M170 414 Q150 480 176 548 M230 414 Q250 480 224 548" fill="none" stroke-width="5"/>`,
      `<path d="M272 490 Q300 530 280 560 Q260 590 300 600" fill="none" stroke-width="5"/>`,
      heart(150, 140, 26, '#fb7185'),
      heart(220, 230, 18, '#fb7185')
    ].join('')
  });

  // 10. PAPILLON ET FLEURS
  PAGES.push({
    id: 'papillon', name: 'Papillon', cat: 'animaux', speak: 'Le papillon et les fleurs',
    svg: () => [
      sun(110, 100, 45),
      cloud(780, 90, 0.9),
      ground(560),
      flower(170, 470, 40, '#f472b6', '#facc15', 600),
      flower(450, 500, 34, '#fb923c', '#fde047', 600),
      flower(730, 460, 42, '#a78bfa', '#facc15', 600),
      // ailes du haut
      `<path d="M440 270 Q360 110 250 120 Q170 140 200 230 Q230 300 440 300 Z" fill="#60a5fa"/>`,
      `<path d="M460 270 Q540 110 650 120 Q730 140 700 230 Q670 300 460 300 Z" fill="#60a5fa"/>`,
      // ailes du bas
      `<path d="M440 300 Q300 300 270 370 Q260 430 330 430 Q410 420 440 330 Z" fill="#c084fc"/>`,
      `<path d="M460 300 Q600 300 630 370 Q640 430 570 430 Q490 420 460 330 Z" fill="#c084fc"/>`,
      // motifs
      `<circle cx="290" cy="200" r="34" fill="#fde047" stroke-width="5"/>`,
      `<circle cx="290" cy="200" r="14" fill="#fb7185" stroke-width="5"/>`,
      `<circle cx="610" cy="200" r="34" fill="#fde047" stroke-width="5"/>`,
      `<circle cx="610" cy="200" r="14" fill="#fb7185" stroke-width="5"/>`,
      `<circle cx="370" cy="160" r="16" fill="#a7f3d0" stroke-width="5"/>`,
      `<circle cx="530" cy="160" r="16" fill="#a7f3d0" stroke-width="5"/>`,
      `<circle cx="370" cy="254" r="18" fill="#a7f3d0" stroke-width="5"/>`,
      `<circle cx="530" cy="254" r="18" fill="#a7f3d0" stroke-width="5"/>`,
      heart(330, 380, 20, '#fde047'),
      heart(570, 380, 20, '#fde047'),
      // corps
      `<path d="M450 200 Q474 210 474 260 L474 400 Q474 440 450 444 Q426 440 426 400 L426 260 Q426 210 450 200 Z" fill="#fb923c"/>`,
      `<path d="M428 300 L472 300 M428 340 L472 340 M428 380 L472 380" fill="none" stroke-width="5"/>`,
      `<circle cx="450" cy="190" r="34" fill="#fb923c"/>`,
      `<circle class="ink" cx="438" cy="186" r="6" fill="${INK}" stroke-width="2"/><circle class="ink" cx="462" cy="186" r="6" fill="${INK}" stroke-width="2"/>`,
      `<path d="M438 204 Q450 214 462 204" fill="none" stroke-width="4"/>`,
      // antennes
      `<path d="M438 160 Q420 110 392 96 M462 160 Q480 110 508 96" fill="none" stroke-width="5"/>`,
      `<circle cx="390" cy="94" r="12" fill="#fb7185" stroke-width="5"/>`,
      `<circle cx="510" cy="94" r="12" fill="#fb7185" stroke-width="5"/>`
    ].join('')
  });

  // 11. FUSÉE DANS L'ESPACE
  PAGES.push({
    id: 'fusee', name: 'Fusée', cat: 'aventure', speak: 'La fusée dans l\'espace',
    svg: () => [
      // planète à anneau
      `<path d="M610 150 Q700 100 840 110 Q860 130 790 160 Q720 186 640 190 Q590 188 610 150 Z" fill="#fde047"/>`,
      `<circle cx="720" cy="150" r="62" fill="#fb923c"/>`,
      `<path d="M664 120 Q720 136 776 120 M660 170 Q720 186 780 170" fill="none" stroke-width="5"/>`,
      `<path d="M664 172 Q720 178 778 166 Q800 160 836 132 Q856 120 840 110" fill="none" stroke-width="7"/>`,
      // lune
      `<circle cx="150" cy="500" r="80" fill="#e5e7eb"/>`,
      `<circle cx="120" cy="470" r="18" fill="#cbd5e1" stroke-width="5"/>`,
      `<circle cx="180" cy="530" r="22" fill="#cbd5e1" stroke-width="5"/>`,
      `<circle cx="168" cy="460" r="10" fill="#cbd5e1" stroke-width="5"/>`,
      star(100, 100, 26, '#fde047'),
      star(260, 200, 18, '#fde047'),
      star(840, 330, 24, '#fde047'),
      star(700, 520, 20, '#fde047'),
      star(560, 600, 14, '#fde047'),
      star(320, 600, 16, '#fde047'),
      `<circle cx="420" cy="70" r="7" fill="#fde047" stroke-width="4"/><circle cx="820" cy="460" r="6" fill="#fde047" stroke-width="4"/><circle cx="60" cy="300" r="7" fill="#fde047" stroke-width="4"/>`,
      `<g transform="rotate(35 450 330)">` +
        // flammes
        `<path d="M400 470 Q380 540 450 610 Q520 540 500 470 Z" fill="#fb923c"/>` +
        `<path d="M420 470 Q412 520 450 570 Q488 520 480 470 Z" fill="#fde047" stroke-width="5"/>` +
        // ailerons
        `<path d="M380 380 Q320 420 320 490 L392 460 Z" fill="#ef4444"/>` +
        `<path d="M520 380 Q580 420 580 490 L508 460 Z" fill="#ef4444"/>` +
        // corps
        `<path d="M450 90 Q540 170 530 330 Q526 420 510 480 L390 480 Q374 420 370 330 Q360 170 450 90 Z" fill="#f1f5f9"/>` +
        `<path d="M450 90 Q500 134 518 190 Q450 210 382 190 Q400 134 450 90 Z" fill="#ef4444"/>` +
        `<circle cx="450" cy="270" r="44" fill="#93c5fd"/>` +
        `<circle cx="450" cy="270" r="28" fill="#bae6fd" stroke-width="5"/>` +
        `<path d="M392 380 L508 380 L506 410 L394 410 Z" fill="#60a5fa" stroke-width="5"/>` +
        `<path d="M410 480 L490 480 L480 500 L420 500 Z" fill="#94a3b8" stroke-width="5"/>` +
        `<path d="M450 410 L450 480" fill="none" stroke-width="5"/>` +
      `</g>`
    ].join('')
  });

  // 12. FOND DE LA MER
  PAGES.push({
    id: 'ocean', name: 'Fond de la mer', cat: 'mer', speak: 'Le fond de la mer',
    svg: () => [
      bubbles([[640, 80, 18], [670, 130, 11], [180, 70, 14], [210, 110, 9], [500, 90, 12]]),
      // sable
      `<path d="M-10 560 Q225 530 450 560 T910 552 L910 660 L-10 660 Z" fill="#fde68a"/>`,
      // algues
      `<path d="M90 580 Q60 500 100 440 Q130 380 100 300 Q160 380 136 450 Q114 510 130 580 Z" fill="#22c55e"/>`,
      `<path d="M150 580 Q140 520 170 470 Q190 430 176 390 Q220 440 200 490 Q186 530 190 580 Z" fill="#4ade80"/>`,
      `<path d="M800 580 Q770 490 810 430 Q840 370 810 300 Q870 370 846 440 Q826 500 840 580 Z" fill="#4ade80"/>`,
      // gros poisson
      `<path d="M300 260 Q400 150 540 220 Q600 250 540 290 Q400 370 300 260 Z" fill="#fb923c"/>`,
      `<path d="M300 260 L230 200 L246 260 L230 320 Z" fill="#fde047"/>`,
      `<path d="M400 190 Q430 150 480 170 Q460 186 450 200 Z" fill="#fde047"/>`,
      `<path d="M400 205 Q384 260 404 318 M450 200 Q434 260 452 326" fill="none" stroke-width="6"/>`,
      `<path d="M408 205 Q392 260 412 316 L444 324 Q426 262 442 202 Z" fill="#ffffff" stroke-width="0"/>`,
      eye(500, 236, 16),
      `<path d="M540 272 Q556 268 562 256" fill="none" stroke-width="5"/>`,
      // tortue
      `<ellipse cx="660" cy="410" rx="30" ry="22" fill="#86efac"/>`,
      `<ellipse cx="560" cy="450" rx="22" ry="14" transform="rotate(30 560 450)" fill="#86efac"/>`,
      `<ellipse cx="610" cy="470" rx="22" ry="14" transform="rotate(-20 610 470)" fill="#86efac"/>`,
      `<ellipse cx="530" cy="380" rx="26" ry="14" transform="rotate(-30 530 380)" fill="#86efac"/>`,
      `<path d="M500 430 Q520 340 600 344 Q660 348 670 420 Q600 450 500 430 Z" fill="#16a34a"/>`,
      `<path d="M560 350 L548 386 L584 400 L612 380 L600 348 M548 386 L520 410 M584 400 L590 438 M612 380 L654 400" fill="none" stroke-width="5"/>`,
      `<circle class="ink" cx="672" cy="402" r="5" fill="${INK}" stroke-width="2"/>`,
      // pieuvre
      `<path d="M250 420 Q250 360 310 360 Q370 360 370 420 Q370 450 350 460 Q360 500 340 520 Q330 480 320 470 Q316 510 296 524 Q296 480 290 470 Q274 506 254 512 Q268 474 264 458 Q250 450 250 420 Z" fill="#f472b6"/>`,
      `<circle class="ink" cx="292" cy="410" r="6" fill="${INK}" stroke-width="2"/><circle class="ink" cx="328" cy="410" r="6" fill="${INK}" stroke-width="2"/>`,
      `<path d="M298 432 Q310 442 322 432" fill="none" stroke-width="4"/>`,
      `<circle cx="282" cy="386" r="8" fill="#fbcfe8" stroke-width="4"/><circle cx="340" cy="384" r="6" fill="#fbcfe8" stroke-width="4"/>`,
      // petit poisson
      `<path d="M680 220 Q720 186 770 220 Q720 254 680 220 Z" fill="#60a5fa"/>`,
      `<path d="M770 220 L800 196 L800 244 Z" fill="#a78bfa"/>`,
      `<circle class="ink" cx="700" cy="216" r="5" fill="${INK}" stroke-width="2"/>`,
      // étoile de mer + coquillages
      star(470, 600, 30, '#f87171', 14),
      `<path d="M640 620 Q640 576 676 570 Q712 576 712 620 Z" fill="#f9a8d4"/>`,
      `<path d="M656 620 L668 578 M676 620 L676 572 M696 620 L684 578" fill="none" stroke-width="4"/>`,
      `<path d="M300 610 Q300 584 330 584 Q360 584 352 606 Q340 620 300 610 Z" fill="#c4b5fd" stroke-width="5"/>`
    ].join('')
  });

  // ---------- Fabrication des SVG ----------
  function wrap(body, lineOnly) {
    const style = lineOnly
      ? `<style>.w *:not(.ink):not([fill="none"]){fill:#ffffff !important}.w .ink{fill:${INK} !important}</style>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650" width="900" height="650">${style}` +
      `<rect width="900" height="650" fill="${lineOnly ? '#ffffff' : '#f8fafc'}"/>` +
      `<g class="${lineOnly ? 'w' : ''}" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
  }

  const toUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  window.COLORING_PAGES = PAGES.map((p) => {
    const body = p.svg();
    return {
      id: p.id,
      name: p.name,
      cat: p.cat,
      speak: p.speak,
      lineUrl: toUrl(wrap(body, true)),
      modelUrl: toUrl(wrap(body, false))
    };
  });

  window.COLORING_CATEGORIES = [
    { id: 'dinos', label: 'Dinos', emoji: '🦖' },
    { id: 'magie', label: 'Magie', emoji: '🦄' },
    { id: 'animaux', label: 'Animaux', emoji: '🐱' },
    { id: 'mer', label: 'La mer', emoji: '🐠' },
    { id: 'aventure', label: 'Espace', emoji: '🚀' }
  ];
})();
