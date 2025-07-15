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
  const token = localStorage.getItem('token');
  const app = document.getElementById('app');
  if (!app) 
    return;
  switch (path) {
    case '/':
        if (!token) {
        app.innerHTML = `<h1>Welcome to Pong!</h1>
        <a href="/login" data-link>Login</a>
        <a href="/register" data-link>Register</a>`;
        }
        else {
          app.innerHTML = `<h1>Welcome to Pong!</h1>
        <a href="/profil" data-link>Profil</a>
        <a href="/game" data-link>Game</a>`;
        }
      break;
    case '/login':
      app.innerHTML = `
        <h2>Login</h2>
        <a href="/register" data-link>Register</a>
        <form id="loginForm">
          <input id="loginUsername" type="text" name="username" required />
          <input id="loginPassword" type="password" name="password" required />
          <button type="submit">Login</button>
        </form>`;
        import('./loginClient.js').then((mod) => mod.init?.());
      break;
    case '/register':
      app.innerHTML = `
        <h2>Register</h2>
        <a href="/login" data-link>Login</a>
        <form id="registerForm">
          <input type="text" id="username" placeholder="Username" required />
          <input type="password" id="password" placeholder="Password" required />
          <input type="email" id="email" placeholder="Email" required />
          <button type="submit">Register</button>
        </form>`;
        import('./registerClient.js').then((mod) => mod.init?.());
      break;
    case '/game':
      app.innerHTML = `<h2>Game Area</h2>
      <a href="/profil" data-link>Profil</a>
      <input type"text" id="lobby-name" placeholder="Room name" required />
      <button id="game-button">create Game</button>`;
      import('./gameLobby.js').then((mod) => mod.init?.());
      break;
    case '/profil':
      app.innerHTML = `<h2>Your Profil</h2>
      <a href="/game" data-link>Game</a>`;
      import('./userProfil.js').then((mod) => mod.init?.());
      break;
    default:
      app.innerHTML = `<h2>404 - Page not found</h2>`;
  }
}

