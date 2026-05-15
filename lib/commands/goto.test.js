import test from 'ava';
import { name, command } from './goto.js';
import Scriptwriter from '../scriptwriter.js';

test.serial('uses the correct interface', (t) => {
	t.truthy(name);
	t.truthy(command.help);
	t.truthy(command.action);
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
	command.action.call(mockReplServer, 'github.com');
	t.true(displayPromptCalled);
	t.deepEqual(
		mockReplServer.lines,
		['await page.goto("https://github.com");'],
		'prints the correct command in .save history',
	);
});
