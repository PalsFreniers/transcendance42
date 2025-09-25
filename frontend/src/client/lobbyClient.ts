import { handleRoute } from "./navClient.js";
import { getUserIdFromToken } from "./loginClient.js";
import { getSocket } from "./socketClient.js";

export let friend_select: string = ''; 

export async function msg_friend()
{
	const token = localStorage.getItem('token');
	const messages = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/get-message`, {
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

async function friend_reload(){
	const token = localStorage.getItem('token');
	 const findfriend = await fetch(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3001/api/user/friend-list`, {
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
	const friends = Array.isArray(listfriend.friends) ? listfriend.friends.filter(Boolean) : [];
	console.log("Nombre d'amis :", friends.length);
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

		friendDiv.appendChild(img);
		friendDiv.appendChild(p);
		friendDiv.addEventListener("click", async (e) => {
			e.preventDefault();
			const cl_friend = document.querySelectorAll<HTMLDivElement>(".fri");
				cl_friend.forEach((fr) => {
					fr.style.backgroundColor = "#555";
			});
			friendDiv.style.backgroundColor = "#ac316eff";
			if (friends_chat)
			{
				friends_chat.innerHTML = `
					<div id="display-msg"> </div>
					<form id="chat-input">
						<input id="msg-send" type="text" placeholder="Écrire un message..." />
						<button type="submit">Send</button>
					</form>`;
				console.log("Tu as cliqué sur :", friend.username);
				friend_select = friend.username;
				msg_friend();
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

async function msg_lobby(event: MouseEvent){
    const token = localStorage.getItem('token');
    const chat = document.getElementById('chat');
    const target = event?.target as Node;
    if (chat)
    {
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

        if (friends_lobby && token)
        {
            try {
                const findfriend = await fetch(`/api/user/friend-list`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (findfriend.ok)
                {
					const nameFriend = document.createElement("input");
					nameFriend.id = "friend-username";
					nameFriend.type = "text";
					nameFriend.placeholder = "Enter friend username";
					const addFriend = document.createElement("button");
					addFriend.id = "add-friend-button";
					addFriend.textContent = "Add Friend";
					friends_lobby.appendChild(nameFriend);
					friends_lobby.appendChild(addFriend);
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
						friend_reload();
					});
					friend_reload();
                }
            } catch (error) {
                console.error(error)
            }
        }
        console.log("On ouvre le chat");
        function click_event(e: MouseEvent){
            const target = e.target as Node;
            if (chat && !chat_boddy?.contains(target) ){
                chat.innerHTML = ``;
				friend_select = '';
                document.removeEventListener('click', click_event);
            }
        }
        setTimeout(() =>{
            document.addEventListener('click', click_event);
        });
    }
}

async function profil_image(){
	const token = localStorage.getItem('token');

	try {
		const profil = await fetch(`/api/user/profil`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				'Authorization': `Bearer ${token}`
			},
		});
		const data = await profil.json();
		const pro = document.getElementById('img_perso') as HTMLImageElement;
		//const url = `${data.user.profile_image_url || '/assets/default-avatar.png'}`;
		if (data)
		{
			console.log("👉 Réponse API :", data.user);
			pro.src = data.user.profile_image_url;
		}
	} catch (error) {
		console.error(error);
	}
}

export function init(){
    profil_image();
    const token = localStorage.getItem('token');
    const path = window.location.pathname;
    const msg = document.getElementById('friends');
	const msg_r = document.getElementById('friends2');
	if (token && path == '/lobby') {
		if (msg)
			msg.addEventListener('click', msg_lobby);
		if (msg_r)
			msg_r.addEventListener('click', msg_lobby);
	}
    const zone = document.querySelector('.game1');
	const selection = document.querySelector('#selection1');

	if (zone) {
		zone.addEventListener('mouseenter', () => {
			if (selection)
				selection.classList.add('active')
		});
	}
	if (zone) {
		zone.addEventListener('mouseleave', () => {
			if (selection)
				selection.classList.remove('active')
		});
	}
	if (zone) {
		zone.addEventListener('click', () => {
			history.pushState(null, '', '/pong');
			handleRoute();
		});
	}

	const zone2 = document.querySelector('.game2');
	const selection2 = document.querySelector('#selection2');

	if (zone2) {
		zone2.addEventListener('mouseenter', () => {
			zone2.classList.add('active')
			if (selection2)
				selection2.classList.add('active')
		});
	}
	if (zone2) {
		zone2.addEventListener('mouseleave', () => {
			zone2.classList.remove('active')
			if (selection2)
				selection2.classList.remove('active')
		});
	}
	if (zone2) {
		zone2.addEventListener('click', () => {
			history.pushState(null, '', '/shifumi-lobby');
			handleRoute();
		});
	}
	const but_return = document.querySelector('#return');
	if (but_return) {
		but_return.addEventListener('click', () => {
			history.pushState(null, '', '/');
			handleRoute();
		});
	}
	const prof = document.querySelector('#perso');
	if (prof)
	{
		prof.addEventListener('click', () => {
			history.pushState(null, '', '/profil');
			handleRoute();
		});
	}

	const but_tes = document.querySelector("#friends");
	const but_te = document.querySelector("#friends2");
	const but_test = document.getElementById("friends");
	const but_tests = document.getElementById("friends2");
	if (but_tes) {
		but_tes.addEventListener('click', () => {
			if (but_test)
				but_test.style.visibility = "hidden";
			if (but_tests)
				but_tests.style.visibility = "visible";
		});
	}
	if (but_te) {
		but_te.addEventListener('click', () => {
			if (but_tests)
				but_tests.style.visibility = "hidden";
			if (but_test)
				but_test.style.visibility = "visible";
		});
	}
	const offline = document.getElementById("offline");
	if (offline) {
		offline.addEventListener("click", async () => {
			const token = localStorage.getItem("token");
			const res = await fetch(`/api/user/logout`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({}),
			});

			const data = await res.json();
			if (data.success) {
				// remove token from localStorage
				localStorage.removeItem("token");

				// optional: redirect to login page
				handleRoute();
			} else {
				alert("Logout failed: " + (data.error || "Unknown error"));
			}
		});
	}
	const music = document.getElementById("music") as HTMLAudioElement;
	const musicButton = document.getElementById("btn-music") as HTMLButtonElement;
	const musicVolume = document.getElementById("volume-music") as HTMLInputElement;

	let currentTrack = 0;
	let isPlaying = false;

	const playlist =
		[
			"/asset/Nightcore - Love Is Confusing (Lyrics).mp3"
		]
	if (music) {
		music.src = playlist[currentTrack];
		music.addEventListener("ended", () => {
			currentTrack = (currentTrack + 1) % playlist.length;
			music.src = playlist[currentTrack];
			music.play();
		});

		musicButton.addEventListener("click", () => {
			if (isPlaying) {
				music.pause();
				musicButton.classList.add("paused");
			}
			else {
				music.play();
				musicButton.classList.remove("paused");
			}
			isPlaying = !isPlaying;
		});

		musicVolume?.addEventListener("input", () => {
			music.volume = Number(musicVolume.value);
		});
	}
}