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
- 📴 **Hors-ligne** : après une première visite avec internet, le jeu fonctionne sans réseau (`sw.js`).
- 🏰 **Mon Monde Dino Magique** : Décor interactif à glisser-déposer avec œuf surprise qui éclot, volcan magique et mode danse.
- 🎹 **L'Orchestre des Dinos** : Piano géant arc-en-ciel (8 notes), 4 instruments, boucles rythmiques et enregistreur de chansons.
- 📸 **Mon Album Magique** : Sauvegarde et téléchargement des créations de l'enfant.

## 📱 Jouer sur Tablette ou Téléphone (GitHub Pages)
Une fois publié sur **GitHub Pages**, ouvrez le lien sur la tablette ou le téléphone puis choisissez **« Ajouter à l'écran d'accueil »** dans Safari ou Chrome pour y jouer en plein écran comme une vraie application !

## 🧱 Monde de blocs (dossier `blocs/`)

Jeu 3D en blocs, ouvert depuis l'onglet « Monde de blocs » de l'Atelier.

- 🏃 **Parcours** : 5 niveaux de sauts (plateformes qui bougent, trampolines, lave, portes magiques à calcul), pièces à ramasser, points de sauvegarde. Chaque niveau réussi ouvre le suivant.
- 🏝️ **Petit monde** : une île à explorer, 12 gemmes, 3 coffres à calcul, 5 animaux qui deviennent amis et suivent le joueur.
- 🏗️ **Construction** : poser, enlever et peindre des blocs (15 couleurs dont la vitre), maison modèle, puis « Me promener » dans sa construction. Sauvegarde automatique.
- 👕 **Mon perso** : couleurs du t-shirt, du pantalon, de la peau et des cheveux, chapeaux débloqués avec les étoiles gagnées.
- Commandes : joystick (doigt sur la moitié gauche), caméra (glisser à droite, pincer pour zoomer), bouton Saute. Sur ordinateur : flèches/ZQSD + espace.

**Modifier le jeu** : les sources sont dans `blocs/src/`. Après une modification, reconstruire `blocs/jeu.js` :

```
cd blocs
npm install
npm run build
```
