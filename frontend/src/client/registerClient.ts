document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (!form) 
        return;
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('username') as HTMLInputElement | null)?.value ?? '';
    const password = (document.getElementById('password') as HTMLInputElement | null)?.value ?? '';
    const email = (document.getElementById('email') as HTMLInputElement | null)?.value ?? '';
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    const data = await res.json();
    console.log('Registration response', data);
  });
});