module app::states::login;
import std::encoding::json;
import std::collections::object;
import window;
import termbox;
import curl;

import app::state;
import app::textbox;
import app::button;
import app::box;
import app::api;
import app::api::json;

struct Login (State) {
	TextBox login;
	TextBox password;
	TextBox* currTextBox;
	Button submit;
	App* handle;
}

Login instance;

enum Positions : const inline int @local {
	LOGIN = 0,
	PASSWORD = 1,
	SUBMIT = 2,
}

enum Names: const inline String @local {
	LOGIN = "Login",
	PASSWORD = "Password",
	SUBMIT = "Submit",
}

fn void Login.init(&self, App* handle) @dynamic {
	Window* w = handle.getWindow();
	int[<2>][] positions = {
		{ w.width() / 2 - textbox::LEN_2, w.height() / 2 - textbox::HEIGHT_2 - w.height() / 4 },
		{ w.width() / 2 - textbox::LEN_2, w.height() / 2 - textbox::HEIGHT_2 },
		{ w.width() / 2 - Names.SUBMIT.len / 2, w.height() / 2 - button::HEIGHT_2  + w.height() / 4},
	};
	self.login = textbox::new(Names.LOGIN, positions[Positions.LOGIN]);
	self.password = textbox::new(Names.PASSWORD, positions[Positions.PASSWORD], hide: true);
	self.submit = button::new(Names.SUBMIT, positions[Positions.SUBMIT], &onSubmitPressed);
	self.handle = handle;
}

fn void Login.load(&self, App* handle) @dynamic {
	Window* w = handle.getWindow();
	self.submit.draw(w);
	w.onKey(&onKeyTextBox);
	w.onMouse(&onMouseLoginTextBox);
	w.onUpdate(&updateLoginTextBox);
	self.login.reload();
	self.password.reload();
}

fn void Login.unload(&self, App* handle) @dynamic {
	Window* w = handle.getWindow();
	self.currTextBox = null;
	w.delKey(&onKeyTextBox);
	w.delMouse(&onMouseLoginTextBox);
	self.login.clean();
	self.password.clean();
}

fn String makeJSONLogin(String login, String pass) {
	JSONObj obj = json::new();
	obj.setVal("username", login);
	obj.next();
	obj.setVal("password", pass);
	obj.next();
	obj.setVal("twofaCheckBox", true);
	return obj.end();
}

fn void onSubmitPressed(Mouse m) {
	MemChunk loginResponse;
	defer mem::free((char[])loginResponse);
	String logn = instance.login.getValue();
	defer logn.free(mem);
	String pass = instance.password.getValue();
	defer pass.free(mem);
	String post = makeJSONLogin(logn, pass);
	defer post.free(mem);
	win::_log.info("sending post msg: %s", post);
	Object* res;
	if(!api::curlPost(instance.handle, &res, api::LOGIN_EP, post)) return;
	instance.handle.pushTmp(res);
	instance.handle.changeState(States.TFA);
}

fn void onKeyTextBox(Key k) {
	if(instance.currTextBox == null) return;
	instance.currTextBox.onKey(k);
}

bool release = true;

fn void onMouseLoginTextBox(Mouse m) {
	if(m == KeyCode.MOUSE_RELEASE) {
		release = true;
		return;
	}
	if(!release) return;
	if(m != KeyCode.MOUSE_LEFT) return;
	Rect mouseRect = (Rect) {m.pos * {win::CHAR_WIDTH, win::CHAR_HEIGHT}, 1, 1};
	if(((Box)&instance.login).collide(&mouseRect)) {
		instance.currTextBox = &(instance.login);
	} else if(((Box)&instance.password).collide(&mouseRect)) {
		instance.currTextBox = &(instance.password);
	} else if(((Box)&instance.submit).collide(&mouseRect)) {
		instance.currTextBox = null;
		instance.submit.onClick(m);
	} else {
		instance.currTextBox = null;
	}
	release = false;
}

fn void updateLoginTextBox() {
	Window* w = instance.handle.getWindow();
	if(instance.login.isDirty()) instance.login.draw(w);
	if(instance.password.isDirty()) instance.password.draw(w);
}
