import { navigateTo } from "./navClient.js";
import { notify } from "./notify.js";

export function init() {
	
	console.log('Init running');
	const form = document.getElementById('registerForm') as HTMLFormElement;
	if (!form) 
		return;
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const username = (document.getElementById('username') as HTMLInputElement).value;
		const password = (document.getElementById('password') as HTMLInputElement).value;
		const email = (document.getElementById('email') as HTMLInputElement).value;
		try {
			const res = await fetch(`/api/user/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password, email }),
			});
			if (res.ok) {
				notify('You are successfully register!');
				navigateTo('/login');
			}
			else
				notify('Registration failed.');
		} catch (err) {
			console.error('Register error:', err);
		}
	});
}
