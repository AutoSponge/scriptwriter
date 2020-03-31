exports.name = 'clearTerminal';
exports.command = {
	help: 'Clears the screen and scroll buffer',
	action() {
		const { scriptwriter } = this.context;
		scriptwriter.log(scriptwriter.escapes.clearTerminal);
		this.displayPrompt();
	},
};
