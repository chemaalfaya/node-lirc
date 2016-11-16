var config = require('./config');
var async = require('async');
var exec = require('child_process').exec;
var fs = require('fs');
var deasync = require('deasync');
var self;

var reloadDataSync = deasync(reloadData);
var startSync = deasync(start);
var stopSync = deasync(stop);
var sendSync = deasync(send);

function NodeLIRC () {
	self = this;
	this.irsend = require('./irsend');
	this.irrecord = require('./irrecord');

	this.remotes = [];
}

NodeLIRC.prototype.init = function() {
	this.start();
	this.reloadData();
}

NodeLIRC.prototype.reloadData = function() {
	try {
		reloadDataSync();
	} catch (err) {
		console.log(err);
	}
}
/**/function reloadData (callback) {
/**/	start(function(err){
/**/		if (err)
/**/			return (callback) ? callback(error) : null;
/**/
/**/		self.irsend.list('','', function(error, stdout, stderr) {
/**/			loadRemotes(error, stdout, stderr, function() {
/**/				if (callback) callback();
/**/			});
/**/		});
/**/	});
/**/}

NodeLIRC.prototype.getRemotes = function() {
	var remotes = [];
	for (var remote in this.remotes) {
		var json_remote = {};
		json_remote.name = remote;
		json_remote.commands = this.remotes[remote];
		remotes.push(json_remote);
	}

	return remotes;
}

NodeLIRC.prototype.isRunning = function () {
	return fs.existsSync(config.get('node-lirc:lirc_pid'));
}

NodeLIRC.prototype.start = function () {
	try {
		startSync();
	} catch (err) {
		console.log(err);
	}
}
/**/function start (callback) {
/**/	if (self.isRunning()) {
/**/		//console.log('Lirc was already running.');
/**/		return (callback) ? callback(null) : null;
/**/	}
/**/
/**/	exec(config.get('node-lirc:commands:lircd') + ' --uinput --driver=' + config.get('node-lirc:lirc_driver') + ' --device=' + config.get('node-lirc:device'), (error, stdout, stderr) => {
/**/		if (error) {
/**/			console.log(error);
/**/			return (callback) ? callback(error) : null;
/**/		} else {
/**/			//console.log('Lirc started.');
/**/			return (callback) ? callback(null) : null;
/**/		}
/**/	});
/**/}

NodeLIRC.prototype.stop = function () {
	try {
		stopSync();
	} catch (err) {
		console.log(err);
	}
}
/**/function stop (callback) {
/**/	if (!self.isRunning()) {
/**/		//console.log('Lirc was already stopped.');
/**/		return (callback) ? callback(null) : null;
/**/	}
/**/
/**/	exec('kill `cat ' + config.get('node-lirc:lirc_pid') + '`', (error, stdout, stderr) => {
/**/		if (error) {
/**/			console.log(error);
/**/			return (callback) ? callback(error) : null;
/**/		} else {
				while (self.isRunning());
/**/			//console.log('Lirc stopped.');
/**/			return (callback) ? callback(null) : null;
/**/		}
/**/	});
/**/}

NodeLIRC.prototype.send = function (remote, code, duration) {
	try {
		sendSync(remote, code, duration);
	} catch (err) {
		console.log(err);
	}
}
/**/function send (remote, code, duration, callback) {
/**/	if (!duration || duration <= 0) duration = 200;
/**/	self.irrecord.stop();
/**/	self.start();
/**/	self.irsend.sendStart(remote, code, function(err) {
/**/		if (err) {
/**/			return (callback) ? callback(err) : null;
/**/		}
/**/		setTimeout(function() {
/**/			self.irsend.sendStop(remote, code, callback);
/**/		}, duration);
/**/	});
/**/}

NodeLIRC.prototype.record = function (remote) {
	this.irrecord.stop();
	this.stop();
	this.irrecord.start(remote);
}

NodeLIRC.prototype.on = function(eventName, listener) {
	this.irrecord.on(eventName, listener);
}

NodeLIRC.prototype.writeLine = function (text) {
	this.irrecord.writeLine(text);
}

