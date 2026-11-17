# 🦖 Dino & Magie : L'Atelier Créatif (6-7 ans)

Un jeu créatif **100 % tactile** conçu pour les enfants de **6 à 7 ans**, jouable sur tablette et téléphone sans publicité, sans installation complexe et fonctionnant même hors-ligne.

## ✨ Activités incluses
- 🎨 **Atelier Coloriage** : 20 dessins au trait (Dinos, Magie, Animaux, Mer, Véhicules, Fêtes & saisons) + page blanche.
  - 💾 Sauvegarde automatique : chaque dessin en cours est gardé sur la tablette et rouvert tel quel.
  - 🔢 Mode Numéros et ➕ mode Calculs : chaque zone porte un numéro (ou une opération), la bonne couleur la remplit.
  - 🪣 Pot magique par zones, avec motifs : uni, pois, rayures, étoiles, cœurs, dégradé, paillettes.
  - 🛡️ Pinceau « sans déborder », 🪄 baguette (couleur du modèle), tampons, gomme.
  - 🔍 Zoom à deux doigts, bouton « Vue entière » pour revenir.
  - 🔒 Déblocage : 8 dessins ouverts au départ, chaque dessin fini en ouvre 2 (réglable en haut de la section 3 de `app.js` : `FREE_PAGES`, `PAGES_PER_DONE`).
  - ⭐ Chaque dessin fini devient un autocollant dans « Mon Monde ».
  - 🖨️ Impression du dessin vierge depuis l'écran « Dessins ».
  - Les dessins sont dans `coloriages.js` : pour en ajouter un, copier un bloc `PAGES.push({...})`.
- 📴 **Hors-ligne** : après une première visite avec internet, le jeu fonctionne sans réseau (`sw.js`), y compris `Monde de blocs`.
- 🏰 **Mon Monde Dino Magique** : Décor interactif à glisser-déposer avec œuf surprise qui éclot, volcan magique et mode danse.
- 🎹 **L'Orchestre des Dinos** : Piano géant arc-en-ciel (8 notes), 4 instruments, boucles rythmiques et enregistreur de chansons.
- 📸 **Mon Album Magique** : Sauvegarde et téléchargement des créations de l'enfant (coloriages + photos 3D du Monde de blocs).

## 📱 Jouer sur Tablette ou Téléphone (GitHub Pages)
Une fois publié sur **GitHub Pages**, ouvrez le lien sur la tablette ou le téléphone puis choisissez **« Ajouter à l'écran d'accueil »** dans Safari ou Chrome pour y jouer en plein écran comme une vraie application !

## 🧱 Monde de blocs (dossier `blocs/`)

Jeu 3D en blocs, ouvert depuis l'onglet « Monde de blocs » de l'Atelier.

- 🏃 **Parcours** : 5 niveaux de sauts (plateformes qui bougent, trampolines, lave, portes magiques à calcul), pièces à ramasser, points de sauvegarde. Chaque niveau réussi ouvre le suivant.
- 🏝️ **Petit monde** : grande île à explorer **et à modifier en jeu** (`128×128`), montagne enneigée avec trampolines, forêt aux champignons géants, vallée arc-en-ciel et îlot au trésor relié par un pont en bois. 24 gemmes, 6 coffres à calcul, 8 animaux amis (dont renard, panda et bébé dino), bouton `🧭 Indice` lumineux, retour `🏡` à la maison et bouton `🔨` pour poser/enlever arbres, palmiers, maisons visitables, barrières qui se connectent toutes seules, ponts sur l'eau, fleurs, champignons, trampolines, lampes et blocs colorés (sauvegarde automatique + `↩️ Oups`).
- 🏗️ **Construction** :
  - Poser, enlever, peindre, copier une couleur (`💧`), prévisualisation fantôme du bloc avant de poser.
  - Modes rapides : `👆 1 bloc`, `〰️ Glisser` (tracer en continu), `🗼 Pile ×3`, et `🪞 Symétrie` (miroir automatique).
  - Blocs spéciaux en plus des 14 couleurs et de la vitre : `🦘 Trampoline`, `💡 Lampe` (brille la nuit), `💧 Eau`, `🌿 Feuillage`, `🌸 Fleur`, `🚪 Porte automatique`, `🪙 Or`, `🎉 Bloc Fête` (confettis 3D), `🔺 Toit`.
  - Mode `☀️ Jour / 🌙 Nuit` avec ciel étoilé et lune.
  - 5 modèles prêts à décorer (`🏠 Maison`, `🏰 Château`, `🚀 Fusée`, `🦖 Dino géant`, `🌈 Pont & Lac`).
  - 3 emplacements de sauvegarde (« Mes 3 Mondes »), boutons caméra (`↺` `🎯` `↻`) + déplacement à 2 doigts.
  - `🚶 Me promener` : exploration dans sa construction avec ses animaux amis adoptés dans « Petit monde », possibilité de poser/casser un bloc devant soi et bouton `📸 Photo` relié à « Mon Album ».
- 👕 **Mon perso** : couleurs du t-shirt, du pantalon, de la peau et des cheveux, chapeaux débloqués avec les étoiles gagnées.
- Commandes : joystick (doigt sur la moitié gauche), caméra (glisser à droite, pincer pour zoomer, glisser à 2 doigts pour déplacer en construction), bouton Saute. Sur ordinateur : flèches/ZQSD + espace.

**Modifier le jeu** : les sources sont dans `blocs/src/`. Après une modification, reconstruire `blocs/jeu.js` :

```
cd blocs
npm install
npm run build
```
