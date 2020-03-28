const { magenta } = require('kleur');

module.exports = function() {
	console.log(magenta('repl session ended.'));
	process.exit();
};
