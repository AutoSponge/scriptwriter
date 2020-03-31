const test = require('ava');
const clearScreen = require('./clear-screen');
const Scriptwriter = require('../scriptwriter');

test.serial('uses the correct interface', (t) => {
	t.truthy(clearScreen.name);
	t.truthy(clearScreen.command.help);
	t.truthy(clearScreen.command.action);
});

test.serial('action', (t) => {
	const scriptwriter = new Scriptwriter();
	let displayPromptCalled = false;
	const mockReplServer = {
		context: {
			scriptwriter,
			director: {
				displayPrompt() {
					displayPromptCalled = true;
				},
			},
		},
	};
	clearScreen.command.action.call(mockReplServer);
	t.true(displayPromptCalled);
});
