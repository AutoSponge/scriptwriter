exports.name = 'clearScreen';
exports.command = {
	help: 'Clears the screen',
	action() {
		const { scriptwriter } = this.context;
		scriptwriter.log(scriptwriter.escapes.clearScreen);
		this.displayPrompt();
	},
};
