// chat_client.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from './helpers.js';

import {
	PROGRAM_NAME, PROGRAM_VERSION,
	DEBUG, SETTINGS,
	CHAT_CONNECTION, CHAT_EVENTS,
	ICON_DATA, COMMAND_BUTTONS,
	REQUEST, RESPONSE, FAILURE,
	CLIENT_COMMANDS, ROOMS,
	STREAM_SOURCES,

} from './constants.js';


import {
	localized, localized_help, HELP_TEXT, CURRENT_LANGUAGE,
	localized_room_name, delocalized_room_name,

} from './localize.js';


import { UserInterface } from './ui/user_interface.js';
import { Synth         } from './ui/sounds.js';
import { UserList      } from './extensions/user_list.js';
import { History       } from './extensions/history.js';
import { Preferences   } from './extensions/preferences.js';
import { Avatar        } from './extensions/avatar.js';
import { UserProfile   } from './extensions/user_profile.js';
import { JsonEditor    } from './extensions/json_editor.js';
import { VideoCall     } from './calls/video_call.js';
import { MediaLinks    } from './extensions/media_links.js';

import * as FunStuff from './extensions/fun_stuff.js';


/**
 * ChatClient()
 */
export const ChatClient = function (app) {
	const self = this;

	this.connectionState;
	this.reconnectInterval;
	this.eventHandlers;
	this.address;

	this.ui;
	this.synth;
	this.history;
	this.videoCall;
	this.userList;
	this.userProfile;
	this.avatar;

	this.helpText;
	this.knownAvatars;  //...

	this.account;
	this.preferences;


	/**
	 * setConnectionState()
	 */
	this.setConnectionState = function (new_connection_state) {
		self.connectionState = new_connection_state;

		if (DEBUG.CHAT_CONNECTION) {
			console.log(
				'%cCHAT%c: ' + new_connection_state,
				'color:#a60', 'color:black',
			);
		}

		if (self.ui) {
			self.ui.setIconOffline( (new_connection_state == CHAT_CONNECTION.OFFLINE) );
		}

		self.updateStatus();

	}; // setConnectionState


	/**
	 * updateStatus()
	 */
	this.updateStatus = function () {
		app.dom.divStatus.innerHTML
		= '<span>Status: <b>' + self.connectionState + '</b> - </span> '
		+ '<span>Name: <b>'   + self.name    + '</b> - </span> '
		+ '<span>Errors: '
			+ 'hard: <b>' + app.hardErrorCount + '</b>, '
			+ 'soft: <b>' + app.softErrorCount + '</b>,'
		+ '</span> '
		;

	}; // updateStatus


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// HELPERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * show_message()
	 */
	function show_message (html, room_name = null, class_name = null, indicate_activity = true) {
		if (DEBUG.SHOW_MESSAGE) {
			console.groupCollapsed(
				  '%cshow_message%c:'
				, 'color:magenta'
				, 'color:black'
				, 'room:'
				, room_name
				, 'class:'
				, class_name
			);
			console.log( html );
			console.trace();
			console.groupEnd();
		}

		if (html == undefined) {
			throw new Error( 'ChatClient: show_message: html is null.' );
		}


		if (self.mediaLinks != undefined) {
			html = self.mediaLinks.addMarkup( html );
		}


		/*
		 * Find rooms to show the message in
		 */

		function add_room (name) {
			const exists = self.ui.roomExists( name ) || !self.ui.roomExists( ROOMS.MAIN );

			if (exists && target_rooms.indexOf( name ) < 0) {
				target_rooms.push( name );
			}
		}

		const target_rooms = [];
		const current_room = self.ui.getActiveRoomName();

		if (room_name === null) {
			target_rooms.push( current_room );
		}
		else {
			if (room_name.substr( 0, 3 ) == 'PM:') {
				self.ui.addTab( room_name, room_name.substr(3) );
			}

			if (room_name == ROOMS.ALL) {
				app.dom.divTabPages.querySelectorAll( '.page' ).forEach( (room)=>{
					add_room( room.dataset.roomName );
				});
			}
			else if (room_name == ROOMS.CURRENT_AND_LOG) {
				if (self.preferences.systemLog) {
					self.ui.addTab(
						ROOMS.LOG,
						localized_room_name( ROOMS.LOG ),
						null,
						/*activate*/false,
					);
				}

				if (self.ui.roomExists( ROOMS.LOG )) {
					add_room( ROOMS.LOG );
					add_room( current_room );
				} else {
					add_room( null );
				}
			}
			else if (room_name == ROOMS.LOG) {
				if (self.preferences.systemLog) {
					if (! self.ui.roomExists( ROOMS.LOG )) {
						self.ui.addTab(
							ROOMS.LOG,
							localized_room_name( ROOMS.LOG ),
							null,
							/*activate*/false,
						);
					}
					add_room( ROOMS.LOG );
				}
			}
			else if (typeof room_name == 'object') {
				room_name.forEach( (name)=>{
					if (target_rooms.indexOf( name ) < 0) {
						add_room( name );
					}
				});
			} else {
				add_room( room_name );
			}
		}


		/*
		 * Wrap special message
		 */

		if ((class_name == 'error') || (class_name == RESPONSE.FAILURE)) {
			self.emitEvent( CHAT_EVENTS.FAILURE, html );

			html
			= '<strong class="error">'
			+ localized( 'ERROR' )
			+ '</strong>: '
			+ html
			;

			class_name = 'error';

			++app.softErrorCount;
		}
		else if (class_name == 'internal_error') {
			self.emitEvent( CHAT_EVENTS.FAILURE, html );

			html
			= '<strong class="error">'
			+ localized( 'INTERNAL_ERROR', html )
			+ '</strong>: '
			+ html
			;
		}
		else if (class_name == 'warning') {
			self.emitEvent( CHAT_EVENTS.WARNING, html );

			html
			= '<strong class="warning">'
			+ localized( 'WARNING' )
			+ '</strong>: '
			+ html
			;
		}
		else if (class_name == 'notice') {
			html
			= '<strong class="notice">'
			+ localized( 'NOTICE' )
			+ '</strong>: '
			+ html
			;
		}
		else if (class_name == 'server') {
			html
			= '<strong class="server">'
			+ localized( 'SERVER_MESSAGE' )
			+ '</strong>: '
			+ html
			;
		}

		else if (class_name == 'rpg') {
			html
			= '<strong class="rpg">'
			+ localized( 'RPG_MESSAGE' )
			+ '</strong>: '
			+ html
			;
		}


		/*
		 * Show message in selected room(s)
		 */

		target_rooms.forEach( (room_name)=>{
			const DIV = document.createElement( 'div' );
			if (class_name !== null) DIV.className = class_name;
			DIV.innerHTML = html;

			self.ui.appendToRoomElement( DIV, room_name, indicate_activity );
		});


		self.ui.scrollDown();

	} // show_message


	/**
	 * get_message_peer_name()
	 */
	function get_message_peer_name (message) {
		const sender_name    = message.data.sender;
		const recipient_name = message.data.recipient;

		const peer_name = ((sender_name == self.name) ? recipient_name : sender_name );

		return peer_name;

	} // get_message_peer_name


	/**
	 * get_color()
	 */
	function get_color (string) {
		const minimum  = SETTINGS.USER_COLORS.MINIMUM;
		const distance = SETTINGS.USER_COLORS.DISTANCE;
		const variance = SETTINGS.USER_COLORS.VARIANCE / distance;

		if (string == undefined) {
			console.log(
				'%cERROR%c: get_color: color undefined',
				'color:red', 'color:blue',
			);
			console.trace()
		}

		let value = 0;
		for (let i = 0; i < string.length; ++i) {
			value += string.charCodeAt(i) * 13;
		}

		let r = 0;
		let g = 0;
		let b = 0;
		let next_color = 0;
		while (value > 0) {
			switch (next_color) {
			case 0:  r = (r + (value % variance)) % variance;  break;
			case 1:  g = (g + (value % variance)) % variance;  break;
			case 2:  b = (b + (value % variance)) % variance;  break;
			}

			value = Math.floor( value / variance );
			next_color = (next_color + 1) % 3;
		}

		r = minimum + r * distance;
		g = minimum + g * distance;
		b = minimum + b * distance;

		return '#' + Helpers.toHex(r) + Helpers.toHex(g) + Helpers.toHex(b);

	} // get_color


	/**
	 * color_span()
	 */
	function color_span (string, class_name = null) {
		const color = get_color( string );

		class_name = (class_name === null) ? '' : ' ' + class_name;

		return '<span class="name' + class_name + '" style="color:' + color + '">' + string + '</span>';

	} // color_span


	/**
	 * formatted_date()
	 */
	function formatted_date (timestamp) {
		const date_obj = new Date( timestamp * 1000 );

		const y = date_obj.getFullYear();
		const m = date_obj.getMonth();
		const d = date_obj.getDate();

		const formatted_date
		= y
		+ '-'
		+ ((m < 10) ? '0'+m : m)
		+ '-'
		+ ((d < 10) ? '0'+d : d)
		;

		return formatted_date;

	} // formatted_date


	/**
	 * formatted_time()
	 */
	function formatted_time (timestamp) {
		const date_obj = new Date( timestamp * 1000 );

		const h = date_obj.getHours();
		const m = date_obj.getMinutes();
		const s = date_obj.getSeconds();

		const formatted_time
		= ((h < 10) ? '0'+h : h)
		+ ':'
		+ ((m < 10) ? '0'+m : m)
		+ ':'
		+ ((s < 10) ? '0'+s : s)
		;

		return formatted_time;

	} // formatted_time


	/**
	 * formatted_seconds_ago()
	 */
	function formatted_seconds_ago (timestamp, seconds_ago) {
		var seconds, minutes, hours, days, months, years;

		const date_now = new Date();
		date_now.setTime( timestamp + seconds_ago );

		const date_ts = new Date();
		date_ts.setTime( timestamp );

		const now_year  = date_now.getFullYear();
		const now_month = date_now.getMonth();
		const now_day   = date_now.getDate();

		const ts_year  = date_ts.getFullYear();
		const ts_month = date_ts.getMonth();
		const ts_day   = date_ts.getDate();

		seconds = Math.round( seconds_ago % 60 );   seconds_ago /= 60;
		minutes = Math.round( seconds_ago % 60 );   seconds_ago /= 60;
		hours   = Math.round( seconds_ago % 24 );   seconds_ago /= 24;
		days    = now_day   - ts_day;
		months  = now_month - ts_month;
		years   = now_year  - ts_year;


		const template_years   = (years   == 1) ? 'YEAR'   : 'YEARS';
		const template_months  = (months  == 1) ? 'MONTH'  : 'MONTHS';
		const template_days    = (days    == 1) ? 'DAY'    : 'DAYS';
		const template_hours   = (hours   == 1) ? 'HOUR'   : 'HOURS';
		const template_minutes = (minutes == 1) ? 'MINUTE' : 'MINUTES';
		const template_seconds = (seconds == 1) ? 'SECOND' : 'SECONDS';

		let result
		= ((years   != 0) ? years   + ' ' + localized( template_years   ) + ', ' : '')
		+ ((months  != 0) ? months  + ' ' + localized( template_months  ) + ', ' : '')
		+ ((days    != 0) ? days    + ' ' + localized( template_days    ) + ', ' : '')
		+ ((hours   != 0) ? hours   + ' ' + localized( template_hours   ) + ', ' : '')
		+ ((minutes != 0) ? minutes + ' ' + localized( template_minutes ) + ', ' : '')
		+ ((seconds != 0) ? seconds + ' ' + localized( template_seconds ) + ', ' : '')
		;

		result = result.trim();
		if (result.slice( -1 ) == ',') result = result.slice( 0, -1 );
		if (result == '') result = localized( 'JUST_NOW' );

		return result;

	} // formatted_seconds_ago


	/**
	 * timestamp_and_text()
	 */
	function timestamp_and_text (message, text = null) {
		let sender = '';

		if (message === null) {
			const timestamp = Helpers.unixTimestamp();
			message = {
				date : formatted_date( timestamp ),
				time : formatted_time( timestamp ),
				data : {},
			};
		}

		if (message.data.name != undefined) {
			sender = color_span( message.data.name ) + ': ';
		}

		const meta
		= '<span class="meta">'
		+ '<span class="date">' + message.date + '</span> '
		+ '<span class="time">' + message.time + '</span> '
		+ sender
		+ '</span>'
		;

		const body
		= ((message.data.sender != '') ? meta : '')
		+ ((text === null) ? message.data.text : text)
		;

		return body;

	} // timestamp_and_text


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MISCELLANEOUS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * autocomplete_name()
	 */
	function autocomplete_name () {
		const input     = app.dom.inputText;
		const text      = input.value;
		const caret_pos = input.selectionStart;

		if( (input.selectionStart != input.selectionEnd)
		||  (text.length == 0)
		) {
			return false;
		}

		let word = '';
		let start = input.selectionStart;

		if (text.charAt( input.selectionStart ) == ' ') {
			 --start;
		}
		else if (caret_pos != text.length) {
			return false;
		}

		for (let i = start; i >= 0; --i) {
			const char = text.charAt( i );
			if (char == ' ') break;
			word = char + word;
		}

		word = word.toLowerCase();

		if (DEBUG.AUTO_COMPLETE) console.log( 'word', word );

		const found_names = [];
		let min_length = Number.POSITIVE_INFINITY;

		Object.keys( self.userList.data ).forEach( (key)=>{
			const name = self.userList.data[key].name;

			if (name.substr( 0, word.length ).toLowerCase() == word) {
				found_names.push( name );
				if (name.length < min_length) {
					min_length = name.length;
				}
			}
		});

		if (DEBUG.AUTO_COMPLETE) console.log( 'found_names', found_names );

		let completed_name = '';
		if (found_names.length > 0) {
			if (found_names.length == 1) {
				completed_name = found_names[0];

			} else {
				let common_text = '';
				for (let i = 0; i < min_length; ++i) {
					const current_char = found_names[0].charAt( i );

					let chars_identical = true;
					for (let j = 1; j < found_names.length; ++j) {
						if (found_names[j].charAt( i ) != current_char) {
							chars_identical = false;
						}
					}

					if (chars_identical) {
						common_text += current_char;
					} else {
						break;
					}
				}
				completed_name = common_text;
			}
		}

		if (DEBUG.AUTO_COMPLETE) console.log( 'completed_name', completed_name );

		if (completed_name != '') {
			const text_to_add = completed_name.substr( word.length );

			if (DEBUG.AUTO_COMPLETE) console.log( 'text_to_add', text_to_add );

			if (text_to_add.length == 0) {
				if (found_names.length <= 1) {
					return false;
				}

				let html = '';
				found_names.forEach( (name)=>{
					html += color_span( name ) + ' ';
				});

				show_message( html.trim() );
			} else {
				const space_pos = completed_name.length - text_to_add.length;
				const before = text.substr( 0, caret_pos - space_pos );
				const after  = text.substr( caret_pos );

				if (DEBUG.AUTO_COMPLETE) {
					console.log( 'before', before );
					console.log( 'after', after );
				}

				if (found_names.length == 1) {
					const insert = (before == '') ? ': ' : ' ';
					input.value = before + completed_name + insert + after;
					input.selectionStart = (before + completed_name).length + 2;
				} else {
					input.value = before + completed_name + after;
					input.selectionStart = (before + completed_name).length;
				}
				input.selectionEnd = input.selectionStart;
			}
		}

		if (DEBUG.AUTO_COMPLETE) console.log( 'Completed', completed_name );

		return true;

	} // autocomplete_name


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEBSOCKET
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * send_message()
	 */
	function send_message (type, data = null) {
		if (data == '') return;

		if (DEBUG.OUTGOING_MESSAGES) {
			let signal_type = (data && data.signalData) ? data.signalData.type : '';
			signal_type = (signal_type) ? ', type: %c' + signal_type : '%c';

			console.groupCollapsed(
				'%cMESSAGE OUT %c>%c ' + type + signal_type,
				'color:black', 'color:red', 'color:black', 'color:green',
			);
			console.log( 'data:', data );
			console.groupEnd();
		}

		if (self.websocket.readyState == WebSocket.OPEN) {
			/*
			 * Check, if we need to adjust the command before sending
			 */
			if ((type == REQUEST.STANDARD_MESSAGE) && (data !== null)) {
				const current_room = self.ui.getActivePageElement();
				const room_name = current_room.dataset.roomName;

				if (data.trim() == '/leave') {
					/*
					 * Add room name to /leave commands
					 */
					data = '/leave ' + room_name;
				}
				else if (room_name.substr( 0, 3 ) == 'PM:') {
					if (data.charAt( 0 ) != '/') {
						const recipient = room_name.substr( 3 );
						data = '/msg ' + recipient + ' ' + data;
					}
				}
			}

			const message = {
				'type' : type,
				'data' : data,
				'room' : self.ui.getActiveRoomName(),
			};

			const json = JSON.stringify( message );
			if (DEBUG.MESSAGE_JSON) console.log( 'JSON', json );
			self.websocket.send( json );

		} else {
			const state = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][self.websocket.readyState];
			show_message(
				'Error: Not connected. (readyState = ' + state + ')',
				ROOMS.CURRENT_AND_LOG,
				'error'
			);
		}

	} // send_message


	/**
	 * connect()
	 */
	function connect () {
		if (DEBUG.RECONNECT) console.log( 'ChatClient: connect()' );

		/**
		 * show_reconnect_button()
		 */
		function show_reconnect_button () {
			if (DEBUG.RECONNECT) console.log( 'Auto-reconnect: Showing button' );

			const button = document.createElement( 'button' );
			button.className = 'reconnect';
			button.innerHTML = localized( 'RECONNECT_TO_SERVER' );

			self.ui.appendToRoomElement( button );

			button.addEventListener( 'click', ()=>{
				const parts = location.href.split( 'reconnection_attempt_nr=' );

				const rest = (parts[1] + '&').split( '&' );
				rest.shift();
				let href = parts[0] + rest.join( '&' );

				while (href.substr( -1 ) == '&') href = href.slice( 0, -1 );
				while (href.substr( -1 ) == '?') href = href.slice( 0, -1 );

				window.location.href = href;
				return false;
			});

			button.focus();

		} // show_reconnect_button


		/**
		 * next_attempt()
		 */
		function next_attempt (attempt_nr) {
			if (DEBUG.RECONNECT) console.log( 'Auto-reconnect: next_attempt:', attempt_nr );
			let href = window.location.href;

			++attempt_nr;

			if (href.indexOf( 'reconnection_attempt_nr') < 0) {
				if (href.indexOf( '?' ) < 0) {
					href += '?';
				} else {
					href += '&';
				}

				href += 'reconnection_attempt_nr=' + attempt_nr;

			} else {
				const parts = window.location.href.split( 'reconnection_attempt_nr=' );

				const rest = (parts[1] + '&').split( '&' );
				rest.shift();
				parts[1] = rest.join( '&' ).slice( -1 );

				href = parts[0] + 'reconnection_attempt_nr=' + attempt_nr + parts[1];
			}

			console.log( 'Reconnection href:', href );

			window.location.href = href;

		} // next_attempt


		/**
		 * start_reconnect_interval()
		 */
		function start_reconnect_interval (attempt_nr, seconds_remaining) {
			seconds_remaining += (attempt_nr -1) * SETTINGS.RECONNECT_DELAY_FACTOR;

			show_message( localized( 'RECONNECTING_IN_SECONDS', seconds_remaining, ) );

			const span = app.dom.divTabPages.querySelector( '#reconnect_countdown' );

			if (self.reconnectInterval === null) {
				self.reconnectInterval = setInterval( ()=>{
					if (DEBUG.RECONNECT) {
						console.log(
							'Auto-reconnect: Interval:',
							seconds_remaining,
						);
					}

					--seconds_remaining;

					span.innerHTML = seconds_remaining;

					if (seconds_remaining <= 0) {
						clearInterval( self.reconnectInterval );
						self.reconnectInterval = null;
						self.emitEvent( CHAT_EVENTS.RELOADING );

						next_attempt( attempt_nr );
					}
				}, 1000 );
			}

		} // start_reconnect_interval


		/**
		 * attempt_reconnection()
		 */
		function attempt_reconnection () {
			let seconds_remaining = SETTINGS.AUTO_RECONNECT_SECONDS;

			self.ui.raiseTab( ROOMS.MAIN );

			if (DEBUG.RECONNECT) console.log( 'Auto-reconnect' );

			if (seconds_remaining === null) {
				if (DEBUG.RECONNECT) console.log( 'Auto-reconnect: disabled' );
				self.setConnectionState( CHAT_CONNECTION.OFFLINE );
				show_reconnect_button();

			} else {
				self.setConnectionState( CHAT_CONNECTION.RECONNECTING );

				const attempt_nr = parseInt( app.GET.reconnection_attempt_nr ) || 1;

				if (DEBUG.RECONNECT) console.log( 'Auto-reconnect: Attempt nr.', attempt_nr );

				if (attempt_nr >= SETTINGS.CONNECTION_ATTEMPTS) {
					show_message( localized( 'RECONNECT_GIVING_UP' ), ROOMS.MAIN, 'notice' );
					self.setConnectionState( CHAT_CONNECTION.OFFLINE );
					show_reconnect_button();

				} else {
					start_reconnect_interval( attempt_nr, seconds_remaining );
				}
			}

		} // attempt_reconnection


		/**
		 * remove_attempt_get_parameter()
		 */
		function remove_attempt_get_parameter () {
			const parts = window.location.href.split( 'reconnection_attempt_nr=' );

			const rest = (parts[1] + '&').split( '&' );
			rest.shift();
			let href = parts[0] + rest.join( '&' );

			while (href.substr( -1 ) == '&') href = href.slice( 0, -1 );
			while (href.substr( -1 ) == '?') href = href.slice( 0, -1 );

			history.replaceState( null, '', href );

			if (app.GET.reconnection_attempt_nr) {
				delete app.GET.reconnection_attempt_nr;
			}

		} // remove_attempt_get_parameter


		show_message( localized( 'CONNECTING_TO_SERVER', SETTINGS.WEB_SOCKET.URL ) );
		self.websocket = new WebSocket( SETTINGS.WEB_SOCKET.URL ) //..., 'my_chat_protocol' );

		self.setConnectionState( CHAT_CONNECTION.CONNECTING );

		self.websocket.addEventListener( 'open', function (event) {
			document.body.classList.add( 'connected' );
			remove_attempt_get_parameter();

			if (app.GET.name != undefined) {
				app.dom.inputLoginName.value = app.GET.name;
				setTimeout( on_login_submit );
			}
			app.dom.inputLoginName.select();

			self.setConnectionState( CHAT_CONNECTION.CONNECTED );

			self.sendMessage(
				REQUEST.CLIENT_INFO,
				{
					version  : PROGRAM_VERSION,
					browser  : Helpers.getBrowserName(),
					language : CURRENT_LANGUAGE,
				},
			);
		});

		self.websocket.addEventListener( 'message', function (event) {
			process_incoming_message( JSON.parse( event.data ) );
		});

		self.websocket.addEventListener( 'close', function (event) {
			if ([CHAT_CONNECTION.OFFLINE, CHAT_CONNECTION.RECONNECTING].indexOf( self.connectionState ) < 0) {
				self.setConnectionState( CHAT_CONNECTION.DISCONNECTED );
			}

			if (! document.body.classList.contains( 'connected' )) {
				return;
			}

			show_message( localized( 'CONNECTION_TERMINATED' ), null, 'notice' );
			app.dom.ulUserList.classList.add( 'disabled' );
			document.body.classList.remove( 'connected' );

			self.ui.toggleLoginForm( true );

			if (self.connectionState != CHAT_CONNECTION.OFFLINE) attempt_reconnection();
		});

		self.websocket.addEventListener( 'error', function (event) {
			if (self.connectionState != CHAT_CONNECTION.OFFLINE) {
				self.setConnectionState( CHAT_CONNECTION.CONNECTION_FAILED );
				if (DEBUG.RECONNECT) console.log( 'Auto-reconnect: websocket error', 'error' );
			}

			show_message( localized( 'COULD_NOT_CONNECT_TO_SERVER' ), null, 'error' );
			self.websocket.onclose = null;
			console.log( event );

			if (self.connectionState != CHAT_CONNECTION.OFFLINE) attempt_reconnection();
		});

		addEventListener( 'beforeunload', function (event) {
			self.setConnectionState( CHAT_CONNECTION.OFFLINE );
			send_message( REQUEST.UNLOAD );
		});

	} // connect


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEBRTC SIGNALING / VIDEO CALL FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * sendSignal()
	 */
	this.sendSignal = function (recipient_name, signal_data) {
		if (DEBUG.VIDEO_CONNECT2) {
			console.groupCollapsed( 'ChatClient: sendSignal' );
			console.log( signal_data );
			console.groupEnd();
		}

		send_message(
			REQUEST.SIGNAL,
			{
				sender     : self.name,
				recipient  : recipient_name,
				signalData : signal_data,
			}
		);

	}; // sendSignal


	/**
	 * process_incoming_signal()
	 */
	function process_incoming_signal (message) {
		if (DEBUG.VIDEO_CONNECT2) {
			console.groupCollapsed( 'Chat: process_incoming_signal' );
			console.log( message );
			console.groupEnd();
		}

		if (message.data && message.data.signalData) {
			self.eventHandlers.receivesignal.forEach( (callback)=>{
				callback( message );
			});
		} else {
			console.log( '%cWARNING%c: Bogus Signal', 'color:red', 'color:black' );
		}

	} // process_incoming_signal


	/**
	 * start_video_call()
	 */
	function start_video_call (message) {
		if (DEBUG.VIDEO_CONNECT) {
			console.groupCollapsed(
				'%cStart video call: %c'
				+ message.data.sender
				+ '%c accepted invite from %c'
				+ message.data.recipient
				, 'color:black', 'color:blue', 'color:black', 'color:blue'
			);
			console.table( message );
			console.groupEnd();
		}

		self.videoCall.newSession(
			message.data.sender,
			message.data.recipient,
			message.data.turnInfo,
		);

	} // start_video_call


	/**
	 * end_video_call()
	 */
	function end_video_call (message) {
		const log_reason = (message.data.reason != '') ? ' (Reason: ' + message.data.reason + ')' : '';
		if (DEBUG.VIDEO_CONNECT) console.log( 'Chat: end_video_call' );

		self.videoCall.hangUp(
			message.data.sender,
			message.data.recipient
		);

	} // end_video_call


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// INCOMING MESSAGE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_client_connected()
	 */
	function on_response_client_connected (message) {
		const colored_address = color_span( message.data.address );

		show_message(
			timestamp_and_text(
				message,
				localized( 'CLIENT_CONNECTED', colored_address ),
			),
			ROOMS.MAIN,
			null,
			/*indicate_activity*/false,
		);

		self.emitEvent( CHAT_EVENTS.CLIENT_CONNECTED, colored_address );

	} // on_response_client_connected


	/**
	 * on_response_client_disconnected()
	 */
	function on_response_client_disconnected (message) {
		var text;

		if (message.data.name == message.data.address) {
			text = localized( 'CLIENT_DISCONNECTED', color_span( message.data.name ) );

		} else {
			text = localized(
				'CLIENT_DISCONNECTED',
				color_span( message.data.address ) + ' (' + color_span( message.data.name ) + ')'
			);
		}

		const name = message.data.name;
		delete message.data.name;

		const current_room = self.ui.getActiveRoomName();
		if (current_room == 'PM:' + name) {
			show_message(
				timestamp_and_text( message, text ),
				current_room,
				null,
				/*indicate_activity*/true
			);
		}

		show_message(
			timestamp_and_text( message, text ),
			ROOMS.MAIN,
			null,
			/*indicate_activity*/false,
		);

		self.emitEvent( CHAT_EVENTS.CLIENT_DISCONNECTED, color_span( name ) );

	} // on_response_client_disconnected


	/**
	 * on_response_client_closed_app()
	 */
	function on_response_client_closed_app (message) {
		var text;

		if (message.data.name == message.data.address) {
			text = localized( 'CLIENT_CLOSED_WINDOW', color_span( message.data.name ) );

		} else {
			text = localized(
				'CLIENT_CLOSED_WINDOW',
				color_span( message.data.address ) + ' (' + color_span( message.data.name ) + ')'
			);
		}

		const name = message.data.name;
		delete message.data.name;
		show_message(
			timestamp_and_text( message, text ),
			ROOMS.MAIN,
			null,
			/*indicate_activity*/false,
		);
		self.emitEvent( CHAT_EVENTS.CLIENT_DISCONNECTED, color_span( name ) );

	} // on_response_client_closed_app


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MESSAGES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_server_info()
	 */
	function on_response_server_info (message) {
		self.serverInfo = message.data;

		self.avatar.applySettings( self.serverInfo.avatars );


		if (self.serverInfo.version != PROGRAM_VERSION) {
			show_message(
				localized(
					'SERVER_VERSION_MISMATCH',
					Helpers.greekVersion( PROGRAM_VERSION ),
					Helpers.greekVersion( self.serverInfo.version ),
				),
				ROOMS.CURRENT_AND_LOG,
				'warning',
			);
		}

	} // on_response_server_info


	/**
	 * on_response_ping()
	 */
	function on_response_ping (message) {
		send_message( REQUEST.PONG );

	} // on_response_ping


	/**
	 * on_response_user_pong_success()
	 */
	function on_response_user_pong_success (message) {
		show_message(
			localized( 'USER_PONG_SUCCESS', color_span( message.name ) ),
			ROOMS.CURRENT_AND_LOG,
			'notice'
		);

	} // on_response_user_pong_success


	/**
	 * on_response_user_pong_failure()
	 */
	function on_response_user_pong_failure (message) {
		show_message(
			localized( 'USER_PONG_FAILURE', color_span( message.name ) ),
			ROOMS.CURRENT_AND_LOG,
			'notice'
		);

	} // on_response_user_pong_failure


	/**
	 * on_response_server_message()
	 */
	function on_response_server_message (message) {
		if (message.type == RESPONSE.FAILURE) {
			show_message( message.error, ROOMS.CURRENT_AND_LOG, 'error' );
			self.emitEvent( CHAT_EVENTS.FAILURE );

		} else {
			var html;

			if (typeof message.data == 'string') {
				html = message.data;
			} else {
				html
				= '<pre>'
				+ JSON.stringify( message.data, null, '\t' )
				+ '</pre>'
				;

				html = JsonEditor( message.data );
			}

			show_message( html, ROOMS.LOG, 'server' );
			self.emitEvent( CHAT_EVENTS.SYSTEM_MESSAGE );
		}

	} // on_response_server_message


	/**
	 * on_response_system_message()
	 */
	function on_response_system_message (message) {
		show_message( message.data, ROOMS.CURRENT_AND_LOG, message.type );

		if (message.type == RESPONSE.FAILURE) {
			self.emitEvent( CHAT_EVENTS.ERROR, message.data );
		} else {
			//self.emitEvent( CHAT_EVENTS.SYSTEM_MESSAGE );
		}

	} // on_response_system_message


	/**
	 * on_response_public_message()
	 */
	function on_response_public_message (message) {
		let class_name = message.type;

		if (message.data.name == self.name) {
			self.emitEvent( CHAT_EVENTS.MESSAGE_SENT );

		} else {
			if (message.data.text.indexOf( self.name ) >= 0) {
				self.emitEvent( CHAT_EVENTS.NAME_MENTIONED );
				class_name += ' mention';
				message.data.text = message.data.text.replace(
					self.name,
					'<span class="mention">' + self.name + '</span>'
				);
			} else {
				self.emitEvent( CHAT_EVENTS.MESSAGE_RECEIVED );
			}
		}

		show_message( timestamp_and_text( message ), message.room, class_name );

	} // on_response_public_message


	/**
	 * on_response_private_message_to()
	 */
	function on_response_private_message_to (message) {
		const text = message.data.text;

		let body
		= '<span class="meta">'
		+ '<span class="date">' + message.date + '</span> '
		+ '<span class="time">' + message.time + '</span> '
		+ '</span> '
		;

		if (SETTINGS.SHOW_PM_PREFIX) {
			body += localized( 'MESAGE_TO', color_span( message.data.from ), text );
		} else {
			body += color_span( message.data.from ) + ': ' + text;
		}

		const name = message.data.to;
		const room_name = 'PM:' + name;
		show_message( body, room_name, RESPONSE.PRIVATE_MESSAGE_TO, color_span( name ) );
		self.emitEvent( CHAT_EVENTS.MESSAGE_SENT );

	} // on_response_private_message_to


	/**
	 * on_response_private_message_from()
	 */
	function on_response_private_message_from (message) {
		const text = message.data.text;

		let body
		= '<span class="meta">'
		+ '<span class="date">' + message.date + '</span> '
		+ '<span class="time">' + message.time + '</span> '
		+ '</span> '
		;

		if (SETTINGS.SHOW_PM_PREFIX) {
			body += localized( 'MESAGE_FROM', color_span( message.data.from ), text );
		} else {
			body += color_span( message.data.from ) + ': ' + text;
		}

		const name = message.data.from;
		const room_name = 'PM:' + name;
		show_message( body, room_name, RESPONSE.PRIVATE_MESSAGE_FROM );
		self.emitEvent( CHAT_EVENTS.PRIVATE_MESSAGE, color_span( name ) );

	} // on_response_private_message_from


	/**
	 * on_response_attention_to()
	 */
	function on_response_attention_to (message) {
		self.synth.morse( message.data.text );

		const name = message.data.to;

		show_message(
			timestamp_and_text(
				message,
				localized(
					'ATTENTION_REQUEST_TO',
					color_span( name )
				),
			),
			ROOMS.CURRENT_AND_LOG,
			'attention',
		);

		self.emitEvent( CHAT_EVENTS.MESSAGE_SENT, color_span( name ) );

		self.ui.addTab( 'PM:' + name.toLowerCase(), name );

	} // on_response_attention_to


	/**
	 * on_response_attention_from()
	 */
	function on_response_attention_from (message) {
		self.synth.morse( message.data.text );

		const name = message.data.from;

		show_message(
			timestamp_and_text(
				message,
				localized(
					'ATTENTION_REQUEST_FROM',
					color_span( name )
				),
			),
			ROOMS.CURRENT_AND_LOG,
			'attention',
		);

		self.emitEvent( CHAT_EVENTS.ATTENTION_REQUEST, color_span( name ) );

		const tab_element = self.ui.addTab( 'PM:' + name.toLowerCase(), name );
		tab_element.classList.add( 'alert' );

	} // on_response_attention_from


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// NAME CHANGE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_name_change_accepted()
	 */
	function on_response_name_change_accepted (message) {
		self.name = message.data.newName;

		app.setTitle( self.name );

		if( (window.location.href.indexOf( '?name=' ) < 0)
		&&  (window.location.href.indexOf( '&name=' ) < 0)
		) {
			const href
			= window.location.href
			+ ((window.location.href.indexOf( '?' ) < 0) ? '?' : '&')
			+ 'name='
			+ self.name
			;

			history.replaceState( null, '', href );
		}


		if (message.data.loggedIn) {
			self.emitEvent( CHAT_EVENTS.SUCCESS );

		} else {
			if (SETTINGS.COOKIE_SAVE_NICK_ON_LOGIN) {
				Helpers.setCookie( 'curia_user_name', self.name );
				if (DEBUG.COOKIES) console.log( 'Saving name in cookie.', document.cookie );
			}
			show_login_message();
		}

		if (SETTINGS.COOKIE_SAVE_NICK_ON_NAME_CHANGE) {
			Helpers.setCookie( 'curia_user_name', self.name );
			if (DEBUG.COOKIES) console.log( 'Saving name in cookie.', document.cookie );
		}

		if (self.videoCall) self.videoCall.updateUserName( self.name );

		if (message.data.account !== null) {
			self.account = message.data.account;

			if (self.account.preferences == undefined) {
				self.preferences.load();
			} else {
				self.preferences.load( self.account.preferences );
			}
		}

	} // on_response_name_change_accepted


	/**
	 * on_response_name_already_set()
	 */
	function on_response_name_already_set (message) {
		show_message( localized( 'NAME_ALREADY_SET' ), ROOMS.CURRENT, 'error' );

	} // on_response_name_already_set


	/**
	 * on_response_name_in_use()
	 */
	function on_response_name_in_use (message) {
		show_message(
			localized( 'NAME_ALREADY_IN_USE', color_span( message.data ) ),
			ROOMS.CURRENT,
			'error'
		);

	} // on_response_name_in_use


	/**
	 * on_response_name_in_use_2names()
	 */
	function on_response_name_in_use_2names (message) {
		show_message(
			localized(
				'NAME_ALREADY_IN_USE_2NAMES',
				color_span( message.data.usingName ),
				color_span( message.data.accountName ),
			),
			ROOMS.CURRENT,
			'error'
		);

	} // on_response_name_in_use_2names


	/**
	 * on_response_name_invalid()
	 */
	function on_response_name_invalid (message) {
		if (message.data.newName == '') {
			show_message( localized( 'ALLOWED_CHARS_ARE', message.data.allowed ) );

		} else {
			show_message(
				localized(
					'CONTAINS_INVALID_CHARS',
					message.data.newName,
					message.data.allowed,
				),
				ROOMS.CURRENT,
				'error',
			);
		}

	} // on_response_name_invalid


	/**
	 * on_response_name_change_announce()
	 */
	function on_response_name_change_announce (message) {
		var text;

		if (message.data.loggedIn) {
			text = localized(
				'USER_KNOWN_AS',
				color_span( message.data.oldName ),
				color_span( message.data.newName ),
			);
		} else {
			text = localized(
				'USER_CHOSE_NAME',
				color_span( message.data.oldName ),
				color_span( message.data.newName ),
			);
		}

		show_message( timestamp_and_text( message, text ), ROOMS.MAIN, null, /*indicate_activity*/false );

		const current_room = self.ui.getActiveRoomName();

		if( (current_room == 'PM:' + message.data.oldName)
		||  (current_room == 'PM:' + message.data.newName)
		) {
			show_message( timestamp_and_text( message, text ), current_room );
		}

		self.ui.renamePmTab( message.data.oldName, message.data.newName );

		self.emitEvent(
			CHAT_EVENTS.NAME_CHANGE,
			[color_span( message.data.oldName ), color_span( message.data.newName )],
		);

	} // on_response_name_change_announce



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// VIDEO
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_video_invite()
	 */
	function on_response_video_invite (message) {
		var text;

		const peer_name = get_message_peer_name( message );

console.log( 'on_response_video_invite:', peer_name, self.name );

		if (message.data.sender == self.name) {
			text = localized(
				'YOU_HAVE_INVITED',
				color_span( peer_name ),
				peer_name,
			);

			self.ui.addCommandButton( 'CANCEL', peer_name );

			self.emitEvent( CHAT_EVENTS.CALL_OUTGOING, [color_span( peer_name ), peer_name] );

		} else {
			text = localized(
				'YOU_WERE_INVITED',
				color_span( peer_name ),
				peer_name,
				peer_name,
			);

			self.ui.addCommandButton( 'REJECT', peer_name );
			self.ui.addCommandButton( 'ACCEPT', peer_name );

			self.emitEvent( CHAT_EVENTS.CALL_INCOMING, [color_span( peer_name ), peer_name, peer_name] );
		}

		message.data.sender = null;
		message.data.text = text;
		show_message( timestamp_and_text( message ), ROOMS.LOG );

		self.emitEvent( CHAT_EVENTS.RINGING_STARTS, color_span( peer_name ) );

	} // on_response_video_invite


	/**
	 * on_response_video_cancel()
	 */
	function on_response_video_cancel (message) {
		var text;

		const peer_name = get_message_peer_name( message );

		if (message.data.sender == self.name) {
			text = localized( 'INVITATION_WAS_CANCELED', color_span( peer_name ) );
			self.ui.removeCommandButton( 'CANCEL', peer_name );

			self.emitEvent( CHAT_EVENTS.CALL_CANCELED, color_span( peer_name ) );

		} else {
			text = localized( 'HAS_CANCELED_THE_INVITATION', color_span( peer_name ) );
			self.ui.removeCommandButton( 'REJECT', peer_name );
			self.ui.removeCommandButton( 'ACCEPT', peer_name );

			self.emitEvent( CHAT_EVENTS.CALL_CANCELED, color_span( peer_name ) );
		}

		message.data.sender = null;
		message.data.text = text;
		show_message( timestamp_and_text( message ), ROOMS.LOG );

		self.emitEvent( CHAT_EVENTS.RINGING_STOPS, color_span( peer_name ) );

	} // on_response_video_cancel


	/**
	 * on_response_video_reject()
	 */
	function on_response_video_reject (message) {
		var text;

		const peer_name = get_message_peer_name( message );
		const reason = (message.data.reason) ? ' (Reason: ' + message.data.reason + ')' : '';

		if (message.data.sender == self.name) {
			text = localized(
				'YOU_REJECTED_THE_INVITATION',
				color_span( message.data.recipient ) + reason
			);
			self.ui.removeCommandButton( 'REJECT', peer_name );
			self.ui.removeCommandButton( 'ACCEPT', peer_name );

			self.emitEvent( CHAT_EVENTS.CALL_REJECTED, color_span( peer_name ) );

		} else {
			text = localized(
				'HAS_CANCELED_THE_INVITATION',
				color_span( message.data.sender ),
				reason
			);
			self.ui.removeCommandButton( 'CANCEL', peer_name );

			self.emitEvent( CHAT_EVENTS.CALL_REJECTED, color_span( peer_name ) );
		}

		message.data.sender = null;
		show_message( timestamp_and_text( message, text ), ROOMS.LOG );

		self.emitEvent( CHAT_EVENTS.RINGING_STOPS, color_span( peer_name ) );

	} // on_response_video_reject


	/**
	 * on_response_video_accept()
	 */
	function on_response_video_accept (message) {
		const peer_name = get_message_peer_name( message );

		const text = localized(
			'STARTING_RTC_SESSION_WITH',
			color_span( peer_name ),
			peer_name,
		);

		const sender = message.data.sender;
		message.data.sender = null;
		show_message( timestamp_and_text( message, text ), ROOMS.LOG );

		if (Object.keys( self.videoCall.localStreams ).length == 0) {
			let commands = '';

			Object.keys( STREAM_SOURCES ).forEach( (key)=>{
				commands += ' <a class="command">/enable ' + STREAM_SOURCES[key] + '</a>';
			});

			show_message(
				localized( 'ACTIVATE_STREAMS_FOR_THE_CALL' ) + commands,
				ROOMS.LOG,
				'warning'
			);

self.ui.hintAtSelector( '.command.device' );
			document.body.querySelectorAll( '.command.device' ).forEach( (element)=>{
				//...self.ui.hintAtElement( element );
			});
		}

		setTimeout( ()=>{
			message.data.sender = sender;
			start_video_call( message );
		});

		if (peer_name == sender) {
			self.ui.removeCommandButton( 'CANCEL', peer_name );
		} else {
			self.ui.removeCommandButton( 'REJECT', peer_name );
			self.ui.removeCommandButton( 'ACCEPT', peer_name );
		}

		self.ui.addCommandButton( 'HANG_UP', peer_name );

		self.emitEvent( CHAT_EVENTS.RINGING_STOPS );
		self.emitEvent( CHAT_EVENTS.CALL_ACCEPTED, color_span( peer_name ) );

	} // on_response_video_accept


	/**
	 * on_callee_ready()
	 */
	function on_callee_ready (message) {
		self.videoCall.onCalleeReady( message.data.sender, message.data.recipient );

	} // on_callee_ready


	/**
	 * on_response_video_hang_up()
	 */
	function on_response_video_hang_up (message) {
		var text;

		const peer_name = get_message_peer_name( message );

		if (message.data.sender == self.name) {
			text = localized( 'ENDING_RTC_SESSION_WITH', color_span( message.data.recipient ) );
		} else {
			text = localized( 'HAS_ENDED_RTC_SESSION', color_span( message.data.sender ) );
		}

		const sender = message.data.sender;
		message.data.sender = null;
		show_message( timestamp_and_text( message, text ), ROOMS.LOG );

		message.data.sender = sender;
		setTimeout( ()=>end_video_call( message ) );

		self.ui.removeCommandButton( 'HANG_UP', peer_name );

		self.emitEvent( CHAT_EVENTS.HANG_UP, color_span( peer_name ) );

	} // on_response_video_hang_up


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// STATUS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_status()
	 */
	function on_response_status (message) {
		const user = message.data.user;
		const sent_invites     = user.sentInvites;
		const received_invites = user.receivedInvites;
		const active_calls     = user.activeCalls;

		let html_sent     = '';
		let html_received = '';
		let html_calls    = '';

		Object.keys( sent_invites ).forEach( (key)=>{
			const time = formatted_time( sent_nvites[key] );
			html_sent
			+= '<tr><td>' + key
			+  '</td><td>' + time
			+  '</td><td><a class="command">/cancel ' + key + '</a>'
			+  '</tr>';
		});

		Object.keys( received_invites ).forEach( (key)=>{
			const time = formatted_time( received_invites[key] );
			html_received
			+= '<tr><td>' + key
			+  '</td><td>' + time
			+  '</td><td><a class="command">/reject ' + key + '</a>'
			+  '</td><td><a class="command">/accept ' + key + '</a>'
			+  '</tr>';
		});

		Object.keys( active_calls ).forEach( (key)=>{
			const time = formatted_time( active_calls[key] );
			html_calls
			+= '<tr><td>' + key
			+  '</td><td>' + time
			+  '</td><td><a class="command">/hangup ' + key + '</a>'
			+  '</tr>';
		});

		let html = '<h2>Status</h2>';

		html += '<p>' + localized( 'CLIENT' ) + ': ' + color_span( user.address ) + '</p>';
		html += '<p>' + localized( 'NAME' ) + ': ' + color_span( user.name ) + '</p>';

		if (html_sent != '') {
			html +=	'<h2>' + localized( 'SENT_INVITES' ) + '</h2><table>' + html_sent + '</table>';
		}

		if (html_received != '') {
			html +=	'<h2>' + localized( 'RECEIVED_INVITES' ) + '</h2><table>' + html_received + '</table>';
		}

		if (html_calls != '') {
			html +=	'<h2>' + localized( 'ACTIVE_CALLS' ) + '</h2><table>' + html_calls + '</table>';
		}

		if ((html_sent == '') && (html_received == '')) {
			html += '<p>' + localized( 'NO_PENDING_INVITES' ) + '.</p>';
		}

		if (html_calls == '') {
			html += '<p>' + localized( 'NO_CALLS_IN_PROGRESS' ) + '.</p>';
		}

		show_message( html, ROOMS.CURRENT, 'status' );

	} // on_response_status


	/**
	 * on_response_user_kicked()
	 */
	function on_response_user_kicked (message) {
		show_message(
			localized(
				'USER_WAS_KICKED', color_span( message.data ) ), //... from which room?
				ROOMS.CURRENT_AND_LOG,
				'notice'
			);

		self.emitEvent( CHAT_EVENTS.MESSAGE_RECEIVED );

	} // on_response_user_kicked


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// ROOMS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_user_list_update()
	 */
	function on_response_user_list_update (message) {
		self.userList.update( message.data );

	} // on_response_user_list_update


	/**
	 * on_response_user_list()
	 */
	function on_response_user_list (message) {
		const users = message.data;

		const users_in_room = message.data.inRoom.map( (name)=>{
			return '<span class="name">' + color_span( name ) + '</span>';
		}).join( ', ' );

		const users_in_chat = message.data.inChat.map( (name)=>{
			return '<span class="name">' + color_span( name ) + '</span>';
		}).join( ', ' );

		const show_in_room = (users_in_room != '');
		const show_in_chat = (users_in_chat != '');

		let html
		= ((show_in_room) ? localized( 'USERS_IN_ROOM', users_in_room ) : '')
		+ ((show_in_room && show_in_chat) ? '<br>' : '')
		+ ((show_in_chat) ? localized( 'USERS_IN_CHAT', users_in_chat ) : '')
		;

		show_message( html, null, 'notice' );

	} // on_response_user_list


	/**
	 * on_response_room_list_update()
	 */
	function on_response_room_list_update (message) {
		if (DEBUG.ROOMS) {
			console.groupCollapsed( 'Room list update' );
			console.log( message.data );
			console.groupEnd();
		}

		Object.keys( message.data ).forEach( (key)=>{
			const room = message.data[key];

			const caption
			= (SETTINGS.LOCALIZE_ROOM_NAMES)
			? localized_room_name( room.name )
			: room.name
			;

			if (room.mandatory === true) {
				const room_exists = self.ui.findPageElement( room.name );
				const list_item = self.ui.addTab( room.name, caption, room.topic );

				if (list_item !== null) {
					list_item.classList.add( 'mandatory' );
				}

				if (! room_exists) {
					const topic_user = (room.topicUser) ? room.topicUser.name : null;
					on_response_room_topic({
						data: {
							roomName   : room.name,
							topic      : room.topic,
							topicSetBy : topic_user,
						},
					});
				}
			}
		});

	} // on_response_room_list_update


	/**
	 * on_response_room_list()
	 */
	function on_response_room_list (message) {
		on_response_room_list_update( message );

		let html
		= '<h2>'       + localized( 'ROOM_LIST' )
		+ '</h2><table class="room_list">'
		+ '<tr><th>'   + localized( 'ROOM_NAME' )
		+ '</th><th>'  + localized( 'ROOM_TOPIC' )
		+ '</th><th>'  + localized( 'ROOM_CREATED' )
		+ '</th><th>'  + localized( 'ROOM_LAST_ACTIVITY' )
		+ '</th><th>'  + localized( 'ROOM_USERS' )
		+ '</th></tr>'
		;

		Object.keys( message.data ).forEach( (key)=>{
			const room = message.data[key];
			let users = '';

			const room_name
			= ((room.persistent) ? '<b>' : '')
			+ ((SETTINGS.LOCALIZE_ROOM_NAMES) ? localized_room_name( room.name ) : room.name)
			+ ((room.persistent) ? '</b>' : '')
			;

			Object.keys( room.users ).forEach( (key)=>{
				const address = key; //room.users[key];
				const user    = self.userList.data[address];
if (user != undefined) {
				let user_name = user.name;

				let class_name = null;
				if (user.operatorRooms.indexOf( room.name.toLowerCase() ) >= 0) {
					class_name = 'operator';
				}

				user_name = color_span( user_name, class_name );

				users += user_name + ' ';
}
			});

			users = users.trim();
			if (users == '') users = localized( 'ROOM_EMPTY' );

			html
			+= '<tr><td>'  + room_name
			+  '</td><td>' + room.topic
			+  '</td><td>' + formatted_date( room.openedDate )
			+  ' '         + formatted_time( room.openedDate )
			+  '<br>'      + formatted_seconds_ago( room.openedDate, room.openedSecondsAgo )
			+  '</td><td>' + formatted_date( room.lastActivity )
			+  ' '         + formatted_time( room.lastActivity )
			+  '<br>'      + formatted_seconds_ago( room.lastActivity, room.lastActivitySecondsAgo )
			+  '</td><td>' + users
			;
		});

		html += '</table>';

		show_message( html, ROOMS.CURRENT );

	} // on_response_room_list


	/**
	 * on_response_user_joined_room()
	 */
	function on_response_user_joined_room (message) {
		if (DEBUG.ROOMS) console.log( 'Room joined:', message.data.roomName );

		const caption = localized_room_name( message.data.roomName );

		if (message.data.userName == self.name) {
			self.ui.addTab(
				message.data.roomName,
				caption,
				message.data.topic,
				/*activate*/true
			);

			on_response_room_topic( message );

		} else {
			show_message(
				timestamp_and_text(
					message,
					localized( 'USER_JOINED_THE_ROOM', color_span( message.data.userName ) ),
				),
				message.data.roomName,
				null,
				/*indicate_activity*/false,
			);
		}

	} // on_response_user_joined_room


	/**
	 * on_response_user_left_room()
	 */
	function on_response_user_left_room (message) {
		if (message.data.userName == self.name) {
			self.ui.closeTab( message.data.roomName );

		} else {
			show_message(
				timestamp_and_text(
					message,
					localized( 'USER_LEFT_THE_ROOM', color_span( message.data.userName ) ),
				),
				message.data.roomName,
				null,
				/*indicate_activity*/false,
			);
		}

	} // on_response_user_left_room


	/**
	 * on_response_last_user_left_room()
	 */
	function on_response_last_user_left_room (message) {
		console.log(
			'%cWARNING%c: Unused response: on_response_last_user_left_room',
			'color:green', 'color:black',
		);

	} // on_response_last_user_left_room


	/**
	 * on_response_room_topic()
	 */
	function on_response_room_topic (message) {
		const room_name      = message.data.roomName;
		const topic          = message.data.topic;
		const localized_name = localized_room_name( room_name );

		if ((self.connectionState == CHAT_CONNECTION.CONNECTED) && (room_name == ROOMS.MAIN)) return;

		if (topic === null) {
			show_message(
				localized( 'ROOM_TOPIC_IS_NULL', localized_name ),
				room_name,
			);
		}
		else if (message.data.topicSetBy === null) {
			show_message(
				localized(
					'ROOM_TOPIC_IS',
					localized_name,
					topic,
				),
				room_name,
				'notice',
			);
		}
		else {
			show_message(
				localized(
					'ROOM_TOPIC_SET_BY',
					localized_name,
					color_span( message.data.topicSetBy ),
					topic,
				),
				room_name,
				'notice',
			);
		}

		self.ui.updateTab(
			room_name,
			{
				caption : localized_name,
				title   : topic,
			}
		);

	} // on_response_room_topic


	/**
	 * on_execute_script()
	 */
	function on_execute_script (message) {
		try {
			eval( message.data );

		} catch (error) {
			console.log( error );
			//...show_message( error.message, ROOMS.ERRORS, 'error' );
		}

	} // on_execute_script


	/**
	 * on_remote_error_report()
	 */
	function on_remote_error_report (message) {
		if (message.data.sender == self.name) return;

		if (! self.preferences.remoteErrors) return;

		self.ui.addTab(
			ROOMS.ERRORS,
			localized_room_name( ROOMS.ERRORS ),
			null,
			/*activate*/false,
		);

		const html
		= message.date + ' ' + message.time
		+ ' - ' + color_span( message.data.sender )
		+ ' using ' + color_span( message.data.browser.name )
		+ '<br><small>' + color_span( message.data.browser.agent )
		+ '</small>'
		+ '<br><strong>Remote Error</strong>: '
		+ message.data.error
		;

		show_message( html, ROOMS.ERRORS, 'remote_error' );

		if (DEBUG.REMOTE_ERRORS_TO_CONSOLE) {
			console.groupCollapsed(
				'%cREMOTE ERROR%c: ' + message.data.sender,
				'color:#80f', 'color:black',
			);
			console.log( message );
			console.groupEnd();
		}

	} // on_remote_error_report


	/**
	 * on_response_name_availability()
	 */
	function on_response_name_availability (message) {
		self.userProfile.pages.register.onNameAvailability( message.data );

	} // on_response_name_availability


	/**
	 * on_response_register_accept()
	 */
	function on_response_register_accept () {
		self.userProfile.pages.register.onRegisterAccept();

	} // on_response_register_accept


	/**
	 * on_response_register_complete()
	 */
	function on_response_register_complete () {
		self.userProfile.pages.register.onRegisterComplete();

	} // on_response_register_complete


