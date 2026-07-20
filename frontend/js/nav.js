// Nav partagée (topbar + hamburger + drawer mobile) — injectée dans #app-nav sur chaque page.
// Ajouter une page ici l'ajoute automatiquement partout.
const NAV_PAGES = [
  { href: 'dashboard.html', label: 'Dashboard' },
  { href: 'wallet.html', label: 'Portefeuille' },
  { href: 'p2p.html', label: 'P2P' },
  { href: 'spot.html', label: 'Spot' },
  { href: 'history.html', label: 'Historique' },
  { href: 'kyc.html', label: 'Vérification' },
  { href: 'profile.html', label: 'Profil' }
];

function renderNav() {
  const root = document.getElementById('app-nav');
  if (!root) return;
  const current = location.pathname.split('/').pop();
  const isAdmin = document.body.dataset.admin === 'true';

  const links = NAV_PAGES.concat(isAdmin ? [{ href: 'admin.html', label: 'Admin' }] : []);

  root.innerHTML = `
    <header class="topbar">
      <a href="dashboard.html" class="brand">
        <div class="mark">A</div>
        <div class="name">AfriCrypto <span>Exchange</span></div>
      </a>
      <nav class="tabs">
        ${links.map(p => `<a href="${p.href}" class="${p.href === current ? 'active' : ''}">${p.label}</a>`).join('')}
      </nav>
      <div class="user-menu" data-user-menu>
        <div class="avatar">U</div>
        <button class="btn btn-ghost" onclick="logout()">Déconnexion</button>
      </div>
      <button class="hamburger" id="hamburgerBtn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </header>
    <div class="mobile-drawer" id="mobileDrawer">
      <div class="drawer-head">
        <div class="name">Menu</div>
        <button class="close-btn" id="closeDrawerBtn">✕</button>
      </div>
      ${links.map(p => `<a href="${p.href}" class="${p.href === current ? 'active' : ''}">${p.label}</a>`).join('')}
      <a href="#" onclick="logout()">Déconnexion</a>
    </div>`;

  document.getElementById('hamburgerBtn').addEventListener('click', () => {
    document.getElementById('mobileDrawer').classList.add('open');
  });
  document.getElementById('closeDrawerBtn').addEventListener('click', () => {
    document.getElementById('mobileDrawer').classList.remove('open');
  });
}

document.addEventListener('DOMContentLoaded', renderNav);