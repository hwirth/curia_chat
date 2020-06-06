// rtc_session.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// https://www.tutorialspoint.com/webrtc/

import {
	DEBUG, SETTINGS, REQUEST, RESPONSE,
	MEDIA_CONSTRAINTS, SIGNALS, ROOMS

} from '../constants.js';

import { TEXT, localized } from '../localize.js';
import { Signaler        } from '../calls/signaler.js';


let instance_nr = -1;


/**
 * RtcSession()
 */
export const RtcSession = function (app, chat, call, user_name, peer_name, as_caller, turn_info, owner_instance_id) {
	const self = this;

	this.instanceId;

	this.userName;
	this.peerName;
	this.isCaller;
	this.caller;
	this.callee;

	this.signaler;
	this.senders;
	this.remoteStreams;


	/**
	 * create_peer_connection()
	 */
	function create_peer_connection () {
		if (DEBUG.VIDEO_CONNECT) console.log( self.instanceId + 'Creating PeerConnection' );

		const pc = new RTCPeerConnection( self.iceConfig );
		pc.addEventListener( 'track',                    on_track );
		pc.addEventListener( 'removetrack',              on_remove_track );
		pc.addEventListener( 'negotiationneeded',        on_negotiation_needed );
		pc.addEventListener( 'signalingstatechange',     on_signaling_state_change );
		pc.addEventListener( 'iceconnectionstatechange', on_ice_connection_state_change );
		pc.addEventListener( 'icegatheringstatechange',  on_ice_gathering_state_change );
		pc.addEventListener( 'icecandidate',             on_ice_candidate );


		if (DEBUG.VIDEO_CONNECT) {
			console.groupCollapsed( self.instanceId + 'RTCPeerConnection.getConfiguration' );
			console.log( pc.getConfiguration() );
			console.groupEnd();
		}

		return pc;

	} // create_peer_connection


	/**
	 * destroy_peer_connection()
	 */
	function destroy_peer_connection () {
		if (self.peerConnection == undefined) {
			console.log(
				self.instanceId + '%cWARNING%c: peerConnection is undefined',
				'color:red', 'color:black'
			);

		} else {
			const pc = self.peerConnection;
			pc.removeEventListener( 'track',                    on_track );
			pc.removeEventListener( 'removetrack',              on_remove_track );
			pc.removeEventListener( 'negotiationneeded',        on_negotiation_needed );
			pc.removeEventListener( 'signalingstatechange',     on_signaling_state_change );
			pc.removeEventListener( 'iceconnectionstatechange', on_ice_connection_state_change );
			pc.removeEventListener( 'icegatheringstatechange',  on_ice_gathering_state_change );
			pc.removeEventListener( 'icecandidate',             on_ice_candidate );

			self.peerConnection.close();
			self.peerConnection = null;
		}

	} // destroy_peer_connection


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEBRTC EVENTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_track()
	 */
	async function on_track (event) {
		const pc      = self.peerConnection;
		const track   = event.track;
		const streams = event.streams;

console.log( 'ON_TRACK', streams.length, streams );

		if (DEBUG.VIDEO_CONNECT || DEBUG.VIDEO_STREAM) {
			console.groupCollapsed( self.instanceId + 'on_track:', track.kind, streams[0].id );
			console.log( event );
			console.log( track );
			console.log( streams );
			console.groupEnd();
		}

		const device = track.kind;
		const control_element = call.addControlElement(
			'REMOTE ' + device.toUpperCase() + ' ' + self.peerName,
			'remote ' + device
		);

		if (control_element.srcObject) {
			if (DEBUG.VIDEO_CONNECT) console.log( self.instanceId + 'srcObject already set' );
			return;
		}

		if (DEBUG.VIDEO_CONNECT) {
			console.log(
				self.instanceId + 'Adding incoming stream to remoteVideo',
				streams[0].id
			);
		}

		self.remoteStreams[streams[0].id] = {
			controlElement : control_element,
			stream         : streams[0],
			analyserStream : null,
		};

		control_element.srcObject = streams[0];
		control_element.volume    = SETTINGS.REMOTE_VOLUME;
		//...control_element.oncanplay = ()=>control_element.play();
		//...await control_element.play();
		control_element.play();

		call.updateVideoPanelVisibility();

	} // on_track


	/**
	 * toggleStreamAnalyser()
	 */
	this.toggleStreamAnalyser = function (enable) {
		if (call.analyser === null) return;

		Object.keys( self.remoteStreams ).forEach( (key)=>{
			const remote_stream = self.remoteStreams[key];

			if (remote_stream.analyserStream === null) {
				if (enable) {
					remote_stream.analyserStream = call.analyser.connectStream(
						remote_stream.stream
					);
				}
			} else {
				if (! enable) {
					call.analyser.disconnectStream( remote_stream.analyserStream );
					remote_stream.analyserStream = null;
				}
			}
		});

	}; // toggleStreamAnalyser


	/**
	 * on_remove_track()
	 */
	function on_remove_track (event) {
		console.log( self.instanceId + 'on_remove_track:', event );

	} // on_remove_track


	/**
	 * on_negotiation_needed()
	 */
	async function on_negotiation_needed () {
		if (DEBUG.VIDEO_CONNECT) {
			console.groupCollapsed( self.instanceId + 'on_negotiation_needed' );
			console.log( event );
			console.groupEnd();
		}

		const pc = self.peerConnection;


		/* Caller: Once the PeerConnection is created and tracks were added, negotiation_needed is triggered.
		 * To start the negotiation process, we have to send an SDP offer to the other party.
		 *
		 * Once setLocalDescription()'s fulfillment handler has run, the ICE agent begins sending icecandidate
		 * events to the RTCPeerConnection, one for each potential configuration it discovers. Our handler for
		 * the icecandidate event is responsible for transmitting the candidates to the other peer.
		 */

		const offer = await pc.createOffer();

		if (pc.signalingState != 'stable') {
			if (DEBUG.VIDEO_CONNECT) {
				console.log(
					'VideoChat: on_negotiation_needed: '
					+ 'Connection not stable yet, postponing'
				);
			}

			return;
		}

		await pc.setLocalDescription( offer );

		if (DEBUG.VIDEO_CONNECT) {
			console.groupCollapsed( self.instanceId + 'Sending offer' );
			console.log( pc.localDescription );
			console.groupEnd();
		}

		self.signaler.send({
			type        : SIGNALS.VIDEO_OFFER,
			description : pc.localDescription,
		});

	} // on_negotiation_needed


	/**
	 * on_video_offer()
	 */
	async function on_video_offer (signal) {
		if (DEBUG.VIDEO_CONNECT) console.log( self.instanceId + 'VideoChat: on_video_offer' );

		if (self.offerReceived) {
			console.log(
				'%cWARNING%c: on_video_offer: offer already received',
				'color:red', 'color:black'
			);
			//...return;
		}
		self.offerReceived = true;

		if (! self.peerConnection) {
			console.log(
				'%cWARNING&c: on_video_offer: No peerConnection, creating...',
				'color:red', 'color:black'
			);
			self.peerConnection = create_peer_connection();
		}

		const pc = self.peerConnection;
		const description = new RTCSessionDescription( signal.description );

		pc.setRemoteDescription( description )
		.then( ()=>{
			return pc.createAnswer();
		})
		.then( (answer)=>{
			return pc.setLocalDescription( answer );
		})
		.then( ()=>{
			self.signaler.send({
				type        : SIGNALS.VIDEO_ANSWER,
				description : pc.localDescription,
			});
		})
		.catch( (error)=>{
			console.log(
				self.instanceId + '%cERROR%c: VideoChat: on_video_offer:',
				'color:red', 'color:black',
				error
			);
			chat.showMessage( error, ROOMS.LOG, 'internal_error' );
		});

	} // on_video_offer


	/**
	 * on_video_answer()
	 */
	function on_video_answer (signal) {
		if (DEBUG.VIDEO_CONNECT) console.log( self.instanceId + 'VideoChat: on_video_answer' );

		if (self.peerConnection === null) {
			if (DEBUG.VIDEO_CONNECT) {
				console.log(
					'%cERROR%c: self.peerConnection is null',
					'color:red', 'color:black'
				);
			}
			return;
		}

		const description = new RTCSessionDescription( signal.description );

		self.peerConnection.setRemoteDescription( description )
		.catch( (error)=>{
			console.log(
				self.instanceId + '%cERROR%c: on_video_answer:',
				'color:red', 'color:black',
				error
			);
		});

	} // on_video_answer


	/**
	 * on_signaling_state_change()
	 */
	function on_signaling_state_change (event) {
		if (DEBUG.VIDEO_STATES) {
			console.groupCollapsed(
				'VideoChat: on_signaling_state_change: %c'
				+ self.peerConnection.signalingState
				, 'color:blue'
			);
			console.log( event );
			console.groupEnd();
		}

	} // on_signaling_state_change


	/**
	 * on_ice_connection_state_change()
	 */
	function on_ice_connection_state_change (event) {
		if (DEBUG.VIDEO_STATES) {
			console.groupCollapsed(
				'VideoChat: on_ice_connection_state_change: %c'
				+ self.peerConnection.iceConnectionState
				, 'color:blue',
			);
			console.log( event );
			console.groupEnd();
		}

	} // on_ice_connection_state_change


	/**
	 * on_ice_gathering_state_change()
	 */
	function on_ice_gathering_state_change  (event) {
		if (DEBUG.VIDEO_STATES) {
			console.groupCollapsed(
				'VideoChat: on_ice_gathering_state_change: %c'
				+ self.peerConnection.iceGatheringState
				, 'color:blue'
			);
			console.log( event );
			console.groupEnd();
		}

		if ((self.peerConnection.iceGatheringState == 'complete') && (! self.isCaller)) {
			self.addAllLocalStreams();
		}

	} // on_ice_gathering_state_change


	/**
	 * on_ice_candidate()
	 */
	function on_ice_candidate (event) {
		if (DEBUG.ICE_CANDIDATES) {
			let candidate_info = ' (null)';

			if (event.candidate !== null) {
				candidate_info
				= ' ' + event.candidate.type
				+ ' ' + event.candidate.component
				+ ' ' + event.candidate.protocol
				;
			}

			console.groupCollapsed( 'VideoChat: on_ice_candidate:%c' + candidate_info , 'color:blue' );
			console.log( event );
			console.groupEnd();
		}

		self.signaler.send({
			type      : SIGNALS.CANDIDATE,
			candidate : event.candidate,
		});

	} // on_ice_candidate


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// SIGNALING
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_call_started()
	 */
	function on_call_started () {
		setTimeout( self.showRtcStats, 1000);  //... Slow computer: Empty list without delay

	} // on_call_started


	/**
	 * remove_remote_stream()
	 */
	function remove_remote_stream (stream_id) {
		const remote_stream = self.remoteStreams[stream_id];

		if (remote_stream == undefined) {
			console.log(
				'%cERROR%c: remove_remote_stream: self.remoteStreams[id] undefined',
				'color:red', 'color:black'
			);

			return;
		}

		if (DEBUG.STREAMS) {
			console.groupCollapsed( self.instanceId + 'remove_remote_stream:' , stream_id );
			console.log( remote_stream );
			console.groupEnd();
		}

		if (call.analyser) call.analyser.disconnectStream( remote_stream.analyserStream );

		app.dom.divVideos.removeChild( remote_stream.controlElement.parentNode );
		remote_stream.analyserStream = null;
		delete self.remoteStreams[stream_id];

	} // remove_remote_stream


	/**
	 * on_signaler_receive()
	 */
	async function on_signaler_receive (message) {
		const signal      = message.data.signalData;
		const signal_type = (signal ? signal.type : '???');
		const pc          = self.peerConnection;

		if (signal == undefined) {
			console.log( self.instanceId + 'Signal undefined, aborting' );
			return;
		}

		switch (signal.type) {
		case SIGNALS.VIDEO_OFFER  :  on_video_offer( signal );   break;
		case SIGNALS.VIDEO_ANSWER :  on_video_answer( signal );  break;
		case SIGNALS.CANDIDATE: {
			if (self.peerConnection === null) {
				console.groupCollapsed(
					self.instanceId + '%cWEIRD%c: peerConnection is null',
					'color:red', 'color:black',
				);
				console.log( signal );
				console.groupEnd();
				return;
			}

			if (signal.candidate !== null) {
				pc.addIceCandidate( signal.candidate )
				.catch( (error)=>{
					console.log(
						self.instanceId + '%cWARNING%c: pc.addIceCandidate failed',
						'color:red', 'color:black',
						signal.candidate
					);
					//...throw error;
				});

			} else if (DEBUG.ICE_CANDIDATES) {
				console.log( self.instanceId + 'ICE candidate is null.' );
				on_call_started();
			}
		break; }
		case SIGNALS.REMOVE_STREAM :  remove_remote_stream( signal.streamId );  break;
		//... done in exit(): case SIGNALS.HANG_UP       :  close_video_call( signal.reason );        break;
		default:
			console.log( self.instanceId + '%cWARNING%c: Bogus signal type:', signal_type );
		}

	} // on_signaler_receive


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PUBLIC METHODS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * updateUserName()
	 */
	this.updateUserName = function (new_name) {
		self.userName = new_name;

	}; // updateUserName


	/**
	 * showRtcStats()
	 */
	this.showRtcStats = function () {
		const pc = self.peerConnection;

		if (pc === null) {
			chat.showMessage( localized( 'CALL_SOMEONE_FIRST' ), ROOMS.CURRENT, 'error' );
			console.groupCollapsed( '%cERROR%c: showRtcStats', 'color:red', 'color:black' );
			console.trace();
			console.groupEnd();

			return;
		}
	/*
		pc.getStats( null ).then( (stats)=>{
			let html = '<h2>WebRTC Stats</h2>';

			if (DEBUG.VIDEO_CONNECT2) {
				console.groupCollapsed( '%cpeerConnection.getStats', 'color:blue' );
				stats.forEach( console.log );
				console.groupEnd();
			}

			pc.getSenders().forEach( (sender)=>{
				const ice_transport = sender.transport.iceTransport;
				const selected_pair = ice_transport.getSelectedCandidatePair();

				ice_transport.onselectedcandidatepairchange = self.showRtcStats;//...

				html
				+= '<h2>Sender: '
				+  sender.track.kind
				+  '</h2>'
				;

				if (selected_pair === null) {
					html += '<p>Candidate pair is (unexpectedly) null.</p>';
				} else {
					console.log( 'SELECTED PAIR', selected_pair );


					html
					+= '<p><span class="label">Local ICE:</span> '
					+  '<span class="' + selected_pair.local.type
					+  '">'            + selected_pair.local.type
					+  ':</span> '     + (selected_pair.local.address || 'anonymous')
					+  ':'             + selected_pair.local.port
					+  ' ('            + selected_pair.local.protocol
					+  ')</p>'
					;

					html
					+= '<p><span class="label">Remote ICE:</span> '
					+  '<span class="' + selected_pair.remote.type
					+  '">'            + selected_pair.remote.type
					+  ':</span> '     + (selected_pair.remote.address || 'anonymous')
					+  ':'             + selected_pair.remote.port
					+  ' ('            + selected_pair.remote.protocol
					+  ')</p>'
					;

					if( (selected_pair.local.type == 'host')
					&&  (selected_pair.remote.type == 'host')
					||  (selected_pair.remote.type == 'prflx')
					) {
						html += '<p>Peer-to-peer connection.</p>';
					}
					else if( (selected_pair.local.type == 'relay')
					||       (selected_pair.remote.type == 'relay')
					||       (selected_pair.remote.type == 'srflx')
					) {

						html += '<p>TURN server is relaying data.</p>';
					}
					else {
						html += '<p>Transport mode could not reliably determined.</p>';
					}

					//prflx: https://tools.ietf.org/html/rfc5245#section-7.1.3.2.1
				}
			});

			chat.showMessage( html, ROOMS.LOG, 'status' );
		});
	*/

		pc.getStats( null ).then( (stats)=>{
			let html = '<h2>WebRTC Stats</h2>';

			if (DEBUG.VIDEO_CONNECT2) {
				console.groupCollapsed( '%cpeerConnection.getStats', 'color:blue' );
			}

			stats.forEach( (report)=>{
				if (DEBUG.VIDEO_CONNECT2) console.log( report );

				if (report.candidateType != undefined) {
					html
					+= '<p><span class="' + report.candidateType
					+ '">'                + report.candidateType
					+  '</span> '         + report.ip
					+  ':'                + report.port
					+  ' ('               + report.protocol
					+  ')</p>'
					;
				}
			});

			if (DEBUG.VIDEO_CONNECT2) console.groupEnd();
			chat.showMessage( html, ROOMS.MAIN, 'status' );
		});


	}; // rtcStats


	/**
	 * addLocalStream()
	 */
	this.addLocalStream = function (local_stream) {
		const stream = local_stream.stream;
		const device = local_stream.device.toUpperCase();

		if (DEBUG.VIDEO_STREAMS) console.log( self.instanceId + 'addLocalStream:', stream.id );

		if (self.senders[device] == undefined) {
			self.senders[device] = [];
		}

		stream.getTracks().forEach( (track)=>{
			if (DEBUG.VIDEO_CONNECT) {
				console.groupCollapsed( 'Adding track: ' + track.kind );
				console.log( 'Adding track', track, stream );
				console.groupEnd();
			}


try {
			const sender = self.peerConnection.addTrack( track, stream )
			self.senders[device].push( sender );
} catch (error) {
	console.groupCollapsed(
		'%cERROR%c: addLocalStream: addTrack() failed (%crelayed to timeout%c)',
		'color:red', 'color:black', 'color:blue', 'color:black',
	);
	console.log( error );
	console.groupEnd();

	setTimeout( ()=>{
		throw error;
	});
}
		});

		if (DEBUG.VIDEO_STREAMS) console.log( self.instanceId + 'addLocalStream:', self.senders, device );

	}; // addLocalStream


	/**
	 * addAllLocalStreams()
	 */
	this.addAllLocalStreams = function () {
console.log( '> ADDING ALL LOCAL STREAMS' );
		Object.keys( call.localStreams ).forEach( (key)=>{
			self.addLocalStream( call.localStreams[key] );
		});
console.log( '< ADDING ALL LOCAL STREAMS' );

	}; // addAllLocalStreams


	/**
	 * removeLocalStream()
	 */
	this.removeLocalStream = function (local_stream) {
		const device = local_stream.device.toUpperCase();
		const stream = local_stream.stream;

		if (call.analyser) call.analyser.disconnectStream( local_stream.analyserStream );
		local_stream.analyserStream = null;

		if (DEBUG.VIDEO_STREAMS) {
			console.log(
				self.instanceId + 'removeLocalStream:',
				self.senders,
				device,
				stream.id,
			);
		}

		self.signaler.send({
			type     : SIGNALS.REMOVE_STREAM,
			streamId : stream.id,
		});

if (self.senders[device] == undefined) {
	console.log(
		'%cERROR%c: removeLocalStream: self.senders[' + device + '] is unexpectedly null',
		'color:red', 'color:black',
	);

	return;
}

		self.senders[device].forEach( (sender)=>{
			if (DEBUG.VIDEO_CONNECT) {
				console.groupCollapsed( 'Removing sender: ' + sender );
				console.log( 'Removing sender', sender );
				console.groupEnd();
			}

			sender.replaceTrack( null ).then( ()=>{
				//...self.peerConnection.removeTrack( sender );
			});
		});

		delete self.senders[device];

		if (DEBUG.VIDEO_STREAMS) {
			console.groupCollapsed( self.instanceId + 'removeLocalStream: post', device );
			console.log( self.senders );
			console.groupEnd();
		}

	}; // removeLocalStream


	/**
	 * onCalleeReady()
	 */
	this.onCalleeReady = function () {
		if (DEBUG.VIDEO_CONNECT) {
			console.log( self.instanceId + 'callee is ready, starting ICE negotiation...' );
		}

		self.addAllLocalStreams();

		// Adding streams to the peer connection will trigger  on_negotiation_needed  events,
		//  on_negotiation_needed()  will send a  VIDEO_OFFER  in return.

	}; // onCalleeReady


	/**
	 * close_video_call()
	 */
	function close_video_call () {
		if (DEBUG.VIDEO_CONNECT) console.log( self.instanceId + 'VideoChat: close_video_call' );

console.groupCollapsed( 'CLOSE VIDEO CALL' );
console.trace();
console.groupEnd();

		if (DEBUG.STREAMS) {
			console.groupCollapsed( self.instanceId + 'close_video_call' );
			console.log( call.localStreams );
			console.groupEnd();
		}

		Object.keys( self.remoteStreams ).forEach( (key)=>{
			remove_remote_stream( self.remoteStreams[key].stream.id );
		});

		Object.keys( call.localStreams ).forEach( (key)=>{
			self.removeLocalStream( call.localStreams[key] );
		});

		self.peerConnection.close();
/*
		Object.keys( self.remoteStreams ).forEach( (key)=>{
			const parent = self.remoteStreams[key].controlElement.parentNode;
			app.dom.divVideos.removeChild( parent );
		});
*/

	} // close_video_call


	/**
	 * hangUp()
	 */
	this.hangUp = function (reason = '') {
		const log_reason = (reason != '') ? ' (Reason: ' + reason + ')' : '';
		if (DEBUG.VIDEO_CONNECT) console.log( self.instanceId + 'VideoChat: Hanging up' + log_reason );

		self.signaler.send({
			type   : SIGNALS.HANG_UP,
			reason : String( reason ),
		});

		self.exit();

	}; // hangUp


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * exit()
	 */
	this.exit = function () {
		if (DEBUG.INSTANCES) console.log( self.instanceId + 'Session: terminating' );

		close_video_call();
		self.signaler.exit();
		destroy_peer_connection();
		self.instanceAlive = false;

	}; // exit


	/**
	 * onInitialized()
	 */
	this.onInitialized = function () {
		if (self.isCaller) {
			//...self.addAllLocalStreams();

		} else {
			if (DEBUG.VIDEO_CONNECT) {
				console.log(
					self.instanceId
					+ 'Telling the caller (%c'
					+ self.caller
					+ '%c) that we are ready for the session...'
					, 'color:blue; font-weight:bold', 'color:black'
				);
			}

			chat.calleeReady( self.callee, self.caller );
			self.addAllLocalStreams();
		}

	}; // onInitialized


	/**
	 * init()
	 */
	this.init = function (user_name, peer_name, as_caller, turn_info, owner_instance_id) {
		if (DEBUG.INSTANCES) {
			++instance_nr;
			self.instanceId = owner_instance_id.slice( 0, -2 ) + 'ssn[' + instance_nr + ']: ';
		} else {
			self.instanceId = '';
		}

		self.instanceAlive = true;

		self.userName = user_name;
		self.peerName = peer_name;
		self.isCaller = as_caller;
		self.callee   = (as_caller) ? peer_name : user_name;
		self.caller   = (as_caller) ? user_name : peer_name;

		self.senders       = {};
		self.remoteStreams = {};

		if (DEBUG.VIDEO_CONNECT) {
			const text = (as_caller) ? 'We are the %ccaller%c.' : 'We are the %ccallee%c.';
			console.log( self.instanceId + text, 'color:blue; font-weight:bold', 'color:black' );
		}

		self.iceConfig = {
			iceServers: [
				{
					urls: 'stun:' + turn_info.server,
					username: turn_info.userName,
					credential: turn_info.credential,
				},
				{
					urls: 'turn:' + turn_info.server,
					username: turn_info.userName,
					credential: turn_info.credential,
				},
			],
			bundlePolicy: 'max-compat',
		};

		self.peerConnection = create_peer_connection();

		self.signaler = new Signaler(app, chat, user_name, peer_name, self.instanceId);
		self.signaler.onreceive = on_signaler_receive;

		if (as_caller) {
			console.log(
				self.instanceId
				+ 'Waiting for callee (%c'
				+ self.callee
				+ '%c) to get ready...'
				, 'color:blue; font-weight:bold', 'color:black'
			);

		} else {
			// VideoCall() will store this object in its  sessions[]  array and then call  onInitialized ,
			// in order for the session to be available in  VideoCall.onCalleeReady() .
			// So we essentially call  self.onInitialized()  here.
		}

		chat.updateStatus();

	}; // init


	// CONSTRUCTOR

	self.init( user_name, peer_name, as_caller, turn_info, owner_instance_id );

}; // RtcSession


//EOF