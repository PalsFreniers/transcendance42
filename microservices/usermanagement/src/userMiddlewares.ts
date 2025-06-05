import { FastifyInstance } from 'fastify';

// VERIFY THE VALIDITY OF THE TOKEN
export async function verifJWTToken(app: FastifyInstance) {
    app.decorate("authenticate", async function(request, reply){
        try{
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
}

// GET USER ID FROM VALIDATED TOKEN
export function getUserId(request: FastifyInstance) {
  try {
    const decoded = request.user || request.jwtVerify();
    return decoded.userId;
  } catch {
    throw new Error("Invalid token");
  }
}