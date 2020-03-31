module.exports = async function (scriptwriter) {
	const { context } = scriptwriter.company;
	const page = await context.newPage();
	await scriptwriter.assign({ page });
	/* istanbul ignore next */
	if (context.newCDPSession) {
		const client = await context.newCDPSession(page);
		await scriptwriter.assign({ client });
	}
	scriptwriter.emit('ready', 'context');
};
