module app::states::game;
import std::collections::object;
import window;
import app;
import termbox;
import std::thread;

import app::state;
import app::button;

const LOGICAL_WIDTH = 20;
const LOGICAL_HEIGHT = 10;

struct Game (State) {
	App* handle;
	double[<2>] scale;
	double[<2>] offset;
	bool up;
	bool down;
}

Game instance;

fn void Game.init(&self, App* handle) @dynamic {
	self.handle = handle;
	self.offset = ((double[<2>])handle.getWindow().dim() - (double[<2>]){win::CHAR_WIDTH, win::CHAR_HEIGHT} * 2) / 2.0 + (double[<2>]){win::CHAR_WIDTH, win::CHAR_HEIGHT};
	self.scale = self.offset * 2.0 / (double[<2>]){LOGICAL_WIDTH, LOGICAL_HEIGHT};
}

fn void Game.load(&self, App* handle) @dynamic {
	self.up = false;
	self.down = false;
	drawBoard(handle.popTmp());
	handle.getSocketIO().on("game-end", fn void(Object* obj) {
		instance.handle.pushTmp(obj);
		instance.handle.changeState(States.MENU); // TODO: change to endGameState instead
	});
	handle.getSocketIO().on("game-state", &drawBoard);
	handle.getWindow().onKey(&onKey);
	handle.unsetNeedQuit();
	win::_log.info("Game started");
}

fn void Game.unload(&self, App* handle) @dynamic {
	handle.getSocketIO().on("game-state", fn void(Object* obj) {
		instance.handle.pushTmp(obj);
		instance.handle.changeState(States.GAME);
	});
	handle.getSocketIO().del("game-end");
	handle.getWindow().delKey(&onKey);
}

fn int mapValue(double t, double minA, double maxA, double minB, double maxB) {
	double mapped = ((t - minA) * (maxB - minB)) / (maxA - minA) + minB;
	return (int)$$min(maxB, $$max(minB, mapped));
}

fn Color hsl2rgb(double h, double s, double l) {
	double r;
	double g;
	double b;
	if(s == 0) {
		r = l;
		g = l;
		b = l;
	} else {
		double q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
		double p = 2 * l - q;
		r = hue2RGB(p, q, h + 1.0/3.0);
		g = hue2RGB(p, q, h);
		b = hue2RGB(p, q, h - 1.0/3.0);
	}
	return (Color) ((double[<3>]){r, g, b} * 255);
}

fn double hue2RGB(double p, double q, double t) {
	if (t < 0.0) t += 1.0;
	if (t > 1.0) t -= 1.0;
	if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
	if (t < 1.0/2.0) return q;
	if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
	return p;
}

fn void drawBoard(Object* obj) {
	defer obj.free();
	Window* w = instance.handle.getWindow();
	instance.handle.resetScreen();
	Object* ballPosObj = obj.get("ballPos")!!;
	double[<2>] bPos = (double[<2>]){ballPosObj.get_float("x")!!, ballPosObj.get_float("y")!!};
	double[<2>] ballPos = bPos * instance.scale + instance.offset;
	double valHue = mapValue(bPos.x, -8, 8, 190, 356);
	Color c = hsl2rgb(valHue / 360.0, 0.89, 0.55);
	w.putPixel((int[<2>])ballPos, c);
	double[<2>] paddleSize = (double[<2>]){0.5, 2} * instance.scale;
	Object* paddleRightObj = obj.get("rightPaddle")!!;
	double[<2>] paddleRight = (double[<2>]){paddleRightObj.get_float("x")!!, paddleRightObj.get_float("y")!!} * instance.scale + instance.offset;
	w.putRect((int[<2>])paddleRight, (int[<2>])paddleSize, {0xf2, 0x24, 0x32});
	Object* paddleLeftObj = obj.get("leftPaddle")!!;
	double[<2>] paddleLeft = (double[<2>]){paddleLeftObj.get_float("x")!!, paddleLeftObj.get_float("y")!!} * instance.scale + instance.offset;
	w.putRect((int[<2>])paddleLeft, (int[<2>])paddleSize, {0x24, 0xd0, 0xf2});
	DString score = dstring::new(mem);
	defer score.free();
	Object* unameL = obj.get("usernameLeftTeam")!!;
	Object* unameR = obj.get("usernameRightTeam")!!;
	String unameLS = "No one";
	if(!unameL.is_null()) unameLS = obj.get_string("usernameLeftTeam")!!;
	String unameRS = "No one";
	if(!unameR.is_null()) unameRS = obj.get_string("usernameRightTeam")!!;
	score.appendf("%s %d - %d %s",
		unameLS,
		obj.get_int("leftScore")!!,
		obj.get_int("rightScore")!!,
		unameRS
	);
	String s = score.str_view();
	w.putStr(s, {w.width() / 2 - s.len / 2, 1 * win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
	String state = obj.get_string("state")!!;
	if(state == "idling") {
		w.putStr("PAUSED", {w.width() / 2 - 3 * win::CHAR_WIDTH, 2 * win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
		instance.up = false;
		instance.down = false;
	} else if(state == "resume") {
		score.clear();
		score.appendf("Resuming in %d", obj.get_int("resumeTimer")!!);
		s = score.str_view();
		w.putStr(s, {w.width() / 2 - s.len / 2, 2 * win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
		instance.up = false;
		instance.down = false;
	}
}

fn void onKey(Key k) {
	switch(k.code) {
		case KeyCode.ARROW_UP:
			if(instance.up) return;
			if(instance.down) {
				instance.handle.getSocketIO().emit("input", "{\"key\":\"down\",\"action\":\"keyup\"}");
				instance.down = false;
			}
			instance.handle.getSocketIO().emit("input", "{\"key\":\"up\",\"action\":\"keydown\"}");
			instance.up = true;
		case KeyCode.ARROW_DOWN:
			if(instance.down) return;
			if(instance.up) {
				instance.handle.getSocketIO().emit("input", "{\"key\":\"up\",\"action\":\"keyup\"}");
				instance.up = false;
			}
			instance.handle.getSocketIO().emit("input", "{\"key\":\"down\",\"action\":\"keydown\"}");
			instance.down = true;
		case KeyCode.SPACE:
			if(instance.up) {
				instance.handle.getSocketIO().emit("input", "{\"key\":\"up\",\"action\":\"keyup\"}");
				instance.up = false;
			} else if(instance.down) {
				instance.handle.getSocketIO().emit("input", "{\"key\":\"down\",\"action\":\"keyup\"}");
				instance.down = false;
			}
		default:
	}
}
