const normalized = require('normalize-url');
exports.name = 'goto';
exports.command = {
	help: 'page.goto with a normalized url',
	action(url) {
		const href = normalized(url, { forceHttps: true });
		const line = `await page.goto("${href}");`;
		this.eval(line, this.context, '', () => {
			this.lines.push(line);
		});
		this.displayPrompt();
	},
};
