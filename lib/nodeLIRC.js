var async = require('async');
var self;

function NodeLIRC () {
	self = this;
	this.irsend = require('./irsend');
	this.irrecord = require('./irrecord');

	this.remotes = [];
}

NodeLIRC.prototype.init = function(callback) {
	this.reloadData(function() {
		if (callback) callback();
	});
}

NodeLIRC.prototype.reloadData = function(callback) {
	this.irsend.list('','', function(error, stdout, stderr) {
		loadRemotes(error, stdout, stderr, function() {
			if (callback) callback();
		});
	});
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
	var calls = [];
	for (var remote in self.remotes) {
		calls.push(function(cb) {
			self.irsend.list(remote, '', function(error, stdout, stderr){
				loadRemoteCommands(remote, error, stdout, stderr);
				cb(null,null);
			});
		});
	}

	async.parallel(calls, function(error, result) {
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

module.exports = new NodeLIRC();
