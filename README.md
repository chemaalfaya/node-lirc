node-lirc
=========

``node-lirc`` is an npm module that provides a wrapper around some LIRC executables so that you can make LIRC calls from node.

It is intended to be used in a scenario where you want to control infrared devices from a [Node.js](https://nodejs.org) application.

### LIRC

[LIRC](http://lirc.org) is an open source software package that allows you to send and receive infrared commands from Linux.

It provides certain command line executables like [irrecord](http://www.lirc.org/html/irrecord.html), that allow you to record your remotes signal codes, and [irsend](http://www.lirc.org/html/irsend.html), that uses those codes to send them back to your devices.

## Installation
	$ npm install node-lirc

## How to use it

Require the module

	var nodeLIRC = require('node-lirc');
	
### Recording remote signal codes

	// Configure your device
	nodeLIRC.irrecord.setDevice('/dev/lirc0'); //Default '/dev/lirc'
	nodeLIRC.irrecord.setConfigFile('Samsung_AA59-00581A.conf'); //Default '_lircd.conf'
	
	// Setup the event listeners
	nodeLIRC.irrecord.on('stdout', function(event) {
		console.log(event.instructions);
		
		...
		
		if (event.eventName == 'EVENT_BUTTON_NAME')
			event.writeLine('VOLUME_UP');
			
		...
	});
	
	nodeLIRC.irrecord.on('stderr', function(data) {
		console.log('irrecord output stderr: ' + data.toString());
	});
	
	nodeLIRC.irrecord.on('exit', function(code) {
		console.log('irrecord exited with code ' + (code?code.toString():'(unknown)'));
	});
	
	// Start irrecord process
	nodeLIRC.irrecord.start();
	
	...
	
	// Stop irrecord process
	nodeLIRC.irrecord.stop();

### Sending remote signal codes

    // Initialize
    nodeLIRC.init();

    // Get all the remotes and commands known by LIRC
    console.log(nodeLIRC.remotes);

    // Tell our Samsung TV to turn the volume up
    nodeLIRC.irsend.send_once("Samsung_AA59-00581A", "VOLUME_UP", function() {
      console.log("Samsung_AA59-00581A -> VOLUME_UP command sent!");
    });

## Irrecord events reference

Every event json object provided to the listener function when an event is fired consist of:

	event = {
		eventName: "EVENT_NAME",		///(String) Event name
		error: 0,						///(Int) 0:OK, 1:warning, 2:critical
		trigger: ['...', '...'],		///(String Array) Strings used to parse the
											irrecord output to determine which event
											should be emitted
		triggeredMessage: '...',		///(String) Irrecord output that matched
											the trigger
		instructions: '...'				///(String) Instructions to follow in order to
											continue the irrecord flow
	}

Available events are:

* EVENT_WELCOME
* EVENT_ANALYSIS
* EVENT_DOT
* EVENT_CONST_LENGTH
* EVENT_TIMEOUT_RAW_MODE
* EVENT_ANALYSIS_FINISHED
* EVENT_BUTTON_NAME
* EVENT_HOLD_BUTTON
* EVENT_TOGGLE_BIT_MASK
* EVENT_FINISHED
* EVENT_TIMEOUT
* EVENT_TIMEOUT_NO_SIGNAL

## Development

Feel free to contribute and improve this module.

Clone the repository:

```
git clone git://github.com/chemaalfaya/node-lirc.git
```

Then:

```
cd node-lirc
npm install
```

And... happy coding!


## License

(The ISC License)

Copyright (c) 2016 Chema Alfaya Montero &lt;chemaalfaya@gmail.com&gt;

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.