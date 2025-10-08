import { getSockets } from './socketClient.js';
import { routes } from './template.js';
import { notify } from './notify.js';

import * as loginClient from './loginClient.js';
import * as registerClient from './registerClient.js';
import * as lobbyClient from './lobbyClient.js';
import * as profilClient from './userProfil.js';
import * as pongClient from './gameLobby.js';
import * as shifumiLobbyClient from './game2Lobby.js';
import * as shifumiStartClient from './shifumiStart.js';

const pageModules: Record<string, any> = {
	'/login': loginClient,
	'/register': registerClient,
	'/lobby': lobbyClient,
	'/profil': profilClient,
	'/pong': pongClient,
	'/shifumi-lobby': shifumiLobbyClient,
	'/shifumi': shifumiStartClient,
};

async function isTokenValid(token: string): Promise<boolean> {
	try {
		const res = await fetch('/api/user/auth/verify', {
			method: 'POST',
			headers: {'Content-Type': 'application/json' },
			body: JSON.stringify({ token: token })
		});

		if (!res.ok) 
			return false;
		const data = await res.json();
		return data?.valid === true;
	} catch (err) {
		console.error('Token validation error:', err);
		return false;
	}
}


window.addEventListener('DOMContentLoaded', async () => {
	const token = localStorage.getItem('token');
	if (token) {
		if (await isTokenValid(token)) {
			getSockets();
		} else {
			notify('Token invalid or expire, token was suppress.');
			localStorage.removeItem('token');
			navigateTo('/login');
			return;
		}
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

function getClient(path: string) {
	if (path.startsWith("/profil"))
		return profilClient;
	return pageModules[path] ?? null;
}


export async function handleRoute() {
	const path = window.location.pathname;
	const token = localStorage.getItem('token');
	// --- redirect rules ---
	if (!token && !['/', '/login', '/register'].includes(path)) {
		history.replaceState(null, '', '/login');
		return handleRoute();
	}
	if (token) {
		if (await isTokenValid(token)) {
			getSockets();
		} else {
			notify('Token invalid or expire, token was suppress.');
			localStorage.removeItem('token');
			navigateTo('/login');
			return;
		}
	}
	if (token && ['/login', '/register'].includes(path)) {
		history.replaceState(null, '', '/lobby');
		return handleRoute();
	}

	// --- template injection ---
	const app = document.getElementById('app');
	if (!app)
		return;
	let templateFn = routes[path];
	if (path.startsWith("/profil"))
		templateFn = routes["/profil"];
	if (templateFn) {
		app.innerHTML = templateFn();
		// --- loader ---
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
		// --- chargement du module JS correspondant ---
		const mod = getClient(path);
		if (mod?.init)
			mod.init();
	} else
		app.innerHTML = `<h1>404 - Page not found</h1>`;
}
// --- navigation helper ---
export function navigateTo(url: string) {
	history.pushState(null, '', url);
	handleRoute();
}

export function backToPreviousPage() {
	const backBtn = document.getElementById('return');
	const path = window.location.pathname;
	if (backBtn){
		backBtn.addEventListener('click', () => {
			if (path.startsWith("/shifumi"))
			{
				history.pushState(null, '', '/lobby');
				handleRoute();
			}
			else
				history.back();
		})
	}
}
