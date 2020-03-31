exports.name = 'clearScreen';
exports.command = {
	help: 'Clears the screen',
	action() {
		const { scriptwriter, director } = this.context;
		scriptwriter.log(scriptwriter.escapes.clearScreen);
		director.displayPrompt();
	},
};
