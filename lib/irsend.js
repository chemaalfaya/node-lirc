var exec = require('child_process').exec;
var config = require('./config');

function IRSend () {
	this.command = config.get('node-lirc:commands:irsend');
}

IRSend.prototype.setSocket = function(socket) {
	if (socket) {
		this.command = config.get('node-lirc:commands:irsend') + ' -d ' + socket;
	} else {
		this.command = config.get('node-lirc:commands:irsend');
	}
}

IRSend.prototype.list = function(remote, code, callback) {
	if (!remote) remote = '';
	if (!code) code = '';
	var command = this.command + ' LIST "' + remote + '" "' + code + '"';

	return exec(command, callback);
}

IRSend.prototype.sendOnce = function(remote, code, callback) {
	if (!remote) remote = '';
	if (!code) code = '';

	if (code instanceof Array) {
		var newCode = '';

		code.forEach(function(element, index, array) {
			newCode = newCode + '"' + element + '" ';
		});

		code = newCode.trim();
		code = code.substr(1, code.length-2);
	}

	var command =  this.command + ' SEND_ONCE "' + remote + '" "' + code + '"';
	
	return exec(command, callback);
}

IRSend.prototype.sendStart = function(remote, code, callback) {
	if (!remote) remote = '';
	if (!code) code = '';
	var command = this.command + ' SEND_START "' + remote + '" "' + code + '"';

	return exec(command, callback);
}

IRSend.prototype.sendStop = function(remote, code, callback) {
	if (!remote) remote = '';
	if (!code) code = '';
	var command = this.command + ' SEND_STOP "' + remote + '" "' + code + '"';

	return exec(command, callback);
}

IRSend.prototype.setTransmitters = function(transmitters, callback) {
	if (transmitters instanceof Array) {
		var newTransmitters = '';

		transmitters.forEach(function(element, index, array) {
			newTransmitters = newTransmitters + element + " ";
		});

		transmitters = newTransmitters.trim();
	}

	var command = this.command + ' SET_TRANSMITTERS ' + transmitters;
	return exec(command, callback);
}

IRSend.prototype.simulate = function(code, callback) {
	var command = this.command + ' SIMULATE "' + code + '"';
	return exec(command, callback);
}

module.exports = new IRSend();
