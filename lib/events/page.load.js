module.exports = async function (scriptwriter) {
	const { green, yellow } = scriptwriter.color;
	const { page, director } = scriptwriter.company;
	const url = await page.url();
	const { host } = new URL(url);
	const prompt = `${green(host)} ${yellow('~>')} `;
	director.setPrompt(prompt);
	director.displayPrompt();
};
