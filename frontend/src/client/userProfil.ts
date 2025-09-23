import { getUserIdFromToken } from "./loginClient.js";
import { getSocket } from "./socketClient.js";
import { handleRoute } from "./navClient.js";

export async function init() {
	try {
		const token = localStorage.getItem('token'); // TOKEN LINK FROM THE USER CONNECTED
		const path = window.location.pathname;
		const profil_path = path.startsWith("/profil/") ? path.slice("/profil/".length) : null;
		const url = profil_path
			? `http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/profil?username=${encodeURIComponent(profil_path)}`
			: `http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/profil`;
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
				<input id="phoneNumber" type="text" placeholder="Phone number" />
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
			const phone_number = document.getElementById('phoneNumber') as HTMLInputElement;
			pp.addEventListener('change', () => {
				const file = pp.files?.[0];
				if (!file)
					return;
				fileName.textContent = file.name;
				preview.src = URL.createObjectURL(file);
			});
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				console.log('coucou');

				const formData = new FormData();
				formData.append("bio", bio.value);
				formData.append("phoneNumber", phone_number.value);
				if (pp.files?.[0]) {
					formData.append("profile_image", pp.files[0]);
				}

				const changeProfil = await fetch(
					`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/update`,
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
					console.error('Failed to update profile:', err);
					return;
				}

				const data = await changeProfil.json();
				console.log(data.user.phone_number);
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
		const resFriends = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/friend-list`, {
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
					const res = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/delete-friend`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ friendUsername: friend.username })
					});
					const data = await res.json();
					if (res.ok) {
						console.log('friend deleted:', data.message);
						handleRoute();
					}
					else
						console.log('failed to delete friend', data.error);
				});
				li.appendChild(button);
				friendListContainer.appendChild(li);
				const friendConverstaion = document.getElementById('chat-friend') as HTMLElement;
				const friendPP = document.createElement('div');
				friendPP.classList.add('friend-pp');
				const imgDiv = document.createElement('div');
				const ppFriend = document.createElement('img');
				ppFriend.src = friend.profile_image_url;
				imgDiv.appendChild(ppFriend);
				const nameDiv = document.createElement('div');
				const nameFriend = document.createElement('p');
				nameFriend.textContent = friend.username;
				nameDiv.appendChild(nameFriend);
				friendPP.appendChild(imgDiv);
				friendPP.appendChild(nameDiv);
				friendConverstaion.appendChild(friendPP);
				ppFriend.dataset.friendusername = friend.username;
				ppFriend.addEventListener('click', async (e) => {
					e.preventDefault();
					document.querySelectorAll('.friend-pp').forEach(el => el.classList.remove('selected'));
					const usernameTarget = (e.currentTarget as HTMLImageElement).dataset.friendusername;
					const friendPPDiv = (e.currentTarget as HTMLElement).closest('.friend-pp');
					friendPPDiv?.classList.add('selected');
					console.log("Image cliquée => username:", usernameTarget);
					const messages = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/get-message`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ friendUsername: usernameTarget })
					});
					const data = await messages.json();
					if (data.messages) {
						const boxMsg = document.getElementById('display-msg') as HTMLElement;
						boxMsg.innerHTML = ``;
						data.messages.forEach(msg => {
							if (!msg)
								return;
							const msgElement = document.createElement('p');
							msgElement.textContent = msg.text;
							if (msg.userId === getUserIdFromToken())
								msgElement.className = "user-msg";
							else
								msgElement.className = "user-target-msg";
							boxMsg.appendChild(msgElement);
						});
						boxMsg.scrollTop = boxMsg.scrollHeight;
					}
					const formMsg = document.getElementById('chat-input') as HTMLFormElement;
					const msgsend = document.getElementById('msg-send') as HTMLInputElement; 
					if (formMsg) {
						formMsg.addEventListener('submit', async (e) => {
							e.preventDefault();
							const server = getSocket(0);
							if (msgsend.value.length != 0)
							{
								server!.emit('message', msgsend.value, getUserIdFromToken(), friend.username)
								msgsend.value = '';
							}
						})
					}
				});
				
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
				const res = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/add-friend`, {
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
