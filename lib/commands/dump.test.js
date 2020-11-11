const test = require('ava');
const dump = require('./dump');
const Scriptwriter = require('../scriptwriter');

test.serial('uses the correct interface', (t) => {
	t.truthy(dump.name);
	t.truthy(dump.command.help);
	t.truthy(dump.command.action);
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
	dump.command.action.call(mockReplServer, 'myobj {a:1}');
	t.true(displayPromptCalled);
	t.deepEqual(
		mockReplServer.lines,
		[
			`await fs.promises.writeFile("myobj.json", JSON.stringify({a:1}, null, '  '));`,
		],
		'prints the correct command in .save history'
	);
});
