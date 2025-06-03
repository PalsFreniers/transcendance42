import { FastifyInstance } from 'fastify';

export async function profilRoutes(app: FastifyInstance) {
    app.get('/profile', async (request, reply) => {
        return { success: true};
    });
}

export async function friendRoutes(app: FastifyInstance) {
    app.get('/friendList', async (requestAnimationFrame, reply) => {
        return { success: true};
    });
}

export async function updateRoutes(app: FastifyInstance) {
    app.put('/update', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const { bio, profile_image_url } = request.body;
    const stmt = db.prepare(`
        UPDATE users
        SET bio = ?, profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    stmt.run(bio, profile_image_url, userId);
    return reply.send({ success: true });
    });
}

export async function deleteRoutes(app: FastifyInstance) {
    app.delete('/delete', { preValidation: [app.authenticate] }, async (request, reply) =>{

        return { success: true};
    })
}