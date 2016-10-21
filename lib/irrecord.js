var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var readline = require('readline');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var self;
var buffer;
var timeout;

function IRRecord () {
	self = this;
	this.device = '/dev/lirc';
	this.configFile = '_lircd.conf';
	this.irrev = require('./irrecord-events');
	this.process = null;
}

IRRecord.prototype.setDevice = function(device) {
	if (device) {
		this.device = device;
	} else {
		this.device = '/dev/lirc';
	}
}

IRRecord.prototype.setConfigFile = function(configFile) {
	if (configFile) {
		this.configFile = configFile;
	} else {
		this.configFile = '_lircd.conf';
	}
}

IRRecord.prototype.start = function() {
	buffer = '';
	removeConfigFile();
	//killLIRCd();
	this.process = spawn('unbuffer', ['-p', 'irrecord', '-d', this.device, this.configFile, '--disable-namespace']);
	this.process.stdout.setEncoding('utf8');
	
	var rl = readline.createInterface({
		input: this.process.stdout,
		terminal: false
	});

	rl.on('line', function(line) {
		buffer += line + '\n';
		clearTimeout(timeout);
		timeout = setTimeout(processStdout, 500);
	});

	//Special case for EVENT_DOT event
	this.process.stdout.on('data', function(data){
		var str = data.toString();
		if (str == '.') {
			var event = {
				eventName: "EVENT_DOT",
				error: 0,
				triggerMessage: '.',
				triggeredMessage: '.',
				instructions: '.'
			}
			eventEmitter.emit('stdout', event);
		}
	});

	this.process.stderr.on('data', function (data) {
        console.log('irrecord output stderr: ' + data.toString());
        eventEmitter.emit('stderr', data);
    });
    this.process.on('exit', function (code) {
        console.log('irrecord exited with code ' + (code?code.toString():'(unknown)'));
        eventEmitter.emit('exit', code);
    });
}

IRRecord.prototype.writeLine = function (text) {
	if (!text) text = '';

	if (this.process) 
		this.process.stdin.write(text + '\n');
}

IRRecord.prototype.stop = function () {
	if (this.process) {
		this.process.kill('SIGINT');
		this.process = null;
	}
}

IRRecord.prototype.on = function(eventName, listener) {
	eventEmitter.on(eventName, listener);
}

//------------------------------ PRIVATE METHODS ------------------------------

function processStdout() {
	var str = buffer;
	buffer = '';

	if (event = self.irrev.resolveTriggeredMessage(str)) {
		console.log(event.instructions);
		eventEmitter.emit('stdout', event);
		if ((event.eventName == 'EVENT_ANALYSIS_FINISHED') || (event.eventName == 'EVENT_TIMEOUT_RAW_MODE'))
			eventEmitter.emit('stdout', self.irrev.getEvent('EVENT_BUTTON_NAME'));
	}
}

function removeConfigFile () {
	exec('rm ' + self.configFile);
}

/*function killLIRCd () {
	//sudo kill `cat /var/run/lirc/lircd.pid`
}

function startLIRCd () {
	//sudo lircd --uinput --driver=default --device=/dev/lirc0
}*/

module.exports = new IRRecord();