const link = require('terminal-link');
const PLAYBILL = 'playbill';
const command = {
	help: `List the scriptwriter's ${PLAYBILL}`,
	action() {
		const { scriptwriter } = this.context;
		const credits = Object.keys(scriptwriter.company).sort();
		const maxLength = Math.max(...credits.map((c) => c.length)) + 2;
		scriptwriter.log(
			credits
				.map((c) =>
					[
						getLink(c),
						' '.repeat(maxLength - c.length),
						getDescription(c),
					].join('')
				)
				.join('\n')
		);
		this.displayPrompt();
	},
};
exports.name = PLAYBILL;
exports.command = command;

function getLink(name) {
	const PLAYWRIGHT_API =
		'https://github.com/microsoft/playwright/blob/v0.12.1/docs/api.md';
	switch (name) {
		case 'page':
		case 'browser':
			return link(name, `${PLAYWRIGHT_API}#class-${name}`);
		case 'client':
			return link(name, 'https://chromedevtools.github.io/devtools-protocol/');
		case 'context':
			return link(name, `${PLAYWRIGHT_API}#class-browser${name}`);
		case 'director':
			return link(name, 'https://nodejs.org/api/repl.html');
		case 'playwright':
			return link(name, PLAYWRIGHT_API);
		case 'scriptwriter':
			return link(name, 'https://github.com/AutoSponge/scriptwriter#readme');
		default:
	}
}

function getDescription(name) {
	switch (name) {
		case 'page':
			return `Playwright's Page instance for the browser's context.`;
		case 'browser':
			return `Playwright's Browser instance.`;
		case 'client':
			return `Playwright's CDPSession instance (Chrome only).`;
		case 'context':
			return `Playwright's BrowserContext instance for the browser.`;
		case 'director':
			return `Node's repl instance.`;
		case 'playwright':
			return `Playwright object.`;
		case 'scriptwriter':
			return `The instance object that controls the director.`;
		default:
	}
}
