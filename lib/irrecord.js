var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var readline = require('readline');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var fs = require('fs');

var config = require('./config');
var unbuffer = config.get('node-lirc:commands:unbuffer');
var irrecord = config.get('node-lirc:commands:irrecord');
var tmp_dir = config.get('node-lirc:tmp_dir');

var self;
var buffer;
var timeout;

function IRRecord () {
	self = this;
	this.device = config.get('node-lirc:device');
	this.remote = config.get('node-lirc:remote');
	this.irrev = require('./irrecord-events');
	this.process = null;
}

IRRecord.prototype.start = function(remote) {
	buffer = '';
	setRemote (remote);
	removeConfigFile();
	createTmpDir();
	this.process = spawn(unbuffer, ['-p', irrecord, '-d', this.device, this.remote, '--disable-namespace'], { cwd: tmp_dir });
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
				trigger: ['.'],
				triggeredMessage: '.',
				instructions: '.'
			}
			eventEmitter.emit('stdout', event);
		}
	});

	this.process.stderr.on('data', function (data) {
        //console.log('irrecord output stderr: ' + data.toString());
        eventEmitter.emit('stderr', data);
    });
    this.process.on('exit', function (code) {
        //console.log('irrecord exited with code ' + (code?code.toString():'(unknown)'));
        this.process = null;
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

function setRemote (remote) {
	if (remote) {
		self.remote = remote;
	} else {
		self.remote = config.get('node-lirc:remote');
	}
}

function processStdout() {
	var str = buffer;
	buffer = '';

	if (event = self.irrev.resolveTriggeredMessage(str)) {
		//console.log(event.instructions);
		eventEmitter.emit('stdout', event);
		if ((event.eventName == 'EVENT_ANALYSIS_FINISHED') || (event.eventName == 'EVENT_TIMEOUT_RAW_MODE'))
			eventEmitter.emit('stdout', self.irrev.getEvent('EVENT_BUTTON_NAME'));
		if (event.eventName == 'EVENT_FINISHED') {
			readConfigFile();
		}
	}
}

function createTmpDir() {
	exec('mkdir ' + tmp_dir);
}

function removeConfigFile () {
	//console.log('rm ' + (tmp_dir + self.remote));
	exec('rm ' + (tmp_dir + self.remote));
}

function parseConfigFile (data) {
	var configuration = data.match(/(begin remote(.|[\r?\n])*end remote)/)[1];
	var remoteName = configuration.match(/begin remote\n*\s*name\s*(.*)\n/)[1];
	
	var remoteConfig = {
		name: remoteName,
		configuration: configuration
	};

	return remoteConfig;
}

function readConfigFile () {
	fs.readFile((tmp_dir + self.remote), 'utf8', function(err, data) {
		if (err) return console.log(err);
		removeConfigFile ();
		var remoteConfig = parseConfigFile(data);
		eventEmitter.emit('remote-config-ready', remoteConfig);
	});
}

module.exports = new IRRecord();