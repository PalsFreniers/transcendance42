module app::states::tfa;
import std::collections::object;
import std::encoding::json;
import app;
import window;
import termbox;
import curl;

import app::state;
import app::button;
import app::textbox;
import app::api::json;
import app::api::socketio;

struct Tfa (State) {
	TextBox tfa;
	Button submit;
	Button back;
	Object* obj;
	App* handle;
}

Tfa instance;

enum Positions : const inline int {
	TFA = 0,
	SUBMIT = 1,
	BACK = 2,
}

enum Names : const inline String {
	TFA = "2fa",
	SUBMIT = "Submit",
	BACK = "<-",
}

fn void Tfa.init(&self, App* handle) @dynamic {
	self.handle = handle;
	Window* w = handle.getWindow();
	int[<2>][] positions = {
		{ w.width() / 2 - textbox::LEN_2, w.height() / 2 - textbox::HEIGHT_2 },
		{ w.width() / 2 - Names.SUBMIT.len / 2, w.height() / 2 - button::HEIGHT_2  + w.height() / 4},
		{ 2 * win::CHAR_WIDTH, 3 * win::CHAR_HEIGHT },
	};
	self.tfa = textbox::new(Names.TFA, positions[Positions.TFA]);
	self.submit = button::new(Names.SUBMIT, positions[Positions.SUBMIT], &onSubmitClicked);
	self.back = button::new(Names.BACK, positions[Positions.BACK], &onBackClicked);
}

fn void Tfa.load(&self, App* handle) @dynamic {
	self.handle = handle;
	handle.getWindow().onMouse(&onMouseClicked);
	handle.getWindow().onUpdate(&updateTfa);
	handle.getWindow().onKey(&onKeyTextBox);
	self.submit.draw(handle.getWindow());
	self.back.draw(handle.getWindow());
	self.obj = handle.popTmp();
}

fn void Tfa.unload(&self, App* handle) @dynamic {
	handle.getWindow().delMouse(&onMouseClicked);
	handle.getWindow().delUpdate(&updateTfa);
	handle.getWindow().delKey(&onKeyTextBox);
	if(self.obj != null) self.obj.free();
}

fn String makeJSONTokPong(String token) {
	JSONObj obj = json::new();
	obj.setVal("token", token);
	return obj.end();
}

fn Curl* getPongSocket() {
	Curl* ret = curl::easy_init();
	win::_log.debug("serverAddress: %s", api::SOCKET);
	Slist* headers = null;
	defer curl::slist_free_all(headers);
	headers = curl::slist_append(headers, "Upgrade: websocket");
	headers = curl::slist_append(headers, "Accept: */*");
	curl::easy_setopt(ret, curl::CURLOPT_URL, api::SOCKET);
	curl::easy_setopt(ret, curl::CURLOPT_CONNECT_ONLY, (long)2);
	curl::easy_setopt(ret, curl::CURLOPT_SSL_VERIFYPEER, 0);
	CURLcode code = curl::easy_perform(ret);
	if(code != CURLcode.E_OK) {
		win::_log.error("curl error: %s", ((ZString)curl::easy_strerror(code)).str_view());
		return null;
	}
	return ret;
}

fn bool socketIOHandshake(Curl* socket) {
	String token = app::instance.getSecret();
	defer token.free(mem);
	String jsTok = makeJSONTokPong(token);
	defer jsTok.free(mem);
	String auth = "40".concat(mem, jsTok);
	defer auth.free(mem);
	CURLcode code = api::sendWSpayload(socket, auth);
	if(code != CURLcode.E_OK) {
		win::_log.error("curl error: %s", ((ZString)curl::easy_strerror(code)).str_view());
		return false;
	}
	win::_log.info("sent token to socketIO server");
	String res;
	defer res.free(mem);
	api::recvWSpayload(socket, &res);
	api::recvWSpayload(socket, &res);
	win::_log.info("websocket connected recived message: %s", res);
	instance.handle.setSocketIO(io::new(socket));
	return true;
}

fn String genVerifyJson(int id, String name, String code) {
	JSONObj obj = json::new();
	obj.setVal("userId", id);
	obj.next();
	obj.setVal("username", name);
	obj.next();
	obj.setVal("otp", code);
	return obj.end();
}

fn bool setupSocketIO() {
	Curl* skt = getPongSocket();
	if(skt == null) {
		win::_log.error("unable to create socket");
		instance.handle.getWindow().quit();
		return false;
	}
	if(!socketIOHandshake(skt)) {
		win::_log.error("unable to initiate socketIO handshake");
		instance.handle.getWindow().quit();
		return false;
	}
	DString d = dstring::new(mem);
	defer d.free();
	d.appendf("%d", instance.handle.getID());
	String s = d.str_view().copy(mem);
	instance.handle.getSocketIO().emit("register-socket", s);
	return true;
}

fn void onSubmitClicked(Mouse m) {
	String codeOtp = instance.tfa.getValue();
	defer codeOtp.free(mem);
	String? msg = instance.obj.get_string("message");
	if(catch msg) {
		win::_log.error("tfa check failed: %s", instance.obj.get_string("error")!!);
		return;
	}
	instance.handle.setID(instance.obj.get_int("userId")!!);
	String jsonVerify = genVerifyJson(instance.handle.getID(), instance.obj.get_string("username")!!, codeOtp);
	defer jsonVerify.free(mem);
	win::_log.info("sending otp code infos: %s", jsonVerify);
	Object* res;
	defer res.free();
	if(!api::curlPost(instance.handle, &res, api::VERIFY_EP, jsonVerify)) return;
	String token = res.get_string("token")!!.copy(mem);
	win::_log.info("user connected with token: %s", token);
	instance.handle.saveSecret(token);
	if(!setupSocketIO()) return;
	instance.handle.changeState(States.MENU);
}

fn void onKeyTextBox(Key k) {
	instance.tfa.onKey(k);
}

fn void onBackClicked(Mouse m) {
	instance.handle.changeState(States.LOGIN);
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
	if(((Box)&instance.submit).collide(&mouseRect)) {
		instance.submit.onClick(m);
	} else if (((Box)&instance.back).collide(&mouseRect)) {
		instance.back.onClick(m);
	}
	release = false;
}

fn void updateTfa() {
	Window* w = instance.handle.getWindow();
	if(instance.tfa.isDirty()) instance.tfa.draw(w);
}
