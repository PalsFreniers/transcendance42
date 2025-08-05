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
		});
		const resFriends = await fetch('http://localhost:3001/api/user/friend-list', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		});
		const dataFriend = await resFriends.json();
		const friendListContainer = document.getElementById('friend-list') as HTMLUListElement;
		if (dataFriend && Array.isArray(dataFriend.friends)) {
			dataFriend.friends.forEach(friend => {
				const li = document.createElement('li');
				li.textContent = friend.username;
				const button = document.createElement('button');
				button.textContent = 'Delete';
				button.addEventListener('click', async (e) => {
					e.preventDefault();
					const res = await fetch('http://localhost:3001/api/user/delete-friend', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ friendUsername: friend.username })
					});
					const data = await res.json();
					if (res.ok)
						console.log('friend deleted:', data.message);
					else
						console.log('failed to delete friend', data.error);
				});
				li.appendChild(button);
				friendListContainer.appendChild(li);
			});
		} else {
			const msg = document.createElement('p');
			msg.textContent = 'No friends found.';
			friendListContainer.appendChild(msg);
		}
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
					console.log('friend added:', data.message);
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
