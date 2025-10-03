module app::api::socketio::io;
import std::collections::object;
import app::api::json;
import std::encoding::json;
import window;
import curl;

alias OnMessageCallbackF = fn void(Object*);

struct OnMessageCallback {
	String name;
	OnMessageCallbackF f;
}

const MAX_MESSAGE_CALLBACKS = 15;

struct Socket {
	Curl* handle;
	OnMessageCallback[MAX_MESSAGE_CALLBACKS] msgs;
}

macro Socket new(Curl* handle) => (Socket) {
	.handle = handle,
};

macro Socket.setHandle(&self, Curl* handle) => self.handle = handle;

fn void Socket.free(&self) {
	curl::easy_cleanup(self.handle);
}

fn void Socket.onUpdate(&self) {
	String res;
	defer res.free(mem);
	Ws_frame* meta;
	do {
		String tmp;
		CURLcode code = api::recvWSpayloadNoRetry(self.handle, &tmp, &meta);
		if(code != CURLcode.E_OK) {
			if(code != CURLcode.E_AGAIN) win::_log.error("curl error: %s", ((ZString)curl::easy_strerror(code)).str_view());
			return;
		}
		String x = res;
		res = res.concat(mem, tmp);
		x.free(mem);
		tmp.free(mem);
	} while(meta.bytesleft != 0);
	if(res.len == 0) return;
	//win::_log.info("got frame from websocket: %s", res);
	if(res[0] == '2') {
		self.direct("3");
	} else if(res[0] == '4') {
		if(res[1] == '2') {
			Object* resO = json::parse_string(mem, res[2..])!!;
			foreach(msg: self.msgs) {
				if(msg.name == resO.get_string_at(0)!!) {
					if(resO.get_len() == 1) {
						msg.f(null);
					} else {
						msg.f(resO.get_at(1));
					}
					return;
				}		
			}
			win::_log.warning("unknown socketIO message missed %s", res[2..]);
		} else {
			win::_log.warning("socketIO emmited message: %d", res[0]);
		}
	} else {
		win::_log.warning("engineIO emmited ws frame: %d", res[0]);
	}
}

fn CURLcode Socket.emit(&self, String message, String obj = "") {
	JSONObj arr = json::newArr();
	arr.append(message);
	if(obj.len != 0) {
		arr.next();
		arr.appendRaw(obj);
	}
	String payload1 = arr.end();
	defer payload1.free(mem);
	String payload2 = "42".concat(mem, payload1);
	defer payload2.free(mem);
	win::_log.info("emited socketIO message %s", payload2);
	return api::sendWSpayload(self.handle, payload2);
}

fn CURLcode Socket.direct(&self, String msg) {
	win::_log.info("emited socketIO message %s", msg);
	return api::sendWSpayload(self.handle, msg);
}

fn void Socket.on(&self, String msg, OnMessageCallbackF cb) {
	self.del(msg);
	foreach(&m: self.msgs) {
		if(m.f == null) {
			*m = (OnMessageCallback) {
				.name = msg,
				.f = cb,
			};
			return;
		}
	}
}

fn void Socket.del(&self, String msg) {
	foreach(&m: self.msgs) {
		if(m.name == msg) {
			*m = (OnMessageCallback){};
		} 
	}
}
