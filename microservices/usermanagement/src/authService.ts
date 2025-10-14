import { FastifyInstance } from 'fastify';
import { createUser, User } from './userModel.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer'
import db from './dbSqlite/db.js';

const otpStore = new Map<number, { otp: number; expires: number }>();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'transendance42@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

export async function register(app: FastifyInstance) {
    app.post('/register', async (request, reply) => {
        const { username, email, password } = request.body as {
            username: string;
            password: string;
            email: string;
        };
        if (!username || !email || !password)
            return reply.status(400).send({ error: 'Missing required fields' });
        const existingUser = db.prepare('SELECT 1 FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existingUser)
            return reply.status(409).send({ error: 'Username or email already in use' });
        try {
            console.log("Hashing password...");
            const password_hash = await bcrypt.hash(password, 10);
            console.log("Password hashed!");
            const newUser: User = {
                username,
                password_hash,
                email,
            };
            const userId = createUser(newUser);
            return reply.status(201).send({ success: true, userId });
        } catch (err) {
            console.error(err);
            return reply.status(500).send({ error: 'Failed to register user' });
        }
    });
}

export async function auth(app: FastifyInstance) {
    app.post('/login', async (request, reply) => {
        const { username, password, twofaCheckBox } = request.body as {
            username: string;
            password: string;
            twofaCheckBox: boolean;
        };
        //GET USER FROM DB
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
            id: number;
            username: string;
            email: string;
            password_hash: string;
            is_online: number;
        };
        if (!user)
            return reply.code(401).send({ error: 'Invalid username or password' });
        // COMPARE HASHED PASSWORD RESULT
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return reply.code(401).send({ error: 'Invalid username or password' });
        if (user.is_online) {
            console.log('User is already connected');
            return reply.code(401).send({ error: 'You are already connected on another device' });
        }
        //SIGN 2FA TOKEN FOR THAT SESSION ANOTHER IS GENERATE AT EACH CONNECTION
        if (twofaCheckBox) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            otpStore.set(user.id, { otp, expires: Date.now() + 5 * 60 * 1000 });
            await transporter.sendMail({
                from: 'transendance42@gmail.com',
                to: user.email,
                subject: 'Votre code de vérification',
                text: `Votre code pour terminer la connexion est : ${otp}`
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            // RETURN IT FOR OTHERS SERVICES CAN BE USED IT!
            return reply.send({ message: 'OTP sent', userId: user.id, username: user.username });
        }
        const token = app.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '2h' });
        return reply.send({ token: token });
    });
    app.post('/verify-email', async (request, reply) => {
        const { userId, otp, username } = request.body as { userId: number; otp: string, username: string };
        const record = otpStore.get(userId);

        if (!record || record.expires < Date.now() || record.otp !== parseInt(otp))
            return reply.code(401).send({ error: 'Invalid or expired otp' });
        otpStore.delete(userId);
        const token = app.jwt.sign({ userId: userId, username: username }, { expiresIn: '2h' });

        return reply.send({ token: token });
    });
}

export async function verifyToken(app: FastifyInstance) {
	app.post('/auth/verify', async (request, reply) => {
		const { token } = request.body as { token: string }
		try {
			const decoded = app.jwt.verify(token) as { userId: number; username: string };
            const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(decoded.userId);
            if (!user)
                return reply.code(404).send({ valid: false });
			db.prepare(`UPDATE users SET is_online = 1 WHERE id = ?`).run(decoded.userId);
			return reply.send({ valid: true, user: decoded });
		} catch (err) {
			console.error('JWT verification failed:', err);
			return reply.code(401).send({ valid: false });
		}
	});
}

export async function logOut(app: FastifyInstance) {
    app.post('/logout', async (request, reply) => {
        const user = request.user as { userId: number };
        const userdb = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId) as { id: number };
        if (!userdb)
            return reply.code(401).send({ error: 'User dosen\'t exist' });
        db.prepare('UPDATE users SET is_online = 0 WHERE id = ?').run(user.userId);
        return reply.status(200).send({ success: true });
    });
}

export async function logOutHardReload(app: FastifyInstance) {
    app.post('/logouthr', async () => {
         const socketConnect = db.prepare(`SELECT socket FROM users WHERE is_online = 1`);
         console.log(socketConnect);
    })
}

