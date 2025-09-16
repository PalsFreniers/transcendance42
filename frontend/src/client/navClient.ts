import { getSockets } from './socketClient.js';

window.addEventListener('DOMContentLoaded', () => {
	const token = localStorage.getItem('token');
	if (token) {
		getSockets();  // Connect the socket once on page load if logged in
	}
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
	if (!token)
		monCercle.classList.add('expand');
	else
		monCercle.classList.add('expandlobby');
	if (!token) {
		setTimeout(() => {
			history.pushState(null, '', '/login');
			handleRoute();
		}, 600);
	}
	else {
		setTimeout(() => {
			history.pushState(null, '', '/lobby');
			handleRoute();
		}, 600);
	}
}

async function profil_image(){
	const token = localStorage.getItem('token');
	
	try {
		const profil = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/profil`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				'Authorization': `Bearer ${token}`
			},
		});
		const data = await profil.json();
		const pro = document.getElementById('img_perso') as HTMLImageElement;
		//const url = `${data.user.profile_image_url || '/assets/default-avatar.png'}`;
		console.log("👉 Réponse API :", data.user);
		pro.src = data.user.profile_image_url;
	} catch (error) {
		console.error(error)
	}
}

async function msg_lobby(event: MouseEvent){
	const token = localStorage.getItem('token');
	const chat = document.getElementById('chat');
	
	const target = event?.target as Node;
	if (chat)
	{
		chat.innerHTML = `
			<div id="boddy_chat">
				<div id="page_chat">
					<div id="lobby_friends">
					</div>
					<div id="lobby_chat">
					</div>
				</div>
			</div>
		`;
		const chat_boddy = document.getElementById('page_chat');
		const friends_lobby = document.getElementById('lobby_friends');
		const friends_chat = document.getElementById('lobby_chat');

		if (friends_lobby && token)
		{
			try {
				const findfriend = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/friend-list`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
				if (findfriend.ok)
				{
					const listfriend = await findfriend.json();
					const friends = Array.isArray(listfriend.friends) ? listfriend.friends.filter(Boolean) : [];
					console.log("Nombre d'amis :", friends.length);
					listfriend.friends.forEach(friend => {
					const friendDiv = document.createElement("div");
					friendDiv.id = "flex_friends";
					friendDiv.style.cursor = "pointer";

					const img = document.createElement("img");
					img.src = friend.profile_image_url;
					const p = document.createElement("p");
					p.textContent = friend.username;

					friendDiv.appendChild(img);
					friendDiv.appendChild(p);

					friendDiv.addEventListener("click", () => {
						console.log("Tu as cliqué sur :", friend.username);
						// Ici tu peux ouvrir un chat ou autre
					});

					friends_lobby.appendChild(friendDiv);
				});

				}
			} catch (error) {
				console.error(error)
			}
		}
		console.log("On ouvre le chat");
		function click_event(e: MouseEvent){
			const target = e.target as Node;
			if (chat && !chat_boddy?.contains(target)){
				chat.innerHTML = ``;
				document.removeEventListener('click', click_event);
			}
		}
		setTimeout(() =>{
			document.addEventListener('click', click_event);
		});
	}
}



