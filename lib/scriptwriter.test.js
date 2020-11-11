const test = require('ava');
const Scriptwriter = require('./scriptwriter');
const ansiEscapes = require('ansi-escapes');
const importGlobal = require('import-global');
const kleur = require('kleur');
const tempfile = require('tempfile');

test('Scriptwriter is a constructor', (t) => {
	t.plan(1);
	const scriptwriter = new Scriptwriter();
	t.truthy(scriptwriter);
});

test('exposes color, code, escapes', (t) => {
	const scriptwriter = new Scriptwriter();
	t.is(scriptwriter.escapes, ansiEscapes);
	t.is(scriptwriter.color, kleur);
	t.is(scriptwriter.importGlobal, importGlobal);
	t.is(scriptwriter.code('var x=1').trim(), 'var x = 1;');
});

/*****************************************
 * all async tests must be run in serial *
 *****************************************/
test.serial('scriptwriter persists the replServer as director', async (t) => {
	const scriptwriter = new Scriptwriter();
	t.is(scriptwriter.replServer, null);
	let allReady = waitFor(scriptwriter, 'ready', ['client']);
	await scriptwriter.init();
	await allReady;
	const replServer = scriptwriter.company.director;
	allReady = waitFor(scriptwriter, 'ready', ['client']);
	replServer.resetContext();
	await allReady;
	t.is(replServer, scriptwriter.company.director);
	scriptwriter.company.director.close();
});

test.serial('page.load updates the repl prompt', async (t) => {
	const scriptwriter = new Scriptwriter();
	await scriptwriter.init();
	let allReady = waitFor(scriptwriter, 'ready', ['client']);
	const initalPrompt = scriptwriter.company.director._prompt;
	t.is(initalPrompt, '> ');
	await allReady;
	const { page } = scriptwriter.company;
	const loaded = waitFor(page, 'load');
	page.emit('load');
	await loaded;
	t.not(scriptwriter.company.director._prompt, initalPrompt);
	scriptwriter.company.director.close();
});

test.serial('scriptwriter creates client for chromium', async (t) => {
	const scriptwriter = new Scriptwriter();
	let allReady = waitFor(scriptwriter, 'ready', ['client']);
	await scriptwriter.init();
	await allReady;
	t.truthy(scriptwriter.company.client);
	scriptwriter.company.director.close();
});

test.serial('scriptwriter creates the .playbill action', async (t) => {
	const scriptwriter = new Scriptwriter();
	let allReady = waitFor(scriptwriter, 'ready', ['client']);
	await scriptwriter.init();
	await allReady;
	const { commands } = scriptwriter.company.director;
	t.truthy(commands.playbill);
	const { director } = scriptwriter.company;
	const log = waitFor(scriptwriter, 'log');
	director.commands.playbill.action.call(director);
	const [args] = await log;
	const [msg] = args;
	t.truthy(
		[
			'browser',
			'client',
			'director',
			'page',
			'playwright',
			'scriptwriter',
		].every((name) => msg.includes(name))
	);
	director.close();
});

test.serial('completer ', async (t) => {
	const scriptwriter = new Scriptwriter();
	let allReady = waitFor(scriptwriter, 'ready', ['client']);
	await scriptwriter.init();
	await allReady;
	t.deepEqual(
		scriptwriter.completer('client.o'),
		[['client.off', 'client.on', 'client.once'], 'client.o'],
		'returns company objects'
	);
	t.deepEqual(
		scriptwriter.completer('fs.writev'),
		[['fs.writev', 'fs.writevSync'], 'fs.writev'],
		'returns native objects'
	);
	t.deepEqual(
		scriptwriter.completer('await '),
		[[], 'await '],
		'ignores general syntax'
	);
	t.deepEqual(
		scriptwriter.completer('fs'),
		[[], 'fs'],
		'ignores non-getter syntax'
	);
	t.deepEqual(
		scriptwriter.completer('foo.'),
		[[], 'foo.'],
		'ignores unknown objects'
	);
	t.deepEqual(
		scriptwriter.completer('await page'),
		[[], 'await page'],
		'can handle the last token'
	);
	t.deepEqual(
		scriptwriter.completer('await page.accessibility.s'),
		[['await page.accessibility.snapshot'], 'await page.accessibility.s'],
		'can handle nested and within a line of syntax'
	);
	t.deepEqual(
		scriptwriter.completer('director.commands.play'),
		[['director.commands.playbill'], 'director.commands.play'],
		'handles null prototype objects'
	);
});

test.serial('can launch a persistant context', async (t) => {
	const scriptwriter = new Scriptwriter({ userDataDir: tempfile() });
	let allReady = waitFor(scriptwriter, 'ready', ['client']);
	await scriptwriter.init();
	await allReady;
	t.truthy(scriptwriter.company.client);
	scriptwriter.company.director.close();
});

function waitFor(emitter, event, only) {
	return new Promise((resolve) => {
		emitter.on(event, (...args) => {
			if (only && JSON.stringify(only) !== JSON.stringify(args)) return;
			resolve(args);
		});
	});
}
