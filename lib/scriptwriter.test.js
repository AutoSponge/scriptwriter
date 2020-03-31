const test = require('ava');
const Scriptwriter = require('./scriptwriter');
const ansiEscapes = require('ansi-escapes');
const importGlobal = require('import-global');
const kleur = require('kleur');

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
	let directorReady = waitFor(scriptwriter, 'assign', ['director']);
	await scriptwriter.init();
	await directorReady;
	const replServer = scriptwriter.company.director;
	replServer.close();
	directorReady = waitFor(scriptwriter, 'assign', ['director']);
	await scriptwriter.init();
	await directorReady;
	t.is(replServer, scriptwriter.company.director);
	directorReady = waitFor(scriptwriter, 'assign', ['director']);
	replServer.resetContext();
	await directorReady;
	t.is(replServer, scriptwriter.company.director);
	scriptwriter.company.director.close();
});

test.serial('page.load updates the repl prompt', async (t) => {
	const scriptwriter = new Scriptwriter();
	await scriptwriter.init();
	const pageReady = waitFor(scriptwriter, 'assign', ['page']);
	const initalPrompt = scriptwriter.company.director._prompt;
	t.is(initalPrompt, '> ');
	await pageReady;
	const { page } = scriptwriter.company;
	const loaded = waitFor(page, 'load');
	page.emit('load');
	await loaded;
	t.not(scriptwriter.company.director._prompt, initalPrompt);
	scriptwriter.company.director.close();
});

test.serial('scriptwriter creates client for chromium', async (t) => {
	const scriptwriter = new Scriptwriter();
	const clientReady = waitFor(scriptwriter, 'assign', ['client']);
	await scriptwriter.init();
	await clientReady;
	t.truthy(scriptwriter.company.client);
	scriptwriter.company.director.close();
});

test.serial('scriptwriter creates the .playbill action', async (t) => {
	const scriptwriter = new Scriptwriter();
	const clientReady = waitFor(scriptwriter, 'assign', ['client']);
	await scriptwriter.init();
	await clientReady;
	const { commands } = scriptwriter.company.director;
	t.truthy(commands.playbill);
	const { director } = scriptwriter.company;
	const log = waitFor(scriptwriter, 'log');
	director.commands.playbill.action();
	const [args] = await log;
	const [msg] = args;
	t.truthy(
		[
			'browser',
			'client',
			'context',
			'director',
			'page',
			'playwright',
			'scriptwriter',
		].every((name) => msg.includes(name))
	);
	director.close();
});

test('completer ', async (t) => {
	const scriptwriter = new Scriptwriter();
	const clientReady = waitFor(scriptwriter, 'assign', ['client']);
	await scriptwriter.init();
	await clientReady;
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
		scriptwriter.completer('await page.accessibility.'),
		[
			[
				'await page.accessibility._getAXTree',
				'await page.accessibility.snapshot',
			],
			'await page.accessibility.',
		],
		'can handle nested and within a line of syntax'
	);
	t.deepEqual(
		scriptwriter.completer('director.commands.'),
		[
			[
				'director.commands.break',
				'director.commands.clear',
				'director.commands.exit',
				'director.commands.help',
				'director.commands.load',
				'director.commands.playbill',
				'director.commands.save',
			],
			'director.commands.',
		],
		'handles null prototype objects'
	);
});

function waitFor(emitter, event, only) {
	return new Promise((resolve) => {
		emitter.on(event, (...args) => {
			if (only && JSON.stringify(only) !== JSON.stringify(args)) return;
			resolve(args);
		});
	});
}
