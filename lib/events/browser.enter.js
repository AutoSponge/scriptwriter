const dlv = require('dlv');
module.exports = async function (scriptwriter) {
	const { company, config } = scriptwriter;
	const { browser, playwright } = company;
	const contextConfig = {
		viewport: null,
		...dlv(playwright.devices, [config.device], {}),
		...dlv(config, 'context', {}),
	};
	const context = await browser.newContext(contextConfig);
	scriptwriter.assign({ context });
};
