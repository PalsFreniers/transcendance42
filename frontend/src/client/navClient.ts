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

function expandCercle() {
  const monCercle = document.getElementById('moncercle');
  const token = localStorage.getItem('token');
  if (!monCercle) return;

  monCercle.classList.add('expand');

  if (!token){
	setTimeout(() => {
		history.pushState(null, '', '/login');
		handleRoute();
	}, 600);
  }
  else
  {
	setTimeout(() => {
		history.pushState(null, '', '/lobby');
		handleRoute();
	}, 600);
  }

  
}

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
			<a href="/lobby" data-link>Profil</a>
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
      <input type="text" id="lobby-name" placeholder="Room name" required />
      <button id="game-button">create Game</button>
      <button id="join-button">Join Game</button>`;
      import('./gameLobby.js').then((mod) => mod.init?.());
      break;
	case '/2game':
		app.innerHTML = `<h2>Game Area</h2>`;
		break;
    case '/profil':
      app.innerHTML = `<h2>Your Profil</h2>
      <a href="/game" data-link>Game</a>
      <button id="edit-profil">Edit Profil</button>
      <form id="form-profil"></form>`;
      import('./userProfil.js').then((mod) => mod.init?.());
      break;
	case '/lobby':
			app.innerHTML = `
			<div id="lobby">
				<div id="rectangle">
				</div>
				<div id="barres">
				</div>
				<div id="border">
				</div>
				<div id="profils">
				</div>
				<svg class="topgame1" viewBox="0 0 100 100" preserveAspectRatio="none">
					<polygon class="triangle1" points="0,100 100,100 100,97 0,0"/>
				</svg>
				<svg class="topgame2" viewBox="0 0 100 100" preserveAspectRatio="none">
					<polygon class="triangle2" points="0,100 100,100 100,0 0,97" />
				</svg>
				<div id="centent">
					<div class="game1">
						<h2>Jeux 1</h2>
					</div>
					<div class="game2">
						<h2>Jeux 2</h2>
					</div>

				</div>
			</div>
			`;
			break;
    default:
      app.innerHTML = `<h2>404 - Page not found</h2>`;
  }
  const lienCercle = document.getElementById('lien-cercle');
	if (lienCercle) {
		lienCercle.style.display = (path === '/') ? 'flex' : 'none';
	}
	const monCercle = document.getElementById('moncercle');

	if (path === '/') {
		monCercle?.addEventListener('click', expandCercle);
	}

	if (monCercle) {
		if (path === '/') {
			monCercle.classList.remove('expand');
		} else {
			monCercle.removeEventListener('click', expandCercle);
		}
	}

	const zone = document.querySelector('.game1');
	const triangle = document.querySelector('.triangle1');
	const topgame = document.querySelector('.topgame1');

	if (zone){
		zone.addEventListener('mouseenter', () => {
			if (triangle)
			{
				triangle.classList.add('active')
				if (topgame)
					topgame.classList.add('active')
			}
		});
	}
	if (zone){
		zone.addEventListener('mouseleave', () => {
		if (triangle)
			{
				triangle.classList.remove('active')
				if (topgame)
					topgame.classList.remove('active')
			}
		});
	}
	if (triangle){
		triangle.addEventListener('mouseenter', () => {
			triangle.classList.add('active')
			if (topgame)
				topgame.classList.add('active')
			if (zone)
				zone.classList.add('active')
		});
	}
	if (triangle){
		triangle.addEventListener('mouseleave', () => {
			triangle.classList.remove('active')
			if (topgame)
				topgame.classList.remove('active')
			if (zone)
				zone.classList.remove('active')
		});
	}

	const zone2 = document.querySelector('.game2');
	const triangle2 = document.querySelector('.triangle2');
	const topgame2 = document.querySelector('.topgame2');

	if (zone2){
		zone2.addEventListener('mouseenter', () => {
			if (triangle2)
			{
				triangle2.classList.add('active')
				if (topgame2)
					topgame2.classList.add('active')
			}
		});
	}
	if (zone2){
		zone2.addEventListener('mouseleave', () => {
		if (triangle2)
			{
				triangle2.classList.remove('active')
				if (topgame2)
					topgame2.classList.remove('active')
			}
		});
	}
	if (triangle2){
		triangle2.addEventListener('mouseenter', () => {
			triangle2.classList.add('active')
			if (topgame2)
				topgame2.classList.add('active')
			if (zone2)
				zone2.classList.add('active')
		});
	}
	if (triangle2){
		triangle2.addEventListener('mouseleave', () => {
			triangle2.classList.remove('active')
			if (topgame2)
				topgame2.classList.remove('active')
			if (zone2)
				zone2.classList.remove('active')
		});
	}

	const game1 = document.querySelector('.game1');
	const game1triangle = document.querySelector('.triangle1');
	if (game1) {
		game1.addEventListener('click', () => {
			history.pushState(null, '', '/game');
			handleRoute();
		});
	}
	if (game1triangle) {
		game1triangle.addEventListener('click', () => {
			history.pushState(null, '', '/game');
			handleRoute();
		});
	}

	const game2 = document.querySelector('.game2');
	const game2triangle = document.querySelector('.triangle2');
	if (game2) {
		game2.addEventListener('click', () => {
			history.pushState(null, '', '/2game');
			handleRoute();
		});
	}
	if (game2triangle) {
		game2triangle.addEventListener('click', () => {
			history.pushState(null, '', '/2game');
			handleRoute();
		});
	}
}

