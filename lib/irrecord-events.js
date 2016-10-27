function IRRecordEvents () {	
	this.events =
	[
		{
			eventName: "EVENT_WELCOME",
			error: 0,
			trigger:
				[
`irrecord -  application for recording IR-codes for usage with lirc

Copyright (C) 1998,1999 Christoph Bartelmus(lirc@bartelmus.de)

This program will record the signals from your remote control
and create a config file for lircd.


A proper config file for lircd is maybe the most vital part of this
package, so you should invest some time to create a working config
file. Although I put a good deal of effort in this program it is often
not possible to automatically recognize all features of a remote
control. Often short-comings of the receiver hardware make it nearly
impossible. If you have problems to create a config file READ THE
DOCUMENTATION of this package, especially section "Adding new remote
controls" for how to get help.

If there already is a remote control of the same brand available at
http://www.lirc.org/remotes/ you might also want to try using such a
remote as a template. The config files already contain all
parameters of the protocol used by remotes of a certain brand and
knowing these parameters makes the job of this program much
easier. There are also template files for the most common protocols
available in the remotes/generic/ directory of the source
distribution of this package. You can use a template files by
providing the path of the file as command line parameter.

Please send the finished config files to <lirc@bartelmus.de> so that I
can make them available to others. Don't forget to put all information
that you can get about the remote control in the header of the file.

Press RETURN to continue.`
				]
		},
		{
			eventName: "EVENT_ANALYSIS",
			error: 0,
			trigger:
				[
`Now start pressing buttons on your remote control.

It is very important that you press many different buttons and hold them
down for approximately one second. Each button should generate at least one
dot but in no case more than ten dots of output.
Don't stop pressing buttons until two lines of dots (2x80) have been
generated.`

///Press RETURN now to start recording.`
				]
		},
		{
			eventName: "EVENT_CONST_LENGTH",
			error: 0,
			trigger:
				[
///`Found const length:`,
`Please keep on pressing buttons like described above.`
				]
		},
		{
			eventName: "EVENT_TIMEOUT_RAW_MODE",
			error: 1, //warning
			trigger:
				[
`irrecord: no data for 10 secs, aborting
Creating config file in raw mode.
Now enter the names for the buttons.

Please enter the name for the next button (press <ENTER> to finish recording)`
				]
		},
		{
			eventName: "EVENT_ANALYSIS_FINISHED",
			error: 0,
			trigger:
				[
///`Space/pulse`,///`Space/pulse encoded remote control found.`,
///`Signal length`,///`Signal length is`,
///`header`,///`Found possible header:`,
///`trail pulse`,///`Found trail pulse:`,
///`repeat code`,///`No repeat code found.`,
///`Signals are space encoded.`,
///`Signal length is`,
`Now enter the names for the buttons.`,

`Please enter the name for the next button (press <ENTER> to finish recording)`
				]
		},
		{
			eventName: "EVENT_BUTTON_NAME",
			error: 0,
			trigger:
				[
///`Got it.`,
///`Signal length is`,

`Please enter the name for the next button (press <ENTER> to finish recording)`
				]
		},
		{
			eventName: "EVENT_HOLD_BUTTON",
			error: 0,
			trigger:
				[
`Now hold down button`
				]
		},
		{
			eventName: "EVENT_TOGGLE_BIT_MASK",
			error: 0,
			trigger:
				[
`Checking for toggle bit mask.
Please press an arbitrary button repeatedly as fast as possible.
Make sure you keep pressing the SAME button and that you DON'T HOLD
the button down!.
If you can't see any dots appear, then wait a bit between button presses.`

///Press RETURN to continue.
				]
		},
		{
			eventName: "EVENT_FINISHED",
			error: 0,
			trigger:
				[
///`No toggle bit mask found.`,
`Successfully written config file.`
				]
		},
		{
			eventName: "EVENT_TIMEOUT",
			error: 2, //critical
			trigger:
				[
`irrecord: no data for 10 secs, aborting
irrecord: gap not found, can't continue`
				]
		},
		{
			eventName: "EVENT_TIMEOUT_NO_SIGNAL",
			error: 1, //warning
			trigger:
				[
`irrecord: no data for 10 secs, aborting
The last button did not seem to generate any signal.
Press RETURN to continue.`
				]
		}
	];
}

IRRecordEvents.prototype.resolveTriggeredMessage = function(triggeredMessage) {
	for (var i = 0; i < this.events.length; i++) {
		if (eventContainsTriggeredMessage(triggeredMessage, this.events[i]))
			return prepareEvent(this.events[i], triggeredMessage);
	}
	return null;
}

IRRecordEvents.prototype.getEvent = function(eventName) {
	for (var i = 0; i < this.events.length; i++) {
		if (this.events[i].eventName == eventName) return prepareEvent(this.events[i], '');
	}
	return null;
}

//------------------------------ PRIVATE METHODS ------------------------------

function eventContainsTriggeredMessage (triggeredMessage, event) {
	for (var i = 0; i < event.trigger.length; i++) {
		if (!triggeredMessage.includes(event.trigger[i])) return false;
	}
	return true;
}

function prepareEvent(originalEvent, triggeredMessage) {
	var event = originalEvent;
	event.triggeredMessage = triggeredMessage;
	event.instructions = '';
	for (var i = 0; i < event.trigger.length; i++) {
		event.instructions += event.trigger[i] + '\n';
	}
	//Special modifications cases
	if (event.eventName == 'EVENT_ANALYSIS')
		event.instructions += "Press RETURN now to start recording.\n";
	if (event.eventName == 'EVENT_TOGGLE_BIT_MASK')
		event.instructions += "Press RETURN to continue.\n";
	if (event.eventName == 'EVENT_HOLD_BUTTON')
		event.instructions = event.instructions.slice(0, -1) + ' "' + triggeredMessage.match(/\"(.*)\"/)[1] + '"\n';

	return event;
}

module.exports = new IRRecordEvents();
