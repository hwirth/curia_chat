// video_call.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import {
	DEBUG, SETTINGS, CHAT_EVENTS,
	REQUEST, RESPONSE,
	MEDIA_CONSTRAINTS, SIGNALS, ROOMS,

} from '../constants.js';

import { TEXT, localized } from '../localize.js';
import { Analyser        } from '../ui/analyser.js';
import { RtcSession      } from '../calls/rtc_session.js';


let instance_nr = -1;


/**
 * VideoCall()
 */
export const VideoCall = function (app, chat, new_container_element, new_user_name) {
	const self = this;

	this.instanceId;
	this.containerElement;

	this.userName;
	this.localStreams;
	this.snapshotCanvas;

	this.sessions;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DOM HELPERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * empty_video_panel()
	 */
	function empty_video_panel () {
		self.containerElement.querySelectorAll( 'div' ).forEach( (element)=>{
			if (element.classList.contains( 'controller' )) {
				self.containerElement.removeChild( element );
			}
		});

	} // empty_video_panel


	/**
	 * addControlElement()
	 */
	this.addControlElement = function (caption, class_name) {
		const is_video
		=  (class_name.indexOf( 'microphone' ) < 0)
		&& (class_name.indexOf( 'audio' ) < 0)
		;
		const DIV   = document.createElement( 'div' );
		const H2    = document.createElement( 'h2' );
		const VIDEO = document.createElement( (is_video) ? 'video' : 'audio' );

		DIV.className = class_name;
		DIV.classList.add( 'controller' );
		H2.innerHTML  = caption;

		if (class_name.indexOf('local' ) >= 0) {
			//...VIDEO.setAttribute( 'muted', 'true' );
		}
		VIDEO.setAttribute( 'controls', 'true' );

		VIDEO.addEventListener( 'canplay', (event)=>{
			const name = VIDEO.parentNode.className.replace( /controller/g, '' ).trim();
			console.groupCollapsed( 'VideoCall: oncanplay:', name );
			console.log ( VIDEO );
			console.log( event );
			console.groupEnd();

			//...VIDEO.play();
		});

		DIV.appendChild( H2 );
		DIV.appendChild( VIDEO );

		/*
		 * Make sure, the float lets the local elements disappear first, when the panel is resized.
		 */
		const temp = document.querySelector( '#hidden_controllers' );
		temp.appendChild( DIV );

		self.containerElement.querySelectorAll( '.controller' ).forEach( (element)=>{
			temp.appendChild( element );
		});

		temp.querySelectorAll( '.remote.camera' ).forEach( (element)=>{
			self.containerElement.appendChild( element );
		});
		temp.querySelectorAll( '.remote.screen' ).forEach( (element)=>{
			self.containerElement.appendChild( element );
		});
		temp.querySelectorAll( '.remote' ).forEach( (element)=>{
			self.containerElement.appendChild( element );
		});
		temp.querySelectorAll( '.local.screen' ).forEach( (element)=>{
			self.containerElement.appendChild( element );
		});
		temp.querySelectorAll( '.local.camera' ).forEach( (element)=>{
			self.containerElement.appendChild( element );
		});
		temp.querySelectorAll( '.local' ).forEach( (element)=>{
			self.containerElement.appendChild( element );
		});

		return VIDEO;

	} // addControlElement


	/**
	 * set_command_button()
	 */
	function set_command_button (mode, device) {
		switch (mode) {
		case 'enable':
			switch (device) {
			case 'CAMERA':
				chat.ui.removeCommandButton( 'DISABLE_CAMERA' );
				chat.ui.addCommandButton( 'ENABLE_CAMERA' );
			break;
			case 'SCREEN':
				chat.ui.removeCommandButton( 'DISABLE_SCREEN' );
				chat.ui.addCommandButton( 'ENABLE_SCREEN' );
			break;
			case 'MICROPHONE':
				chat.ui.removeCommandButton( 'DISABLE_MICROPHONE' );
				chat.ui.addCommandButton( 'ENABLE_MICROPHONE' );
			break;
			}
		break;

		case 'disable':
			switch (device) {
			case 'CAMERA':
				chat.ui.removeCommandButton( 'ENABLE_CAMERA' );
				chat.ui.addCommandButton( 'DISABLE_CAMERA' );
			break;
			case 'SCREEN':
				chat.ui.removeCommandButton( 'ENABLE_SCREEN' );
				chat.ui.addCommandButton( 'DISABLE_SCREEN' );
			break;
			case 'MICROPHONE':
				chat.ui.removeCommandButton( 'ENABLE_MICROPHONE' );
				chat.ui.addCommandButton( 'DISABLE_MICROPHONE' );
			break;
			}
		break;

		default: throw new Error( 'Internal Error: VideoCall.set_command_button: unknonw mode: ' + mode );
		}

	} // set_command_button


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DOM EVENTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_get_audio_tracks()
	 */
	function on_get_audio_tracks () {
		console.log( 'on_get_audio_tracks()' );
		console.log( self.localStream.getAudioTracks() );

	} // on_get_audio_tracks


	/**
	 * on_get_track_by_id()
	 */
	function on_get_track_by_id () {
		console.log( 'on_get_track_by_id' );
		console.log( self.localStream.getTrackById( self.localStream.getAudioTracks()[0].id ) );

	} // on_get_track_by_id


	/**
	 * on_get_tracks()
	 */
	function on_get_tracks () {
		console.log( 'on_get_tracks()' );
		console.log( self.localStream.getTracks() );

	} // on_get_tracks


	/**
	 * on_get_video_tracks()
	 */
	function on_get_video_tracks () {
		console.log( 'on_get_video_tracks()' );
		console.log( self.localStream.getVideoTracks() );

	} // on_get_video_tracks


	/**
	 * on_remove_audio_track()
	 */
	function on_remove_audio_track () {
		console.log( 'on_remove_audio_track()' );
		self.localStream.removeTrack( self.localStream.getAudioTracks()[0] );

	} // on_remove_audio_track


	/**
	 * on_remove_video_track()
	 */
	function on_remove_video_track () {
		console.log( 'on_remove_video_track()' );
		self.localStream.removeTrack( self.localStream.getVideoTracks()[0] );

	} // on_remove_video_track


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// SNAPSHOT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_webcam_snapshot()
	 */
	function on_webcam_snapshot () {

		function set_timeout () {
			setTimeout( on_webcam_snapshot, SETTINGS.SNAPSHOT_INTERVAL );
		}

		if (self.localStreams.CAMERA == undefined) {
			chat.avatar.sendSnapshot( null );
			set_timeout();

		} else {
			// Get <video> element
			const camera   = self.localStreams.CAMERA.controlElement;

			if (self.localStreams.CAMERA.controlElement.readyState != 4) {
				set_timeout();
				return;
			}

			// Prepare canvas
			const canvas   = self.snapshotCanvas;
			canvas.width   = camera.videoWidth;
			canvas.height  = camera.videoHeight;

			// Transfer data from <video> to canvas
			const context  = canvas.getContext( '2d' );
			context.drawImage( camera, 0, 0 );

			// Transfer data to <img>
			const data_url = canvas.toDataURL( 'image/jpeg', 0.25 );
			const image = document.createElement( 'img' );

			image.src = data_url;

			// Wait for the image to have actual content
			image.addEventListener( 'load', ()=>{
				// Resize
				const zoomed_data = chat.avatar.zoomImageToDataUrl(
					image,
					null,
					1, 0, 0,
					/*zoom_to_fit*/true
				);

				// Upload
				chat.avatar.sendSnapshot( zoomed_data );

				set_timeout();
			});
		}

	} // on_webcam_snapshot


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// SESSIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * find_session()
	 */
	function find_session (sender_name, recipient_name) {
		let found_session_index = -1;

		for (let i = 0; i < self.sessions.length; ++i) {
			const session = self.sessions[i];

			if( (session.userName == sender_name) && (session.peerName == recipient_name)
			||  (session.peerName == sender_name) && (session.userName == recipient_name)
			) {
				if (found_session_index >= 0) {
					throw new Error( 'VideoCall: find_session: Duplicate session' );
				}

				found_session_index = i;
			}
		}

		return found_session_index;

	} // find_session


	/**
	 * remove_session()
	 */
	function remove_session (index) {
		self.sessions.splice( index, 1 );

		if (DEBUG.SESSIONS) {
			console.groupCollapsed( self.instanceId + 'remove_session:' );
			console.log( self.sessions );
			console.groupEnd();
		}

	} // remove_session


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// LOCAL STREAMS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * aquire_local_stream()
	 */
	async function aquire_local_stream (device) {
		device = device.toUpperCase();

		if (self.localStreams[device] != undefined) {
			chat.showMessage(
				localized( 'DEVICE_ALREADY_ENABLED', device ),
				ROOMS.CURRENT,
				'error'
			);

			return null;
		}

		//...?? Also add to current calls

		const media_getter = ((device == 'SCREEN') ? 'getDisplayMedia' : 'getUserMedia');
		const constraints = MEDIA_CONSTRAINTS[device];

		const new_stream = await navigator.mediaDevices[media_getter]( constraints ).catch( (error)=>{
			chat.showMessage(
				localized( 'COULD_NOT_AQUIRE_LOCAL_STREAM' ) + error,
				ROOMS.LOG,
				'error'
			);
		});

		if (new_stream == undefined) return null;

		if (DEBUG.VIDEO_CONNECT) {
			console.groupCollapsed( self.instanceId + 'Local stream(s) aquired' );
			console.log( constraints );
			console.log( new_stream );
			console.groupEnd();
		}

		const control_element = self.addControlElement( 'LOCAL ' + device, 'local ' + device.toLowerCase() );
		control_element.srcObject = new_stream;

		self.localStreams[device] = {
			device         : device,
			stream         : new_stream,
			analyserStream : null,
			controlElement : control_element,
		};

		if (DEBUG.VIDEO_STREAMS) {
			console.log( 'Aquired stream with id=' + new_stream.id );
		}

		control_element.volume = 0;
		//...control_element.oncanplay = ()=>control_element.play();
		//...await control_element.play();
		control_element.play();

		return self.localStreams[device];

	} // aquire_local_stream


	/**
	 * toggle_analyse_local_streams()
	 */
	function toggle_analyse_local_streams (enable) {
		if (self.analyser === null) return;

		Object.keys( self.localStreams ).forEach( (key)=>{
			const local_stream = self.localStreams[key];

			if (local_stream.analyserStream === null) {
				if (enable) {
					local_stream.analyserStream = self.analyser.connectStream(
						local_stream.stream
					);
				}
			} else {
				if (! enable) {
					self.analyser.disconnectStream( local_stream.analyserStream );
					local_stream.analyserStream = null;
				}
			}
		});

	}; // toggle_analyse_local_streams


	/**
	 * showRtcStats()
	 */
	this.showRtcStats = function () {

		function show_report (selected_pair) {
			let html
			+ '<p><span class="label">'
			+ localized( 'LOCAL_ICE' )
			+ ':</span> '
			+ '<span class="' + selected_pair.local.type
			+ '">'            + selected_pair.local.type
			+ ':</span> '     + (selected_pair.local.address || localized( 'ANONYMOUS' ))
			+ ':'             + selected_pair.local.port
			+ ' ('            + selected_pair.local.protocol
			+ ')</p>'
			;

			html
			+= '<p><span class="label">'
			+  localized( 'REMOTE_ICE' )
			+ ':</span> '
			+  '<span class="' + selected_pair.remote.type
			+  '">'            + selected_pair.remote.type
			+  ':</span> '     + (selected_pair.remote.address || localized( 'ANONYMOUS' ))
			+  ':'             + selected_pair.remote.port
			+  ' ('            + selected_pair.remote.protocol
			+  ')</p>'
			;

			if( (selected_pair.local.type == 'host')
			&&  (selected_pair.remote.type == 'host')
			||  (selected_pair.remote.type == 'prflx')
			) {
				html += '<p>' + localized( 'PEER_TO_PEER_CONNECTION' ) + '</p>';
			}
			else if( (selected_pair.local.type == 'relay')
			||       (selected_pair.remote.type == 'relay')
			||       (selected_pair.remote.type == 'srflx')
			) {

				html += '<p>' + localized( 'TURN_SERVER_IS_RELAYING_DATA' ) + '</p>';
			}
			else {
				html += '<p>' + localized( 'TRANSPORT_MODE_COULD_NOT_BE_DETERMINED' ) + '</p>';
			}

			//prflx: https://tools.ietf.org/html/rfc5245#section-7.1.3.2.1

			return html;
		}

		if (self.sessions.length == 0) {
			chat.showMessage( localized( 'CALL_SOMEONE_FIRST' ), ROOMS.CURRENT, 'error' );

			console.groupCollapsed( '%cERROR%c: showRtcStats', 'color:red', 'color:black' );
			console.trace();
			console.groupEnd();

			return;
		}

		self.sessions.forEach( (session)=>{
			const pc = session.peerConnection;

			if (pc === null) {
				chat.showMessage(
					localized( 'PEER_CONNECTION_UNEXPECTEDLY_NULL' ),
					ROOMS.LOG,
					'internal_error'
				);

				return;
			}

			pc.getStats( null ).then( (stats)=>{
				let html = '<h2>WebRTC Stats</h2>';

				if (DEBUG.VIDEO_CONNECT2) {
					console.groupCollapsed( '%cpeerConnection.getStats', 'color:blue' );
					stats.forEach( console.log );
					console.groupEnd();
				}

				pc.getSenders().forEach( (sender)=>{
					if (sender.transport === null) {
						console.log(
							'VideoCall: showRtcStats: sender.transport is null',
							'warning'
						);

					} else {
						const ice_transport = sender.transport.iceTransport;
						const selected_pair = ice_transport.getSelectedCandidatePair();

ice_transport.onselectedcandidatepairchange = self.showRtcStats;//...

						html
						+= '<h2>Sender: '
						+  ((sender.track) ? sender.track.kind : sender.track)
						+  '</h2>'
						;

						if (selected_pair === null) {
							html
							+= '<p>'
							+ localized( 'PEER_CONNECTION_UNEXPECTEDLY_NULL' )
							+ '</p>'
							;
						} else {
							console.log( 'SELECTED PAIR', selected_pair );

							html += show_report( selected_pair );
						}
					}
				});

				chat.showMessage( html, ROOMS.CURRENT, 'status' );
			});
		});

	}; // rtcStats


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PUBLIC METHODS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * updateUserName()
	 */
	this.updateUserName = function (new_name) {
		self.userName = new_name;

		self.sessions.forEach( (session)=>{
			session.updateUserName( new_name );
		});

	}; // updateUserName


	/**
	 * showVideoPanel()
	 */
	this.showVideoPanel = function () {
		app.dom.divVideos.classList.remove( 'hidden' );

	}; // showVideoPanel


	/**
	 * hideVideoPanel()
	 */
	this.hideVideoPanel = function () {
		app.dom.divVideos.classList.add( 'hidden' );

	}; // hideVideoPanel


	/**
	 * updateVideoPanelVisibility()
	 */
	this.updateVideoPanelVisibility = function () {
		const panel_empty = (app.dom.divVideos.querySelectorAll( '.controller' ).length == 0);
		app.dom.divVideos.classList.toggle( 'collapsed', panel_empty );

	}; // updateVideoPanelVisibility


	/**
	 * listDevices()
	 */
	this.listDevices = function (params) {
		navigator.mediaDevices.enumerateDevices().then( (mediaDevices)=>{
			let html
			= '<h2>'
			+ localized( 'INPUT_DEVICES' )
			+ '</h2><table class="devices">'
			+ '<tr><th>Kind</th><th>Label</th><th>ID</th></tr>'
			;

			mediaDevices.forEach( (device)=>{
				html
				+= '<tr><td>'  +  device.kind
				+  '</td><td>' +  device.label
				+  '</td><td>' +  device.deviceId
				+  '</td></tr>'
				;
			});

			html += '</table>';

			chat.showMessage( html, ROOMS.CURRENT );
		});

	}; // listDevices


	/**
	 * enableDevice()
	 */
	this.enableDevice = function (params) {

		/**
		 * disable_device_buttons()
		 */
		function disable_device_buttons (enable) {
			document.querySelectorAll( '.device.command' ).forEach( (element)=>{
				element.classList.toggle( 'aquiring', enable );
			});

		} // disable_device_buttons

		const device = (params[0] || '').toUpperCase();
		const text   = (device == '') ? '' : localized( 'UNKNOWN_DEVICE_OPTIONS_ARE', device ) + '<br>';

		if (MEDIA_CONSTRAINTS[device] == undefined) {
			chat.showMessage(
				text
				+ '<a class="command">/enable camera</a> '
				+ '<a class="command">/enable screen</a> '
				+ '<a class="command">/enable microphone</a>'
				, ROOMS.LOG
				, ((device == '') ? '' : 'error')
			);

			return;
		}

		disable_device_buttons( true );
		aquire_local_stream( device ).then( (new_local_stream)=>{
			if (new_local_stream !== null) {
				self.sessions.forEach( (session)=>{
					session.addLocalStream( new_local_stream );
				});

				set_command_button( 'disable', device );

				chat.showMessage(
					localized( 'DEVICE_ENABLED', device ),
					ROOMS.LOG,
					'notice'
				);

				chat.emitEvent( CHAT_EVENTS.DEVICE_ENABLED );

				return new_local_stream;
			}
		}).then( (new_local_stream)=>{
			self.showVideoPanel();
			self.updateVideoPanelVisibility();
			disable_device_buttons( false );
		});

	}; // enableDevice


	/**
	 * disableDevice()
	 */
	this.disableDevice = function (params) {
		const device = (params[0] || '').toUpperCase();
		const text   = (device == '') ? '' : localized( 'UNKNOWN_DEVICE_OPTIONS_ARE', device ) + '<br>';

		if (MEDIA_CONSTRAINTS[device] == undefined) {
			chat.showMessage(
				text
				+ '<a class="command">/disable camera</a> '
				+ '<a class="command">/disable screen</a> '
				+ '<a class="command">/disable microphone</a>'
				, ROOMS.CURRENT
				, ((device == '') ? '' : 'error')
			);

			return;
		}

		if (self.localStreams[device] == undefined) {
			chat.showMessage( localized( 'DEVICE_ALREADY_DISABLED' ), ROOMS.LOG, device );
			return;
		}

		const local_stream = self.localStreams[device];

		if (local_stream.analyserStream !== null) {
			local_stream.analyserStream.disconnect();
		}

		self.sessions.forEach( (session)=>{
			session.removeLocalStream( local_stream );
		});

		local_stream.controlElement.srcObject.getTracks().forEach( (track)=>{
			track.stop();
		});

		local_stream.srcObject = null;

		app.dom.divVideos.removeChild( self.localStreams[device].controlElement.parentNode );
		delete self.localStreams[device];

		self.updateVideoPanelVisibility();

		set_command_button( 'enable', device );

		chat.showMessage( localized( 'DEVICE_DISABLED', device ), ROOMS.LOG, 'notice' );
		chat.emitEvent( CHAT_EVENTS.DEVICE_DISABLED );

	}; // disableDevice


	/**
	 * startAnalyser()
	 */
	this.startAnalyser = function () {
		if (self.analyser !== null) return;

		app.audioContext = chat.synth.audioContext;

		const container = document.querySelector( '#audio_analyser' );
		self.analyser = new Analyser( app, container, app.audioContext.destination );

		document.querySelector( '#audio_analyser' ).classList.remove( 'hidden' );

	}; // startAnalyser


	/**
	 * stopAnalyser()
	 */
	this.stopAnalyser = function () {
		if (self.analyser === null) return;

		self.analyser.running = false;
		self.analyser = null;

		document.querySelector( '#audio_analyser' ).classList.add( 'hidden' );

	}; // stopAnalyser


	/**
	 * toggleStreamAnalyser()
	 */
	this.toggleStreamAnalyser = function (enable) {
		if (enable == 'on') enable = true;
		else if (enable == 'off') enable = false;
		else {
			//... error
			return;
		}

		if (enable) {
			self.startAnalyser();
		}

		toggle_analyse_local_streams( enable );
		self.sessions.forEach( (session)=>{
			session.toggleStreamAnalyser( enable );
		});

		if (! enable) {
			self.stopAnalyser();
		}

	}; // toggleStreamAnalyser


	/**
	 * newSession()
	 */
	this.newSession = function (sender_name, recipient_name, turn_info) {
		const as_caller = (self.userName != sender_name);
		const peer_name = ((as_caller) ? sender_name : recipient_name);

		if (find_session( sender_name, recipient_name) >= 0) {
			chat.showMessage(
				localized( 'SESSION_ALREADY_EXISTS', chat.colorSpan( peer_name ) ),
				ROOMS.LOG,
				'internal_error',
			);

		} else {
			const new_session = new RtcSession(
				app,
				chat,
				self,
				self.userName,
				peer_name,
				as_caller,
				turn_info,
				self.instanceId,
			);

			self.sessions.push( new_session );
			new_session.onInitialized();
		}

	}; // newSession


	/**
	 * onCalleeReady()
	 */
	this.onCalleeReady = function (sender_name, recipient_name) {
		const as_caller = (self.userName != sender_name);
		const peer_name = ((as_caller) ? sender_name : recipient_name);
		const index     = find_session( sender_name, recipient_name );

		if (index < 0) {
			chat.showMessage(
				  'onCalleeReady: '
				+ localized( 'NO_SESSION_WITH_USER_FOUND', chat.colorSpan( peer_name ) )
				, ROOMS.LOG
				, 'internal_error'
			);

		} else {
			self.sessions[index].onCalleeReady();
		}

	}; // onCalleeReady


	/**
	 * hangUp()
	 */
	this.hangUp = function (sender_name, recipient_name) {
		const as_caller = (self.userName != sender_name);
		const peer_name = ((as_caller) ? sender_name : recipient_name);
		const index     = find_session( sender_name, recipient_name );

		if (index < 0) {
			chat.showMessage(
				'hangUp: ' + localized( 'NO_SESSION_WITH_USER_FOUND', chat.colorSpan( peer_name ) ),
				ROOMS.LOG,
				'internal_error',
			);
		} else {
			if (DEBUG.SESSIONS) console.log( self.instanceId + 'hangUp:', index );

			self.sessions[index].hangUp();
			remove_session( index );

			self.updateVideoPanelVisibility();
		}

	}; // hangUp


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * exit()
	 */
	this.exit = function () {
		if (DEBUG.INSTANCES) console.log( self.instanceId + 'terminating' );

		self.sessions.forEach( (session)=>{
			session.exit();
		});

		self.hideVideoPanel();
		empty_video_panel();

	}; // exit


	/**
	 * init()
	 */
	this.init = function (new_container_element, new_user_name) {
		if (DEBUG.INSTANCES) {
			++instance_nr;
			self.instanceId = 'vca[' + instance_nr + ']: ';
		} else {
			self.instanceId = '';
		}

		function hasUserMedia() { return !!navigator.getUserMedia; }
		if (! hasUserMedia()) {
			chat.showMessage(
				self.instanceId + localized( 'YOUR_BROWSER_DOES_NOT_SUPPORT_GET_USER_MEDIA' ),
				ROOMS.CURRENT_AND_LOG,
				'error',
			);
			return;
		}

		self.containerElement = new_container_element;
		self.userName = new_user_name;

		empty_video_panel();

		self.localStreams = {};
		self.sessions     = [];
		self.analyser     = null;

		self.snapshotCanvas = document.createElement( 'canvas' );
		self.snapshotCanvas.width  = SETTINGS.AVATARS.WIDTH;
		self.snapshotCanvas.height = SETTINGS.AVATARS.HEIGHT;

		chat.ui.addCommandButton( 'ENABLE_WHITEBOARD' );
		chat.ui.addCommandButton( 'ENABLE_CAMERA' );
		chat.ui.addCommandButton( 'ENABLE_SCREEN' );
		chat.ui.addCommandButton( 'ENABLE_MICROPHONE' );

		const analyser_element = document.querySelector( '#audio_analyser .screen' );
		analyser_element.addEventListener( 'mouseup', (event)=>{
			if (event.button != 0) return;
			analyser_element.parentNode.classList.toggle( 'minimized' );
		});

		setTimeout( on_webcam_snapshot, SETTINGS.SNAPSHOT_INTERVAL );

	}; // init


	// CONSTRUCTOR

	self.init( new_container_element, new_user_name );

}; // VideoCall


//EOF