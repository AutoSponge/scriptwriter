import link from 'terminal-link';
import { resolvePlaywright } from '../resolve-playwright.js';

export default async function (scriptwriter) {
	let version;
	try {
		const resolved = await resolvePlaywright();
		version = resolved.version;
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
	} catch (error) {
		console.warn(`Warning: ${error.message}`);
	}
}
