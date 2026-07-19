// Injecte les infos utilisateur dans la topbar (nom, initiale) sur les pages authentifiées.
async function initUserMenu() {
  const el = document.querySelector('[data-user-menu]');
  if (!el) return;
  try {
    const user = await api.me();
    el.querySelector('.avatar').textContent = user.fullName?.[0]?.toUpperCase() || 'U';
    el.querySelector('.uname')?.replaceChildren(document.createTextNode(user.fullName));
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