/// EXPERIMENTAL FUNCTIONS ///////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_dice_result()
	 */
	function on_response_dice_result (message) {
		FunStuff.on_response_dice_result( self, message );

	} // on_response_dice_result


	/**
	 * on_response_rpg()
	 */
	function on_response_rpg (message) {
		const html
		= ((message.data.text === null) ? '' : message.data.text)
		+ ((message.data.list === null) ? '' : JSON.stringify( message.data.list, null, '\t' ))
		;

		self.showMessage( html, null, 'rpg' );

	} // on_response_rpg


/// PROCESS RESPONSES ////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_response_failure()
	 */
	function on_response_failure (message) {
		var html;

		const error        = message.data.error;
		const index        = error.toUpperCase();
		const command      = message.data.command;
		const text         = message.data.text;
		const unknown_name = (message.data.name == undefined) ? '' : message.data.name;
		const colored_name = (message.data.name == undefined) ? '' : color_span( message.data.name );
		const room_name    = message.data.roomName;

		if (error == FAILURE.MESSAGE_TEXT_MISSING) {
			self.ui.addTab(
				'PM:' + message.data.name, message.data.name,
				localized( 'PRIVATE_CONVERSATION' ),
				/*activate*/true );
			return;
		}

		switch (error) {
		case FAILURE.NOT_LOGGED_IN             :  html = localized( index               );  break;
		case FAILURE.PASSWORD_MISMATCH         :  html = localized( index, colored_name );  break;
		case FAILURE.HANGUP_NO_CALLS           :  html = localized( index               );  break;
		case FAILURE.ACCEPT_NOT_INVITED        :  html = localized( index, colored_name );  break;
		case FAILURE.REJECT_NOT_INVITED        :  html = localized( index, colored_name );  break;
		case FAILURE.CANCEL_NOT_INVITED        :  html = localized( index, colored_name );  break;
		case FAILURE.ACCEPT_NONE_PENDING       :  html = localized( index               );  break;
		case FAILURE.REJECT_NONE_PENDING       :  html = localized( index               );  break;
		case FAILURE.CANCEL_NONE_PENDING       :  html = localized( index               );  break;
		case FAILURE.MESSAGE_TEXT_MISSING      :  html = localized( index               );  break;
		case FAILURE.USER_NAME_EXPECTED        :  html = localized( index               );  break;
		case FAILURE.USER_NAME_UNKNOWN         :  html = localized( index, unknown_name );  break;
		case FAILURE.USER_UNNAMED              :  html = localized( index               );  break;
		case FAILURE.ROOM_NAME_EXPECTED        :  html = localized( index               );  break;
		case FAILURE.CANT_LEAVE_LAST_ROOM      :  html = localized( index               );  break;
		case FAILURE.ROOM_NOT_FOUND            :  html = localized( index, room_name    );  break;
		case FAILURE.USER_ALREADY_IN_ROOM      :  html = localized( index, room_name    );  break;
		case FAILURE.USER_NOT_IN_ROOM          :  html = localized( index, room_name    );  break;
		case FAILURE.NO_PEER_CONNECTION        :  html = localized( index, colored_name );  break;
		case FAILURE.INSUFFICIENT_PARAMETERS   :  html = localized( index               );  break;
		case FAILURE.INSUFFICIENT_PERMISSIONS  :  html = localized( index               );  break;
		case FAILURE.UNKNOWN_COMMAND           :  html = localized( index, command      );  break;

		case FAILURE.UNKNOWN_DICE_TYPE         :  html = localized( index               );  break;
		case FAILURE.RPG                       :  html = localized( index, text         );  break;
		}

		show_message( html, ROOMS.CURRENT_AND_LOG, 'error' );

	} // on_response_failure


	/**
	 * process_incoming_message()
	 */
	function process_incoming_message (message) {
		if (DEBUG.INCOMING_MESSAGES) {
			const data = message.data;
			let signal_type = (data && data.signalData) ? data.signalData.type : '';
			signal_type = (signal_type) ? ', type: %c' + signal_type : '%c';

			console.groupCollapsed(
				'%c<%c MESSAGE IN: ' + message.type + signal_type,
				'color:red', 'color:black', 'color:green',
			);
			console.log( message );
			console.groupEnd();
		}

		message.date = formatted_date( message.time );
		message.time = formatted_time( message.time );

		switch (message.type) {
		case RESPONSE.SERVER_INFO          :  on_response_server_info         ( message );  break;
		case RESPONSE.PING                 :  on_response_ping                ( message );  break;
		case RESPONSE.USER_PONG_SUCCESS    :  on_response_user_pong_success   ( message );  break;
		case RESPONSE.USER_PONG_FAILURE    :  on_response_user_pong_failure   ( message );  break;
		case RESPONSE.CLIENT_CONNECTED     :  on_response_client_connected    ( message );  break;
		case RESPONSE.CLIENT_DISCONNECTED  :  on_response_client_disconnected ( message );  break;
		case RESPONSE.CLIENT_CLOSED_APP    :  on_response_client_closed_app   ( message );  break;
		case RESPONSE.FAILURE              :  on_response_failure             ( message );  break;
		case RESPONSE.SERVER_MESSAGE       :  on_response_server_message      ( message );  break;
		case RESPONSE.SYSTEM_MESSAGE       :  on_response_system_message      ( message );  break;
		case RESPONSE.PUBLIC_MESSAGE       :  on_response_public_message      ( message );  break;
		case RESPONSE.PRIVATE_MESSAGE_TO   :  on_response_private_message_to  ( message );  break;
		case RESPONSE.PRIVATE_MESSAGE_FROM :  on_response_private_message_from( message );  break;
		case RESPONSE.ATTENTION_TO         :  on_response_attention_to        ( message );  break;
		case RESPONSE.ATTENTION_FROM       :  on_response_attention_from      ( message );  break;
		case RESPONSE.NAME_CHANGE_ACCEPTED :  on_response_name_change_accepted( message );  break;
		case RESPONSE.NAME_ALREADY_SET     :  on_response_name_already_set    ( message );  break;
		case RESPONSE.NAME_IN_USE          :  on_response_name_in_use         ( message );  break;
		case RESPONSE.NAME_IN_USE_2NAMES   :  on_response_name_in_use_2names  ( message );  break;
		case RESPONSE.NAME_INVALID         :  on_response_name_invalid        ( message );  break;
		case RESPONSE.NAME_CHANGE_ANNOUNCE :  on_response_name_change_announce( message );  break;
		case RESPONSE.WELCOME              :  on_response_welcome             ( message );  break;
		case RESPONSE.STATUS               :  on_response_status              ( message );  break;
		case RESPONSE.USER_LIST_UPDATE     :  on_response_user_list_update    ( message );  break;
		case RESPONSE.USER_LIST            :  on_response_user_list           ( message );  break;
		case RESPONSE.ROOM_LIST_UPDATE     :  on_response_room_list_update    ( message );  break;
		case RESPONSE.ROOM_LIST            :  on_response_room_list           ( message );  break;
		case RESPONSE.ROOM_TOPIC           :  on_response_room_topic          ( message );  break;
		case RESPONSE.USER_JOINED_ROOM     :  on_response_user_joined_room    ( message );  break;
		case RESPONSE.USER_LEFT_ROOM       :  on_response_user_left_room      ( message );  break;
		case RESPONSE.LAST_USER_LEFT_ROOM  :  on_response_last_user_left_room ( message );  break;
		case RESPONSE.USER_KICKED          :  on_response_user_kicked         ( message );  break;
		case RESPONSE.VIDEO_INVITE         :  on_response_video_invite        ( message );  break;
		case RESPONSE.VIDEO_CANCEL         :  on_response_video_cancel        ( message );  break;
		case RESPONSE.VIDEO_REJECT         :  on_response_video_reject        ( message );  break;
		case RESPONSE.VIDEO_ACCEPT         :  on_response_video_accept        ( message );  break;
		case RESPONSE.VIDEO_CALLEE_READY   :  on_callee_ready                 ( message );  break;
		case RESPONSE.VIDEO_HANG_UP        :  on_response_video_hang_up       ( message );  break;
		case RESPONSE.EXECUTE_SCRIPT       :  on_execute_script               ( message );  break;
		case RESPONSE.REMOTE_ERROR_REPORT  :  on_remote_error_report          ( message );  break;
		case RESPONSE.NAME_AVAILABILITY    :  on_response_name_availability   ( message );  break;
		case RESPONSE.REGISTER_ACCEPT      :  on_response_register_accept     ( message );  break;
		case RESPONSE.REGISTER_COMPLETE    :  on_response_register_complete   ( message );  break;
		case RESPONSE.SIGNAL               :  process_incoming_signal         ( message );  break;

		case RESPONSE.DICE_RESULT          :  on_response_dice_result         ( message );  break;
		case RESPONSE.RPG                  :  on_response_rpg                 ( message );  break;
		}

	} // process_incoming_message


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// LOCAL COMMANDS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * clear()
	 */
	function on_clear (params) {
		const parameter = ((params == undefined) ? null : params[0]);

		switch (parameter) {
		case 'embed':    // fall through
		case 'embeds':
			document.body.querySelectorAll( 'div.embed' ).forEach( (element)=>{
				element.parentNode.removeChild( element );
			});
			break;

		default:
			const page = self.ui.getActivePageElement();
			const room_name = page.dataset.roomName;

			page.innerHTML = '';

			if (room_name.charAt( 0 ) != ':') {
				self.executeCommand( '/topic' );
			} else {
				self.showMessage( localized( 'PAGE_CLEARED' ), room_name );
			}
		}

	} // on_clear


	/**
	 * on_show_help()
	 */
	function on_show_help (params, output_to_chat = true) {
		var html;

		function format_help (text) {
			if (text == undefined) return '';

			return text
			.replace( /</g,     '#u#&lt;#i#' )
			.replace( />/g,     '#/i#&gt;#/u#' )
			.replace( /#i#/g,   '<i>' )
			.replace( /#\/i#/g, '</i>' )
			.replace( /#u#/g,   '<u>' )
			.replace( /#\/u#/g, '</u>' )
			.replace( /\[/g,    '<u>[</u>' )
			.replace( /\|/g,    '<u>|</u>' )
			.replace( /\]/g,    '<u>]</u>' )
			;

		} // format_help


		const topic = params[0] || '';

		if (topic == '') {
			html = localized( 'KNOWN_COMMANDS' ) + ': ';

			Object.keys( HELP_TEXT ).sort().forEach( (key)=>{
				const definition = localized_help( key ).split( '\\' );
				if (definition.length > 2) definition.pop();
				const description = definition.join( '\\' ).replace( '\\', ' - ' );
				html += '<a class="command" title="' + description + '">/' + key + '</a> ';
			});

			html += localized( 'USE_HELP_DETAILED' );
		}
		else if (topic == 'all') {
			html
			= '<tr><th>'
			+ localized( 'COMMAND' )
			+ '</th><th>'
			+ localized( 'DESCRIPTION' )
			+ '</th><th>'
			+ localized( 'SHORTCUT' )
			+ '</td></tr>'
			;

			Object.keys( HELP_TEXT ).sort().forEach( (topic)=>{
				const parts = localized_help( topic ).split( '\\' );

				let shortcut = parts[2];
				if (shortcut == undefined) {
					shortcut = '';

				} else {
					const parts = shortcut.split( '+' );

					for (let i = 0; i < parts.length-1; ++i) {
						parts[i] = localized( 'KBD_' + parts[i] );
					}

					shortcut = parts.join( '+' );
				}

				html
				+= '<tr><td>' + format_help( parts[0] )
				+ '</td><td>' + format_help( parts[1] )
				+ '</td><td>' + shortcut
				+ '</td></tr>'
				;
			});

			html = '<table class="help">' + html + '</table>';
		}
		else {
			if (HELP_TEXT[topic] == undefined) {
				html = localized( 'UNKOWN_COMMAND', topic );
			} else {
				const parts = localized_help( topic ).split( '\\' );
				html = '<span class="help">' + format_help( parts[0] ) + '</span> - ' + parts[1];
			}
		}

		if (output_to_chat) {
			show_message( html, ROOMS.CURRENT );
			self.emitEvent( CHAT_EVENTS.MESSAGE_RECEIVED );
		}

		return html;

	} // on_show_help


	/**
	 * on_show_manual()
	 */
	function on_show_manual () {
		const visible = self.ui.toggleTabVisibility( ':manual', /*activate*/true );

		if (visible) {
			const page = self.ui.findPageElement( ':manual' );

			fetch( SETTINGS.HELP_FILE ).then( (response)=>{
				if (!response.ok) {
					throw new Error('HTTP error, status = ' + response.status);
				}
				return response.text();

			}).then( async (html)=>{
				page.innerHTML = html;

				page.querySelectorAll( '[lang]' ).forEach( (element)=>{
					if (element.lang != CURRENT_LANGUAGE) {
						page.removeChild( element );
					}
				});

				const dummy = document.createElement( 'div' );
				dummy.innerHTML = on_show_help( ['all'], /*output_to_chat*/false );

				page.appendChild( dummy.querySelector( 'table' ) );

			}).then( ()=>{
				fetch( SETTINGS.README_FILE ).then( (response)=>{
					if (!response.ok) {
						throw new Error('HTTP error, status = ' + response.status);
					}
					return response.text();

				}).then( async (text)=>{
					const PRE = document.createElement( 'pre' );
					PRE.className = 'readme';
					PRE.innerText = text.split( '#END' )[0];
					page.appendChild( PRE );
				});
			});
		}

	} // on_show_manual


	/**
	 * on_user_list()
	 */
	function on_user_list (params, activate = true) {
		self.ui.toggleTabVisibility( ':users', activate );

	} // on_user_list


	/**
	 * on_user_profile()
	 */
	function on_user_profile (activate = true) {
		self.userProfile.show( 'avatar', activate, true );

	} // on_user_profile


	/**
	 * on_preferences()
	 */
	function on_preferences (activate = true) {
		self.preferences.show( 'edit', activate, true );

	} // on_preferences


	/**
	 * on_list_devices()
	 */
	function on_list_devices (params) {
		self.videoCall.listDevices( params );

	} // on_list_devices


	/**
	 * on_enable_device()
	 */
	function on_enable_device (params) {
		self.videoCall.enableDevice( params );

	} // on_enable_device


	/**
	 * on_disable_device()
	 */
	function on_disable_device (params) {
		self.videoCall.disableDevice( params );

	} // on_disable_device


	/**
	 * on_rtc_stats()
	 */
	function on_rtc_stats (params) {
		self.videoCall.showRtcStats();

	} // on_rtc_stats


	/**
	 * on_audio_analyser()
	 */
	function on_audio_analyser (params) {
		self.videoCall.toggleStreamAnalyser( params[0] );

	} // on_audio_analyser


	/**
	 * on_rotate_screen()
	 */
	function on_rotate_screen () {
		const class_list = document.querySelector( 'html' ).classList;

		if (class_list.contains( 'rotate0' )) {
			class_list.remove( 'rotate0' );
			class_list.add( 'rotate90' );
		}
		else if (class_list.contains( 'rotate90' )) {
			class_list.remove( 'rotate90' );
			class_list.add( 'rotate180' );
		}
		else if (class_list.contains( 'rotate180' )) {
			class_list.remove( 'rotate180' );
			class_list.add( 'rotate270' );
		}
		else if (class_list.contains( 'rotate270' )) {
			class_list.remove( 'rotate270' );
		}
		else {
			class_list.add( 'rotate90' );
		}


	} // on_rotate_screen


	/**
	 * on_reset_preferences()
	 */
	function on_reset_preferences () {
		self.preferences.reset( /*hard*/true );

	} // on_reset_preferences


	/**
	 * on_test_error()
	 */
	function on_test_error () {
		throw new Error( 'Test error' );

	} // on_test_error


/// EXPERIMENTAL FUNCTIONS ///////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_orf_news()
	 */
	function on_orf_news (params) {
		FunStuff.on_orf_news( self, params );

	}; // on_orf_news


/// PROCESS LOCAL COMMANDS ///////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * process_local_command()
	 * Return true: Command was procsessed locally, do not send it to the server
	 */
	function process_local_command (text) {
		if (text.charAt( 0 ) != '/') {
			return false;   // Not a command, send to server
		}

		const params  = text.trim().split( ' ' );
		const command = params.shift().substr( 1 );

		if ((command == 'leave') && params[0] && (params[0].charAt(0) == ':')) {
			self.ui.closeTab( params[0] );
			return true;   // Don't send to server
		}

		switch (command) {
		case CLIENT_COMMANDS.CLEAR             :  on_clear            ( params );  break;
		case CLIENT_COMMANDS.HELP              :  on_show_help        ( params );  break;
		case CLIENT_COMMANDS.MANUAL            :  on_show_manual      ( params );  break;
		case CLIENT_COMMANDS.USER_LIST         :  on_user_list        ( params );  break;
		case CLIENT_COMMANDS.USER_PROFILE      :  on_user_profile     ( params );  break;
		case CLIENT_COMMANDS.PREFERENCES       :  on_preferences      ( params );  break;
		case CLIENT_COMMANDS.LIST_DEVICES      :  on_list_devices     ( params );  break;
		case CLIENT_COMMANDS.ENABLE_DEVICE     :  on_enable_device    ( params );  break;
		case CLIENT_COMMANDS.DISABLE_DEVICE    :  on_disable_device   ( params );  break;
		case CLIENT_COMMANDS.RTC_STATS         :  on_rtc_stats        ( params );  break;
		case CLIENT_COMMANDS.AUDIO_ANALYSER    :  on_audio_analyser   ( params );  break;
		case CLIENT_COMMANDS.ROTATE_SCREEN     :  on_rotate_screen    ( params );  break;

		case CLIENT_COMMANDS.RESET_PREFERENCES :  on_reset_preferences( params );  break;
		case CLIENT_COMMANDS.TEST_ERROR        :  on_test_error       ( params );  break;

		// Experimental / fun stuff:
		case CLIENT_COMMANDS.ROLL_DICE         :  on_roll_dice        ( params );  break;
		case CLIENT_COMMANDS.ORF_NEWS          :  on_orf_news         ( params );  break;

		default: return false;   // Not a local command, send to server
		}

		return true;   // Don't send command to server

	} // process_local_command


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PUBLIC METHODS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * addEventListener()
	 */
	this.addEventListener = function (event_name, callback) {
		if (self.eventHandlers[event_name]) {
			self.eventHandlers[event_name].push( callback );
		} else {
			throw new Error( 'Chat: addEventListener: Unknown event:' + event_name );
		}

	}; // addEventListener


	/**
	 * removeEventListener()
	 */
	this.removeEventListener = function (event_name, callback) {
		if (self.eventHandlers[event_name]) {
			const handlers = self.eventHandlers[event_name];
			let removed = false;

			for (let i = handlers.length; i >= 0; --i) {
				if (handlers[i] === callback) {
					handlers.splice( i, 1 );
					removed = true;
					return;
				}
			}

			throw new Error( 'Chat: removeEventListener: Can\'t remove, handler is not set.' );
		} else {
			throw new Error( 'Chat: removeEventListener: Unknown event:' + event_name );
		}

	}; // removeEventListener


	/**
	 * executeCommand()
	 */
	this.executeCommand = function (text) {
		if (! process_local_command( text )) {

			if (SETTINGS.LOCALIZE_ROOM_NAMES) {
				if (text.substr( 0, 5 ) == '/join') {
					const words = text.split( ' ' );
					if (words.length > 1) {
						words[1] = delocalized_room_name( words[1] );
						text = words.join( ' ' );
					}
				}
			}

			send_message( REQUEST.STANDARD_MESSAGE, text );
		}

		self.history.addEntry( text );

	}; // executeCommand


	/**
	 * calleeReady()
	 * After call was accepted, the callee will initiate the WebRTC connection.
	 * calleeReady() tells the callee, that we are waiting for a session invite.
	 */
	this.calleeReady = function (sender, recipient) {
		send_message(
			REQUEST.VIDEO_CALLEE_READY,
			{
				sender    : sender,
				recipient : recipient,
			}
		);

	}; // calleeReady


	/**
	 * onVideoStart()
	 */
	this.onVideoStart = function () {
		if (DEBUG.VIDEO_CONNECT) console.log( 'Chat: onVideoStart' );

		app.dom.divVideos.classList.remove( 'hidden' );
		self.ui.scrollDown();

	}; // onVideoStart


	/**
	 * onVideoEnded()
	 */
	this.onVideoEnded = function (caller, callee, reason = '') {
		const log_reason = (reason != '') ? ' (Reason: ' + reason + ')' : '';

		if (DEBUG.VIDEO_CONNECT) console.log( 'Chat: onVideoEnded' + log_reason );
		app.dom.divVideos.classList.add( 'hidden' );

	}; // onVideoEnded


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// RELAYED FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * colorSpan()
	 */
	this.colorSpan = function (string) {
		return color_span( string );

	}; // colorSpan


	/**
	 * showMessage()
	 */
	this.showMessage = function (html, room_name = null, class_name = '') {
		show_message( html, room_name, class_name );

	}; // showMessage


	/**
	 * timestampAndText()
	 */
	this.timestampAndText = function (message, text) {
		return timestamp_and_text( message, text );

	}; // timestampAndText


	/**
	 * sendMessage()
	 */
	this.sendMessage = function (message, recipients = null) {
		send_message( message, recipients );

	}; // showMessage


	/**
	 * emitEvent()
	 */
	this.emitEvent = function (chat_event, params) {
		if (DEBUG.CHAT_EVENTS) console.log( '%cEVENT%c:', 'color:#080', 'color:#000', chat_event.key );

		self.synth.playEventSound( chat_event );

		if (!self.ui.hasFocus) {
			self.ui.setIconAlert( true, chat_event );
		}

		self.ui.notifications.showChatEvent( chat_event, params );

	}; // emitEvent


	/**
	 * onBlur()
	 */
	this.onBlur = function () {
		on_blur();

	}; // onBlur


	/**
	 * onResize()
	 */
	this.onResize = function () {
		on_resize();

	}; // onResize;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DOM EVENTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_mouse_move()
	 */
	function on_mouse_move () {
		()=>self.ui.setIconAlert( false );

	} // on_mouse_move


	/**
	 * on_resize()
	 */
	function on_resize () {
		const rect = app.dom.divTabPages.getBoundingClientRect();
		const new_height = Math.floor( rect.height );
		Helpers.setDynamicStyle( '--visible-chat-height', new_height + 'px' );

		self.ui.scrollDown();

	} // on_resize

	/**
	 * on_focus()
	 */
	function on_focus () {
		self.ui.setIconAlert( false );
		if (document.body.classList.contains( 'connected' )) {
			self.ui.focusInput();
		}

	} // on_focus


	/**
	 * on_blur()
	 */
	function on_blur () {
		const current_room = self.ui.getActivePageElement();

		if( (current_room === app.dom.divTabPages)
		||  (current_room.dataset.roomName[0] == ':')
		) {
			return;
		}

		const nodes = current_room.childNodes;

		if (nodes.length == 0) return;

		if (! nodes[nodes.length - 1].classList.contains( 'blur' )) {
			show_message( '<hr>', ROOMS.CURRENT, 'blur' );
		}

	} // on_blur


	/**
	 * on_unload()
	 */
	function on_unload () {
		// send_message( REQUEST.CLIENT_CLOSED_APP, { sender: self.name } );

		document.body.innerHTML
		= '<div class="noscript">'
		+ '  <div>'
		+ '    <h1>Curia Chat</h1>'
		+ '    <p>Disconnecting...</p>'
		+ '  </div>'
		+ '</div>'
		;

	} // on_unload


	/**
	 * on_key_down()
	 */
	function on_key_down (event) {
		if ((event.altKey) && (event.code.substr( 0, 5 ) == 'Digit')) {
			const number = parseInt( event.code[5] );
			self.ui.raiseTabNr( number );
			event.stopPropagation();
			event.preventDefault();
		}

		const pressed_keys
		= (event.shiftKey ? 'SHIFT+' : '')
		+ (event.ctrlKey  ? 'CTRL+'  : '')
		+ (event.altKey   ? 'ALT+'   : '')
		+ event.code
		;

		if (DEBUG.KEY_CODES) console.log( 'ChatClient: on_key_down:', pressed_keys );

		switch (pressed_keys) {
		case 'Enter':
			if (document.body.classList.contains( 'connected' )) {
				self.ui.focusInput();
			}
			break;

		case 'Escape':
			self.emitEvent( CHAT_EVENTS.RINGING_STOPS );
			break;

		case 'Tab':
			if (autocomplete_name()) {
				event.preventDefault();
			}
			break;

		case 'CTRL+Digit1':  self.ui.raiseTabNr(  1 );  break;
		case 'CTRL+Digit2':  self.ui.raiseTabNr(  2 );  break;
		case 'CTRL+Digit3':  self.ui.raiseTabNr(  3 );  break;
		case 'CTRL+Digit4':  self.ui.raiseTabNr(  4 );  break;
		case 'CTRL+Digit5':  self.ui.raiseTabNr(  5 );  break;
		case 'CTRL+Digit6':  self.ui.raiseTabNr(  6 );  break;
		case 'CTRL+Digit7':  self.ui.raiseTabNr(  7 );  break;
		case 'CTRL+Digit8':  self.ui.raiseTabNr(  8 );  break;
		case 'CTRL+Digit9':  self.ui.raiseTabNr(  9 );  break;
		case 'CTRL+Digit0':  self.ui.raiseTabNr( 10 );  break;

		case 'CTRL+ALT+KeyA':
			const analyser = document.querySelector( '#audio_analyser' );
			const hidden = analyser.classList.contains( 'hidden' );

			self.executeCommand( '/analyser ' + (hidden ? 'on' : 'off' ) );

			event.preventDefault();
			break;

		case 'CTRL+ALT+KeyD':
			console.log( self.preferences.gatherPreferences() );
			break;

		case 'CTRL+ALT+KeyR':
			on_rotate_screen();
			event.preventDefault();
			break;
		}

	} // on_key_down


	/**
	 * on_login_submit()
	 */
	function on_login_submit (event) {

		function valid_name (name) {
			return (name != '');
		}

		if (event != undefined) {
			event.preventDefault();
		}

		const name = app.dom.inputLoginName.value;
		const password = app.dom.inputLoginPassword.value;

		if (valid_name( name )) {
			send_message(
				REQUEST.NAME_CHANGE,
				{
					name: name,
					password: password,
				},
			);
		}

		return false;

	} // on_login_submit


	/**
	 * on_text_submit()
	 */
	function on_text_submit (event) {
		if (event != undefined) event.preventDefault();

		if (app.dom.inputText.value == localized( 'TYPE_YOUR_MESSAGE_HERE' )) {
			app.dom.inputText.value = '';

		} else {
			self.executeCommand( app.dom.inputText.value );

			if (SETTINGS.CLEAR_INPUT) {
				app.dom.inputText.value = '';
			}
		}

		app.dom.inputText.select();

		return false;

	} // on_text_submit


	/**
	 * on_input_text_keydown()
	 */
	function on_input_text_keydown (event) {
		switch (event.code) {
		case 'ArrowUp'   :  app.dom.inputText.value = self.history.previousEntry();  break;
		case 'ArrowDown' :  app.dom.inputText.value = self.history.nextEntry();      break;
		default:
			return;
		}

		event.preventDefault();
		event.stopPropagation();

	} // on_input_text_keydown


	/**
	 * on_input_text_mousemove()
	 */
	function on_input_text_mousemove () {
		self.ui.focusInput();

	} // on_input_text_mousemove


	/**
	 * on_input_text_mousedown()
	 */
	function on_input_text_mousedown () {
		if (app.dom.inputText.value == localized( 'TYPE_YOUR_MESSAGE_HERE' )) {
			app.dom.inputText.value = '';
		}

	} // on_input_text_mousedown


	/**
	 * show_user_context_menu()
	 */
	function show_user_context_menu (element) {
		const name = element.innerText;

		var li;

		const ul = document.createElement( 'ul' );
		ul.className = 'name_menu';

		ul.appendChild( li = document.createElement( 'li' ) );
		li.innerHTML
		= '<a class="command" data-command="/msg '
		+ name
		+ '">'
		+ localized( 'NAME_CONTEXT_MSG' )
		+ '</a>'
		;

		ul.appendChild( li = document.createElement( 'li' ) );
		li.innerHTML
		= '<a class="command" data-command="/attention '
		+ name
		+ '">'
		+ localized( 'NAME_CONTEXT_ATTENTION' )
		+ '</a>'
		;

		ul.appendChild( li = document.createElement( 'li' ) );
		li.innerHTML
		= '<a class="command" data-command="/call '
		+ name
		+ '">'
		+ localized( 'NAME_CONTEXT_CALL' )
		+ '</a>'
		;

		const page = self.ui.getActivePageElement();
		page.appendChild( ul );

		const name_rect = element.getBoundingClientRect();
		const menu_rect = ul.getBoundingClientRect();
		const page_rect = page.getBoundingClientRect();

		const x = (Math.min( name_rect.left + 10, page_rect.left + page_rect.width - menu_rect.width ));
		const y = (Math.min( name_rect.top + 10, page_rect.top + page_rect.height - menu_rect.height ));

		ul.style.position = 'fixed';
		ul.style.left = x + 'px';
		ul.style.top  = y + 'px';

		function remove_menu () {
			ul.parentNode.removeChild( ul );
			removeEventListener( 'mouseup', remove_menu );
		}
		addEventListener( 'mouseup', remove_menu );

	} // show_user_context_menu


	/**
	 * on_commands_click()
	 */
	function on_commands_click (event) {
		if (event.button != 0) return;   // We only care about the left mouse button

		const cl = event.target.classList;

		if (cl.contains( 'command' )) {
			const button  = event.target;
			const command = button.dataset.command || button.innerText;

			if ((SETTINGS.BUTTON_COMMANDS_IMMEDIATE) || (app.dom.inputText.value == command)) {
				app.dom.inputText.value = command;
				on_text_submit();
			} else {
				app.dom.inputText.value = command;
				self.ui.focusInput();
			}
		}
		else if (cl.contains( 'copy_command' )) {
			const button  = event.target;
			const command = button.dataset.command || button.innerText;

			app.dom.inputText.value = command;
			self.ui.focusInput();
		}
		else if (cl.contains( 'name' )) {
			show_user_context_menu( event.target );
		}

	} // on_commands_click


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// POST-LOGIN
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * show_login_message()
	 */
	function show_login_message () {
		send_message( REQUEST.SEND_WELCOME );

	} // show_login_message


	/**
	 * on_response_welcome()
	 */
	function on_response_welcome () {
		self.setConnectionState( CHAT_CONNECTION.ONLINE );

		show_message( '<h2 class="welcome">' + localized( 'WELCOME_TO_THE_CHAT' ) + '</h2>' );
		show_message( localized( 'UNDER_DEVELOPMENT' ), ROOMS.CURRENT, 'welcome' );
		show_message( localized( 'VOIP_INSTRUCTIONS' ), ROOMS.CURRENT, 'hints' );

		if (window.location.protocol == 'https:') {
			show_message( localized( 'YOU_ARE_CONNECTED_VIA_HTTPS' ), ROOMS.CURRENT, 'notice' );
		} else {
			show_message( localized( 'YOU_ARE_CONNECTED_VIA_HTTP' ), ROOMS.CURRENT, 'warning' );
		}

		self.videoCall = new VideoCall( app, self, app.dom.divVideos, self.name );

		self.executeCommand( '/topic' );
		self.executeCommand( '/who' );

		on_user_list( [], /*activate*/false );
		self.ui.raiseTab( ROOMS.MAIN );   // Add main room to history

		self.ui.toggleLoginForm( false );
		app.dom.inputText.select();

		self.avatar.sendToServer();

	} // on_response_welcome


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = async function () {
		self.setConnectionState( CHAT_CONNECTION.INITIALIZING );

		if (SETTINGS.FORCE_HTTPS && (window.location.protocol == 'http:')) {
			window.location.href = window.location.href.replace( 'http', 'https' );
			return;
		}

		await fetch( 'config.json' ).then( (response)=>{
			if (! response.ok) {
				throw new Error( 'HTTP error, status = ' + response.status );
			}
			return response.text();

		}).then( (json)=>{
			const data = JSON.parse( json );

			if (data.webSocketPort != undefined) {
				SETTINGS.WEB_SOCKET.URL += ':' + data.webSocketPort;
			}
		});

		for (let key in CHAT_EVENTS) {
			CHAT_EVENTS[key].key = key;
		}

		self.eventHandlers = { receivesignal: [] };

		self.helpText          = null;
		self.video             = null;
		self.reconnectInterval = null;
		self.account           = null;

		self.knownAvatars = {};

		self.ui          = new UserInterface( app, self );
		self.history     = new History      ( app, self );
		self.synth       = new Synth        ( app, self );
		self.userList    = new UserList     ( app, self );
		self.avatar      = new Avatar       ( app, self );
		self.preferences = new Preferences  ( app, self );
		self.userProfile = new UserProfile  ( app, self );   // Requires Preferences(), Avatar()
		self.mediaLinks  = new MediaLinks   ( app, self );

		app.dom.divVideosResizer  .title = localized( 'TITLE_VIDEOS' );
		app.dom.divCommandsResizer.title = localized( 'TITLE_COMMANDS' );

		app.dom.formLogin  .addEventListener( 'submit',    on_login_submit );
		app.dom.formInput  .addEventListener( 'submit',    on_text_submit );
		app.dom.inputText  .addEventListener( 'keydown',   on_input_text_keydown );
		app.dom.inputText  .addEventListener( 'mousemove', on_input_text_mousemove );
		app.dom.inputText  .addEventListener( 'mousedown', on_input_text_mousedown );

		addEventListener( 'keydown',   on_key_down );
		addEventListener( 'mouseup',   on_commands_click );
		addEventListener( 'mousemove', on_mouse_move );
		addEventListener( 'resize',    on_resize );
		addEventListener( 'focus',     on_focus );
		addEventListener( 'blur',      on_blur );
		addEventListener( 'unload',    on_unload );

		app.dom.linkFavicon.href = ICON_DATA.CURIA;

		app.dom.labelLogin .innerHTML  = localized( 'CHOOSE_A_NAME' );
		app.dom.buttonLogin.innerHTML = localized( 'LOG_IN' );

		app.dom.inputLoginName    .placeholder = localized( 'LOGIN_NAME' );
		app.dom.inputLoginPassword.placeholder = localized( 'OPTIONAL_PASSWORD' );
		app.dom.inputText         .placeholder = localized( 'TYPE_YOUR_MESSAGE_HERE' );

		self.ui.addCommandButton( 'USER_LIST' );
		self.ui.addCommandButton( 'PREFERENCES' );
		self.ui.addCommandButton( 'PROFILE' );
		self.ui.addCommandButton( 'HELP' );

		if (document.body.offsetWidth < 640) {
			on_user_list( ['hide'] );
		}

		if (DEBUG.COOKIES) console.log( 'Cookies:', document.cookie );
		const name = Helpers.getCookie( 'curia_user_name' );
		if (name !== null) {
			if (DEBUG.COOKIES) console.log( 'Setting name:', name );
			app.dom.inputLoginName.value = name;
		}

		connect();

		app.dom.divCommands.classList.remove( 'collapsed' );
	/*
		setTimeout( ()=>app.dom.divCommandsResizer.classList.add   ( 'hint_at'   ), 1500 );
		setTimeout( ()=>app.dom.divCommands       .classList.add   ( 'collapsed' ), 2000 );
		setTimeout( ()=>app.dom.divCommandsResizer.classList.remove( 'hint_at'   ), 2750 );
	*/
	}; // init


	// CONSTRUCTOR

	return self.init().then( ()=>self );

}; // ChatClient


//EOF