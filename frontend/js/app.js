// Injecte les infos utilisateur dans la topbar et détermine si le lien Admin doit apparaître.
async function initUserMenu() {
  const el = document.querySelector('[data-user-menu]');
  try {
    const user = await api.me();
    if (user.role === 'admin') {
      document.body.dataset.admin = 'true';
      if (typeof renderNav === 'function') renderNav(); // ré-injecte la nav avec le lien Admin
    }
    if (el) {
      el.querySelector('.avatar').textContent = user.fullName?.[0]?.toUpperCase() || 'U';
    }
  } catch (err) {
    localStorage.removeItem('ac_token');
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('ac_token');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', initUserMenu);