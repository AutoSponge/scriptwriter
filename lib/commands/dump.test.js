import test from 'ava';
import { name, command } from './dump.js';
import Scriptwriter from '../scriptwriter.js';

function createMockRepl() {
	const scriptwriter = new Scriptwriter();
	return {
		context: {
			scriptwriter,
		},
		displayPromptCalled: false,
		displayPrompt() {
			this.displayPromptCalled = true;
		},
		lines: [],
		eval(line, context, file, cb) {
			cb();
		},
	};
}

test.serial('uses the correct interface', (t) => {
	t.truthy(name);
	t.truthy(command.help);
	t.truthy(command.action);
});

test.serial('action defaults to txt when no type is provided', (t) => {
	const mockReplServer = createMockRepl();
	command.action.call(mockReplServer, 'myobj');
	t.true(mockReplServer.displayPromptCalled);
	t.deepEqual(
		mockReplServer.lines,
		[
			'await fs.promises.writeFile("myobj.txt", util.inspect(myobj,  { showHidden: true, depth: null, colors: false }));',
		],
		'prints the correct command in .save history for txt type',
	);
});

test.serial('action writes json when json type is provided', (t) => {
	const mockReplServer = createMockRepl();
	command.action.call(mockReplServer, 'myobj json');
	t.deepEqual(
		mockReplServer.lines,
		[
			'await fs.promises.writeFile("myobj.json", JSON.stringify(myobj, null, \'  \'));',
		],
		'prints the correct command in .save history for json type',
	);
});

test.serial(
	'action writes ansi output when ansi type and depth are provided',
	(t) => {
		const mockReplServer = createMockRepl();
		command.action.call(mockReplServer, 'myobj ansi 2');
		t.deepEqual(
			mockReplServer.lines,
			[
				'await fs.promises.writeFile("myobj.ansi", util.inspect(myobj,  { showHidden: true, depth: 2, colors: true }));',
			],
			'prints the correct command in .save history for ansi type',
		);
	},
);

test.serial('action falls back to String() for unsupported file types', (t) => {
	const mockReplServer = createMockRepl();
	command.action.call(mockReplServer, 'myobj xml');
	t.deepEqual(
		mockReplServer.lines,
		['await fs.promises.writeFile("myobj.xml", String(myobj));'],
		'prints the correct command in .save history for unsupported types',
	);
});

test.serial('action errors when no arguments are provided', (t) => {
	const scriptwriter = new Scriptwriter();
	let errorCalled = false;
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
	scriptwriter.error = () => {
		errorCalled = true;
	};
	command.action.call(mockReplServer, '');
	t.true(errorCalled);
	t.true(displayPromptCalled);
});
