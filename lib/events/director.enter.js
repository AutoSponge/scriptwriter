const { magenta } = require('kleur');
const PLAYBILL = 'playbill'
const COMMAND_PLAYBILL = `.${PLAYBILL}`

module.exports = function(scriptwriter) {
	const { director } = scriptwriter.company;
	scriptwriter.assign({ scriptwriter });
	director.displayPrompt();
	if (scriptwriter.completions.includes(COMMAND_PLAYBILL)) return;
	console.log(magenta('.help for help. Tab twice for hints.'));
	scriptwriter.completion = COMMAND_PLAYBILL;
	director.defineCommand(PLAYBILL, {
		help: `List the scriptwriter's ${PLAYBILL}`,
		action() {
			const credits = Object.keys(scriptwriter.company).sort();
			console.log(credits.join('\n'));
			director.displayPrompt();
		},
	});
};
