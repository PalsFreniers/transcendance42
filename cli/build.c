#include "bob.h"
#include <unistd.h>

#define check(val) do { if(val != 0) { nob_log(NOB_ERROR, "unable to compile " #val); return; } } while(0);
#define C3C "./c3/c3c"
#define NAME "transcli"
#define LIBCURL "libcurl.a"
#define LIBTB "libtermbox.a"
#define CONFIGGEN "src/app/api/gen.c3"

int c3c(bool clean) {
	if(clean) {
		if(!rm("c3")) return 1;
		if(!rm("c3-linux.tar.gz")) return 1;
	} else if(!nob_file_exists("./c3/c3c")) {
		if(!wget("https://github.com/c3lang/c3c/releases/download/v0.7.5/c3-linux.tar.gz")) return 1;
		if(!extract("c3-linux.tar.gz")) return 1;
	} else {
		nob_log(NOB_INFO, "c3c already existing skipping...");
	}
	return 0;
}

int termbox(bool clean) {
	if(clean) {
		if(!rm(LIBTB)) return 1;
		if(!rm("tb1.o")) return 1;
		if(!rm("tb2.o")) return 1;
	} else if(!nob_file_exists(LIBTB)) {
		CMD(cmd);
		nob_cmd_append(&cmd, "clang", "-o", "tb1.o", "-c", "src/termbox.c");
		if(!nob_cmd_run(&cmd)) return 1;
		nob_cmd_append(&cmd, "clang", "-o", "tb2.o", "-c", "src/utf8.c");
		if(!nob_cmd_run(&cmd)) return 1;
		nob_cmd_append(&cmd, "ar", "rcs", LIBTB, "tb1.o", "tb2.o");
		if(!nob_cmd_run(&cmd)) return 1;
	} else {
		nob_log(NOB_INFO, "termbox already existing skipping...");
	}
	return 0;
}

int curl(bool clean) {
	if(clean) {
		if(!rm(LIBCURL)) return 1;
		if(!rm("buildCurl")) return 1;
		if(!rm("curl")) return 1;
		if(!rm("curl-8.16.0.tar.xz")) return 1;
		if(!rm("curl-8.16.0")) return 1;
	} else if(!nob_file_exists(LIBCURL)) {
		if(!nob_file_exists("curl")) {
			if(!wget("https://github.com/curl/curl/releases/download/curl-8_16_0/curl-8.16.0.tar.xz")) return 1;
			if(!extract("curl-8.16.0.tar.xz")) return 1;
		}
		if(!nob_mkdir_if_not_exists("buildCurl")) return 1;
		if(chdir("buildCurl")) return 1;
		if(!configure("../curl-8.16.0", "--without-zstd", "--without-libpsl", "--disable-shared", "--enable-static", "--enable-websockets", "--with-openssl")) return 1;
		if(chdir("..")) return 1;
		if(!make("./buildCurl")) return 1;
		if(!mv("buildCurl/lib/.libs/libcurl.a", LIBCURL)) return 1;
	} else {
		nob_log(NOB_INFO, "curl already existing skipping...");
	}
	return 0;
}

int strnclen(char *str, char c, int max) {
	int i = 0;
	while(str[i] && str[i] != '\n' && i <= max) {
		i++;
	}
	return i;
}

int conf(bool clean) {
	if(clean) {
		if(!rm(CONFIGGEN)) return 1;
	} else {
		if(!nob_file_exists("cli.conf")) {
			nob_log(NOB_ERROR, "unable to find config file");
			return 1;
		}
		int defer = 0;
		FILE* f = fopen("cli.conf", "r");
		FILE* out = fopen(CONFIGGEN, "w");
		if(!f || !out) {defer = 1; goto ret;}
		fprintf(out, "module app::api::gen;\n const String SERVER_ADDRESS = SERVER_IP +++ \":\" +++ SERVER_PORT;\n");
		char line[256];
		int i = 0, a = 0, b = 0;
		while(fgets(line, sizeof(line), f)) {
			int pos = strnclen(line, '\n', 255);
			if(pos == 0) continue;
			line[pos] = 0;
			if(i >= 2) {
				nob_log(NOB_ERROR, "config does not contain only two lines");
				defer = 1;
				goto ret;
			}
			if(line[pos - 1] != '\"') {
				nob_log(NOB_ERROR, "bad end of string");
				defer = 1;
				goto ret;
			}
			if(strncmp(line, "addr:=\"", 6) == 0) {
				a = 1;
				fprintf(out, "const String SERVER_IP = %s;\n", line + 6);
			} else if(strncmp(line, "port:=\"", 6) == 0) {
				b = 1;
				fprintf(out, "const String SERVER_PORT = %s;\n", line + 6);
			} else {
				nob_log(NOB_ERROR, "unable to parse line: %s", line);
				defer = 1;
				goto ret;
			}
			i++;
		}
		if(!a || !b) {
			defer = 1;
			nob_log(NOB_ERROR, "address or port not defined in config");
		}
ret:
		if(out) fclose(out);
		if(f) fclose(f);
		return defer;
	}
	return 0;
}

int cli(bool clean) {
	if(clean) {
		if(!rm(NAME)) return 1;
		return 0;
	}
	CMD(cmd);
	const char *sources[] = {
		// main
		"src/main.c3",
		// window
		"src/logger.c3",
		"src/window.c3",
		// bindings
		"src/curl.c3i",
		"src/termbox.c3",
		// app
		"src/app/main.c3",
		"src/app/border.c3",
		"src/app/box.c3",
		"src/app/button.c3",
		"src/app/main.c3",
		"src/app/state.c3",
		"src/app/textbox.c3",
		// app api
		"src/app/api/api.c3",
		"src/app/api/json.c3",
		"src/app/api/socketIO.c3",
		"src/app/api/gen.c3",
		// app states
		"src/app/states/login.c3",
		"src/app/states/menu.c3",
		"src/app/states/tfa.c3",
		"src/app/states/wait.c3",
		"src/app/states/game.c3",
	};
	nob_cmd_append(&cmd, C3C, "compile", "-o", NAME);
	for(int i = 0; i < NOB_ARRAY_LEN(sources); i++)
		nob_cmd_append(&cmd, sources[i]);
	nob_cmd_append(&cmd, "-z", LIBTB, "-z", LIBCURL);
	nob_cmd_append(&cmd, "-z", "-lssl", "-z", "-lcrypto", "-z", "-lz");
	nob_cmd_append(&cmd, "-z", "-lbrotlidec", "-z", "-lbrotlienc");
	if(!nob_cmd_run(&cmd)) {
		if(!rm(CONFIGGEN)) return 1;
		return 1;
	}
	return 0;
}

void build(bool clean) {
	check(c3c(clean));
	check(termbox(clean));
	check(curl(clean));
	check(conf(clean));
	check(cli(clean));
}

int main(int c, char **v) {
	NOB_GO_REBUILD_URSELF(c, v);
	if(c != 2) {
		nob_log(NOB_ERROR, "USAGE: %s (build | clean | re)", v[0]);
		return 1;
	}
	if(nob_file_exists("build.old")) rm("build.old");
	if(strequ(v[1], "build")) {
		build(false);
	} else if(strequ(v[1], "clean")) {
		build(true);
	} else if(strequ(v[1], "re")) {
		build(true);
		build(false);
	} else {
		nob_log(NOB_ERROR, "USAGE: %s (build | clean | re)", v[0]);
		nob_log(NOB_ERROR, "unknown command %s", v[1]);
		return 1;
	}
	return 0;
}
