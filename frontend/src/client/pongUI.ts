const leftPaddleColor = [
    "#24d0f2", // Fill
    "#ffffff", // Border
    "190" // Hue
];
const rightPaddleColor = [
    "#f22432", // Fill
    "#ffffff", // Border
    "352" // HUE
];

class PongInfo {
    public particles: Particle[] = [];
    public frames: number = 0;
}

abstract class Particle {
    protected constructor(
        public pos: { x: number, y: number },
        public dir: { x: number, y: number },
        public color: string,
        public speed: number,
        public alpha: number = 0.5,
        public lifetime: number = Number.MAX_VALUE
    ) {
        const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
        if (!canvas)
            return;
        const realWidth = 20;
        const realHeight = 10;
        const scaleX = canvas.width / realWidth;
        const scaleY = canvas.height / realHeight;

        const len = this.len;
        this.dir.x *= this.speed / len;
        this.dir.y *= this.speed / len;
        this.pos.x *= scaleX;
        this.pos.y *= scaleY;
    }
    public alive: boolean = true;

    private get len() {
        return Math.sqrt(this.dir.x * this.dir.x + this.dir.y * this.dir.y);
    }

    move() {
        const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
        if (!canvas)
            return;
        if (this.dir.x)
            this.pos.x += this.dir.x;
        if (this.dir.y)
            this.pos.y += this.dir.y;
        if (--this.lifetime < 0)
            this.alive = false;
    }

    abstract draw(ctx: CanvasRenderingContext2D);
}

class RectangleParticle extends Particle {
    constructor(
        pos: { x: number, y: number },
        dir: { x: number, y: number },
        color: string,
        speed: number,
        alpha: number,
        lifetime: number = Number.MAX_VALUE,
        public size: { x: number, y: number },
    ) {
        super(pos, dir, color, speed, alpha, lifetime);
        const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
        if (!canvas)
            return;
        const realWidth = 20;
        const realHeight = 10;
        const scaleX = canvas.width / realWidth;
        const scaleY = canvas.height / realHeight;
        this.size.x *= scaleX;
        this.size.y *= scaleY;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        ctx.fillStyle = `hsla(${this.color}, 89%, 55%, ${this.alpha})`;
        ctx.fill();
        ctx.restore();
    }
}

class RectangleColorFlash extends RectangleParticle {
    constructor(
        pos: { x: number, y: number },
        dir: { x: number, y: number },
        color: string,
        speed: number,
        alpha: number,
        lifetime: number = Number.MAX_VALUE,
        size: { x: number, y: number },
        public rate: number = 1 / 30,
    ) {
        super(pos, dir, color, speed, alpha, lifetime, size);
    }

    move()  {
        super.move();
        this.alpha -= this.rate;
        if (this.alpha < 0)
            this.alive = false;
    }
}

