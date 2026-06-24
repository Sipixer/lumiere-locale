# Lumière Locale — CinéMatch

Refonte propre et gamifiée du prototype [aziliss/lumierelocale](https://github.com/aziliss/lumierelocale).

Une marketplace cinéma qui connecte **réalisateurs** et **salles indépendantes**, avec un mini-jeu
de programmation (drag & drop) et un programme de fidélité (points → niveaux → récompenses).

## Lancer

Aucune dépendance, aucun build. Ouvre simplement le fichier :

```bash
open index.html        # macOS
```

Ou sers-le localement :

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```

Déployable tel quel sur **GitHub Pages** (un seul fichier `index.html`).

## Ce qui a été refait vs le proto

- **Design system** cohérent (palette, typo, espacements, rayons, ombres) au lieu d'emojis bruts.
- **Set d'icônes SVG** propre (style Lucide) en sprite réutilisable.
- **Toggle de rôle** animé qui reconfigure tout (pitch, niveaux, récompenses, formulaire).
- **HUD de progression** permanent : points, niveau actuel, barre vers le palier suivant, récompenses débloquées/verrouillées.
- **Drag & drop accessible** : fonctionne à la souris, au doigt (mobile) **et** au clavier / clic-pour-placer.
- **Score d'audience** calculé par adéquation film ↔ ligne éditoriale de la salle, avec animation + verdict.
- **Persistance** des points et du rôle en `localStorage`.
- **Micro-interactions** : compteur animé, confettis à la montée de niveau, toasts, transitions.
- **Responsive** mobile-first + respect de `prefers-reduced-motion`.

## Où brancher le vrai backend

Le formulaire de contact est simulé (prototype). Le point d'accroche est commenté dans
`init()` / `wireForm()` :

```js
// window.location.href = state.role==="real" ? "/contact-realisateur" : "/catalogue-diffuseur";
```

## Données

Tout est centralisé en haut du `<script>` : `FILMS`, `SALLES`, `ROLES`, `EARN_TABLE`.
Les barèmes, niveaux et récompenses reprennent fidèlement ceux du prototype d'origine.
