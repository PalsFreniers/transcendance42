module app::api;
import app::api::gen;
import std::encoding::json;
import app::api::json;
import std::thread;
import std::collections::object;
import window;
import curl;
import app;

const String HTTP_ADDRESS = "https://" +++ gen::SERVER_ADDRESS;
const String WS_ADDRESS = "wss://" +++ gen::SERVER_ADDRESS;

const String ENDPOINT = HTTP_ADDRESS +++ "/api";
const String USER_EP  = ENDPOINT +++ "/user";
const String GAME_EP = ENDPOINT +++ "/game";
const String LOGIN_EP = USER_EP  +++ "/login";
const String VERIFY_EP = USER_EP +++ "/verify-email";
const String FIND_EP = GAME_EP +++ "/find-lobbies";
const String JOIN_EP = GAME_EP +++ "/join-lobby";
const String CREATE_EP = GAME_EP +++ "/create-game";

const String SOCKET = WS_ADDRESS +++ "/pongSocket/?EIO=4&transport=websocket";

typedef MemChunk = char[];

String frame;

fn isz writeCallback(char* data, usz size, usz nmemb, void* clientp) {
	usz realsize = nmemb;
	MemChunk* chunk = clientp;
	MemChunk new = (MemChunk)mem::new_array(char, chunk.len + realsize + 1);
	mem::copy(new.ptr, chunk.ptr, chunk.len);
	mem::copy(new.ptr + chunk.len, data, realsize);
	mem::free((char[])*chunk);
	*chunk = new;
	return realsize;
}

fn CURLcode sendPostRequest(Curl* handle, String url, MemChunk* res, String value) {
	Slist* headers = null;
	defer curl::slist_free_all(headers);
	headers = curl::slist_append(headers, "Content-Type: application/json");
	curl::easy_setopt(handle, curl::CURLOPT_URL, (ZString)url);
	curl::easy_setopt(handle, curl::CURLOPT_WRITEFUNCTION, &api::writeCallback);
	curl::easy_setopt(handle, curl::CURLOPT_WRITEDATA, res);
	curl::easy_setopt(handle, curl::CURLOPT_POSTFIELDS, (ZString)value);
	curl::easy_setopt(handle, curl::CURLOPT_SSL_VERIFYPEER, 0);
	curl::easy_setopt(handle, curl::CURLOPT_HTTPHEADER, headers);
	return curl::easy_perform(handle);
}

fn CURLcode sendPostRequestT(Curl* handle, String url, MemChunk* res, String value) {
	String token = app::instance.getSecret();
	defer token.free(mem);
	String auth = "Authorization: Bearer ".concat(mem, token);
	defer auth.free(mem);
	Slist* headers = null;
	defer curl::slist_free_all(headers);
	headers = curl::slist_append(headers, "Content-Type: application/json");
	headers = curl::slist_append(headers, (ZString)auth);
	curl::easy_setopt(handle, curl::CURLOPT_URL, (ZString)url);
	curl::easy_setopt(handle, curl::CURLOPT_WRITEFUNCTION, &api::writeCallback);
	curl::easy_setopt(handle, curl::CURLOPT_WRITEDATA, res);
	curl::easy_setopt(handle, curl::CURLOPT_POSTFIELDS, (ZString)value);
	curl::easy_setopt(handle, curl::CURLOPT_SSL_VERIFYPEER, 0);
	curl::easy_setopt(handle, curl::CURLOPT_HTTPHEADER, headers);
	return curl::easy_perform(handle);
}

fn CURLcode sendWSpayload(Curl* socket, String payload) {
	usz size;
	CURLcode code = curl::ws_send(socket, (ZString)payload, payload.len, &size, 0, curl::CURLWS_TEXT);
	while(size < payload.len) {
		if(code != CURLcode.E_OK && code != CURLcode.E_AGAIN) return code;
		payload = payload[size..];
		code = curl::ws_send(socket, (ZString)payload, payload.len - size, &size, 0, curl::CURLWS_TEXT);
	}
	return code;
}

fn CURLcode recvWSpayloadNoRetry(Curl* socket, String* payload, Ws_frame** meta = null) {
	usz rlen;
	char[1024] buf;
	Ws_frame* dummy;
	if(meta == null) meta = &dummy;
	CURLcode res = curl::ws_recv(socket, (ZString)((String)buf[:buf.len]), 1024, &rlen, meta);
	if(res != CURLcode.E_OK) return res;
	*payload = ((String)buf[:rlen]).copy(mem);
	return res;
}

fn CURLcode recvWSpayload(Curl* socket, String* payload, Ws_frame** meta = null) {
	CURLcode code;
	do {
		code = recvWSpayloadNoRetry(socket, payload, meta);
		if(code != CURLcode.E_OK && code != CURLcode.E_AGAIN) return code;
		thread::sleep_ms(1);
		if((*payload) == "2") {
			sendWSpayload(socket, "3");
			code = CURLcode.E_AGAIN;
		}
	} while(code != CURLcode.E_OK);
	return CURLcode.E_OK;
}

fn void errNotify(Window* w, String err) {
		w.putStr(err, {
			w.width() / 2 - err.len / 2, win::CHAR_HEIGHT
		}, win::RED, win::BLACK);
}

fn bool curlPost(App* handle, Object** res, String url, String req) {
	defer curl::easy_reset(handle.getCurl());
	MemChunk loginResponse;
	defer mem::free((char[])loginResponse);
	CURLcode code = api::sendPostRequest(handle.getCurl(), url, &loginResponse, req);
	if(code != CURLcode.E_OK) {
		win::_log.error("curl error: %s", ((ZString)curl::easy_strerror(code)).str_view());
		return false;
	}
	long codeHTTP; 
	code = curl::easy_getinfo(handle.getCurl(), curl::CURLINFO_RESPONSE_CODE, &codeHTTP);
	if(code != CURLcode.E_OK) {
		win::_log.error("curl error: %s", ((ZString)curl::easy_strerror(code)).str_view());
		return false;
	}
	*res = json::parse_string(mem, (String)loginResponse)!!;
	if(codeHTTP != 200) {
		String err = getError(*res);
		win::_log.error("unable to execute request: %s code %d", err, codeHTTP);
		errNotify(handle.getWindow(), err);
		return false;
	}
	return true;
}

fn bool curlPostT(App* handle, Object** res, String url, String req) {
	defer curl::easy_reset(handle.getCurl());
	MemChunk loginResponse;
	defer mem::free((char[])loginResponse);
	CURLcode code = api::sendPostRequestT(handle.getCurl(), url, &loginResponse, req);
	if(code != CURLcode.E_OK) {
		win::_log.error("curl error: %s", ((ZString)curl::easy_strerror(code)).str_view());
		return false;
	}
	long codeHTTP; 
	code = curl::easy_getinfo(handle.getCurl(), curl::CURLINFO_RESPONSE_CODE, &codeHTTP);
	if(code != CURLcode.E_OK) {
		win::_log.error("curl error: %s", ((ZString)curl::easy_strerror(code)).str_view());
		return false;
	}
	*res = json::parse_string(mem, (String)loginResponse)!!;
	if(codeHTTP != 200) {
		String err = getError(*res);
		win::_log.error("unable to execute request: %s code %d", err, codeHTTP);
		errNotify(handle.getWindow(), err);
		return false;
	}
	return true;
}

fn String getError(Object* obj) {
	return obj.get_string("error") ?? "Error: unknown";
}
