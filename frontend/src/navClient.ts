document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app')!; // THE ! MAKE SURE APP NOT NULL
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const url = target.getAttribute('href');
      if (url) {
        history.pushState({}, '', url);
        loadPage(url);
      }
    }
  });
  window.onpopstate = () => loadPage(location.pathname);

  function loadPage(path: string) {
    if (path === '/login') {
      app.innerHTML = '<h2>Login Page</h2>';
    } else if (path === '/register') {
      app.innerHTML = '<h2>Register Page</h2>';
    } else if (path === '/game') {
      app.innerHTML = '<h2>Start Game!</h2>';
    } else {
      app.innerHTML = '<h1>Welcome to Pong!</h1>';
    }
  }
  loadPage(location.pathname);
});
