// import Fastify from 'fastify';
// import { GameManager } from "./GameManager.ts";
// import { loadFastify } from "./API/apiRoutes.ts";

// const fastify = Fastify({ logger: true });
// const manager = new GameManager();

// loadFastify(manager, fastify);

// const start = async () => {
//     try {
//         await fastify.listen({ port: 3004, host: '0.0.0.0' });
//         console.log(`Game service listening on port 3004`);
//     } catch (err) {
//         fastify.log.error(err);
//         process.exit(1);
//     }
// };

// start();
