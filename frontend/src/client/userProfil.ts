import { getUserIdFromToken } from "./loginClient.js";
import { getSocket } from "./socketClient.js";
import { handleRoute } from "./navClient.js";
import { notify } from "./notify.js";
import { mini_msg } from "./chatClient.js";

export async function init() {
	try {
		const token = localStorage.getItem('token'); // TOKEN LINK FROM THE USER CONNECTED
		const path = window.location.pathname;
		const profil_path = path.startsWith("/profil/") ? path.slice("/profil/".length) : null;
		const url = profil_path
			? `/api/user/profil?username=${encodeURIComponent(profil_path)}`
			: `/api/user/profil`;
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
		});
		const data = await res.json();
		const profil = document.getElementById('profil') as HTMLElement;
		profil.innerHTML = `
    		<div class="profil-card">
      			<img src="${data.user.profile_image_url || '/assets/default-avatar.png'}" class="profil-avatar" />
      			<div class="profil-info">
        			<h2 class="profil-username">${data.user.username}</h2>
        			<p class="profil-email">${data.user.email}</p>
       				<p class="profil-bio">${data.user.bio || 'No bio yet.'}</p>
      			</div>
    		</div>`
		const editProfile = document.getElementById('edit-profil') as HTMLButtonElement;
		const form = document.getElementById('form-profil') as HTMLFormElement;
		editProfile.addEventListener('click', async (e) => {
			e.preventDefault();
			form.innerHTML = `
				<input id="bio" type="text" bio="bio" placeholder="bio" />
				<div class="file-upload">
					<label for="img-profil">📷 Upload profile picture</label>
					<input id="img-profil" type="file" accept="image/*"/>
					<span class="file-name">No file chosen</span>
				</div>
				<img id="preview-profil" src="${data.user.profile_image_url || '/assets/default-avatar.png'}"/>
				<button type="submit">Save</button>
			`;
			const bio = document.getElementById('bio') as HTMLInputElement;
			const pp = document.getElementById('img-profil') as HTMLInputElement;
			const fileName = document.querySelector(".file-name") as HTMLElement;
			const preview = document.getElementById("preview-profil") as HTMLImageElement;
			pp.addEventListener('change', () => {
				const file = pp.files?.[0];
				if (!file)
					return;
				fileName.textContent = file.name;
				preview.src = URL.createObjectURL(file);
			});
			form.addEventListener('submit', async (e) => {
				e.preventDefault();

				const formData = new FormData();
				formData.append("bio", bio.value);
				if (pp.files?.[0]) {
					formData.append("profile_image_url", pp.files[0]);
				}

				const changeProfil = await fetch(
					`/api/user/update`,
					{
						method: 'PUT',
						headers: {
							'Authorization': `Bearer ${token}`,
						},
						body: formData,
					}
				);

				if (!changeProfil.ok) {
					const err = await changeProfil.json();
					notify(`Failed to update profile: Error ${err}`);
					return;
				}

				const data = await changeProfil.json();
				notify(`profile well updated !`)
				profil.innerHTML = `
				  <div class="profil-card">
					<img src="${data.user.profile_image_url || '/assets/default-avatar.png'}" class="profil-avatar" />
					<div class="profil-info">
					  <h2 class="profil-username">${data.user.username}</h2>
					  <p class="profil-email">${data.user.email}</p>
					  <p class="profil-bio">${data.user.bio || 'No bio yet.'}</p>
					</div>
				  </div>`;
			});
		});
		const resFriends = await fetch(`/api/user/friend-list`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
		});
		const dataFriend = await resFriends.json();
		const friendListContainer = document.getElementById('friend-list') as HTMLUListElement;
		const imgFriend = document.getElementById('friend-img') as HTMLElement;
		const usernameFriend = document.getElementById('data-friendusername') as HTMLElement;
		if (dataFriend && Array.isArray(dataFriend.friends)) {
			dataFriend.friends.forEach(friend => {
				const li = document.createElement('li');
				li.textContent = friend.username;
				const button = document.createElement('button');
				button.textContent = 'Delete';
				button.addEventListener('click', async (e) => {
					e.preventDefault();
					const res = await fetch(`/api/user/delete-friend`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ friendUsername: friend.username })
					});
					const data = await res.json();
					if (res.ok) {
						notify(`friend deleted: ${data.message}`)
						handleRoute();
					}
					else
						console.log('failed to delete friend', data.error);
				});
				li.appendChild(button);
				friendListContainer.appendChild(li);
				mini_msg(friend);
				
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
				return;
			}
			try {
				const res = await fetch(`/api/user/add-friend`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({ friendUsername })
				});
				const data = await res.json();
				if (res.ok) {
					console.log('friend added:', data.message);
					handleRoute();
				}
				else
					console.log('Failed to add friend', data.error);
			}
			catch (err) {
				console.error('Error:', err);
			}
		});

	} catch (err) {
		console.error('Error:', err);
	}
}
