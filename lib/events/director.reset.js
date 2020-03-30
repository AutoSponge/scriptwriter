const handler = async function (scriptwriter) {
	const { magenta } = scriptwriter.color;
	const { browser, director } = scriptwriter.company;
	await browser.close();
	await scriptwriter.init();
	scriptwriter.log(magenta('repl session reset.'));
	director.setPrompt('> ');
	director.displayPrompt();
};
handler.once = true;

module.exports = handler;