export function handleRoute() {
	const path = window.location.pathname;
	const token = localStorage.getItem('token');
	const app = document.getElementById('app');
	const chat = document.getElementById('chat');
	if (!app || !chat)
		return;
	if (!token && (path != '/' && path != '/login' && path != '/register')) {
		if (path == '/lobby' || path == '/pong' || path == '/2game' || path == '/profil' || path == '/option') {
			//window.alert('Connectez-vous pour accéder à cette page!');
			history.pushState(null, '', '/login');
			handleRoute();
			return;
		}
	}
	if (token && (path == '/login' || path == '/register')) {
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
		case '/pong':
			app.innerHTML = `
			<div id="back-pong">
				<div class="pong-wrapper">
    				<h2 class="pong-title">🎮 Pong Area</h2>
					<div id="pong-controls">
      					<input type="text" id="lobby-name" placeholder="Room name" required />
      					<div class="pong-buttons">
        					<button id="game-button">Create Game</button>
        					<button id="join-button">Join Game</button>
        					<button id="start-game-btn">Start Game</button>
							<button id="spectator-btn">Spectate</button>
      					</div>
    				</div>
					<div id="game-list" class="pong-lobby">
					<h4>List of current games</h4>
					</div>
					<div id="game-salon" class="pong-lobby">
					<h4>Your lobby</h4>
					</div>
					<p id="msg-end" class="pong-message"></p>
  				</div>
				<canvas id="pong-canvas" width="600" height="400"></canvas>
			</div>`;
			import('./gameLobby.js').then((mod) => mod.init?.());
			break;
		case '/2game':
			app.innerHTML = `
			<div id="back_shifumi">
  				<div class="shifumi-wrapper">
    				<h2 class="shifumi-title">✊ Shifumi</h2>
    				<div id="shifumi-controls">
						<input type="text" id="lobby-name" placeholder="Room name" required />
      					<div class="shifumi-buttons">
        					<button id="solo-button">Join Solo</button>
        					<button id="match-button">Join Matchmaking</button>
        					<button id="tournois-button">Tournois</button>
        					<button id="game-button">Create Room</button>
        					<button id="join-button">Join Room</button>
        					<button id="spec-button">Spectator</button>
        					<button id="custom-button">Customisation</button>
      					</div>
    				</div>
  				</div>
			</div>
			`;
			import('./game2Lobby.js').then((mod) => mod.init?.());
			break;
		case '/shifumi':
			app.innerHTML = `
			<div id="back_shifumi">
				<div id="container-button">
					<h2>Shifumi</h2>
					<p id="opponent-name"></p>
					<P id="points"></p>
					<button id="quit-button">quit lobby</button>
					<button id="start-button">Start game</button>
					<button id="kick-opponent">kick</button>
					<button id="card1-button">card 1</button>
					<button id="card2-button">card 2</button>
					<button id="card3-button">card 3</button>
				</div>
			</div>
			`;
			import('./shifumiStart.js').then((mod) => mod.init());
			break;
		case '/profil':
			app.innerHTML = `
				<div id="back-profil">
					<div class="profil-wrapper">
						<h2 id="profil">Your Profil</h2>
						<a href="/lobby" data-link>Lobby</a>
						<button id="edit-profil">Edit Profil</button>
						<form id="form-profil"></form>
						<h3>List of friends</h3>
						<ul id="friend-list"></ul>
						<input id="friend-username" type="text" placeholder="Enter friend username" />
						<button id="add-friend-button">Add Friend</button>
					</div>
				</div>`;
			import('./userProfil.js').then((mod) => mod.init?.());
			break;
		case '/lobby':
			app.innerHTML = `
			<div id="lobby">
				<div id="profils">
					<div id="music-player">
  						<audio id="music" preload="auto"></audio>
  						<svg id="btn-music" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#e323be"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="" stroke-width="0.4800000000000001"></g><g id="SVGRepo_iconCarrier"><path d="M14.3187 2.50498C13.0514 2.35716 11.8489 3.10033 11.4144 4.29989C11.3165 4.57023 11.2821 4.86251 11.266 5.16888C11.2539 5.40001 11.2509 5.67552 11.2503 6L11.25 6.45499C11.25 6.4598 11.25 6.4646 11.25 6.46938V14.5359C10.4003 13.7384 9.25721 13.25 8 13.25C5.37665 13.25 3.25 15.3766 3.25 18C3.25 20.6234 5.37665 22.75 8 22.75C10.6234 22.75 12.75 20.6234 12.75 18V9.21059C12.8548 9.26646 12.9683 9.32316 13.0927 9.38527L15.8002 10.739C16.2185 10.9481 16.5589 11.1183 16.8378 11.2399C17.119 11.3625 17.3958 11.4625 17.6814 11.4958C18.9486 11.6436 20.1511 10.9004 20.5856 9.70089C20.6836 9.43055 20.7179 9.13826 20.7341 8.83189C20.75 8.52806 20.75 8.14752 20.75 7.67988L20.7501 7.59705C20.7502 7.2493 20.7503 6.97726 20.701 6.71946C20.574 6.05585 20.2071 5.46223 19.6704 5.05185C19.4618 4.89242 19.2185 4.77088 18.9074 4.6155L16.1999 3.26179C15.7816 3.05264 15.4412 2.88244 15.1623 2.76086C14.8811 2.63826 14.6043 2.53829 14.3187 2.50498Z" fill="#000"></path> </g></svg>
  						<input type="range" id="volume-music" min="0" max="1" step="0.01" value="0.5"/>
					</div>
					<div id="parametre" class="svg-ico">
						<svg fill="#000000" viewBox="-2.4 -2.4 28.80 28.80" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003" transform="matrix(1, 0, 0, 1, 0, 0)rotate(0)"><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#e323be" stroke-width="0.9600000000000002"> <g data-name="Layer 2"> <g data-name="options-2"> <rect width="24" height="24" transform="rotate(90 12 12)" opacity="0"></rect> <path d="M19 9a3 3 0 0 0-2.82 2H3a1 1 0 0 0 0 2h13.18A3 3 0 1 0 19 9zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"></path> <path d="M3 7h1.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2H9.82a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2zm4-2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"></path> <path d="M21 17h-7.18a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2h5.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2zm-10 2a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"></path> </g> </g> </g><g id="SVGRepo_iconCarrier"> <g data-name="Layer 2"> <g data-name="options-2"> <rect width="24" height="24" transform="rotate(90 12 12)" opacity="0"></rect> <path d="M19 9a3 3 0 0 0-2.82 2H3a1 1 0 0 0 0 2h13.18A3 3 0 1 0 19 9zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"></path> <path d="M3 7h1.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2H9.82a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2zm4-2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"></path> <path d="M21 17h-7.18a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2h5.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2zm-10 2a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"></path> </g> </g> </g></svg>
					</div>
					<div id="return" class="svg-ico">
						<svg fill="#000000ff" viewBox="-7.68 -7.68 47.36 47.36" version="1.1" xmlns="http://www.w3.org/2000/svg" transform="matrix(1, 0, 0, 1, 0, 0)" stroke="#000000" stroke-width="0.00032"><g id="SVGRepo_bgCarrier" stroke-width="0" transform="translate(2.24,2.24), scale(0.86)"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#e323be" stroke-width="2.368"> <title>return</title> <path d="M0 21.984q0.032-0.8 0.608-1.376l4-4q0.448-0.48 1.056-0.576t1.12 0.128 0.864 0.736 0.352 1.12v1.984h18.016q0.8 0 1.408-0.576t0.576-1.408v-8q0-0.832-0.576-1.408t-1.408-0.608h-16q-0.736 0-1.248-0.416t-0.64-0.992 0-1.152 0.64-1.024 1.248-0.416h16q2.464 0 4.224 1.76t1.76 4.256v8q0 2.496-1.76 4.224t-4.224 1.76h-18.016v2.016q0 0.64-0.352 1.152t-0.896 0.704-1.12 0.096-1.024-0.544l-4-4q-0.64-0.608-0.608-1.44z"></path> </g><g id="SVGRepo_iconCarrier"> <title>return</title> <path d="M0 21.984q0.032-0.8 0.608-1.376l4-4q0.448-0.48 1.056-0.576t1.12 0.128 0.864 0.736 0.352 1.12v1.984h18.016q0.8 0 1.408-0.576t0.576-1.408v-8q0-0.832-0.576-1.408t-1.408-0.608h-16q-0.736 0-1.248-0.416t-0.64-0.992 0-1.152 0.64-1.024 1.248-0.416h16q2.464 0 4.224 1.76t1.76 4.256v8q0 2.496-1.76 4.224t-4.224 1.76h-18.016v2.016q0 0.64-0.352 1.152t-0.896 0.704-1.12 0.096-1.024-0.544l-4-4q-0.64-0.608-0.608-1.44z"></path> </g></svg>
					</div>
					<div id="friends" class="svg-ico">
						<svg viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#e323be" stroke-width="0.9600000000000002"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4606 1.25H13.5394C15.1427 1.24999 16.3997 1.24999 17.4039 1.34547C18.4274 1.44279 19.2655 1.64457 20.0044 2.09732C20.7781 2.57144 21.4286 3.22194 21.9027 3.99563C22.3554 4.73445 22.5572 5.57256 22.6545 6.59611C22.75 7.60029 22.75 8.85725 22.75 10.4606V11.5278C22.75 12.6691 22.75 13.564 22.7007 14.2868C22.6505 15.0223 22.5468 15.6344 22.3123 16.2004C21.7287 17.6093 20.6093 18.7287 19.2004 19.3123C18.3955 19.6457 17.4786 19.7197 16.2233 19.7413C15.7842 19.7489 15.5061 19.7545 15.2941 19.7779C15.096 19.7999 15.0192 19.832 14.9742 19.8582C14.9268 19.8857 14.8622 19.936 14.7501 20.0898C14.6287 20.2564 14.4916 20.4865 14.2742 20.8539L13.7321 21.7697C12.9585 23.0767 11.0415 23.0767 10.2679 21.7697L9.72579 20.8539C9.50835 20.4865 9.37122 20.2564 9.24985 20.0898C9.13772 19.936 9.07313 19.8857 9.02572 19.8582C8.98078 19.832 8.90399 19.7999 8.70588 19.7779C8.49387 19.7545 8.21575 19.7489 7.77666 19.7413C6.52138 19.7197 5.60454 19.6457 4.79957 19.3123C3.39066 18.7287 2.27128 17.6093 1.68769 16.2004C1.45323 15.6344 1.3495 15.0223 1.29932 14.2868C1.24999 13.564 1.25 12.6691 1.25 11.5278L1.25 10.4606C1.24999 8.85726 1.24999 7.60029 1.34547 6.59611C1.44279 5.57256 1.64457 4.73445 2.09732 3.99563C2.57144 3.22194 3.22194 2.57144 3.99563 2.09732C4.73445 1.64457 5.57256 1.44279 6.59611 1.34547C7.60029 1.24999 8.85726 1.24999 10.4606 1.25ZM6.73809 2.83873C5.82434 2.92561 5.24291 3.09223 4.77938 3.37628C4.20752 3.72672 3.72672 4.20752 3.37628 4.77938C3.09223 5.24291 2.92561 5.82434 2.83873 6.73809C2.75079 7.663 2.75 8.84876 2.75 10.5V11.5C2.75 12.6751 2.75041 13.5189 2.79584 14.1847C2.84081 14.8438 2.92737 15.2736 3.07351 15.6264C3.50486 16.6678 4.33223 17.4951 5.3736 17.9265C5.88923 18.1401 6.54706 18.2199 7.8025 18.2416L7.83432 18.2421C8.23232 18.249 8.58109 18.2549 8.87097 18.287C9.18246 18.3215 9.4871 18.3912 9.77986 18.5615C10.0702 18.7304 10.2795 18.9559 10.4621 19.2063C10.6307 19.4378 10.804 19.7306 11.0004 20.0623L11.5587 21.0057C11.7515 21.3313 12.2485 21.3313 12.4412 21.0057L12.9996 20.0623C13.1959 19.7306 13.3692 19.4378 13.5379 19.2063C13.7204 18.9559 13.9298 18.7304 14.2201 18.5615C14.5129 18.3912 14.8175 18.3215 15.129 18.287C15.4189 18.2549 15.7676 18.249 16.1656 18.2421L16.1975 18.2416C17.4529 18.2199 18.1108 18.1401 18.6264 17.9265C19.6678 17.4951 20.4951 16.6678 20.9265 15.6264C21.0726 15.2736 21.1592 14.8438 21.2042 14.1847C21.2496 13.5189 21.25 12.6751 21.25 11.5V10.5C21.25 8.84876 21.2492 7.663 21.1613 6.73809C21.0744 5.82434 20.9078 5.24291 20.6237 4.77938C20.2733 4.20752 19.7925 3.72672 19.2206 3.37628C18.7571 3.09223 18.1757 2.92561 17.2619 2.83873C16.337 2.75079 15.1512 2.75 13.5 2.75H10.5C8.84876 2.75 7.663 2.75079 6.73809 2.83873Z" fill="#000000ff"></path> </g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4606 1.25H13.5394C15.1427 1.24999 16.3997 1.24999 17.4039 1.34547C18.4274 1.44279 19.2655 1.64457 20.0044 2.09732C20.7781 2.57144 21.4286 3.22194 21.9027 3.99563C22.3554 4.73445 22.5572 5.57256 22.6545 6.59611C22.75 7.60029 22.75 8.85725 22.75 10.4606V11.5278C22.75 12.6691 22.75 13.564 22.7007 14.2868C22.6505 15.0223 22.5468 15.6344 22.3123 16.2004C21.7287 17.6093 20.6093 18.7287 19.2004 19.3123C18.3955 19.6457 17.4786 19.7197 16.2233 19.7413C15.7842 19.7489 15.5061 19.7545 15.2941 19.7779C15.096 19.7999 15.0192 19.832 14.9742 19.8582C14.9268 19.8857 14.8622 19.936 14.7501 20.0898C14.6287 20.2564 14.4916 20.4865 14.2742 20.8539L13.7321 21.7697C12.9585 23.0767 11.0415 23.0767 10.2679 21.7697L9.72579 20.8539C9.50835 20.4865 9.37122 20.2564 9.24985 20.0898C9.13772 19.936 9.07313 19.8857 9.02572 19.8582C8.98078 19.832 8.90399 19.7999 8.70588 19.7779C8.49387 19.7545 8.21575 19.7489 7.77666 19.7413C6.52138 19.7197 5.60454 19.6457 4.79957 19.3123C3.39066 18.7287 2.27128 17.6093 1.68769 16.2004C1.45323 15.6344 1.3495 15.0223 1.29932 14.2868C1.24999 13.564 1.25 12.6691 1.25 11.5278L1.25 10.4606C1.24999 8.85726 1.24999 7.60029 1.34547 6.59611C1.44279 5.57256 1.64457 4.73445 2.09732 3.99563C2.57144 3.22194 3.22194 2.57144 3.99563 2.09732C4.73445 1.64457 5.57256 1.44279 6.59611 1.34547C7.60029 1.24999 8.85726 1.24999 10.4606 1.25ZM6.73809 2.83873C5.82434 2.92561 5.24291 3.09223 4.77938 3.37628C4.20752 3.72672 3.72672 4.20752 3.37628 4.77938C3.09223 5.24291 2.92561 5.82434 2.83873 6.73809C2.75079 7.663 2.75 8.84876 2.75 10.5V11.5C2.75 12.6751 2.75041 13.5189 2.79584 14.1847C2.84081 14.8438 2.92737 15.2736 3.07351 15.6264C3.50486 16.6678 4.33223 17.4951 5.3736 17.9265C5.88923 18.1401 6.54706 18.2199 7.8025 18.2416L7.83432 18.2421C8.23232 18.249 8.58109 18.2549 8.87097 18.287C9.18246 18.3215 9.4871 18.3912 9.77986 18.5615C10.0702 18.7304 10.2795 18.9559 10.4621 19.2063C10.6307 19.4378 10.804 19.7306 11.0004 20.0623L11.5587 21.0057C11.7515 21.3313 12.2485 21.3313 12.4412 21.0057L12.9996 20.0623C13.1959 19.7306 13.3692 19.4378 13.5379 19.2063C13.7204 18.9559 13.9298 18.7304 14.2201 18.5615C14.5129 18.3912 14.8175 18.3215 15.129 18.287C15.4189 18.2549 15.7676 18.249 16.1656 18.2421L16.1975 18.2416C17.4529 18.2199 18.1108 18.1401 18.6264 17.9265C19.6678 17.4951 20.4951 16.6678 20.9265 15.6264C21.0726 15.2736 21.1592 14.8438 21.2042 14.1847C21.2496 13.5189 21.25 12.6751 21.25 11.5V10.5C21.25 8.84876 21.2492 7.663 21.1613 6.73809C21.0744 5.82434 20.9078 5.24291 20.6237 4.77938C20.2733 4.20752 19.7925 3.72672 19.2206 3.37628C18.7571 3.09223 18.1757 2.92561 17.2619 2.83873C16.337 2.75079 15.1512 2.75 13.5 2.75H10.5C8.84876 2.75 7.663 2.75079 6.73809 2.83873Z" fill="#000000ff"></path> </g></svg>
					</div>
					<div id="friends2" class="svg-ico">
						<svg viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#e323be" stroke-width="0.9600000000000002"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4606 1.25L13.5 1.25C13.9142 1.25 14.25 1.58579 14.25 2C14.25 2.41421 13.9142 2.75 13.5 2.75H10.5C8.84876 2.75 7.663 2.75079 6.73809 2.83873C5.82434 2.92561 5.24291 3.09223 4.77938 3.37628C4.20752 3.72672 3.72672 4.20752 3.37628 4.77938C3.09223 5.24291 2.92561 5.82434 2.83873 6.73809C2.75079 7.663 2.75 8.84876 2.75 10.5V11.5C2.75 12.6751 2.75041 13.5189 2.79584 14.1847C2.84081 14.8438 2.92737 15.2736 3.07351 15.6264C3.50486 16.6678 4.33223 17.4951 5.3736 17.9265C5.88923 18.1401 6.54706 18.2199 7.8025 18.2416L7.83432 18.2421C8.23232 18.249 8.58109 18.2549 8.87097 18.287C9.18246 18.3215 9.4871 18.3912 9.77986 18.5615C10.0702 18.7304 10.2795 18.9559 10.4621 19.2063C10.6307 19.4378 10.804 19.7306 11.0004 20.0623L11.5587 21.0057C11.7515 21.3313 12.2485 21.3313 12.4412 21.0057L12.9996 20.0623C13.1959 19.7306 13.3692 19.4378 13.5379 19.2063C13.7204 18.9559 13.9298 18.7304 14.2201 18.5615C14.5129 18.3912 14.8175 18.3215 15.129 18.287C15.4189 18.2549 15.7676 18.249 16.1656 18.2421L16.1975 18.2416C17.4529 18.2199 18.1108 18.1401 18.6264 17.9265C19.6678 17.4951 20.4951 16.6678 20.9265 15.6264C21.0726 15.2736 21.1592 14.8438 21.2042 14.1847C21.2496 13.5189 21.25 12.6751 21.25 11.5V10.5C21.25 10.0858 21.5858 9.75 22 9.75C22.4142 9.75 22.75 10.0858 22.75 10.5V11.5278C22.75 12.6691 22.75 13.564 22.7007 14.2868C22.6505 15.0223 22.5468 15.6344 22.3123 16.2004C21.7287 17.6093 20.6093 18.7287 19.2004 19.3123C18.3955 19.6457 17.4786 19.7197 16.2233 19.7413C15.7842 19.7489 15.5061 19.7545 15.2941 19.7779C15.096 19.7999 15.0192 19.832 14.9742 19.8582C14.9268 19.8857 14.8622 19.936 14.7501 20.0898C14.6287 20.2564 14.4916 20.4865 14.2742 20.8539L13.7321 21.7697C12.9585 23.0767 11.0415 23.0767 10.2679 21.7697L9.72579 20.8539C9.50835 20.4865 9.37122 20.2564 9.24985 20.0898C9.13772 19.936 9.07313 19.8857 9.02572 19.8582C8.98078 19.832 8.90399 19.7999 8.70588 19.7779C8.49387 19.7545 8.21575 19.7489 7.77666 19.7413C6.52138 19.7197 5.60454 19.6457 4.79957 19.3123C3.39066 18.7287 2.27128 17.6093 1.68769 16.2004C1.45323 15.6344 1.3495 15.0223 1.29932 14.2868C1.24999 13.564 1.25 12.6691 1.25 11.5278L1.25 10.4606C1.24999 8.85726 1.24999 7.60029 1.34547 6.59611C1.44279 5.57256 1.64457 4.73445 2.09732 3.99563C2.57144 3.22194 3.22194 2.57144 3.99563 2.09732C4.73445 1.64457 5.57256 1.44279 6.59611 1.34547C7.60029 1.24999 8.85726 1.24999 10.4606 1.25ZM19 2.75C17.7574 2.75 16.75 3.75736 16.75 5C16.75 6.24264 17.7574 7.25 19 7.25C20.2426 7.25 21.25 6.24264 21.25 5C21.25 3.75736 20.2426 2.75 19 2.75ZM15.25 5C15.25 2.92893 16.9289 1.25 19 1.25C21.0711 1.25 22.75 2.92893 22.75 5C22.75 7.07107 21.0711 8.75 19 8.75C16.9289 8.75 15.25 7.07107 15.25 5Z" fill="#000000ff"></path> </g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4606 1.25L13.5 1.25C13.9142 1.25 14.25 1.58579 14.25 2C14.25 2.41421 13.9142 2.75 13.5 2.75H10.5C8.84876 2.75 7.663 2.75079 6.73809 2.83873C5.82434 2.92561 5.24291 3.09223 4.77938 3.37628C4.20752 3.72672 3.72672 4.20752 3.37628 4.77938C3.09223 5.24291 2.92561 5.82434 2.83873 6.73809C2.75079 7.663 2.75 8.84876 2.75 10.5V11.5C2.75 12.6751 2.75041 13.5189 2.79584 14.1847C2.84081 14.8438 2.92737 15.2736 3.07351 15.6264C3.50486 16.6678 4.33223 17.4951 5.3736 17.9265C5.88923 18.1401 6.54706 18.2199 7.8025 18.2416L7.83432 18.2421C8.23232 18.249 8.58109 18.2549 8.87097 18.287C9.18246 18.3215 9.4871 18.3912 9.77986 18.5615C10.0702 18.7304 10.2795 18.9559 10.4621 19.2063C10.6307 19.4378 10.804 19.7306 11.0004 20.0623L11.5587 21.0057C11.7515 21.3313 12.2485 21.3313 12.4412 21.0057L12.9996 20.0623C13.1959 19.7306 13.3692 19.4378 13.5379 19.2063C13.7204 18.9559 13.9298 18.7304 14.2201 18.5615C14.5129 18.3912 14.8175 18.3215 15.129 18.287C15.4189 18.2549 15.7676 18.249 16.1656 18.2421L16.1975 18.2416C17.4529 18.2199 18.1108 18.1401 18.6264 17.9265C19.6678 17.4951 20.4951 16.6678 20.9265 15.6264C21.0726 15.2736 21.1592 14.8438 21.2042 14.1847C21.2496 13.5189 21.25 12.6751 21.25 11.5V10.5C21.25 10.0858 21.5858 9.75 22 9.75C22.4142 9.75 22.75 10.0858 22.75 10.5V11.5278C22.75 12.6691 22.75 13.564 22.7007 14.2868C22.6505 15.0223 22.5468 15.6344 22.3123 16.2004C21.7287 17.6093 20.6093 18.7287 19.2004 19.3123C18.3955 19.6457 17.4786 19.7197 16.2233 19.7413C15.7842 19.7489 15.5061 19.7545 15.2941 19.7779C15.096 19.7999 15.0192 19.832 14.9742 19.8582C14.9268 19.8857 14.8622 19.936 14.7501 20.0898C14.6287 20.2564 14.4916 20.4865 14.2742 20.8539L13.7321 21.7697C12.9585 23.0767 11.0415 23.0767 10.2679 21.7697L9.72579 20.8539C9.50835 20.4865 9.37122 20.2564 9.24985 20.0898C9.13772 19.936 9.07313 19.8857 9.02572 19.8582C8.98078 19.832 8.90399 19.7999 8.70588 19.7779C8.49387 19.7545 8.21575 19.7489 7.77666 19.7413C6.52138 19.7197 5.60454 19.6457 4.79957 19.3123C3.39066 18.7287 2.27128 17.6093 1.68769 16.2004C1.45323 15.6344 1.3495 15.0223 1.29932 14.2868C1.24999 13.564 1.25 12.6691 1.25 11.5278L1.25 10.4606C1.24999 8.85726 1.24999 7.60029 1.34547 6.59611C1.44279 5.57256 1.64457 4.73445 2.09732 3.99563C2.57144 3.22194 3.22194 2.57144 3.99563 2.09732C4.73445 1.64457 5.57256 1.44279 6.59611 1.34547C7.60029 1.24999 8.85726 1.24999 10.4606 1.25ZM19 2.75C17.7574 2.75 16.75 3.75736 16.75 5C16.75 6.24264 17.7574 7.25 19 7.25C20.2426 7.25 21.25 6.24264 21.25 5C21.25 3.75736 20.2426 2.75 19 2.75ZM15.25 5C15.25 2.92893 16.9289 1.25 19 1.25C21.0711 1.25 22.75 2.92893 22.75 5C22.75 7.07107 21.0711 8.75 19 8.75C16.9289 8.75 15.25 7.07107 15.25 5Z" fill="#000000ff"></path> </g></svg>
					</div>
					<div id="perso">
						<img id="img_perso" src="">
					</div>
					<div id="offline" class="svg-ico">
  						<svg viewBox="0 0 24 24" fill="black" stroke="#e323be" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M16 13V11H7V8L3 12L7 16V13H16ZM20 3H12C10.9 3 10 3.9 10 5V9H12V5H20V19H12V15H10V19C10 20.1 10.9 21 12 21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3Z"/></svg>
					</div>
				</div>
				<div id="selection1">
					<div class=topgame1></div>
					<div class="game1">
						<h2>PONG</h2>
					</div>
				</div>
				<div id="selection2">
					<div class=topgame2></div>
					<div class="game2">
						<h2>SHIFUMI</h2>
					</div>
				</div>
			</div>
			`;
			break;
		default:
			app.innerHTML = `<h2>404 - Page not found</h2>`;
	}
	if (token && path != '/' && path != '/lobby') {
		chat.innerHTML = `
		<div id="chat-container">
			<div id="chat-display">
				<div id="chat-box">
					<div id="chat-friend">
						<div id="friend-pp">
							<div id="friend-img">

							</div>
							<div id="friend-name">

							</div>
						</div>
					</div>
					<div id="display-msg">
						<div id="user-msg">
							<p>Bonjour !</p>
						</div>
						<div id="user-target-msg">
							<p>Salut, ça va ?</p>
						</div>
					</div>
				</div>
				<form id="chat-input">
					<input type="text" placeholder="Écrire un message..." />
					<button type="submit">Send</button>
				</form>
			</div>
			<svg id="msg-ico" fill="none" viewBox="0 0 24 24" id="conversation" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line" stroke=""><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#dc143c" stroke-width="0.144"></g><g id="SVGRepo_iconCarrier"><path id="secondary" d="M18,9.5c0,3.59-3.36,6.5-7.5,6.5A8.5,8.5,0,0,1,7,15.27l-.65.28L3,17l1.15-4A5.82,5.82,0,0,1,3,9.5C3,5.91,6.36,3,10.5,3c3.63,0,6.66,2.24,7.35,5.21A5.49,5.49,0,0,1,18,9.5Z" style="fill: #63dac6; stroke-width: 2;"></path><path id="primary" d="M17.85,8.21A6.27,6.27,0,0,1,21,13.5,5.82,5.82,0,0,1,19.85,17L21,21l-4-1.73A8.5,8.5,0,0,1,13.5,20a7.47,7.47,0,0,1-7.11-4.45" style="fill: none; stroke: #dc143c; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path><path id="primary-2" data-name="primary" d="M18,9.5c0,3.59-3.36,6.5-7.5,6.5A8.5,8.5,0,0,1,7,15.27l-.65.28L3,17l1.15-4A5.82,5.82,0,0,1,3,9.5C3,5.91,6.36,3,10.5,3c3.63,0,6.66,2.24,7.35,5.21A5.49,5.49,0,0,1,18,9.5Z" style="fill: none; stroke: #dc143c; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></g></svg>
		</div>

`;
		import('./chatClient.js').then((mode) => mode.init?.());
	}
	else
		chat.innerHTML = ``;
	const msg = document.getElementById('friends');
	const msg_r = document.getElementById('friends2');
	if (token && path == '/lobby') {
		if (msg)
			msg.addEventListener('click', msg_lobby);
		if (msg_r)
			msg_r.addEventListener('click', msg_lobby);
	}
	const lienCercle = document.getElementById('lien-cercle');
	if (lienCercle)
		lienCercle.style.display = (path === '/') ? 'flex' : 'none';
	const monCercle = document.getElementById('moncercle');
	if (path === '/')
		monCercle?.addEventListener('click', expandCercle);
	if (monCercle) {
		if (path === '/') {
			if (!token)
				monCercle.classList.remove('expand');
			else
				monCercle.classList.remove('expandlobby');
		}
		else
			monCercle.removeEventListener('click', expandCercle);
	}
	const zone = document.querySelector('.game1');
	const selection = document.querySelector('#selection1');

	if (zone) {
		zone.addEventListener('mouseenter', () => {
			if (selection)
				selection.classList.add('active')
		});
	}
	if (zone) {
		zone.addEventListener('mouseleave', () => {
			if (selection)
				selection.classList.remove('active')
		});
	}
	if (zone) {
		zone.addEventListener('click', () => {
			history.pushState(null, '', '/pong');
			handleRoute();
		});
	}

	const zone2 = document.querySelector('.game2');
	const selection2 = document.querySelector('#selection2');

	if (zone2) {
		zone2.addEventListener('mouseenter', () => {
			zone2.classList.add('active')
			if (selection2)
				selection2.classList.add('active')
		});
	}
	if (zone2) {
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
	const but_return = document.querySelector('#return');
	if (but_return) {
		but_return.addEventListener('click', () => {
			history.pushState(null, '', '/');
			handleRoute();
		});
	}
	const prof = document.querySelector('#perso');
	if (prof)
	{
		prof.addEventListener('click', () => {
			history.pushState(null, '', '/profil');
			handleRoute();
		});
	}

	const but_tes = document.querySelector("#friends");
	const but_te = document.querySelector("#friends2");
	const but_test = document.getElementById("friends");
	const but_tests = document.getElementById("friends2");
	if (but_tes) {
		but_tes.addEventListener('click', () => {
			if (but_test)
				but_test.style.visibility = "hidden";
			if (but_tests)
				but_tests.style.visibility = "visible";
		});
	}
	if (but_te) {
		but_te.addEventListener('click', () => {
			if (but_tests)
				but_tests.style.visibility = "hidden";
			if (but_test)
				but_test.style.visibility = "visible";
		});
	}
	const offline = document.getElementById("offline");
	if (offline) {
		offline.addEventListener("click", async () => {
			const token = localStorage.getItem("token");
			const res = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/logout`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({}),
			});

			const data = await res.json();
			if (data.success) {
				// remove token from localStorage
				localStorage.removeItem("token");

				// optional: redirect to login page
				handleRoute();
			} else {
				alert("Logout failed: " + (data.error || "Unknown error"));
			}
		});
	}
	profil_image();
	const music = document.getElementById("music") as HTMLAudioElement;
	const musicButton = document.getElementById("btn-music") as HTMLButtonElement;
	const musicVolume = document.getElementById("volume-music") as HTMLInputElement;

	let currentTrack = 0;
	let isPlaying = false;

	const playlist =
		[
			"/asset/Nightcore - Love Is Confusing (Lyrics).mp3"
		]
	if (music) {
		music.src = playlist[currentTrack];
		music.addEventListener("ended", () => {
			currentTrack = (currentTrack + 1) % playlist.length;
			music.src = playlist[currentTrack];
			music.play();
		});

		musicButton.addEventListener("click", () => {
			if (isPlaying) {
				music.pause();
				musicButton.classList.add("paused");
			}
			else {
				music.play();
				musicButton.classList.remove("paused");
			}
			isPlaying = !isPlaying;
		});

		musicVolume?.addEventListener("input", () => {
			music.volume = Number(musicVolume.value);
		});
	}
}

