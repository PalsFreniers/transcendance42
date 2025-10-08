/*
 *
 *  Here is an example of how to use the TournamentManager (in tournamentManager.ts)
 *
 */

/**
 * export async function sleep(time: number) {
 *     return new Promise((resolve) => {
 *         setTimeout(() => {resolve(null);}, time);
 *     });
 * }
 *
 * async function main() {
 *     const tm = TournamentManager.getInstance();
 *     const players: player_type[] = [];
 *     const maxPlayers = 7;
 *     const tournamentName: string = "Aura Farm";
 *     let errno: number;
 *
 *     for (let i = 0; i < maxPlayers; i++)
 *         players.push([i + 1, (i + 1).toString()]); // creates fake user for the fake tournament
 *
 *     await sleep(3);
 *     console.log(` Starting ${tournamentName}`);
 *
 *     try {
 *         errno = tm.createTournament(tournamentName, maxPlayers)
 *         if (errno)
 *             throw new Error(`createTournament(): ${errno}`);
 *         players.forEach((p) => {
 *             errno = tm.joinTournament(tournamentName, p);
 *             if (errno)
 *                 throw new Error(`joinTournament(tournamentName, p): ${errno}`);
 *         });
 *         tm.getTournament(tournamentName)!.on("game-start", ({ round, name, game }) => {
 *             console.log(`${name}: ${round[0][0]} vs ${round[1][0]}`)
 *         }).on("won", ({t, result}) => { // We can chain event listener for better code
 *             console.log(`${result[0][0]} won against ${result[1][0]}`);
 *         }).on("lose", ({t, result}) => {
 *             console.log(`${result[1][0]} lost against ${result[0][0]}`);
 *         }).on("elimination", ({t, result}) => {
 *             console.log(`${result[1][0]} is eliminated and is ${t.remainingPlayers.length}th`);
 *         });
 *         tm.startTournament(tournamentName, (t) => {
 *             console.log(t.leaderboard);
 *         });
 *     } catch (e) {
 *         console.error(e);
 *         return ;
 *     }
 * }
 *
 * main();
 */