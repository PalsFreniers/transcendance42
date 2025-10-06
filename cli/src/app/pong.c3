module app::pong;

struct Player {
	String name;
	int score;
}

struct Pong {
	String lobbyName;
	Player p1;
	Player p2;
}