class CircleParticle extends Particle {
    constructor(
        pos: { x: number, y: number },
        dir: { x: number, y: number },
        public radius: number,
        color: string,
        speed: number,
        alpha: number = 0.5,
        lifetime: number = Number.MAX_VALUE,
    ) {
        super(pos, dir, color, speed, alpha, lifetime)
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.color}, 89%, 55%, ${this.alpha})`;
        ctx.fill();
        ctx.restore();
    }
}

let pongInfo: PongInfo = new PongInfo();

const MAX_PARTICLES = 600

function drawAllParticles(ctx: CanvasRenderingContext2D) {
    console.log(pongInfo.particles.length);
    if (pongInfo.particles.length > MAX_PARTICLES)
        pongInfo.particles.splice(0, pongInfo.particles.length - MAX_PARTICLES);
    pongInfo.particles.forEach((p: Particle) => {
        p.draw(ctx);
        p.move();
    });
    pongInfo.particles = pongInfo.particles.filter((p) => { return p.alive; });
}

export function handlePaddleReflect(ballPos: { x: number, y: number }, ballDir: { x: number, y: number }) {
    let dir;
    let color;
    if (ballPos.x < 0) {
        dir = 1;
        color = leftPaddleColor[2];
    } else {
        dir = -1;
        color = rightPaddleColor[2];
    }
    for (let i = 0; i < 50; i++) {
        const angle = Math.PI / 2 * Math.random() - Math.PI / 4;
        pongInfo.particles.push(new CircleParticle(
            { x: ballPos.x + 10 + (Math.random() - 0.5) * 0.1, y: ballPos.y + 5 + (Math.random() - 0.5) * 0.5 }, // pos
            { x: dir * Math.cos(angle), y: Math.sin(angle) }, // dir
            2 + 80 * Math.random(), // radius
            color, // color
            0.5 + 19.5 * Math.random(), // speed
            0.1, // alpha
            4 * 60, // LIFETIME
        ));
	    pongInfo.particles.push(new CircleParticle(
            { x: ballPos.x + 10 + (Math.random() - 0.5) * 0.5, y: ballPos.y + 5 + (Math.random() - 0.5) * 0.1 }, // pos
            { x: dir * Math.cos(angle), y: Math.sin(angle) }, // dir
            2 + 8 * Math.random(), // radius
            color.toString(), // color
            5 + 15 * Math.random(), // speed
            0.9, // alpha
            2 * 60, // LIFETIME
        ));
    }

    const size = 0.15;
    pongInfo.particles.push(
        new RectangleColorFlash(
            { x: (ballPos.x < 0 ? -size : 20 + size), y: 0 }, // pos
            ( ballPos.x < 0 ? { x: 1, y: 0 } : { x: -1, y: 0 }), // dir
            color, // color
            12, // speed
            1, // alpha
            300, // lifetime
            { x: size, y: 11 }, // size
            // 1, // rate
        )
    );

    pongInfo.particles.push(
        new RectangleColorFlash(
            {x: 0, y: 0}, // pos
            {x: 0, y: 0}, // dir
            color.toString(), // color
            0, // speed
            0.2, // alpha
            120, // lifetime
            { x: 20, y: 10 }, // size
        )
    );
}

export function handleWallReflect(ballPos: { x: number, y: number }, ballDir: { x: number, y: number }) {
    const color = mapRange(ballPos.x, -8, 8, 190, 356);
    let dir = 1;
    if (ballPos.y < 0)
        dir = -1;
    for (let i = 0; i < 50; i++) {
        const angle = Math.PI / 2 * Math.random() - Math.PI * 3 / 4;
        pongInfo.particles.push(new CircleParticle(
            { x: ballPos.x + 10 + (Math.random() - 0.5) * 0.5, y: ballPos.y + 5 + (Math.random() - 0.5) * 0.1 }, // pos
            { x: Math.cos(angle), y: dir * Math.sin(angle) }, // dir
            2 + 80 * Math.random(), // radius
            color.toString(), // color
            0.5 + 19.5 * Math.random(), // speed
            0.1, // alpha
            4 * 60, // LIFETIME
        ));
        pongInfo.particles.push(new CircleParticle(
            { x: ballPos.x + 10 + (Math.random() - 0.5) * 0.5, y: ballPos.y + 5 + (Math.random() - 0.5) * 0.1 }, // pos
            { x: Math.cos(angle), y: dir * Math.sin(angle) }, // dir
            2 + 8 * Math.random(), // radius
            color.toString(), // color
            5 + 15 * Math.random(), // speed
            0.9, // alpha
            2 * 60, // LIFETIME
        ));
    }

    const size = 0.15;
    pongInfo.particles.push(
        new RectangleColorFlash(
            { x: 0, y: ballPos.y + 5 }, // pos
            ( ballPos.y < 0 ? { x: 0, y: 1 } : { x: 0, y: -1 }), // dir
            color.toString(), // color
            7, // speed
            1, // alpha
            120, // lifetime
            { x: 20, y: size }, // size
            // 1 // rate
        )
    );
}

function ballTrail(ballPos: { x: number, y: number }, ballSize: number) {
    const color = mapRange(ballPos.x, -8, 8, 190, 356);
    pongInfo.particles.push(
        new CircleParticle(
            { x: ballPos.x + 10, y: ballPos.y + 5 },
            { x: 0, y: 0 }, // dir
            ballSize,
            color.toString(), // color
            0, // speed
            0.5, // alpha
            15, // lifetime
        )
    );
}

const paddleGlowCache: Map<string, any> = new Map<string, any>();
function drawGlowingPaddle(
    ctx: CanvasRenderingContext2D,
    paddle: { x: number; y: number },
    color: string[], // [ paddleFill, paddleBorder ]
    scaleX: number,
    scaleY: number,
    offsetX: number,
    offsetY: number,
    paddleWidth: number,
    paddleHeight: number
) {
    // Create the cached glow version if it doesn't exist yet
    if (!paddleGlowCache.has(color[0])) {
        const glowPadding = 20; // Space for the glow around the paddle
        const offscreen = document.createElement("canvas")!;
        offscreen.width = paddleWidth + glowPadding * 2;
        offscreen.height = paddleHeight + glowPadding * 2;

        const glowCtx = offscreen.getContext("2d")!;

        // Draw the glowing paddle ONCE
        glowCtx.shadowColor = color[0];
        glowCtx.beginPath();
        glowCtx.shadowColor = color[0];
        glowCtx.shadowBlur = 12;
        glowCtx.fillStyle = color[0];
        glowCtx.roundRect(glowPadding, glowPadding, paddleWidth, paddleHeight, 12);
        glowCtx.fill();
        glowCtx.strokeStyle = color[1];
        glowCtx.lineWidth = 2;
        glowCtx.stroke();

        // Save to cache
        paddleGlowCache.set(color[0], offscreen);
    }

    const glowCanvas = paddleGlowCache.get(color[0]);

    // Draw the pre-rendered glowing paddle to the main canvas
    ctx.drawImage(
        glowCanvas,
        paddle.x * scaleX + offsetX - 20,
        paddle.y * scaleY + offsetY - 20
    );
}

function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.min(outMax, Math.max(outMin, mapped));
}


export function drawPong(state: any) {
    if (pongInfo.frames >= 60)
        pongInfo.frames = 0;
    const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
    const startBtn = document.getElementById("pong-wrapper") as HTMLButtonElement;
    startBtn.style.display = "none";
    canvas.style.display = "block";
    if (!canvas)
        return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    const realWidth = 20;
    const realHeight = 10;

    const scaleX = canvas.width / realWidth;
    const scaleY = canvas.height / realHeight;

    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowColor = "#c8c8c8";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(
        offsetX - (realWidth / 2) * scaleX,
        offsetY - (realHeight / 2) * scaleY,
        realWidth * scaleX,
        realHeight * scaleY
    );
    ctx.shadowBlur = 0;

    const ballRadius = 0.15 * Math.min(scaleX, scaleY);
    const ballX = state.ballPos.x * scaleX + offsetX;
    const ballY = state.ballPos.y * scaleY + offsetY;

	ballTrail(state.ballPos, ballRadius);
    drawAllParticles(ctx);

    ctx.save();
    const ballColor = `hsl(${mapRange(state.ballPos.x, state.leftPaddle.x + 0.5, state.rightPaddle.x, 190, 356)}, 89%, 35%)`;
    ctx.shadowColor = ballColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    const paddleWidth = 0.5 * scaleX;
    const paddleHeight = 2 * scaleY;

    drawGlowingPaddle(
        ctx,
        state.leftPaddle,
        leftPaddleColor,
        scaleX,
        scaleY,
        offsetX,
        offsetY,
        paddleWidth,
        paddleHeight
    );

    drawGlowingPaddle(
        ctx,
        state.rightPaddle,
        rightPaddleColor,
        scaleX,
        scaleY,
        offsetX,
        offsetY,
        paddleWidth,
        paddleHeight
    );


    ctx.fillStyle = "#ffffff";
    ctx.font = "20px 'Public Pixel'";
    ctx.shadowColor = "#c8c8c8";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.fillText(`${state.usernameLeftTeam}`, canvas.width / 5, 40);
    ctx.fillText(`${state.usernameRightTeam}`, canvas.width - canvas.width / 5, 40);
    ctx.shadowBlur = 20;

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffe96c";
    ctx.shadowBlur = 20;
    ctx.font = "16px 'Public Pixel'";
    ctx.textAlign = "left";

    if (state.state === "idling") {
        console.log("wait a minute")
        const idlingStr = `GAME PAUSED - WAITING FOR OPPONENT`;
        ctx.fillText(idlingStr, offsetX - idlingStr.length / 2 * 16 - 8, 70);
        pongInfo.particles = [];
    }
    else if (state.state === "resume") {
        const resumeStr = `GAME RESUMING IN ${state.resumeTimer}`;
        ctx.fillText(resumeStr, offsetX - resumeStr.length / 2 * 16 - 8, 70);
        pongInfo.particles = [];
    }
    else if (state.state === "scored") {
        ctx.shadowColor = "rgba(255,255,255,0.5)";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "300px 'Public Pixel'";
        ctx.textAlign = "center";
        ctx.fillText(`${state.leftScore}  ${state.rightScore}`, offsetX, offsetY + 125);
    }
    ctx.shadowBlur = 0;
}

export function clearPong() {
	pongInfo.particles = [];
	pongInfo.frames = 0;
}
