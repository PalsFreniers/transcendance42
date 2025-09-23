import { Player } from "./game.js";

export async function calculMmr(player: Player, opponent: Player, token): Promise<number> {

    const playerMmr = await getMmrFromId(player.Id, token);
    const opponentMmr = await getMmrFromId(opponent.Id, token);

    const expectedScore = 1 / (1 + Math.pow(10, (opponentMmr - playerMmr) / 200));
    const k = 15 + Math.round(Math.abs(playerMmr - opponentMmr) / 10);

    const totalPoints = player.Point + opponent.Point;
    const score = totalPoints > 0 ? player.Point / totalPoints : 0.5;

    const mmrGain = Math.trunc(k * (score - expectedScore));

    console.log(`in calcul mmrGain = ${mmrGain}`);
    console.log(`in calcul mmr = ${playerMmr}`);
    setMmrFromId(player.Id, token, playerMmr + mmrGain);

    return mmrGain;
}

async function getMmrFromId(id: number, token): Promise<number>  {
    try {
        const res = await fetch('http://user-service:3001/api/user/get-mmr-shifumi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id
            }),
        });
        let data = await res.json();
        if (!data.success)
            return 50;
        return data.mmr;
    } catch (err) {
        console.log(err);
        return 50;
    }
}

async function setMmrFromId(id: number, token, newMmr: number)  {
    try {
        console.log(`newMmr = ${newMmr}`);
        const res = await fetch('http://user-service:3001/api/user/set-mmr-shifumi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id, newMmr
            }),
        });
        let data = await res.json();
        if (!data.success)
            return false;
        return ;
    } catch (err) {
        console.log(err);
        return true;
    }
}