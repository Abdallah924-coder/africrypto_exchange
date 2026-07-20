# AfriCrypto Exchange — Squelette complet (backend + frontend)

## Démarrage rapide

### Backend
```bash
cd backend
npm install
cp .env.example .env   # renseigner MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, etc.
npm run dev             # http://localhost:4000
```
Le compte admin est créé/synchronisé automatiquement au démarrage à partir de
`ADMIN_EMAIL` / `ADMIN_PASSWORD` — rien à faire en base de données.

### Frontend
Ouvrir `frontend/index.html` avec un serveur statique (Live Server, `npx serve`, etc.) —
pas de build nécessaire, c'est du HTML/CSS/JS vanilla comme le reste du projet.
Si le backend ne tourne pas sur localhost:4000, définir `window.API_BASE_URL` dans
chaque page avant le chargement de `js/api.js`.

## Ce qui est implémenté
- Auth (inscription, connexion, JWT) + structure 2FA prête à brancher
- Wallet interne (solde disponible / bloqué) + génération d'adresse de dépôt (squelette)
- P2P complet : annonces, achat, escrow (blocage/libération), chat temps réel (Socket.IO), litiges
- Panel admin pour trancher les litiges
- Thème visuel partagé (noir, orange, jaune python) sur toutes les pages

## Garde des fonds (self-hosted) — architecture réelle, pas simulée

Le module de garde est maintenant fonctionnel, pas un stub :

- `signer-service/` — service **isolé**, seul endroit où vivent la mnémonique de dérivation
  et la clé privée du hot wallet. Dérive les adresses de dépôt (BIP-44, `ethers.HDNodeWallet`),
  signe et diffuse les balayages (dépôt → hot wallet) et les retraits.
- `backend/services/depositMonitor.js` — interroge le solde USDT on-chain de chaque adresse
  de dépôt toutes les `DEPOSIT_POLL_INTERVAL_MS`, crédite automatiquement les nouveaux dépôts,
  déclenche le balayage vers le hot wallet au-delà de `SWEEP_THRESHOLD_USDT`.
- `backend/controllers/wallet.controller.js` — ne connaît plus aucune clé privée, parle au
  signer-service via `SIGNER_SERVICE_URL` + `SIGNER_SHARED_SECRET`.

### Génération de la clé mère — à faire toi-même, hors-ligne
```bash
node -e "console.log(require('ethers').Wallet.createRandom().mnemonic.phrase)"
```
Ne colle jamais cette phrase dans un chat, un ticket, un fichier versionné (git), ou un
message Slack/WhatsApp. Stocke-la dans un secret manager (Vault, AWS Secrets Manager, ou au
minimum un gestionnaire de mots de passe chiffré), et ne l'injecte dans `.env` du
signer-service qu'au runtime, sur la machine isolée elle-même.

### Test complet sur testnet — obligatoire avant tout argent réel
1. Générer une mnémonique de test (différente de la future mnémonique de production) et
   une clé de hot wallet de test.
2. Récupérer du BNB testnet via un faucet BSC testnet, et un token USDT-like sur testnet
   (déployer un ERC20 mock si besoin).
3. Renseigner `RPC_URL` (déjà pointé sur le testnet par défaut), `USDT_CONTRACT_ADDRESS`,
   `HOT_WALLET_ADDRESS` dans les deux `.env`.
4. Lancer `signer-service` puis `backend`, créer un compte, déposer sur l'adresse générée,
   vérifier que `depositMonitor` crédite le solde et déclenche le balayage, puis tester un
   retrait de bout en bout.
5. Ne migrer vers le mainnet (nouvelle mnémonique, nouveau hot wallet) qu'après ce test complet
   **et** une revue de sécurité par quelqu'un d'autre que toi.

### Déploiement — non négociable
- `signer-service` sur une machine séparée de `backend`, sans port exposé à internet.
- Le hot wallet ne garde qu'un solde de travail limité — le reste en cold storage hors ligne.
- Journaliser et surveiller chaque appel à `/sweep` et `/withdraw`.
- Prévoir une procédure de rotation de clé et un plan de réponse à incident avant le
  lancement, pas après.

## Ce qui te reste à faire, concrètement (dans l'ordre)
1. `cd signer-service && npm install`, générer une mnémonique de **test** hors-ligne
   (commande dans la section ci-dessus), remplir `signer-service/.env`.
2. `cd backend && npm install`, remplir `backend/.env` (mêmes `RPC_URL` /
   `USDT_CONTRACT_ADDRESS` que le signer-service, + `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
3. Lancer `signer-service` (`npm start`) puis `backend` (`npm run dev`) — dans cet ordre.
4. Ouvrir `frontend/index.html`, créer un compte, aller sur Portefeuille, copier l'adresse
   de dépôt générée, envoyer un peu de USDT **testnet** dessus, vérifier que le solde se
   met à jour automatiquement (le monitor tourne toutes les `DEPOSIT_POLL_INTERVAL_MS`).
5. Tester un retrait de bout en bout sur testnet.
6. Seulement après ce test complet réussi : répéter avec une nouvelle mnémonique et un
   nouveau hot wallet sur le mainnet, et faire relire l'ensemble par quelqu'un d'autre que
   toi avant d'accepter de l'argent réel de tes utilisateurs.

## Ce qui manque encore
Upload/vérification KYC, endpoint `GET /p2p/transactions/:id` et `/p2p/transactions/mine`
(référencés côté frontend mais pas encore côté API), rate limiting, tests automatisés,
migration vers des logs d'événements (`Transfer`) plutôt que du polling pur quand le volume
grandit, support TRON (actuellement BSC uniquement), 2FA côté retrait, et surtout : un audit
de sécurité externe du flux dépôt/balayage/retrait avant d'accepter de l'argent réel de tes
10 000 utilisateurs.

## Structure
```
backend/
  models/        User, Wallet, Listing, P2PTransaction, Message, Dispute
  controllers/    logique métier (escrow, commissions, litiges)
  routes/         endpoints REST
  sockets/        chat temps réel
frontend/
  css/theme.css   design tokens partagés
  js/api.js       client API
  index.html, register.html, dashboard.html, wallet.html, p2p.html,
  p2p-transaction.html, admin.html
```