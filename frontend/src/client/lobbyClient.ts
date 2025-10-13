import { handleRoute } from "./navClient.js";
import { msg_lobby } from "./chatClient.js";

async function profil_image(){
	const token = localStorage.getItem('token');

	try {
		const profil = await fetch(`/api/user/profil`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				'Authorization': `Bearer ${token}`
			},
		});
		const data = await profil.json();
		const pro = document.getElementById('img_perso') as HTMLImageElement;
		//const url = `${data.user.profile_image_url || '/assets/default-avatar.png'}`;
		if (data)
		{
			console.log("👉 Réponse API :", data.user);
			pro.src = data.user.profile_image_url;
		}
	} catch (error) {
		console.error(error);
	}
}

export function init(){
    profil_image();
    const token = localStorage.getItem('token');
    const path = window.location.pathname;
    const msg = document.getElementById('friends');
	const msg_r = document.getElementById('friends2');
	if (token && path == '/lobby') {
		if (msg)
			msg.addEventListener('click', msg_lobby);
		if (msg_r)
			msg_r.addEventListener('click', msg_lobby);
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
			history.pushState(null, '', '/shifumi-lobby');
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

	const but_te = document.getElementById("friends") as HTMLElement;
	const but_tes = document.getElementById("friends2") as HTMLElement;
	if (but_tes) {
		but_tes.style.display = 'block';
	}
	if (but_te) {
		if (but_tes.style.display = 'none')
			but_te.style.display = 'block';
		else
			but_te.style.display = 'none';
	}
	const offline = document.getElementById("offline");
	if (offline) {
		offline.addEventListener("click", async () => {
			const token = localStorage.getItem("token");
			const res = await fetch(`/api/user/logout`, {
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
				if (localStorage)
				{
					localStorage.removeItem("token");
					handleRoute();
				}
				else
					alert("Logout failed: " + (data.error || "Unknown error"));
			}
		});
	}
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