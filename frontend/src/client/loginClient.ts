export function init() {
  const form = document.getElementById('loginForm') as HTMLFormElement | null;
  if (!form) 
    return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('loginUsername') as HTMLInputElement).value;
    const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
    try {
      const res = await fetch('api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        alert('Login successful!');
      } else {
        alert('Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  });
}

