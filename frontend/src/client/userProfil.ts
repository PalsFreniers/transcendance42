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
    const nameFriend = document.getElementById('friend-username') as HTMLInputElement;
    const addFriend = document.getElementById('add-friend-button') as HTMLButtonElement;
    addFriend.addEventListener('click', async (e) => {
      e.preventDefault();
      const friendUsername = nameFriend.value;
      if (!friendUsername) {
        console.error('Friend username is empty');
        return ;
      }
      try {
        const res = await fetch('http://localhost:3001/api/user/add-friend', {
          method: 'POST',
          headers: {
            'Content-Type':'application/json', 
            'Authorization' : `Bearer ${token}`
          },
          body: JSON.stringify({ friendUsername })
        });
        const data = await res.json();
        if (res.ok)
          console.log('friend added:', data.message)
        else
          console.log('Failed to add friend', data.error);
      }
      catch (err){
        console.error('Error:', err);
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
}
