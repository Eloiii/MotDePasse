# Mot de passe

Le jeu télévisé « Mot de passe », jouable en ligne à deux.

## Règles

- Deux joueurs, six mots par partie : chacun devine **3 mots**, en alternance (A, B, A, B, A, B).
- Le joueur qui voit le mot donne un indice d’**un seul mot** (interdit d’utiliser le mot lui-même ou un mot qui le contient).
- Son partenaire propose une réponse. Si c’est faux, nouvel indice, et ainsi de suite.
- **30 secondes** maximum par mot.
- Le jeu est coopératif : mot trouvé au 1er indice = 5 points, puis 4, 3, 2, 1.
- Entre deux mots, chaque joueur clique sur « Prêt » : le mot suivant démarre quand les deux sont prêts.
- Un petit chat (bulle 💬 en bas à droite) permet de discuter entre les manches ; il est fermé pendant qu’un mot est en jeu.

## Lancer le jeu

Prérequis : Node.js 24+ (le serveur TypeScript est exécuté directement par Node).

```sh
npm install
npm run dev        # serveur WebSocket (port 3001) + client Vite (port 5173)
```

Ouvrez http://localhost:5173, créez une partie et partagez le code (ou le lien d’invitation) avec l’autre joueur.
Vite écoute sur le réseau local, donc un autre appareil peut rejoindre via `http://<votre-ip>:5173`.

En production, un seul processus sert le client et le WebSocket :

```sh
npm run build
npm start          # http://localhost:3001 (variable PORT pour changer le port)
```

## Déployer en ligne (gratuit, Render)

L’application est un seul serveur Node (client + WebSocket) : il faut un hébergeur qui garde un processus
Node actif. Vercel / Netlify ne conviennent pas (pas de WebSocket persistant).

1. Mettre le projet sur GitHub :
   ```sh
   git init && git add . && git commit -m "Mot de passe"
   gh repo create mot-de-passe --public --source . --push   # ou créer le dépôt sur github.com puis git push
   ```
2. Sur [render.com](https://render.com), créer un compte (gratuit, sans carte bancaire), puis
   **New → Blueprint** et choisir le dépôt. Le fichier `render.yaml` configure tout :
   build `npm ci && npm run build`, démarrage `npm start`, Node 24, offre gratuite.
3. Après le premier déploiement (quelques minutes), le jeu est disponible sur
   `https://mot-de-passe-xxxx.onrender.com`. Chaque `git push` redéploie automatiquement.

Limites de l’offre gratuite :

- le serveur s’endort après 15 min sans activité ; la première visite suivante prend environ 1 minute ;
- les parties sont en mémoire : un redémarrage ou une mise en veille termine les parties en cours ;
- 750 h d’exécution par mois (suffisant pour un seul service).

## Structure

- `server/protocol.ts` — types des messages et constantes partagés client/serveur
- `server/game.ts` — logique du jeu (salles, manches, minuteur, scores)
- `server/words.ts` — liste des mots à deviner
- `server/index.ts` — serveur HTTP + WebSocket (`/ws`)
- `src/` — client Vue 3 (`useGame.ts` gère la connexion WebSocket)

Tests de la logique : `npm test`
