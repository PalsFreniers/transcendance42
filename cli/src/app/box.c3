module app::box;
import window;
import termbox;

interface Box {
	fn int[<4>] getRect() @optional;
	fn int[<2>] getSize();
	fn int[<2>] getPos();
}

fn void Box.drawBorder(self, Window* w) {
	int[<2>] pos = self.getPos();
	int[<2>] size = self.getSize();
	w.putChar(0x250C, {pos.x, pos.y}, win::PWHITE, win::BLACK);
	w.putChar(0x2514, {pos.x, pos.y + size.y - win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
	w.putChar(0x2510, {pos.x + size.x - win::CHAR_WIDTH, pos.y}, win::PWHITE, win::BLACK);
	w.putChar(0x2518, {pos.x + size.x - win::CHAR_WIDTH, pos.y + size.y - win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
	Cell c = win::genCell(0x2502, win::PWHITE, win::BLACK);
	for(int y = pos.y + win::CHAR_HEIGHT; y < pos.y + size.y - win::CHAR_HEIGHT; y += win::CHAR_HEIGHT) {
		w.putCell(c, {pos.x, y});
		w.putCell(c, {pos.x + size.x - win::CHAR_WIDTH, y});
	}
	c.ch = 0x2500;
	for(int x = pos.x + win::CHAR_WIDTH; x < pos.x + size.x - win::CHAR_WIDTH; x++) {
		w.putCell(c, {x, pos.y});
		w.putCell(c, {x, pos.y + size.y - win::CHAR_HEIGHT});
	}
}

fn int[<4>] Box.__getRect__(self) @local {
	if(&self.getRect) return self.getRect();
	return {self.getPos(), self.getSize()};
}

fn bool Box.collide(self, Box other) {
	int[<4>] a = self.__getRect__();
	int[<4>] b = other.__getRect__();
	if(a.x > b.x + b.z) return false;
	if(a.y > b.y + b.w) return false;
	if(a.x + a.z < b.x) return false;
	if(a.y + a.w < b.y) return false;
	return true;
}

module app::box::rect;
import app::box;

typedef Rect (Box) = int[<4>];

fn int[<4>] Rect.getRect(&self) @dynamic => (int[<4>])*self;
fn int[<2>] Rect.getSize(&self) @dynamic => self.zw;
fn int[<2>] Rect.getPos(&self) @dynamic => self.xy;
