// video_chat.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
// https://media.prod.mdn.mozit.cloud/attachments/2016/01/27/12363/9d667775214ae0422fae606050f60c1e/WebRTC%20-%20Signaling%20Diagram.svg
// https://media.prod.mdn.mozit.cloud/attachments/2016/01/27/12365/b5bcd9ecac08ae0bc89b6a3e08cfe93c/WebRTC%20-%20ICE%20Candidate%20Exchange.svg

import { DEBUG, SIGNALS } from '../constants.js';

let instance_nr = -1;


/**
 * Signaler()
 */
export const Signaler = function (app, chat, sender_name, recipient_name, owner_instance_id) {
	const self = this;

	this.instanceId;


	/**
	 * send()
	 */
	this.send = function (data) {
		if( (DEBUG.VIDEO_CONNECT)
		&&  ((data.type != SIGNALS.CANDIDATE) || DEBUG.ICE_CANDIDATES)
		) {
			console.groupCollapsed(
				self.instanceId + '%cSIGNAL OUT %c>%c ' + recipient_name + ', type: %c' + data.type,
				'color:blue', 'color:red', 'color:black', 'color:green'
			);
			console.table( data );
			console.groupEnd();
		}

		chat.sendSignal( recipient_name, data );

	}; // send


	/**
	 * onreceive()
	 */
	this.onreceive = null;


	/**
	 * on_receive_signal()
	 */
	function on_receive_signal (message) {
		const data = message.data.signalData;

		if( (DEBUG.VIDEO_CONNECT)
		&&  ((data.type != SIGNALS.CANDIDATE) || DEBUG.ICE_CANDIDATES)
		) {
			console.groupCollapsed(
				self.instanceId + '%c<%c SIGNAL IN: %c' + sender_name + ', type: %c' + data.type,
				'color:red', 'color:blue', 'color:black', 'color:green'
			);
			console.table( message );
			console.groupEnd();
		}

		if (self.onreceive) {
			self.onreceive( message );
		} else {
			throw new Error( 'Event handler "onreceive" is not set' );
		}

	} // on_receive_signal


	/**
	 * exit()
	 */
	this.exit = function () {
		if (DEBUG.INSTANCES) console.log( self.instanceId + 'Signaler: terminating' );
		chat.removeEventListener( 'receivesignal', on_receive_signal );
		self.onreceive = null;

	}; // exit


	/**
	 * init()
	 */
	this.init = function (owner_instance_id) {
		if (DEBUG.INSTANCES) {
			++instance_nr;
			self.instanceId = owner_instance_id.slice( 0, -2 ) + 'sig[' + instance_nr + ']: ';
		} else {
			self.instanceId = '';
		}

		if (DEBUG.VIDEO_CONNECT) {
			console.log(
				self.instanceId + 'new Signaler: sender:',
				sender_name,
				'recipient:',
				recipient_name
			);
		}
		chat.addEventListener( 'receivesignal', on_receive_signal );

	}; // init


	// CONSTRUCTOR

	self.init( owner_instance_id );

}; // Signaler


//EOF