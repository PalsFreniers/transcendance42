module logger;
import std::io;
import std::time;

enum LogLevel : const inline String {
	DEBUG = "[DEBUG]",
	INFO = "[INFO]",
	WARNING = "[WARNING]",
	ERROR = "[ERROR]",
}

struct PLogger {
	OutStream out;
	String name;
}

macro PLogger new(String name = "", OutStream out = io::stderr()) => (PLogger) {
	.out = out,
	.name = name,
};

fn void PLogger.log(self, LogLevel lvl, String fmt, args...) {
	DateTime t = datetime::now();
	io::fprintf (self.out, "%s %s %d/%d/%d-%d:%d:%d => ", lvl, self.name, t.year, t.month.ordinal, t.day, t.hour, t.min, t.sec)!!;
	io::fprintfn(self.out, fmt, ...args)!!;
}

macro PLogger.debug(self, fmt, args...) => self.log(LogLevel.DEBUG, fmt, ...args);
macro PLogger.info(self, fmt, args...) => self.log(LogLevel.INFO, fmt, ...args);
macro PLogger.warning(self, fmt, args...) => self.log(LogLevel.WARNING, fmt, ...args);
macro PLogger.error(self, fmt, args...) => self.log(LogLevel.ERROR, fmt, ...args);
