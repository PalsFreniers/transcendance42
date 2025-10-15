import { getSocket } from './socketClient.js'
import { getUserIdFromToken } from './loginClient.js'
import { handleRoute } from './navClient.js';
import { notify } from './notify.js';


export let friend_select: string = '';

export async function msg_friend() {
	const token = localStorage.getItem('token');
	const messages = await fetch(`/api/user/get-message`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({ friendUsername: friend_select })
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
}

async function friend_reload() {
	const token = localStorage.getItem('token');
	const findfriend = await fetch(`/api/user/friend-list`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	});
	const friends_chat = document.getElementById('lobby_chat');
	const friends_lobby = document.getElementById('lobby_friends');
	const chat = document.getElementById('chat');
	if (!chat || !friends_lobby)
		return;
	const listfriend = await findfriend.json();
	const cl_friend = document.querySelectorAll<HTMLDivElement>(".fri");
	cl_friend.forEach((fr) => {
		fr.remove();
	});
	listfriend.friends.forEach(friend => {
		const friendDiv = document.createElement("div");
		friendDiv.id = "flex_friends";
		friendDiv.style.cursor = "pointer";
		friendDiv.className = "fri";
		const img = document.createElement("img");
		img.src = friend.profile_image_url;
		const p = document.createElement("p");
		p.textContent = friend.username;
		const statusDot = document.createElement("span");
		statusDot.classList.add(friend.is_online === 1 ? "online" : "offline");

		friendDiv.appendChild(img);
		friendDiv.appendChild(p);
		friendDiv.appendChild(statusDot);
		friendDiv.addEventListener("click", async (e) => {
			e.preventDefault();
			const cl_friend = document.querySelectorAll<HTMLDivElement>(".fri");
			cl_friend.forEach((fr) => {
				fr.style.backgroundColor = "#555";
			});
			friendDiv.style.backgroundColor = "#ac316eff";
			if (friends_chat) {
				friends_chat.innerHTML = `
					<div id="display-msg"> </div>
					<form id="chat-input">
						<input id="msg-send" type="text" placeholder="Écrire un message..." />
						<button type="submit">Send</button>
					</form>`;
				friend_select = friend.username;
				msg_friend();
				const formMsg = document.getElementById('chat-input') as HTMLFormElement;
				const msgsend = document.getElementById('msg-send') as HTMLInputElement;
				if (formMsg) {
					formMsg.addEventListener('submit', async (e) => {
						e.preventDefault();
						const server = getSocket(0);
						if (msgsend.value.length != 0) {
							server!.emit('message', msgsend.value, getUserIdFromToken(), friend.username)
							msgsend.value = '';
							msg_friend();
						}
					})
				}

			}
		});
		let url: string;
		url = '/profil/' + friend.username;
		img.addEventListener("click", () => {
			history.pushState(null, '', url);
			chat.innerHTML = ``;
			handleRoute();
		});
		friends_lobby.appendChild(friendDiv);
	});
}

async function loadFriendRequests(container: HTMLElement, token: string) {
	try {
		const res = await fetch(`/api/user/get-friend-requests`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});
		const data = await res.json();
		if (!data)
			return;
		data.friendRequest.forEach((req: any) => {
			const div = document.createElement("div");
			div.classList.add("friend-request");
			div.innerHTML = `
				<p>${req.sender_username} wants to be your friend</p>
				<div id="button">
					<button class="accept">Accept</button>
					<button class="reject">Reject</button>
				</div>
			`;
			container.appendChild(div);
			const socketChat = getSocket(0);
			div.querySelector('.accept')!.addEventListener('click', () => {
				socketChat!.emit('requests-friend', req.id, true);
				div.remove();
			});
			div.querySelector('.reject')!.addEventListener('click', () => {
				socketChat!.emit('requests-friend', req.id, false);
				div.remove();
			});
		});
	} catch (err) {
		console.error('Error loading friend requests:', err);
		container.innerHTML = "<p>Failed to load friend requests</p>";
	}
}


export async function msg_lobby(event: MouseEvent) {
	const token = localStorage.getItem('token');
	const chat = document.getElementById('chat');
	const target = event?.target as Node;
	if (chat) {
		chat.innerHTML = `
            <div id="boddy_chat">
                <div id="page_chat">
                    <div id="lobby_friends">
                    </div>
                    <div id="lobby_chat">
                    </div>
                </div>
            </div>
        `;
		const chat_boddy = document.getElementById('page_chat');
		const friends_lobby = document.getElementById('lobby_friends');

		if (friends_lobby && token) {
			try {
				const findfriend = await fetch(`/api/user/friend-list`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				});
				if (findfriend.ok) {
					const nameFriend = document.createElement("input");
					nameFriend.id = "friend-username";
					nameFriend.type = "text";
					nameFriend.placeholder = "Enter friend username";

					const addFriend = document.createElement("button");
					addFriend.id = "add-friend-button";
					addFriend.textContent = "Add Friend";

					friends_lobby.appendChild(nameFriend);
					friends_lobby.appendChild(addFriend);

					const requestsContainer = document.createElement("div");
					requestsContainer.id = "friend-requests";
					friends_lobby.appendChild(requestsContainer);

					addFriend.addEventListener('click', async (e) => {
						e.preventDefault();
						const friendUsername = nameFriend.value;
						if (!friendUsername) 
							return notify('Friend username is empty');
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
								notify(`You send a friend request to ${friendUsername}`);
								handleRoute();
							} else notify(`Failed to add friend ${data.error}`);
						} catch (err) {
							console.error('Error:', err);
						}
						friend_reload();
					});
					friend_reload();
					loadFriendRequests(requestsContainer, token);
				}
			} catch (error) {
				console.error(error)
			}
		}
		function click_event(e: MouseEvent) {
			const target = e.target as Node;
			if (chat && !chat_boddy?.contains(target)) {
				chat.innerHTML = ``;
				friend_select = '';
				document.removeEventListener('click', click_event);
			}
		}
		setTimeout(() => {
			document.addEventListener('click', click_event);
		});
	}
}

export function mini_msg(friend) {
	const miniChat = document.getElementById('chat-container') as HTMLElement;
	if (!miniChat)
		return
	const display = document.getElementById('chat-display') as HTMLElement;
	const msgBtn = document.getElementById('msg-ico') as HTMLElement;
	display.style.display = "none";
	msgBtn.addEventListener('click', async () => {
		if (display.style.display === 'none')
			display.style.display = 'block';
		else
			display.style.display = 'none'
	})
	const token = localStorage.getItem('token');
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
		const messages = await fetch(`/api/user/get-message`, {
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
		friend_select = friend.username;
		msg_friend();
		const formMsg = document.getElementById('chat-input') as HTMLFormElement;
		const msgsend = document.getElementById('msg-send') as HTMLInputElement;
		if (formMsg) {
			formMsg.addEventListener('submit', async (e) => {
				e.preventDefault();
				const server = getSocket(0);
				if (msgsend.value.length != 0) {
					server!.emit('message', msgsend.value, getUserIdFromToken(), friend.username)
					msgsend.value = '';
					msg_friend();
				}
			})
		}
	});
}