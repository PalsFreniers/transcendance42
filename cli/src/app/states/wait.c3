module app::states::wait;
import std::collections::object;
import window;
import app;
import termbox;

import app::state;
import app::button;

struct Wait (State) {
	Button start;
	bool showStart;
	App* handle;
}

Wait instance;

fn void Wait.init(&self, App* handle) @dynamic {
	self.handle = handle;
	Window* w = handle.getWindow();
	self.start = button::new("Start", {w.width() / 2 - 3, w.height() / 2 + 5 * win::CHAR_HEIGHT}, &onStartClicked);
	handle.getSocketIO().on("player-joined", fn void(Object* obj) {
		instance.handle.resetScreen();
		Window* w = instance.handle.getWindow();
		String lobby = "Lobby: ".concat(mem, obj.get_string("lobbyName")!!);
		defer lobby.free(mem);
		w.putStr(lobby, {w.width() / 2 - lobby.len / 2, w.height() / 2 - win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
		String p1 = obj.get_string("playerOne")!!.concat(mem, " Vs ");
		defer p1.free(mem);
		String p2 = p1.concat(mem, obj.get_string("playerTwo")!!);
		defer p2.free(mem);
		w.putStr(p2, {w.width() / 2 - p2.len / 2, w.height() / 2 + win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
		if(instance.showStart) instance.activateStart();
	});
	handle.getSocketIO().on("room-created", fn void(Object* obj) {
		instance.handle.resetScreen();
		Window* w = instance.handle.getWindow();
		String lobby = "Lobby: ".concat(mem, obj.get_string("lobbyName")!!);
		defer lobby.free(mem);
		w.putStr(lobby, {w.width() / 2 - lobby.len / 2, w.height() / 2 - win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
		String p1 = obj.get_string("userName")!!.concat(mem, " Vs ");
		defer p1.free(mem);
		Object* p2name = obj.get("playerTwo")!!;
		String p2 = p1.concat(mem, p2name.is_null() ? "The Wind" : obj.get_string("playerTwo")!!);
		defer p2.free(mem);
		w.putStr(p2, {w.width() / 2 - p2.len / 2, w.height() / 2 + win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
		instance.activateStart();
	});
}

fn void Wait.load(&self, App* handle) @dynamic {
	handle.getWindow().onMouse(&onMouseClicked);
}

fn void Wait.unload(&self, App* handle) @dynamic {
	handle.getWindow().delMouse(&onMouseClicked);
}

bool release;

fn void onMouseClicked(Mouse m) {
	if(!instance.showStart) return;
	if(m == KeyCode.MOUSE_RELEASE) {
		release = true;
		return;
	}
	if(!release) return;
	if(m != KeyCode.MOUSE_LEFT) return;
	Rect mouseRect = (Rect) {m.pos * {win::CHAR_WIDTH, win::CHAR_HEIGHT}, 1, 1};
	if(((Box)&instance.start).collide(&mouseRect)) {
		instance.start.onClick(m);
	}
	release = false;
}

fn void onStartClicked(Mouse m) {
	instance.handle.getSocketIO().emit("start-game");
}

fn void Wait.activateStart(&self) {
	self.start.draw(self.handle.getWindow());
	instance.showStart = true;
}
