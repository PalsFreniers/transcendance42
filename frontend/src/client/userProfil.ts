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
    const editProfile = document.getElementById('edit-profil') as HTMLButtonElement;
    const form = document.getElementById('form-profil') as HTMLFormElement;
    editProfile.addEventListener('click', async (e) => {
      e.preventDefault();
      form.innerHTML = `
       <input id="bio" type="text" bio="bio" placeholder="bio" required />
       <input id="img-profil" type="file" accept="image/*" required />
      <button type="submit">Save</button>`
    })
  } catch (err) {
    console.error('Error:', err);
  }
}
