import { getSocket } from './socketClient.js';
import { getUserIdFromToken } from './loginClient.js'
import { notify } from "./notify.js";
import { backToPreviousPage } from './navClient.js';


function activetoggleButton(slider: HTMLInputElement, toggleText :HTMLSpanElement) {
	if (slider && toggleText) {

		slider.addEventListener('mousemove', (e) => {
			slider.setAttribute('value', slider.value);
		});

		toggleText.addEventListener('mousedown', (e) => {
			toggleText.style.background = 'rgba(141,111,111,0.3)'
		})

		toggleText.addEventListener('mouseenter', (e) => {
			toggleText.style.background = 'rgba(141,111,111,0.3)'
		})

		toggleText.addEventListener('mouseup', (e) => {
			toggleText.style.background = 'none'
		})

		toggleText.addEventListener('mouseleave', (e) => {
			toggleText.style.background = 'none'
		})

		// Clique sur le texte
		toggleText.addEventListener('click', (e) => {
			e.preventDefault();
			slider.setAttribute("value", slider.value === "0" ? "1" : "0");
		});
	}
}

export function init(){
	const token = localStorage.getItem('token');
	if (!token) {
		window.location.href = '/login';
		return;
	}

	const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;
	const solo_button  = document.getElementById("solo-button") as HTMLButtonElement;
	const match_button  = document.getElementById("match-button") as HTMLButtonElement;
	const game_button  = document.getElementById("game-button") as HTMLButtonElement;
	const join_button  = document.getElementById("join-button") as HTMLButtonElement;
	const spec_button  = document.getElementById("spec-button") as HTMLButtonElement;
	const listGame = document.getElementById("game-list") as HTMLElement;

	const sliderPriv = document.getElementById("slidePriv") as HTMLInputElement;
	const priv = document.getElementById("priv") as HTMLSpanElement;
	const sliderSpec = document.getElementById("slideSpec") as HTMLInputElement;
	const spec = document.getElementById("spec") as HTMLSpanElement;

	activetoggleButton(sliderPriv, priv);
	activetoggleButton(sliderSpec, spec);


	backToPreviousPage();

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
				let Vpriv = sliderPriv && sliderPriv.value == "1" ? 1 : 0;
				let Vspec = sliderSpec && sliderSpec.value == "1" ? 1 : 0;

				sock.emit('create-room', getUserIdFromToken(), lobbyName.value, Vpriv, Vspec);
			}
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
			}
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
		})
	}

	if (solo_button)
	{
		solo_button.addEventListener('click', async  (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else {
				let Vspec = sliderSpec && sliderSpec.value == "1" ? 1 : 0;
				sock.emit('solo-game', getUserIdFromToken(), Vspec);
			}
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
				const res = await fetch(`/api/game2/get-games`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({}),
				});
				const { names } = await res.json();
				if (!names || names.length === 0)
					return notify("No game running !");
				listGame.innerHTML = names.map(l => `<p class="lobby-item" data-name="${l.lobby_name}">${l.lobby_name} - ${l.status} </p>`).join("");

				document.querySelectorAll(".lobby-item").forEach(el => {
					el.addEventListener("click", (e) => {
						const target = e.currentTarget as HTMLElement;
						const lobbyName = target.dataset.name;
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
