var nconf = require('nconf');

nconf.argv()
	.env()
	.file({
		file: process.cwd() + '/config.json'
	})
	.file('default', {
		file: __dirname + '/../config.json'
	});

module.exports = nconf;
