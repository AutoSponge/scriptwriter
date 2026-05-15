export const name = 'dump';
export const command = {
	help: `serializes and saves an object as a supported file type (args: <object> <type> <depth>).`,
	action(args = '') {
		const { error, isPlainObject } = this.context.scriptwriter;
		const { magenta, green } = this.context.scriptwriter.color;

		if (!args.length) {
			error(new Error(`"No arguments. Usage: .dump <file> <object>"`));
			this.displayPrompt();
			return;
		}
		const tokens = args.trim().split(/\s+/).filter(Boolean);
		const objVar = tokens.shift();
		let type = 'txt',
			line,
			params,
			colors = false;
		if (tokens.length) {
			type = tokens.shift().toLowerCase();
		}
		let depth = null;
		if (tokens.length) {
			depth = parseInt(tokens.shift());
		}
		const filePath = `${objVar}.${type}`;
		console.log(magenta(`Dumping ${objVar} as ${type}...`));
		switch (type) {
			case 'ansi':
				params = `"${filePath}", util.inspect(${objVar},  { showHidden: true, depth: ${depth}, colors: true })`;
				break;
			case 'json':
				params = `"${filePath}", JSON.stringify(${objVar}, null, '  ')`;
				break;
			case 'txt':
				params = `"${filePath}", util.inspect(${objVar},  { showHidden: true, depth: ${depth}, colors: false })`;
				break;
			default:
				params = `"${filePath}", String(${objVar})`;
		}
		line = `await fs.promises.writeFile(${params});`;

		this.eval(line, this.context, '', (err) => {
			if (Array.isArray(this.lines)) {
				this.lines.push(line);
			}
			console.log(green(`File saved to ${filePath}`));
			this.displayPrompt();
		});
	},
};
