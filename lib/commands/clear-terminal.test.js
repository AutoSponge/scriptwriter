import test from 'ava';
import { name, command } from './clear-terminal.js';
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
	};
	command.action.call(mockReplServer);
	t.true(displayPromptCalled);
});
