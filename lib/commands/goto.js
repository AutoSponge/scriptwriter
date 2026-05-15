import normalized from 'normalize-url';

export const name = 'goto';
export const command = {
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
