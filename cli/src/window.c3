module window::win;
import termbox;
import logger;
import std::core::ascii;
import std::io;
import app::box;

const MAX_EVENTS_CALLBACKS = 20;

const BG_COLOR_DEFAULT = (Color){0, 0, 0};
const FG_COLOR_DEFAULT = (Color){0, 0, 0};

const CHAR_HEIGHT = 2;
const CHAR_WIDTH = 1;

alias OnKeyEventCallback = fn void(Key);
alias OnResizeEventCallback = fn void(int[<2>]);
alias OnMouseEventCallback = fn void(Mouse);
alias OnUpdateEventCallback = fn void();
alias OnQuitEventCallback = fn void();

alias Color = char[<3>];

PLogger _log;

const Color RED = {255, 0, 0};
const Color GREEN = {0, 255, 0};
const Color BLUE = {0, 0, 255};
const Color WHITE = {255, 255, 255};
const Color PWHITE = {250, 230, 240};
const Color BLACK = {0, 0, 0};

struct Window (Box) {
	bool loop;
	int[<2>] size;
	Event e;
	Cell* buff;
	OnKeyEventCallback[MAX_EVENTS_CALLBACKS] onKeyCbs;
	OnResizeEventCallback[MAX_EVENTS_CALLBACKS] onResizeCbs;
	OnMouseEventCallback[MAX_EVENTS_CALLBACKS] onMouseCbs;
	OnUpdateEventCallback[MAX_EVENTS_CALLBACKS] onUpdateCbs;
	OnQuitEventCallback[MAX_EVENTS_CALLBACKS] onQuitCbs;
	bool rl;
	bool rr;
	bool rm;
}

fn int[<2>] Window.getPos(&self) @dynamic => {0, 0};
fn int[<2>] Window.getSize(&self) @dynamic => self.size;

macro Window new() {
	return (Window) {
		.loop = true,
		.size = {tb::width(), tb::height() * CHAR_HEIGHT},
		.buff = tb::cellBuffer(),
	};
}

fn void Window.setCursor(&self, int[<2>] pos = {0, 0}, bool hide = false) {
	if(hide) pos = {tb::HIDE_CURSOR, tb::HIDE_CURSOR};
	tb::setCursor(pos.x, pos.y);
}

fn Cell Window.get(&self, int[<2>] pos) @operator([]) {
	return self.buff[pos.x + (pos.y / CHAR_HEIGHT * self.size.x)];
}

macro int[<2>] Window.dim(&self) => self.size;

macro int Window.width(&self) => self.size.x;

macro int Window.height(&self) => self.size.y;

macro char mapColorByte(char val) {
	float f = val / 255.0f;
	return (char)(f * 0b00011111);
}

fn void Window.putPixel(&self, int[<2>] pos, Color c) {
	if(pos.x < 0 || pos.x >= self.size.x) return;
	if(pos.y < 0 || pos.y >= self.size.y) return;
	Cell prev = (*self)[pos];
	Cell cell;
	cell.ch = 0x2584;
	if(pos.y % 2 != 0) {
		cell.fg.r = mapColorByte(c.r);
		cell.fg.g = mapColorByte(c.g);
		cell.fg.b = mapColorByte(c.b);
		cell.bg = prev.bg;
	} else {
		cell.bg.r = mapColorByte(c.r);
		cell.bg.g = mapColorByte(c.g);
		cell.bg.b = mapColorByte(c.b);
		cell.fg = prev.fg;
	}
	tb::putCell(pos.x, pos.y / CHAR_HEIGHT, &cell);
}

fn Cell genCell(ushort ch, Color fg, Color bg) {
	Cell cell;
	cell.ch = ch;
	cell.fg.r = mapColorByte(fg.r);
	cell.fg.g = mapColorByte(fg.g);
	cell.fg.b = mapColorByte(fg.b);
	cell.bg.r = mapColorByte(bg.r);
	cell.bg.g = mapColorByte(bg.g);
	cell.bg.b = mapColorByte(bg.b);
	return cell;
}

fn void Window.putCell(&self, Cell c, int[<2>] pos) {
	if(pos.x < 0 || pos.x >= self.size.x) return;
	if(pos.y < 0 || pos.y >= self.size.y) return;
	tb::putCell(pos.x, pos.y / CHAR_HEIGHT, &c);
}

macro void Window.putChar(&self, ushort ch, int[<2>] pos, Color fg, Color bg) => self.putCell(genCell(ch, fg, bg), pos);

fn void Window.putStr(&self, String str, int[<2>] pos, Color fg, Color bg) {
	if((pos.x < 0 && pos.x + str.len < 0) || pos.x >= self.size.x) return;
	if(pos.y < 0 || pos.y >= self.size.y) return;
	Cell cell = genCell(' ', fg, bg);
	foreach(c: str) {
		if(!c.is_print()) continue;
		cell.ch = c;
		self.putCell(cell, pos);
		pos.x++;
	}
}

fn void Window.clear(&self, Color c) {
	Cell cell;
	cell.ch = 0x2584;
	cell.fg.r = mapColorByte(c.r);
	cell.fg.g = mapColorByte(c.g);
	cell.fg.b = mapColorByte(c.b);
	cell.bg.raw = cell.fg.raw;
	for(int y = 0; y < self.size.y; y += CHAR_HEIGHT) {
		for(int x = 0; x < self.size.x; x++) {
			tb::putCell(x, y / CHAR_HEIGHT, &cell);
		}
	}
}

