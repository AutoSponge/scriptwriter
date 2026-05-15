import test from 'ava';
import { name, command } from './dump.js';
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
	command.action.call(mockReplServer, 'myobj {a:1}');
	t.true(displayPromptCalled);
	t.deepEqual(
		mockReplServer.lines,
		[
			`await fs.promises.writeFile("myobj.json", JSON.stringify({a:1}, null, '  '));`,
		],
		'prints the correct command in .save history',
	);
});
