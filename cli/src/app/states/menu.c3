module app::states::menu;
import std::collections::object;
import std::encoding::json;
import app;
import window;
import termbox;

import app::state;
import app::button;
import app::textbox;
import app::api::json;

struct Menu (State) {
	App* handle;
	Button join;
	Button create;
	TextBox gameName;
	TextBox* currText;
}

Menu instance;

enum Positions : const inline int {
	NAME = 0,
	JOIN = 1,
	CREATE = 2,
}

enum Names : const inline String {
	NAME = "Name",
	JOIN = "Join",
	CREATE = "Create",
}

fn void Menu.init(&self, App* handle) @dynamic {
	self.handle = handle;
	Window* w = handle.getWindow();
	int[<2>][] positions = {
		{ w.width() / 2 - textbox::LEN_2, w.height() / 2 - textbox::HEIGHT_2 - w.height() / 4 },
		{ w.width() / 2 - Names.JOIN.len / 2, w.height() / 2 - button::HEIGHT_2  + w.height() / 4},
		{ w.width() / 2 - Names.CREATE.len / 2, w.height() / 2 - textbox::HEIGHT_2 },
	};
	self.gameName = textbox::new(Names.NAME, positions[Positions.NAME]);
	self.join = button::new(Names.JOIN, positions[Positions.JOIN], &onJoinClicked);
	self.create = button::new(Names.CREATE, positions[Positions.CREATE], &onCreateClicked);
}

fn void Menu.load(&self, App* handle) @dynamic {
	handle.getWindow().onMouse(&onMouseClicked);
	handle.getWindow().onUpdate(&updateMenu);
	handle.getWindow().onKey(&onKeyTextBox);
	self.join.draw(handle.getWindow());
	self.create.draw(handle.getWindow());
}

fn void Menu.unload(&self, App* handle) @dynamic {
	handle.getWindow().delMouse(&onMouseClicked);
	handle.getWindow().delUpdate(&updateMenu);
	handle.getWindow().delKey(&onKeyTextBox);
}

fn String joinJSON(int gameid) {
	JSONObj obj = json::new();
	obj.setVal("gameId", gameid);
	return obj.end();
}

fn void onJoinClicked(Mouse m) {
	Window* w = instance.handle.getWindow();
	Object* res;
	defer res.free();
	if(!api::curlPostT(instance.handle, &res, api::FIND_EP, "{}")) return;
	Object* lobbies = res.get("lobbies")!!;
	if(lobbies.get_len() == 0) {
		win::_log.error("no lobbies available");
		api::errNotify(w, "no lobbies available");
		return;
	}
	Object* lobby = lobbies.get_at(0);
	int id = lobby.get_int("id")!!;
	String name = lobby.get_string("lobby_name")!!;
	String jsonJoin = joinJSON(id);
	defer jsonJoin.free(mem);
	if(!api::curlPostT(instance.handle, &res, api::JOIN_EP, jsonJoin)) return;
	if(!res.get_bool("success")!!) {
		String err = res.get_string("error")!!;
		win::_log.error("unable to join lobby: %s", err);
		api::errNotify(w, err);
		return;
	}
	instance.handle.getSocketIO().emit("join-room", jsonJoin);
	instance.handle.setNeedQuit();
	instance.handle.setLobbyObj(lobbyName);
	instance.handle.changeState(States.WAIT);
}

fn String createJSON(String gameName) {
	JSONObj obj = json::new();
	obj.setVal("lobbyName", gameName);
	return obj.end();
}

fn String createSockJSON(String gameName, int gameId) {
	JSONObj obj = json::new();
	obj.setVal("gameId", gameId);
	obj.next();
	obj.setVal("lobbyName", gameName);
	return obj.end();
}

fn void onCreateClicked(Mouse m) {
	Window* w = instance.handle.getWindow();
	String lobbyName = instance.gameName.getValue();
	defer lobbyName.free(mem);
	String jsonCreate = createJSON(lobbyName);
	defer jsonCreate.free(mem);
	Object* res;
	defer res.free();
	if(!api::curlPostT(instance.handle, &res, api::CREATE_EP, jsonCreate)) return;
	if(!res.get_bool("success")!!) {
		String err = res.get_string("error")!!;
		win::_log.error("unable to join lobby: %s", err);
		api::errNotify(w, err);
		return;
	}
	String jsonCreateSock = createSockJSON(lobbyName, res.get_int("gameId")!!);
	defer jsonCreateSock.free(mem);
	instance.handle.getSocketIO().emit("create-room", jsonCreateSock);
	instance.handle.setNeedQuit();
	instance.handle.setLobbyObj(lobbyName);
	instance.handle.changeState(States.WAIT);
}

fn void onKeyTextBox(Key k) {
	if(instance.currText == null) return;
	instance.currText.onKey(k);
}

bool release;

fn void onMouseClicked(Mouse m) {
	if(m == KeyCode.MOUSE_RELEASE) {
		release = true;
		return;
	}
	if(!release) return;
	if(m != KeyCode.MOUSE_LEFT) return;
	Rect mouseRect = (Rect) {m.pos * {win::CHAR_WIDTH, win::CHAR_HEIGHT}, 1, 1};
	if(((Box)&instance.gameName).collide(&mouseRect)) {
		instance.currText = &instance.gameName;
	} else {
		instance.currText = null;
	}
	if(((Box)&instance.join).collide(&mouseRect)) {
		instance.join.onClick(m);
	} else if(((Box)&instance.create).collide(&mouseRect)) {
		instance.create.onClick(m);
	}
	release = false;
}

fn void updateMenu() {
	Window* w = instance.handle.getWindow();
	if(instance.gameName.isDirty()) instance.gameName.draw(w);
}
