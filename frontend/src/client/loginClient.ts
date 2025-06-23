document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) 
        return;
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('loginUsername') as HTMLInputElement | null)?.value ?? '';
    const password = (document.getElementById('loginPassword') as HTMLInputElement | null)?.value ?? '';
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    console.log('Login response', data);
  });
});

