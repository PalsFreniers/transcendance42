module app::state;
import app::states;

interface State {
	fn void init(App*);
	fn void load(App*);
	fn void unload(App*);
}

enum States : const inline int {
	LOGIN = 0,
	MENU = 1,
	TFA = 2,
	WAIT = 3,
	GAME = 4,
}

const State[] STATES = (State[]) {
	&login::instance,
	&menu::instance,
	&tfa::instance,
	&wait::instance,
	&game::instance,
	// game,
};
