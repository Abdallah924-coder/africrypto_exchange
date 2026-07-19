// À inclure sur toute page qui nécessite une session active.
(function(){
  const token = localStorage.getItem('ac_token');
  if (!token) {
    window.location.href = 'index.html';
  }
})();
