import { getSocket } from './socketClient.js';
import { getUserIdFromToken } from './loginClient.js'
import { notify } from "./notify.js";


export function init(){
	const token = localStorage.getItem('token');
	if (!token) {
		window.location.href = '/login';
		return;
	}
	const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;
	const solo_button  = document.getElementById("solo-button") as HTMLButtonElement;
	const match_button  = document.getElementById("match-button") as HTMLButtonElement;
	const tournois_button  = document.getElementById("tournois-button") as HTMLButtonElement;
	const game_button  = document.getElementById("game-button") as HTMLButtonElement;
	const join_button  = document.getElementById("join-button") as HTMLButtonElement;
	const spec_button  = document.getElementById("spec-button") as HTMLButtonElement;
	const custom_button  = document.getElementById("custom-button") as HTMLButtonElement;
	const listGame = document.getElementById("game-list") as HTMLElement;

	if (game_button)
	{
		game_button.addEventListener('click', async (e) => {
			if (!lobbyName.value) {
				notify('error, lobby name not found !');
				return ('error, lobby name not found !');
			}
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else
			{
				sock.emit('create-room', getUserIdFromToken(), lobbyName.value);
				console.log(`socket(${sock.id}) emit create room !`);
			}
			console.log('game button pressed !');
		})
	}

	if (join_button)
	{
		join_button.addEventListener('click', async (e) => {
			if (!lobbyName.value) {
				notify('error, lobby name not found !');
				return ('error, lobby name not found !');
			}
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else
			{
				sock.emit('join-room-name', getUserIdFromToken(), lobbyName.value);
				console.log(`socket(${sock.id}) emit join room !`);
			}
			console.log('game button pressed !');
		})
	}

	if (match_button)
	{
		match_button.addEventListener('click', async (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else
				sock.emit('join-room', getUserIdFromToken());
			console.log('join button pressed !');
		})
	}

	if (solo_button)
	{
		solo_button.addEventListener('click', async  (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else
				sock.emit('solo-game', getUserIdFromToken());
			console.log('solo button pressed !');
		});
	}

	if (spec_button)
	{
		spec_button.addEventListener('click', async (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404: socket not found !')
			try {
				const res = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3003/api/game2/get-games`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({}),
				});
				const { names } = await res.json();
				if (!names || names.length === 0)
					return console.log("No game running");
				listGame.innerHTML = names.map(l => `<p class="lobby-item" data-name="${l.lobby_name}">${l.lobby_name} - ${l.status} </p>`).join("");

				document.querySelectorAll(".lobby-item").forEach(el => {
					el.addEventListener("click", (e) => {
						const target = e.currentTarget as HTMLElement;
						const lobbyName = target.dataset.name;
						console.log("Clicked lobby:", lobbyName);
						const socket = getSocket(2);
						if (lobbyName) {
							socket!.emit("spec-game", getUserIdFromToken(), {lobbyname: lobbyName});
						}
					});
				});
			} catch (err) {
				console.error(err);
			}
		});
	}
}
