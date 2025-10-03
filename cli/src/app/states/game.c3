module app::states::game;
import std::collections::object;
import window;
import app;

import app::state;
import app::button;

struct Game (State) {
	App* handle;
}

Game instance;

fn void Game.init(&self, App* handle) @dynamic {
	self.handle = handle;
}

fn void Game.load(&self, App* handle) @dynamic {
	handle.getSocketIO().on("game-state", fn void(Object* obj) {
		Game.currObj();
	});
}

fn void Game.unload(&self, App* handle) @dynamic {

}
