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
	window.addEventListener('popstate', () => {
		console.log('[popstate]');
		handleRoute();
	});
	handleRoute(); // On first load
});

function expandCercle() {
	const monCercle = document.getElementById('moncercle');
	const token = localStorage.getItem('token');
	if (!monCercle)
		return;
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
	const chat = document.getElementById('chat');
	if (!app || !chat) 
		return;
	if (!token && (path != '/' && path != '/login' && path != '/register'))
	{
		if (path == '/lobby' || path == '/game' || path == '/2game' || path == '/profil' || path == '/option')
		{
			//window.alert('Connectez-vous pour accéder à cette page!');
			history.pushState(null, '', '/login');
			handleRoute();
			return;
		}
	}
	if (token && (path == '/login' || path == '/register'))
	{
		history.pushState(null, '', '/lobby');
		handleRoute();
		return;
	}
	switch (path) {
		case '/':
			app.innerHTML = `
			<div id="back">
				<div id="lien-cercle">
					<div id="moncercle">
						<img src="https://upload.wikimedia.org/wikipedia/commons/8/8d/42_Logo.svg" id="img" alt="42 Logo" />
					</div>
				</div>
			</div>`
		break;
		case '/login':
			app.innerHTML = `
				<div id="back_login">
					<div class="wrapper">
						<h2>Login</h2>
						<form id="loginForm">
							<div class="input-field">
								<input id="loginUsername" type="text" name="username" required placeholder=""/>
								<label for="loginUsername">Enter your username</label>
							</div>
							<div class="input-field">
								<input id="loginPassword" type="password" name="password" required placeholder=""/>
								<label for="loginPassword">Enter your password</label>
							</div>
							<div class="forget">
								<label for="remember">
									<input type="checkbox" id="remember" />
									<p>Remember me</p>
								</label>
								<a href="#">Forgot password?</a>
							</div>
							<button type="submit">Login</button>
							<div class="register">
								<p>Don't have an account? <a href="/register" data-link>Register</a></p>
							</div>
						</form>
					</div>
				</div>`;
			import('./loginClient.js').then((mod) => mod.init?.());
		break;
		case '/register':
			app.innerHTML = `
				<div id="back_login">
					<div class="wrapper">
						<h2>Register</h2>
						<form id="registerForm">
							<div class="input-field">
								<input id="username" type="text" name="Username" required placeholder=""/>
								<label for="username">Enter your username</label>
							</div>

							<div class="input-field">
								<input id="password" type="password" name="Password" required placeholder=""/>
								<label for="password">Enter your password</label>
							</div>

							<div class="input-field">
								<input id="email" type="email" name="Email" required placeholder="" />
								<label for="email">Enter your email</label>
							</div>

							<button type="submit">Register</button>

							<div class="login">
								<p>You have an account? <a href="/login" data-link>Login</a></p>
							</div>
						</form>
					</div>
				</div>`;
			import('./registerClient.js').then((mod) => mod.init?.());
		break;
		case '/game':
			app.innerHTML = `<h2>Game Area</h2>
				<input type="text" id="lobby-name" placeholder="Room name" required />
				<button id="game-button">create Game</button>
				<button id="join-button">Join Game</button>
				<div id="game-salon"></div>`;
			import('./gameLobby.js').then((mod) => mod.init?.());
		break;
		case '/2game':
			app.innerHTML = `
			<div id="back_shifumi">
				<h2>Shifumi</h2>
				<div id="container-button">
					<button id="solo-button">Join Solo</button>
					<button id="match-button">Join Matchmaking</button>
					<button id="tournois-button">Tournois</button>
					<button id="game-button">create Room</button>
					<button id="join-button">Join Room</button>
					<button id="spec-button">Spectateur</button>
					<button id="custom-button">Customisation</button>
				</div>
				<div class="pong-scene">
					<div class="pong-court">
						<div class="paddle left"></div>
						<div class="paddle right"></div>
						<div class="ball"></div>
					</div>
				</div>
			</div>
			`;
			import('./game2Lobby.js').then((mod) => mod.init?.());
			break;
		case '/profil':
			app.innerHTML = `<h2>Your Profil</h2>
				<a href="/lobby" data-link>Lobby</a>
				<button id="edit-profil">Edit Profil</button>
				<form id="form-profil"></form>
				<h3>List of friends</h3>
				<ul id="friend-list"></ul>
				<input id="friend-username" type="text" placeholder="Enter friend username" />
				<button id="add-friend-button">Add Friend</button>`;
			import('./userProfil.js').then((mod) => mod.init?.());
		break;
	case '/lobby':
			app.innerHTML = `
			<div id="lobby">
				<div id="rectangle"></div>
				<div id="barres"></div>
				<div id="border"></div>
				<div id="profils">
					<div id="parametre">
						<img id="img_par" src="../../asset/gear.svg" alt="param" />
					</div>
					<div id="friends"></div>
					<div id="perso"></div>
				</div>
				<div id="selection1">
					<div class=topgame1></div>
					<div class="game1">
						<h2>Jeux 1</h2>
					</div>
				</div>
				<div id="selection2">
					<div class=topgame2></div>
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
	if (token && path != '/' && path != '/lobby')
	{
		chat.innerHTML = `<div id="chat-container">
			<div id="chat-header">Mon Chat</div>
			<div id="chat-messages">
				<div class="message">
				<span class="username">Name</span>
				<p class="message-text">old !</p>
				</div>
			</div>
			<form id="chat-input">
				<input type="text" id="message" required placeholder="Tape ton message..." />
				<button type="send-msg">Envoyer</button>
			</form>
			</div>`;
		import('./chatClient.js').then((mode) => mode.init?.());
	}
	else
		chat.innerHTML= ``;
	const lienCercle = document.getElementById('lien-cercle');
	if (lienCercle)
		lienCercle.style.display = (path === '/') ? 'flex' : 'none';
	const monCercle = document.getElementById('moncercle');
	if (path === '/')
		monCercle?.addEventListener('click', expandCercle);
	if (monCercle) {
		if (path === '/')
			monCercle.classList.remove('expand');
		else
			monCercle.removeEventListener('click', expandCercle);
	}

	const zone = document.querySelector('.game1');
	const selection = document.querySelector('#selection1');

	if (zone){
		zone.addEventListener('mouseenter', () => {
			if (selection)
				selection.classList.add('active')
		});
	}
	if (zone){
		zone.addEventListener('mouseleave', () => {
			if (selection)
				selection.classList.remove('active')
		});
	}
	if (zone) {
		zone.addEventListener('click', () => {
			history.pushState(null, '', '/game');
			handleRoute();
		});
	}

	const zone2 = document.querySelector('.game2');
	const selection2 = document.querySelector('#selection2');

	if (zone2){
		zone2.addEventListener('mouseenter', () => {
			zone2.classList.add('active')
			if (selection2)
				selection2.classList.add('active')
		});
	}
	if (zone2){
		zone2.addEventListener('mouseleave', () => {
			zone2.classList.remove('active')
			if (selection2)
				selection2.classList.remove('active')
		});
	}
	if (zone2) {
		zone2.addEventListener('click', () => {
			history.pushState(null, '', '/2game');
			handleRoute();
		});
	}
}

