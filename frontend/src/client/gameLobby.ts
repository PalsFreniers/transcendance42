export function getUsernameFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload.username || null;
  } catch (err) {
    console.error('Failed to decode token:', err);
    return null;
  }
}

export function init(){
    const gameButton = document.getElementById('gameButton') as HTMLButtonElement | null;
    if (gameButton)
    gameButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const username = getUsernameFromToken();
      if (username)
        console.log('Welcome', username);
    })
};
