const test = require('ava');
const clearTerminal = require('./clear-terminal');
const Scriptwriter = require('../scriptwriter');

test.serial('uses the correct interface', (t) => {
	t.truthy(clearTerminal.name);
	t.truthy(clearTerminal.command.help);
	t.truthy(clearTerminal.command.action);
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
	clearTerminal.command.action.call(mockReplServer);
	t.true(displayPromptCalled);
});
