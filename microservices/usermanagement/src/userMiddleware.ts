import { FastifyInstance } from 'fastify';

export async function verifJWTToken(app: FastifyInstance) {
    app.decorate("authenticate", async function(request, reply){
        try{
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
}