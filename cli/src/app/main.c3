module app;
import window;
import termbox;
import curl;
import std::collections::object;

import app::border;
import app::state;
import app::api;

struct App {
	Curl* curlHandle;
	States currentState;
	Window w;
	Socket s;
	String secret;
	String lobbyName;
	bool needQuit;
	int userId;
	void*[] tmpMem;
	usz tmpMemP;
}

const TMPMEM_SIZE = 1024;

App instance;

macro App* getHandle() => &instance;
macro Window* App.getWindow(&self) => &(self.w);
macro Curl* App.getCurl(&self) => self.curlHandle;
macro void App.saveSecret(&self, String secret) => self.secret = secret;
macro String App.getSecret(&self) => self.secret.copy(mem);
macro void App.setID(&self, int id) => self.userId = id;
macro int App.getID(&self) => self.userId;
macro void App.setNeedQuit(&self) => self.needQuit = true;
macro bool App.needQuit(&self) => self.needQuit;
macro void App.setLobbyObj(&self, String name) {
	self.lobbyName.free(mem);
	JSONObj t = json::new();
	t.setVal("lobbyname", name);
	self.lobbyName = t.end();
}
macro String App.getLobbyObj(&self) => self.lobbyName;
macro void App.setSocketIO(&self, Socket s) {
	self.s.setHandle(s.handle);
	self.w.onUpdate(fn void() {
		getHandle().s.onUpdate();
	});
}
macro Socket* App.getSocketIO(&self) => &(self.s);

macro mainloop() => instance.w.mainloop();

macro App.pushTmp(&self, value) {
	if(self.tmpMem.len <= self.tmpMemP + 1) {
		win::_log.error("unable to push tmpValue to the stack way end up to corrupted memory");
		return;
	}
	self.tmpMem[self.tmpMemP++] = value;
}

macro App.popTmp(&self) {
	if(self.tmpMemP - 1 < 0) {
		win::_log.error("unable to pop tmpValue to the stack way end up to corrupted memory");
		return null;
	}
	return self.tmpMem[--self.tmpMemP];
}

fn void App.changeState(&self, States state, bool unload = true, bool force = false) {
	if(!force && self.currentState == state) return;
	if(unload) state::STATES[self.currentState].unload(getHandle());
	self.currentState = state;
	self.resetScreen();
	state::STATES[self.currentState].load(getHandle());
}

fn void init() {
	instance.w = win::new();
	instance.w.onKey(fn void(Key k) {
		if(k == KeyCode.ESC) {
			instance.w.quit();
		}
	});
	instance.curlHandle = curl::easy_init();
	foreach(s: state::STATES) {
		s.init(getHandle());
	}
	instance.tmpMem = mem::new_array(void*, TMPMEM_SIZE);
	instance.getSocketIO().on("error", fn void(Object* obj) => win::_log.error("pongSocket error: %s", *obj));
	instance.getSocketIO().on("game-state", fn void(Object* obj) {
		instance.pushTmp(obj);
		instance.changeState(States.GAME);
	});
	instance.getSocketIO().on("in-game", fn void(Object* obj) => instance.changeState(States.MENU));
	instance.changeState(States.LOGIN, unload: false, force: true);	
	instance.getWindow().onQuit(fn void() => if(instance.needQuit()) instance.getSocketIO().emit("left-game", instance.getLobbyObj()));
}

fn void cleanup() {
	state::STATES[instance.currentState].unload(&instance);
	instance.secret.free(mem);
	curl::easy_cleanup(instance.curlHandle);
	instance.s.free();
	instance.getLobbyObj().free(mem);
	mem::free(instance.tmpMem);
}

fn void App.resetScreen(&self) {
	self.w.clear(win::BLACK);
	border::drawScreen(self.getWindow());
}

faultdef CURL_INIT_ERROR;

fn void initCurl() @init {
	if(curl::global_init() != CURLcode.E_OK) return (CURL_INIT_ERROR?)!!;
}

fn void finiCurl() @finalizer {
	curl::global_cleanup();
}
