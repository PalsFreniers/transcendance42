export async function init() {
  try {
    const token = localStorage.getItem('token'); // TOKEN LINK FROM THE USER CONNECTED
    const res = await fetch('http://localhost:3001/api/user/profil', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error('Error:', err);
  }
}
