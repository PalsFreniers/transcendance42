
import { getSocket } from './socketClient.js';
import { getUserIdFromToken } from './loginClient.js'


export function init(){
	const token = localStorage.getItem('token');

	const app = document.getElementById('app');
	const solo_button  = document.getElementById("solo-button");
	const match_button  = document.getElementById("match-button");
	const tournois_button  = document.getElementById("tournois-button");
	const game_button  = document.getElementById("game-button");
	const join_button  = document.getElementById("join-button");
	const spec_button  = document.getElementById("spec-button");
	const custom_button  = document.getElementById("custom-button");

	if (game_button)
	{
		game_button.addEventListener('click', async (e) => {
			e.preventDefault();
			var sock = getSocket(2);
			if (!sock)
				return console.error('error 404 : socket not found !');
			else
				sock.emit('create-room');
			console.log('game button pressed !');
		})
	}
}
