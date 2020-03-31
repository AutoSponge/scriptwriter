const test = require('ava');
const Scriptwriter = require('../scriptwriter');

test.serial('commands must bust cache on .clear', async (t) => {
	const scriptwriter = new Scriptwriter();
	t.is(scriptwriter.replServer, null);
	let allReady = waitFor(scriptwriter, 'ready', ['client']);
	await scriptwriter.init();
	await allReady;
	const replServer = scriptwriter.company.director;
	const playbill = replServer.commands.playbill.action;
	allReady = waitFor(scriptwriter, 'ready', ['client']);
	replServer.commands.clear.action.call(replServer);
	await allReady;
	t.isNot(playbill, replServer.commands.playbill.action);
	scriptwriter.company.director.close();
});
