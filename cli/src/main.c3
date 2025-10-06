import std::io;
import app;
import termbox;

PanicFn origPanic;

fn int main() {
	origPanic = builtin::panic;
	builtin::panic = fn (message, file, function, line) {
		tb::shutdown();
		origPanic(message, file, function, line);
	};
	app::init();
	app::mainloop();
	app::cleanup();
	return 0;
}

