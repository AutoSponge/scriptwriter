module.exports = async function (scriptwriter) {
	const { director } = scriptwriter.company;
	const { magenta } = scriptwriter.color;
	if (!director.commands.playbill) {
		scriptwriter.log(magenta('.help for help. Tab twice for hints.'));
	}
	await scriptwriter.defineCommands();
	director.displayPrompt();
};
