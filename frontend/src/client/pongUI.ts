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
    constructor(
        public particles: Particle[],
        public frames: number,
    ) {}
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

class ColorFlash extends RectangleParticle {
    constructor(
        pos: { x: number, y: number },
        dir: { x: number, y: number },
        color: string,
        speed: number,
        alpha: number,
        lifetime: number = Number.MAX_VALUE,
        size: { x: number, y: number }
    ) {
        super(pos, dir, color, speed, alpha, lifetime, size);
    }

    move() {
        super.move();
        this.alpha -= 1 / 10;
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

let allGames: Map<string, PongInfo> = new Map();

function drawAllParticles(game: string, ctx: CanvasRenderingContext2D) {
    if (!allGames.has(game))
        return ;
    allGames.get(game)!.particles.forEach((p: Particle) => {
        p.draw(ctx);
        p.move();
    });
    allGames.get(game)!.particles = allGames.get(game)!.particles.filter((p) => { return p.alive; });
}

export function handlePaddleReflect(game: string, x: number, y: number) {
    if (!allGames.has(game))
        return ;
    let dir;
    let color;
    if (x < 0) {
        dir = 1;
        color = leftPaddleColor[2];
    } else {
        dir = -1;
        color = rightPaddleColor[2];
    }
    for (let i = 0; i < 50; i++) {
        const angle = Math.PI / 2 * Math.random() - Math.PI / 4;
        allGames.get(game)!.particles.push(new CircleParticle(
            { x: x + 10 + (Math.random() - 0.5) * 0.1, y: y + 5 + (Math.random() - 0.5) * 0.5 }, // pos
            { x: dir * Math.cos(angle), y: Math.sin(angle) }, // dir
            2 + 8 * Math.random(), // radius
            color, // color
            6 + 14 * Math.random(), // speed
            0.9, // alpha
            2.5 * 60, // LIFETIME
        ));
    }

    const size = 0.4;
    allGames.get(game)!.particles.push(
        new ColorFlash(
            { x: (x < 0 ? -size : 20 + size), y: 0 }, // pos
            ( x < 0 ? { x: 1, y: 0 } : { x: -1, y: 0 }), // dir
            color, // color
            12, // speed
            1, // alpha
            300, // lifetime
            { x: size, y: 11 } // size
        )
    );

    allGames.get(game)!.particles.push(
        new ColorFlash(
            {x: 0, y: 0}, // pos
            {x: 0, y: 0}, // dir
            color,
            0, // speed
            0.5, // alpha
            120, // lifetime
            { x: 20, y: 10 }, // size
        )
    );
}

export function handleWallReflect(game: string, x: number, y: number) {
    if (!allGames.has(game))
        return ;
    const color = mapRange(x, -8, 8, 190, 356);
    let dir;
    if (y < 0)
        dir = -1;
    else
        dir = 1;
    for (let i = 0; i < 50; i++) {
        const angle = Math.PI / 2 * Math.random() - Math.PI * 3 / 4;
        allGames.get(game)!.particles.push(new CircleParticle(
            { x: x + 10 + (Math.random() - 0.5) * 0.5, y: y + 5 + (Math.random() - 0.5) * 0.1 }, // pos
            { x: Math.cos(angle), y: dir * Math.sin(angle) }, // dir
            2 + 8 * Math.random(), // radius
            color, // color
            6 + 10 * Math.random(), // speed
            0.9, // alpha
            2.5 * 60, // LIFETIME
        ));
    }

    const size = 0.4;
    allGames.get(game)!.particles.push(
        new ColorFlash(
            { x: 0, y: y + 5 }, // pos
            ( y < 0 ? { x: 0, y: 1 } : { x: 0, y: -1 }), // dir
            color, // color
            7, // speed
            1, // alpha
            120, // lifetime
            { x: 20, y: size } // size
        )
    );

    allGames.get(game)!.particles.push(
        new ColorFlash(
            {x: 0, y: 0}, // pos
            {x: 0, y: 0}, // dir
            color,
            0, // speed
            0.5, // alpha
            120, // lifetime
            { x: 20, y: 10 }, // size
        )
    );
}

function ballTrail(game: string, ballPos: { x: number, y: number }, ballSize: number) {
    if (!allGames.has(game))
        return ;
    const color = mapRange(ballPos.x, -8, 8, 190, 356);
    allGames.get(game)!.particles.push(
        new CircleParticle(
            { x: ballPos.x + 10, y: ballPos.y + 5 },
            { x: 0, y: 0 }, // dir
            ballSize,
            color,
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
    if (!allGames.has(state.name))
        allGames.set(state.name, new PongInfo([], 0));
    if (allGames.get(state.name)!.frames >= 60)
        allGames.get(state.name)!.frames = 0;
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

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(
        offsetX - (realWidth / 2) * scaleX,
        offsetY - (realHeight / 2) * scaleY,
        realWidth * scaleX,
        realHeight * scaleY
    );

    const ballRadius = 0.15 * Math.min(scaleX, scaleY);
    const ballX = state.ballPos.x * scaleX + offsetX;
    const ballY = state.ballPos.y * scaleY + offsetY;

    ballTrail(state.name, state.ballPos, ballRadius);
    drawAllParticles(state.name, ctx);

    ctx.save();
    const ballColor = `hsl(${mapRange(state.ballPos.x, state.leftPaddle.x + 0.5, state.rightPaddle.x, 190, 356)}, 89%, 55%)`;
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

    ctx.fillStyle = "#ffdd00";
    ctx.font = "20px 'Public Pixel'";
    ctx.textAlign = "center";
    ctx.fillText(`${state.leftScore} - ${state.rightScore}`, canvas.width / 2, 40);

    ctx.fillText(`${state.usernameLeftTeam}`, canvas.width / 5, 40);
    ctx.fillText(`${state.usernameRightTeam}`, canvas.width - canvas.width / 5, 40);

    ctx.fillStyle = "#ffdd00";
    ctx.font = "16px 'Public Pixel'";
    ctx.textAlign = "left";

    if (state.state === "idling") {
        ctx.fillText(`GAME PAUSED - WAITING FOR OPPONENT`, 25, 70);
        allGames.get(state.name)!.particles = [];
    }
    else if (state.state === "resume") {
        ctx.fillText(`GAME RESUMING IN ${state.resumeTimer}`, 150, 70);
        allGames.get(state.name)!.particles = [];
    }
    console.log(allGames.get(state.name)!.particles.length);
}

export function clearPong(name: string) {
    allGames.delete(name)
}
