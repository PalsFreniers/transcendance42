module app::textbox;
import std::core::ascii;
import app;
import window;
import termbox;

const HEIGHT = 6;
const HEIGHT_2 = HEIGHT / 2;
const LEN = 30;
const LEN_2 = LEN / 2;
const SIZES = (int[<2>]){LEN, HEIGHT};

bitstruct TextBoxFlags : char {
	bool hide;
	bool dirty;
}

struct TextBox {
	String name;
	int[<2>] pos;
	int len;
	DString value;
	TextBoxFlags flags;
}

macro TextBox new(String name, int[<2>] pos, int len = LEN, String dflt = "", bool hide = false) => (TextBox) {
	.name = name,
	.pos = pos,
	.len = len,
	.value = dstring::new(mem, dflt),
	.flags = (TextBoxFlags) {
		.dirty = true,
		.hide = hide,
	},
};

fn void TextBox.draw(&self, Window* w) {
	((Box)self).drawBorder(w);
	w.putStr(self.name, self.pos + {win::CHAR_WIDTH, 0}, win::PWHITE, win::BLACK);
	for(int i = 1; i < self.len - 1; i++) {
		w.putChar(' ', self.pos + {i, win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
	}
	if(!self.flags.hide) {
		w.putStr(self.value.str_view(), self.pos + {win::CHAR_WIDTH, win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
	} else {
		Cell tc = win::genCell('*', win::PWHITE, win::BLACK);
		for(int i = 0; i < self.value.len(); i++) {
			w.putCell(tc, self.pos + {i + win::CHAR_WIDTH, win::CHAR_HEIGHT});
		}
	}
	self.unmarkDirty();
}

fn bool uint.isascii(c) => c <= 127;

fn void TextBox.onKey(&self, Key c) {
	if(c == KeyCode.BACKSPACE && self.value.len() > 0) {
		self.value.delete(self.value.len() - 1);
		self.markDirty();
	}
	if(self.value.len() == self.len - 2) return;
	if(c.ch != 0 && c.modifier == 0 && c.ch.isascii() && ((char)c.ch).is_print()) {
		self.value.append((char)c.ch);
		self.markDirty();
	}
}

fn void TextBox.clean(&self) {
	self.value.free();
}

fn void TextBox.reload(&self, String dflt = "") {
	self.value.free();
	self.value = dstring::new(mem, dflt);
	self.markDirty();
}

macro void TextBox.markDirty(&self) => self.flags.dirty = true;

macro void TextBox.unmarkDirty(&self) => self.flags.dirty = false;

macro bool TextBox.isDirty(&self) => self.flags.dirty;

macro String TextBox.getValue(&self) => self.value.str_view().copy(mem);

fn int[<4>] TextBox.getRect(&self) @dynamic => {self.pos, self.len, HEIGHT};
fn int[<2>] TextBox.getSize(&self) @dynamic => {self.len + 2, HEIGHT};
fn int[<2>] TextBox.getPos(&self) @dynamic => self.pos;
