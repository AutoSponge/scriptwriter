exports.name = 'dump';
exports.command = {
	help: `serializes and saves an object as .json (args: space separated file and the object to dump)`,
	action(file_objVar) {
		const [file, objVar] = file_objVar.split(/\s+/);
		if (!file || !objVar) return;
		const line = `await fs.promises.writeFile("${file}.json", JSON.stringify(${objVar}, null, '  '));`;
		this.eval(line, this.context, '', () => {
			this.lines.push(line);
		});
		this.displayPrompt();
	},
};
