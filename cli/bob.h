#ifndef BOB_H
#define BOB_H

#include <string.h>
#define NOB_IMPLEMENTATION
#include "nob.h"

#define DA(Type) struct { size_t size; size_t capacity; Type *items; }
#define CMD(name) Nob_Cmd name = {0};

#define configure(path, ...) _configure(nob_temp_sprintf("%s/configure", path), (char **)((const char *[]){__VA_ARGS__}), sizeof(((const char *[]){__VA_ARGS__})) / sizeof(const char *))

int _configure(char *path, char **options, size_t len) {
	CMD(cmd);
	nob_cmd_append(&cmd, path);
	for(int i = 0; i < len; i++) nob_cmd_append(&cmd, options[i]);
	return nob_cmd_run(&cmd);
}

int wget(char *file) {
	CMD(cmd);
	nob_cmd_append(&cmd, "wget", file);
	return nob_cmd_run(&cmd);
}

int extract(char *tarball) {
	CMD(cmd);
	nob_cmd_append(&cmd, "tar", "-xvf", tarball);
	return nob_cmd_run(&cmd);
}

int make(char *dir) {
	if(strcmp(dir, "") == 0) dir = ".";
	CMD(cmd);
	nob_cmd_append(&cmd, "make", "-C", dir);
	return nob_cmd_run(&cmd);
}

int mv(char *src, char *dst) {
	CMD(cmd);
	nob_cmd_append(&cmd, "mv", src, dst);
	return nob_cmd_run(&cmd);
}

int cmake(char *src, char *dst) {
	CMD(cmd);
	nob_cmd_append(&cmd, "cmake", "-S", src, "-B", dst);
	return nob_cmd_run(&cmd);
}

int rm(char *file) {
	CMD(cmd);
	nob_cmd_append(&cmd, "rm", "-fr", file);
	return nob_cmd_run(&cmd);
}

int clone(char *url) {
	CMD(cmd);
	nob_cmd_append(&cmd, "git", "clone", url);
	return nob_cmd_run(&cmd);
}

bool strequ(char *a, char *b) {
	return strcmp(a, b) == 0;
}

#endif // BOB_H
