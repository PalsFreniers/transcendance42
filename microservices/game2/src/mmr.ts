import { Player } from "./game.js";
import {gameIsPrivate, getAllGame} from "./Game2Database.js";

type Ga = { id: number; player_one_id: number };
type Pl = { id: number; shifumi_mmr: number };

export async function matchmaking(playerId: number, token) : Promise<number> {
    const PlayerMmr = await getMmrFromId(playerId, token);
    const allGame: Ga[] = getAllGame();
    if (allGame.length == 0)
        return -1;

    let playerMap = new Map();
    allGame.forEach(g => {
        playerMap.set(g.player_one_id, g.id);
    });

    const playerIds = allGame.map(g => g.player_one_id);
    const players = await getPlayers(playerIds, token);
    if (players === null)
        return -2;

    const mmrMap = new Map();
    players.forEach((p) => {
        mmrMap.set(p.id, p.shifumi_mmr);
    });
    if (mmrMap.size == 0)
        return -4;

    let range = 1;
    const maxRange = 1024;
    let idGame = 0;

    while (range < maxRange)
    {
        mmrMap.forEach((mmr, id, map) => {
            if (mmr >= (PlayerMmr - range) && mmr <= (PlayerMmr + range)) {
                idGame = playerMap.get(id);
            }
        })
        if (idGame)
            return idGame;
        range *= 2;
    }
    return -3;
}

export async function calculMmr(gameId: number, player: Player, opponent: Player, token): Promise<number> {

    if (gameIsPrivate(gameId))
        return -2000;

    if (player.Forfeit)
        return -10;

    const playerMmr = await getMmrFromId(player.Id, token);
    const opponentMmr = await getMmrFromId(opponent.Id, token);

    const expectedScore = 1 / (1 + Math.pow(10, (opponentMmr - playerMmr) / 200));
    const k = 15 + Math.round(Math.abs(playerMmr - opponentMmr) / 10);

    let score;
    if (opponent.Forfeit)
        score = 1;
    else  {
        const totalPoints = player.Point + opponent.Point;
        score = totalPoints > 0 ?  player.Point / totalPoints : 0.5;
    }

    const mmrGain = Math.trunc(k * (score - expectedScore));

    if (playerMmr + mmrGain >= 0)
        setMmrFromId(player.Id, token, playerMmr + mmrGain);
    else
        setMmrFromId(player.Id, token, 0);

    return mmrGain;
}

async function getMmrFromId(id: number, token): Promise<number> {
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

async function getPlayers(playerIds: number[], token): Promise<Pl[] | null>
{
    try {
        const res = await fetch('http://user-service:3001/api/user/get-list-player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                playerIds
            }),
        });
        let data = await res.json();
        if (!data.success)
            return null;
        return data.players;
    } catch (err) {
        console.log(err);
        return null;
    }
}
