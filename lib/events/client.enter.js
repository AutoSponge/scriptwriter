module.exports = async function(scriptwriter) {
	const { client } = scriptwriter.company;
	await Promise.all([
        client.send('Accessibility.enable'),
        client.send('Runtime.enable'),
        client.send('DOM.enable'),
    ]);
};