NodeLIRC.prototype.insertRemote = function(remote, config, callback) {
	var remotes = readConfigFile();

	for (var i = 0; i < remotes.length; i++) {
		if (remotes[i].name == remote) {
			return (callback) ? callback('Remote already exists.') : null;
		}
	}

	var newRemote = {
		name: remote,
		configuration: config
	};
	remotes.push(newRemote);

	writeConfigFile(remotes, callback);
	this.stop();
	this.start();
}

NodeLIRC.prototype.upsertRemote = function(remote, config, callback) {
	var remotes = readConfigFile();

	var inserted = false;
	for (var i = 0; i < remotes.length; i++) {
		if (remotes[i].name == remote) {
			remotes[i].configuration = config;
			inserted = true;
		}
	}

	if (!inserted) {
		var newRemote = {
			name: remote,
			configuration: config
		};
		remotes.push(newRemote);
	}

	writeConfigFile(remotes, callback);
	this.stop();
	this.start();
}

NodeLIRC.prototype.deleteRemote = function(remote, callback) {
	var remotes = readConfigFile();

	var remove = -1;
	for (var i = 0; i < remotes.length; i++) {
		if (remotes[i].name == remote) {
			remove = i;
		}
	}

	if (remove > -1) remotes.splice(remove, 1);

	writeConfigFile(remotes, callback);
	this.stop();
	this.start();
}

//------------------------------ PRIVATE METHODS ------------------------------

function loadRemotes (error, stdout, stderr, callback) {
	var remotes = stderr.split('\n');
	self.remotes = [];

	remotes.forEach(function(element, index, array) {
		var remoteName = element.match(/\s(.*)$/);
		if (remoteName) self.remotes[remoteName[1]] = [];
	});

	loadCommands(function() {
		if (callback) callback();
	});
}

function loadCommands (callback) {
	var remotes = [];
	for (var remote in self.remotes) {
		remotes.push(remote);
	}
	async.eachSeries(remotes, function iteratee(item, cb){
		self.irsend.list(item, '', function(error, stdout, stderr){
			loadRemoteCommands(item, error, stdout, stderr);
			cb(null,null);
		});
	}, function done() {
		if (callback) callback();
	});

}

function loadRemoteCommands (remote, error, stdout, stderr) {
	var commands = stderr.split('\n');

	commands.forEach(function(element, index, array){
		var commandName = element.match(/\s.*\s(.*)$/);
		if (commandName && commandName[1]) self.remotes[remote].push(commandName[1]);
	});
}

function parseConfigFile (data) {
	var remotes = [];
	var result = null;
	do {
		result = data.match(/(begin remote((?!begin remote).|[\r?\n])*end remote)/);
		if (result) {
			var configuration = result[1];
			data = data.replace(configuration, '');
			var name = configuration.match(/begin remote\n*\s*name\s*(.*)\n/)[1];
			var remote = {
				name: name,
				configuration: configuration
			};
			remotes.push(remote);
		}
	} while (result);

	return remotes;
}

function readConfigFile () {
	try {
		var data = fs.readFileSync(config.get('node-lirc:lirc_conf'), { encoding: 'utf8' });
		return parseConfigFile(data);
	} catch (err) {
		console.log("error: " + err);
	}
	return [];
}

function writeConfigFile (remotes, callback) {
	var text = 
`# Please make this file available to others
# by sending it to <lirc@bartelmus.de>
#
# this config file was automatically generated
# using node-lirc
#
# brands:
# model no. of remote controls: 
# devices being controlled by this remotes:
#


`;

	for (var i = 0; i < remotes.length; i++) {
		text += remotes[i].configuration + '\n\n';
	}
	console.log(text);
	fs.writeFile(config.get('node-lirc:lirc_conf'), text, (err) => {
		if (err) {
			console.log(err);
			return (callback) ? callback(err) : null;
		} else {
			//console.log('Lirc config file updated.');
			return (callback) ? callback(null) : null;
		}
	});
}

module.exports = new NodeLIRC();
