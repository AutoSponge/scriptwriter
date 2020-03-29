const { magenta } = require('kleur');

module.exports = function (scriptwriter) {
	scriptwriter.log(magenta('repl session ended.'));
	/* istanbul ignore if */
	if (process.env.NODE_ENV !== 'test') process.exit();
};
