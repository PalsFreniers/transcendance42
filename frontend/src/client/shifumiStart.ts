import {getSocket} from "./socketClient";
import {getUserIdFromToken} from "./loginClient.js";

export function init() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const app = document.getElementById('app');
    const start = document.getElementById('start-button');
    const card1 = document.getElementById('card1-button');
    const card2 = document.getElementById('card2-button');
    const card3 = document.getElementById('card3-button');

    if (start) {
        start.hidden = true;
    }
    if (card1)
        card1.hidden = true;
    if (card2)
        card2.hidden = true;
    if (card3)
        card3.hidden = true;
}