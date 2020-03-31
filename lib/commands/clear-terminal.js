exports.name = 'clearTerminal';
exports.command = {
	help: 'Clears the screen and scroll buffer',
	action() {
		const { scriptwriter, director } = this.context;
		scriptwriter.log(scriptwriter.escapes.clearTerminal);
		director.displayPrompt();
	},
};
