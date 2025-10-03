module app::button;
import std::core::ascii;
import app;
import window;
import termbox;

import app::box;

const HEIGHT = 6;
const HEIGHT_2 = HEIGHT / 2;

alias ButtonOnClickCallback = fn void(Mouse);

struct Button (Box) {
	String name;
	int[<2>] pos;
	ButtonOnClickCallback onClickCb;
}

macro Button new(String name, int[<2>] pos, ButtonOnClickCallback onClick = null) => (Button) {
	.name = name,
	.pos = pos,
	.onClickCb = onClick,
};

fn void Button.draw(&self, Window* w) {
	((Box)self).drawBorder(w);
	w.putStr(self.name, self.pos + {win::CHAR_WIDTH, win::CHAR_HEIGHT}, win::PWHITE, win::BLACK);
}

fn void Button.onClick(&self, Mouse m) {
	if(self.onClickCb) self.onClickCb(m);
}

fn int[<4>] Button.getRect(&self) @dynamic => {self.pos, self.name.len + 2, HEIGHT};
fn int[<2>] Button.getSize(&self) @dynamic => {self.name.len + 2, HEIGHT};
fn int[<2>] Button.getPos(&self) @dynamic => self.pos;
