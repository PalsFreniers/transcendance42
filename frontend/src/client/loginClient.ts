import { navigateTo } from "./navClient.js";
import { getSockets } from "./socketClient.js";

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
		const twofaCheckBox = (document.getElementById('2fa') as HTMLInputElement).checked;
		const remember = (document.getElementById('remember') as HTMLInputElement).checked;
		try {
			const res = await fetch(`/api/user/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password, twofaCheckBox }),
			});
			const data = await res.json();
			if (res.ok && twofaCheckBox) {
				if (res.ok && data.message === "OTP sent") {
					const otp = prompt("Un code de vérification a été envoyé à votre email. Entrez-le ici :");
					if (!otp) {
						alert("Vous devez entrer un code OTP");
						return;
					}
					const verifyRes = await fetch(`/api/user/verify-email`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ userId: data.userId, username: data.username, otp: otp }),
					});

					const verifyData = await verifyRes.json();
					if (verifyRes.ok && verifyData.token) {
						if (remember)
							localStorage.setItem("rememberedUsername", username);
						else
							localStorage.removeItem("rememberedUsername");
						localStorage.setItem('token', verifyData.token);
						await getSockets();
						navigateTo('/lobby');
					} else {
						alert('Code OTP invalide.');
					}
				} else {
					alert('Login failed.');
				}
			}
			else {
				localStorage.setItem('token', data.token);
				await getSockets();
				navigateTo('/lobby');
			}
		} catch (err) {
			console.error('Login error:', err);
		}
	});
}

