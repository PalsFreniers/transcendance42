export function init() {
  const form = document.getElementById('loginForm') as HTMLFormElement | null;
  if (!form) 
    return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('loginUsername') as HTMLInputElement).value;
    const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
    try {
      const res = await fetch('http://localhost:3001/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
      } else {
        alert('Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  });
}

