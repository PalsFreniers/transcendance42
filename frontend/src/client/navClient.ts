window.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('a[data-link]')) {
      e.preventDefault();
      const url = target.getAttribute('href');
      if (url) {
        history.pushState(null, '', url);
        handleRoute();
      }
    }
  });

  window.addEventListener('popstate', handleRoute);

  handleRoute(); // On first load
});
function handleRoute() {
  const path = window.location.pathname;

  const app = document.getElementById('app');
  if (!app) 
    return;
  switch (path) {
    case '/':
      app.innerHTML = `<h1>Welcome to Pong!</h1>`;
      break;
    case '/login':
      app.innerHTML = `
        <h2>Login</h2>
        <form id="loginForm">
          <input id="loginUsername" type="text" name="username" required />
          <input id="loginPassword" type="password" name="password" required />
          <button type="submit">Login</button>
        </form>`;
        setTimeout (() => {
        import('./loginClient.js').then((mod) => mod.init?.());
        }, 0);
      break;
    case '/register':
      app.innerHTML = `
        <h2>Register</h2>
        <form id="registerForm">
          <input type="text" id="username" placeholder="Username" required />
          <input type="password" id="password" placeholder="Password" required />
          <input type="email" id="email" placeholder="Email" required />
          <button type="submit">Register</button>
        </form>`;
        setTimeout(() => {
          import('./registerClient.js').then((mod) => mod.init?.());
        }, 0);
      break;
    case '/game':
      app.innerHTML = `<h2>Game Area</h2>`;
      break;
    default:
      app.innerHTML = `<h2>404 - Page not found</h2>`;
  }
}

