const { magenta } = require('kleur');
const dlv = require('dlv')
const PLAYBILL = 'playbill';
const COMMAND_PLAYBILL = `.${PLAYBILL}`;

module.exports = function (scriptwriter) {
	const { director } = scriptwriter.company;
	scriptwriter.assign({ scriptwriter });
	director.displayPrompt();
	/* istanbul ignore if */
	if (dlv(scriptwriter, `director.commands.${PLAYBILL}`)) return;
	scriptwriter.log(magenta('.help for help. Tab twice for hints.'));
	scriptwriter.completion = COMMAND_PLAYBILL;
	director.defineCommand(PLAYBILL, {
		help: `List the scriptwriter's ${PLAYBILL}`,
		action() {
			const credits = Object.keys(scriptwriter.company).sort();
			scriptwriter.log(credits.join('\n'));
			director.displayPrompt();
		},
	});
};