fn void Window.mainloop(&self) {
	while(self.loop) {
		switch(self.e.peek(1)) {
			case EventType.KEY:
				foreach(cb: self.onKeyCbs) {
					if(cb != null) cb((Key) {
						.modifier = self.e.mod,
						.code = self.e.key,
						.ch = self.e.ch,
					});
				}
			case EventType.RESIZE:
				self.size = {tb::width(), tb::height() * CHAR_HEIGHT};
				self.buff = tb::cellBuffer();
				foreach(cb: self.onResizeCbs) {
					if(cb != null) cb({self.e.w, self.e.h});
				}
			case EventType.MOUSE:
				foreach(cb: self.onMouseCbs) {
					if(cb != null) cb({
						.pos = {self.e.x, self.e.y},
						.code = self.e.key,
					});
				}
		}
		foreach(cb: self.onUpdateCbs) {
			if(cb != null) cb();
		}
		tb::present();
	}
	foreach(cb: self.onQuitCbs) {
		if(cb != null) cb();
	}
	self.loop = true;
}

fn void Window.quit(&self) => self.loop = false;

fn void Window.onKey(&self, OnKeyEventCallback callback) {
	foreach(&cb: self.onKeyCbs) {
		if(*cb == null) {
			*cb = callback;
			return;
		}
	}
}

fn void Window.onResize(&self, OnResizeEventCallback callback) {
	foreach(&cb: self.onResizeCbs) {
		if(*cb == null) {
			*cb = callback;
			return;
		}
	}
}

fn void Window.onMouse(&self, OnMouseEventCallback callback) {
	foreach(&cb: self.onMouseCbs) {
		if(*cb == null) {
			*cb = callback;
			return;
		}
	}
}

fn void Window.onUpdate(&self, OnUpdateEventCallback callback) {
	foreach(&cb: self.onUpdateCbs) {
		if(*cb == null) {
			*cb = callback;
			return;
		}
	}
}

fn void Window.onQuit(&self, OnQuitEventCallback callback) {
	foreach(&cb: self.onQuitCbs) {
		if(*cb == null) {
			*cb = callback;
			return;
		}
	}
}

fn void Window.delKey(&self, OnKeyEventCallback callback) {
	foreach(&cb: self.onKeyCbs) {
		if(*cb == callback) {
			*cb = null;
			return;
		}
	}
}

fn void Window.delResize(&self, OnResizeEventCallback callback) {
	foreach(&cb: self.onResizeCbs) {
		if(*cb == callback) {
			*cb = null;
			return;
		}
	}
}

fn void Window.delMouse(&self, OnMouseEventCallback callback) {
	foreach(&cb: self.onMouseCbs) {
		if(*cb == callback) {
			*cb = null;
			return;
		}
	}
}

fn void Window.delUpdate(&self, OnUpdateEventCallback callback) {
	foreach(&cb: self.onUpdateCbs) {
		if(*cb == callback) {
			*cb = null;
			return;
		}
	}
}

fn void Window.delQuit(&self, OnQuitEventCallback callback) {
	foreach(&cb: self.onQuitCbs) {
		if(*cb == callback) {
			*cb = null;
			return;
		}
	}
}

fn void Window.delIKey(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return;
	self.onKeyCbs[idx] = null;
}

fn void Window.delIResize(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return;
	self.onResizeCbs[idx] = null;
}

fn void Window.delIMouse(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return;
	self.onMouseCbs[idx] = null;
}

fn void Window.delIUpdate(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return;
	self.onUpdateCbs[idx] = null;
}

fn void Window.delIQuit(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return;
	self.onQuitCbs[idx] = null;
}

fn OnKeyEventCallback Window.getKey(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return null;
	return self.onKeyCbs[idx];
}

fn OnResizeEventCallback Window.getResize(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return null;
	return self.onResizeCbs[idx];
}

fn OnMouseEventCallback Window.getMouse(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return null;
	return self.onMouseCbs[idx];
}

fn OnUpdateEventCallback Window.getUpdate(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return null;
	return self.onUpdateCbs[idx];
}

fn OnQuitEventCallback Window.getQuit(&self, uint idx) {
	if(idx >= MAX_EVENTS_CALLBACKS) return null;
	return self.onQuitCbs[idx];
}

struct Key {
	Mod modifier;
	KeyCode code;
	uint ch;
}

fn bool Key.eqKeyCode(self, KeyCode code) @operator(==) {
	return self.code == code;
}

fn bool Key.eqChar(self, uint ch) @operator(==) {
	return self.ch == ch;
}

fn bool Key.neqKeyCode(self, KeyCode code) @operator(!=) {
	return self.code != code;
}

fn bool Key.neqChar(self, uint ch) @operator(!=) {
	return self.ch != ch;
}

struct Mouse {
	int[<2>] pos;
	KeyCode code;
}

fn bool Mouse.eqCode(self, KeyCode code) @operator(==) {
	return self.code == code;
}

fn bool Mouse.eqPos(self, int[<2>] pos) @operator(==) {
	return self.pos == pos;
}

fn bool Mouse.neqCode(self, KeyCode code) @operator(!=) {
	return self.code != code;
}

fn bool Mouse.neqPos(self, int[<2>] pos) @operator(!=) {
	return self.pos != pos;
}

File outf;

fn void win_tb_init_method() @init {
	outf = file::open("windowLog.txt", "a")!!;
	_log = logger::new("window", &outf);
	_log.info("----------------------------------------- New Entry -----------------------------------------");
	tb::init();
	tb::setCursor(tb::HIDE_CURSOR, tb::HIDE_CURSOR);
	tb::selectOutputMode(Output.RGB);
	tb::selectInputMode(Input.MOUSE | Input.ESC);
}

fn void win_tb_fini_method() @finalizer {
	outf.close()!!;
	tb::selectInputMode(Input.ESC);
	tb::selectOutputMode(Output.NORMAL);
	tb::shutdown();
}
