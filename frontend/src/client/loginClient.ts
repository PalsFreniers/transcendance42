import { navigateTo } from "./navClient.js";

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

export function getUsernameFromToken(): string | null {
	const token = localStorage.getItem('token');
	if (!token) return null;

	try {
		const payloadBase64 = token.split('.')[1];
		const payloadJson = atob(payloadBase64);
		const payload = JSON.parse(payloadJson);
		return payload.username || null;
	} catch (err) {
		console.error('Failed to decode token:', err);
		return null;
	}
}

export function init() {
	const form = document.getElementById('loginForm') as HTMLFormElement | null;
	if (!form) 
		return;
	const rememberedUsername = localStorage.getItem("rememberedUsername");
	if (rememberedUsername) {
		const usernameInput = document.getElementById("loginUsername") as HTMLInputElement;
		const rememberCheckbox = document.getElementById("remember") as HTMLInputElement;
		if (usernameInput)
			usernameInput.value = rememberedUsername;
		if (rememberCheckbox)
			rememberCheckbox.checked = true;
	}
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const username = (document.getElementById('loginUsername') as HTMLInputElement).value;
		const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
		const remember = (document.getElementById("remember") as HTMLInputElement).checked;
		try {
		const res = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});
		const data = await res.json();
		if (res.ok && data.token) {
			if (remember)
				localStorage.setItem("rememberedUsername", username);
			else
				localStorage.removeItem("rememberedUsername");
			localStorage.setItem('token', data.token);
			navigateTo('/lobby');
		} else {
			alert('Login failed.');
		}
		} catch (err) {
		console.error('Login error:', err);
		}
	});
}

