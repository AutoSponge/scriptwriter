module.exports = function (scriptwriter) {
	const { magenta } = scriptwriter.color;
	scriptwriter.log(magenta('repl session ended.'));
	/* istanbul ignore if */
	if (process.env.NODE_ENV !== 'test') process.exit();
};
