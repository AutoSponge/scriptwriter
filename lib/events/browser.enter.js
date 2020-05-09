const dlv = require('dlv');
module.exports = async function (scriptwriter) {
	const { company, config } = scriptwriter;
	const { browser, playwright } = company;
	const browserConfig = {
		viewport: null,
		...dlv(playwright.devices, [config.device], {}),
		...dlv(config, 'context', {}),
	};
	const pages = browser.pages ? await browser.pages() : [];
	let page, context;
	if (pages.length) {
		[page] = pages;
		context = browser;
		await scriptwriter.assign({ context }, true);
	} else {
		page = await browser.newPage(browserConfig);
		[context] = await browser.contexts();
		await scriptwriter.assign({ context });
	}
	/* istanbul ignore next */
	if (context.newCDPSession) {
		const client = await context.newCDPSession(page);
		await scriptwriter.assign({ client });
	}
	await scriptwriter.assign({ page });
};
