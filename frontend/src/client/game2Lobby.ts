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

		toggleText.addEventListener('click', (e) => {
			e.preventDefault();
			slider.value = slider.value === "0" ? "1" : "0";
			slider.setAttribute("value", slider.value);
		});
	}
}

export function createNewToggleButton(parentDivName: string, toggleId: string, toggleTextId: string, toggleText: string, startValue: string = '0') {

	const div = document.getElementById(parentDivName);
	if (div)
	{


		const checkBoxDiv = document.createElement('div');
		checkBoxDiv.className = 'div_checkbox';

		const toggleButton = document.createElement('input');
		toggleButton.type = 'range';
		toggleButton.className = "miniSlider";
		toggleButton.id = toggleId;
		toggleButton.max = '1';
		toggleButton.min = '0';
		toggleButton.step = '1';
		toggleButton.value = startValue;
		toggleButton.setAttribute('value', toggleButton.value);

		checkBoxDiv.appendChild(toggleButton);

		const toggleSpan = document.createElement('span');
		toggleSpan.className = 'toggleText';
		toggleSpan.id = toggleTextId;
		toggleSpan.textContent = toggleText;

		checkBoxDiv.appendChild(toggleSpan);

		div.appendChild(checkBoxDiv);
		activetoggleButton(toggleButton, toggleSpan);
		console.log(parentDivName);
	}

}

export function init() {
	const token = localStorage.getItem('token');
	if (!token) {
		window.location.href = '/login';
		return;
	}

	const solo_button = document.getElementById("solo-button") as HTMLButtonElement;
	const match_button = document.getElementById("match-button") as HTMLButtonElement;
	const game_button = document.getElementById("game-button") as HTMLButtonElement;
	const join_button = document.getElementById("join-button") as HTMLButtonElement;
	const spec_button = document.getElementById("spec-button") as HTMLButtonElement;
	const listGame = document.getElementById("game-list") as HTMLElement;

	const priv = document.getElementById("priv") as HTMLSpanElement;
	const spec = document.getElementById("spec") as HTMLSpanElement;

	// activetoggleButton(sliderPriv, priv);
	// activetoggleButton(sliderSpec, spec);


	backToPreviousPage();

	if (game_button) {
		game_button.addEventListener('click', async (e) => {

			const div = document.getElementById('shifumi-controls') as HTMLDivElement;
			const divParent = document.getElementById('shifumi-box') as HTMLDivElement;

			if (div)
				div.style.display = 'none';

			if (divParent) {
				const gameName = document.createElement('input');
				gameName.id = 'lobby-name';
				gameName.type = 'text';
				gameName.placeholder = 'game Name';
				gameName.required = true;

				const divToggle = document.createElement('div');
				divToggle.id = 'checkbox-shifumi';
				divParent.appendChild(divToggle);
				divParent.appendChild(gameName);

				createNewToggleButton('checkbox-shifumi', 'slidePriv', 'priv', 'Private', '0');
				createNewToggleButton('checkbox-shifumi', 'slideSpec', 'spec', 'Spectator', '1');

				const divButton = document.createElement('div');
				divButton.className = 'shifumi-buttons';
				divParent.appendChild(divButton);

				const buttonCreateGame = document.createElement('button');
				buttonCreateGame.textContent = 'create game';
				buttonCreateGame.addEventListener('click', (e) => {

					const sliderPriv = document.getElementById("slidePriv") as HTMLInputElement;
					const sliderSpec = document.getElementById("slideSpec") as HTMLInputElement;
					const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;

					if (!lobbyName.value) {
						notify('The lobby must have a name.');
						return ('error, lobby name not found !');
					}
					e.preventDefault();
					var sock = getSocket(2);
					if (!sock)
						return console.error('error 404 : socket not found !');
					else {
						let Vpriv = sliderPriv && sliderPriv.value == "1" ? 1 : 0;
						let Vspec = sliderSpec && sliderSpec.value == "1" ? 1 : 0;

						sock.emit('create-room', getUserIdFromToken(), lobbyName.value, Vpriv, Vspec);
					}
				});

				const buttonReturn = document.createElement('button');
				buttonReturn.textContent = 'return';
				buttonReturn.addEventListener('click', (e) => {
					e.preventDefault();
					gameName.remove();
					divToggle.remove();
					divButton.remove()
					if (div)
						div.style.display = 'block';
				})
				divButton.appendChild(buttonReturn);
				divButton.appendChild(buttonCreateGame);

			}
		})
	}

	if (join_button) {
		join_button.addEventListener('click', async (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else {
				const div = document.getElementById('shifumi-controls') as HTMLDivElement;
				const divParent = document.getElementById('shifumi-box') as HTMLDivElement;

				if (div)
					div.style.display = 'none';

				if (divParent) {
					const gameName = document.createElement('input');
					gameName.id = 'lobby-name';
					gameName.type = 'text';
					gameName.placeholder = 'game Name';
					gameName.required = true;

					divParent.appendChild(gameName);

					const divButton = document.createElement('div');
					divButton.className = 'shifumi-buttons';
					divParent.appendChild(divButton);

					const buttonCreateGame = document.createElement('button');
					buttonCreateGame.textContent = 'join game';
					buttonCreateGame.addEventListener('click', (e) => {

						const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;

						if (!lobbyName.value) {
							notify('The lobby must have a name.');
							return ('error, lobby name not found !');
						}
						e.preventDefault();
						var sock = getSocket(2);
						if (!sock)
							return console.error('error 404 : socket not found !');
						else
							sock.emit('join-room-name', getUserIdFromToken(), lobbyName.value);
					});

					const buttonReturn = document.createElement('button');
					buttonReturn.textContent = 'return';
					buttonReturn.addEventListener('click', (e) => {
						e.preventDefault();
						gameName.remove();
						divButton.remove()
						if (div)
							div.style.display = 'block';
					})
					divButton.appendChild(buttonReturn);
					divButton.appendChild(buttonCreateGame);

				}
			}
		});
	}

	if (match_button) {
		match_button.addEventListener('click', async (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else
				sock.emit('join-room', getUserIdFromToken());
		})
	}

	if (solo_button) {
		solo_button.addEventListener('click', async (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else
				sock.emit('solo-game', getUserIdFromToken(), 0);
		});
	}

	if (spec_button) {
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
				const {names} = await res.json();
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
