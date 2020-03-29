module.exports = async function(scriptwriter) {
	const { context } = scriptwriter.company;
	try {
		const page = await context.newPage();
		scriptwriter.assign({ page });
		if (context.newCDPSession) {
			const client = await context.newCDPSession(page);
			scriptwriter.assign({ client });
		}
	} catch (err) {
		scriptwriter.log(err);
	}
};
