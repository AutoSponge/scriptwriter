import fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import link from 'terminal-link';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function (scriptwriter) {
	const playwrightPkg = await fs.readFile(
		join(__dirname, '../../node_modules/playwright/package.json'),
		'utf8',
	);
	const { version } = JSON.parse(playwrightPkg);
	const { director } = scriptwriter.company;
	const { magenta, green } = scriptwriter.color;
	if (!director.commands.playbill) {
		const { eraseStartLine, cursorLeft } = scriptwriter.escapes;
		const start = `${eraseStartLine}${cursorLeft.repeat(2)}`;
		const vpath = `https://github.com/microsoft/playwright/releases/tag/v${version}`;
		scriptwriter.log(
			green(`${start}Playwright version ${link(version, vpath)} loaded.`),
		);
		scriptwriter.log(magenta(`${start}.help for help. Tab twice for hints.`));
	}
	await scriptwriter.defineCommands();
	director.displayPrompt();
}
