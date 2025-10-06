module app::border;
import window;
import termbox;

import app::box;

macro void drawScreen(Window *w) {
	((Box)w).drawBorder(w);
}
