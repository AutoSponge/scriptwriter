const { magenta } = require('kleur');

module.exports = async function(scriptwriter) {
    const { browser, director } = scriptwriter.company;
    await browser.close();
    await scriptwriter.init();
    console.log(magenta('repl session reset.'));
    director.setPrompt('> ');
    director.displayPrompt();
};
