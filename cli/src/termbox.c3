module termbox::tb;

enum KeyCode : const inline ushort {
        F1 = (0xFFFF - 0),
        F2 = (0xFFFF - 1),
        F3 = (0xFFFF - 2),
        F4 = (0xFFFF - 3),
        F5 = (0xFFFF - 4),
        F6 = (0xFFFF - 5),
        F7 = (0xFFFF - 6),
        F8 = (0xFFFF - 7),
        F9 = (0xFFFF - 8),
        F10 = (0xFFFF - 9),
        F11 = (0xFFFF - 10),
        F12 = (0xFFFF - 11),
        INSERT = (0xFFFF - 12),
        DELETE = (0xFFFF - 13),
        HOME = (0xFFFF - 14),
        END = (0xFFFF - 15),
        PGUP = (0xFFFF - 16),
        PGDN = (0xFFFF - 17),
        ARROW_UP = (0xFFFF - 18),
        ARROW_DOWN = (0xFFFF - 19),
        ARROW_LEFT = (0xFFFF - 20),
        ARROW_RIGHT = (0xFFFF - 21),
        MOUSE_LEFT = (0xFFFF - 22),
        MOUSE_RIGHT = (0xFFFF - 23),
        MOUSE_MIDDLE = (0xFFFF - 24),
        MOUSE_RELEASE = (0xFFFF - 25),
        MOUSE_WHEEL_UP = (0xFFFF - 26),
        MOUSE_WHEEL_DOWN = (0xFFFF - 27),
        CTRL_TILDE = 0x00,
        CTRL_2 = 0x00,
        CTRL_A = 0x01,
        CTRL_B = 0x02,
        CTRL_C = 0x03,
        CTRL_D = 0x04,
        CTRL_E = 0x05,
        CTRL_F = 0x06,
        CTRL_G = 0x07,
        BACKSPACE2 = 0x08,
        CTRL_H = 0x08,
        TAB = 0x09,
        CTRL_I = 0x09,
        CTRL_J = 0x0A,
        CTRL_K = 0x0B,
        CTRL_L = 0x0C,
        ENTER = 0x0D,
        CTRL_M = 0x0D,
        CTRL_N = 0x0E,
        CTRL_O = 0x0F,
        CTRL_P = 0x10,
        CTRL_Q = 0x11,
        CTRL_R = 0x12,
        CTRL_S = 0x13,
        CTRL_T = 0x14,
        CTRL_U = 0x15,
        CTRL_V = 0x16,
        CTRL_W = 0x17,
        CTRL_X = 0x18,
        CTRL_Y = 0x19,
        CTRL_Z = 0x1A,
        ESC = 0x1B,
        CTRL_LSQ_BRACKET = 0x1B,
        CTRL_3 = 0x1B,
        CTRL_4 = 0x1C,
        CTRL_BACKSLASH = 0x1C,
        CTRL_5 = 0x1D,
        CTRL_RSQ_BRACKET = 0x1D,
        CTRL_6 = 0x1E,
        CTRL_7 = 0x1F,
        CTRL_SLASH = 0x1F,
        CTRL_UNDERSCORE = 0x1F,
        SPACE = 0x20,
        BACKSPACE = 0x7F,
        CTRL_8 = 0x7,
}

enum Mod : const char {
        ALT = 1,
        MOTION = 2,
}

enum EventType : const char {
        KEY = 1,
        RESIZE = 2,
        MOUSE = 3,
}

enum Input : const inline int {
        CURRENT = 0,
        ESC = 1,
        ALT = 2,
        MOUSE = 4,
}

enum Output : const inline int {
        CURRENT = 0,
        NORMAL = 1,
        C256 = 2,
        C216 = 3,
        GRAYSCALE = 4,
		RGB = 5,
}

struct Event {
        EventType type;
        Mod mod;
        KeyCode key;
        uint ch;
        int w;
        int h;
        int x;
        int y;
}

union CellColor {
	ushort raw;
	bitstruct : ushort {
		char b : 0..4;
		char g : 5..9;
		char r : 10..14;
		bool unused : 15;
	}
}

fn bool CellColor.eqCellColor(self, CellColor other) @operator(==) {
	return self.raw == other.raw;
}

fn bool CellColor.neqCellColor(self, CellColor other) @operator(!=) {
	return self.raw == other.raw;
}

struct Cell {
       uint ch;
       CellColor fg;
	   CellColor bg;
}

const int BOLD = 0x0100;
const int UNDERLINE = 0x0200;
const int REVERSE = 0x0400;
const int HIDE_CURSOR = -1;
const int EOF = -1;
const ushort DEFAULT = 0x00;
const ushort BLACK   = 0x01;
const ushort RED     = 0x02;
const ushort GREEN   = 0x03;
const ushort YELLOW  = 0x04;
const ushort BLUE    = 0x05;
const ushort MAGENTA = 0x06;
const ushort CYAN    = 0x07;
const ushort WHITE   = 0x08;

extern fn int init() @extern("tb_init");
extern fn int initFile(char* file) @extern("tb_init_file");
extern fn int initFD(int fd) @extern("tb_init_fd");
extern fn void shutdown() @extern("tb_shutdown");
extern fn int width() @extern("tb_width");
extern fn int height() @extern("tb_height");
extern fn void clear() @extern("tb_clear");
extern fn void setClearAttribute(ushort fg, ushort bg) @extern("tb_set_clear_attributes");
extern fn void present() @extern("tb_present");
extern fn void setCursor(int x, int y) @extern("tb_set_cursor");
extern fn void putCell(int x, int y, Cell* cell) @extern("tb_put_cell");
extern fn void changeCell(int x, int y, uint ch, ushort fg, ushort bg) @extern("tb_change_cell");
extern fn void blit(int x, int y, int w, int h, Cell* cells) @extern("tb_blit");
extern fn Cell* cellBuffer() @extern("tb_cell_buffer");
extern fn int selectInputMode(Input mode) @extern("tb_select_input_mode");
extern fn int selectOutputMode(Output mode) @extern("tb_select_output_mode");
extern fn EventType Event.peek(Event* self, int timeout) @extern("tb_peek_event");
extern fn EventType Event.poll(Event* self) @extern("tb_poll_event");
extern fn int utf8CharLength(char c) @extern("tb_utf8_char_length");
extern fn int utf8CharToUnicode(uint* out, char* c) @extern("tb_utf8_char_to_unicode");
extern fn int utf8UnicodeToChar(char* out, uint c) @extern("tb_utf8_unicode_to_char");
