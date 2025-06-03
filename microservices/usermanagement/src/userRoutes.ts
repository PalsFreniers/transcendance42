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
    app.put('/update', async (request, reply) => {
    
    return { success: true };
  });
}

export async function deleteRoutes(app: FastifyInstance) {
    app.delete('/delete', async (request, reply) =>{

        return { success: true};
    })
}