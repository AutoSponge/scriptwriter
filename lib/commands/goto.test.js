const test = require('ava');
const goto = require('./goto');
const Scriptwriter = require('../scriptwriter');

test.serial('uses the correct interface', (t) => {
	t.truthy(goto.name);
	t.truthy(goto.command.help);
	t.truthy(goto.command.action);
});

test.serial('action', (t) => {
	const scriptwriter = new Scriptwriter();
	let displayPromptCalled = false;
	const mockReplServer = {
		context: {
			scriptwriter,
		},
		displayPrompt() {
			displayPromptCalled = true;
		},
		lines: [],
		eval(line, context, file, cb) {
			cb();
		},
	};
	goto.command.action.call(mockReplServer, 'github.com');
	t.true(displayPromptCalled);
	t.deepEqual(
		mockReplServer.lines,
		['await page.goto("https://github.com");'],
		'prints the correct command in .save history'
	);
});
