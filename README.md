# AfriCrypto Exchange — Squelette complet (backend + frontend)

## Démarrage rapide

### Backend
```bash
cd backend
npm install
cp .env.example .env   # renseigner MONGODB_URI et JWT_SECRET
npm run dev             # http://localhost:4000
```

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

## Ce qui reste à faire avant la production (important)
Ce squelette pose l'architecture et la logique métier (escrow, statuts, commissions),
mais trois zones sensibles sont volontairement des stubs à ne pas utiliser telles quelles :

1. **Garde des clés privées** (`backend/utils/hdWallet.js`) — la dérivation d'adresses
   est simulée. En prod, la clé mère ne doit jamais être en clair dans le code/l'env :
   passer par un WaaS (Fireblocks, Cobo) ou un KMS/HSM.
2. **Monitoring des dépôts on-chain** — `backend/controllers/wallet.controller.js`
   expose un webhook `/wallet/webhook/deposit` mais rien n'écoute encore la blockchain ;
   il faut brancher un fournisseur (Moralis, QuickNode) avec vérification de signature
   et nombre de confirmations avant crédit.
3. **Envoi réel des retraits** — actuellement le solde est débité mais aucune transaction
   n'est diffusée sur la blockchain ; à brancher sur le même service de signature que (1).

Egalement absents : upload/vérification KYC, endpoint `GET /p2p/transactions/:id`
et `/p2p/transactions/mine` (référencés côté frontend mais pas encore côté API),
rate limiting, tests, migrations Mongo indexées en prod (Mongoose crée les index
automatiquement en dev, à gérer explicitement en prod).

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
