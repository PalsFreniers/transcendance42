all:
	@echo "building build script"
	gcc -o build build.c
	@echo "launching build script"
	./build build

clean:
	./build clean
	rm -fr windowLog.txt cli.conf build src/app/api/gen.c3

re:
	./build re

.PHONY: all clean re
