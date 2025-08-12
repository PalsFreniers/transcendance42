import io from 'socket.io-client';

export function getUserIdFromToken(): number {
	const token = localStorage.getItem('token');
	if (!token) return 0;
	try {
		const payloadBase64 = token.split('.')[1];
		const payloadJson = atob(payloadBase64);
		const payload = JSON.parse(payloadJson);
		return payload.userId || 0;
	} catch (err) {
		console.error('Failed to decode token:', err);
		return 0;
	}
}

function createUserSocket() {
	const token = localStorage.getItem('token');
	const userId = getUserIdFromToken();
	const socket = io('http://localhost:3001', {
		path: "/chatSocket/",
		auth: { token : token },
		withCredentials: true,
		transports: ['websocket'],
	});
	socket.on('connect', () => {
		localStorage.debug = 'socket.io-client:socket';
		socket.emit('register-socket', userId);
		console.log(`Socket (${socket.id}) connected!`);
	});
	socket.on('connect_error', (err) => {
		console.error('Connection error:', err.message);
	});
	socket.on('disconnect', (reason) => {
		console.warn('Socket disconnected:', reason);
	});
}

export function init() {
	const token = localStorage.getItem('token');
	if (!token) {
		window.location.href = '/login';
		return;
	}
	console.log('pass')
	// Connect socket
	createUserSocket();
	const createGameButton = document.getElementById('game-button') as HTMLButtonElement;
	const joinGameButton = document.getElementById('join-button') as HTMLButtonElement;
	const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;

	if (createGameButton) {
		createGameButton.addEventListener('click', async (e) => {
			e.preventDefault();
			try {
				const res = await fetch('http://localhost:3002/api/game/create-game', {
					method: "POST",
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ lobbyName: lobbyName.value, oppenentId: null })
				});
				if (res.ok) {
					const data = await res.json();
					console.log("Game created:", data);
					const lobbyGame = document.getElementById('game-salon') as HTMLDivElement;
					lobbyGame.innerHTML = `
						<p><strong>Lobby name:</strong> ${data.lobbyName}</p>
						<p><strong>Player 1:</strong> ${data.playerOne}</p>
						<p><strong>Player 2:</strong> ${data.playerTwo}</p>
						<p><strong>Status:</strong> ${data.status}</p>`;
				}
			} catch (err) {
				console.error('Create game error', err);
			}
		});
	}
	if (joinGameButton) {
		joinGameButton.addEventListener('click', async (e) => {
			e.preventDefault();
			try {
				const findLobbiesRes = await fetch('http://localhost:3002/api/game/find-lobbies', {
					method: "POST",
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({})
				});
				const { lobbies } = await findLobbiesRes.json();
				if (!lobbies || lobbies.length === 0) {
					console.log("No open lobbies found.");
					return;
				}
				const lobby = lobbies[0];
				const joinRes = await fetch('http://localhost:3002/api/game/join-lobby', {
					method: "POST",
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ gameId: lobby.id })
				});
				const data = await joinRes.json();
				if (joinRes.ok) {
					console.log("Successfully joined lobby:", data);
				} else {
					console.error("Failed to join lobby:", data);
				}
			} catch (err) {
				console.error("Error joining game:", err);
			}
		});
	}
}
