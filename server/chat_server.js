// chat_server.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const os        = require( 'os' );
const WebSocket = require( 'ws' );
const http      = require( 'follow-redirects' ).http;
const crypto    = require( 'crypto' );
const reRequire = require( 're-require-module' ).reRequire;
const whois     = require( 'whois' );

const { DEBUG, COLORS, color_log } = require( './debug.js' );

const {
	PROGRAM_NAME, PROGRAM_VERSION,
	EXIT_CODES,
	SETTINGS, SYSTEM_USER,
	REQUEST, RESPONSE, FAILURE,
	SERVER_COMMANDS,
	REGISTER_ACTIVITY_ROOMS,

} = require( './constants.js' );


const { unix_timestamp, sanitize } = require( './helpers.js' );

const { FlatFileDB     } = require( './flat_file_db.js' );

const { Users          } = require( './users.js' );
const { Rooms          } = require( './rooms.js' );
const { Calls          } = require( './calls.js' );
const { Accounts       } = require( './accounts.js' );
const { ServerManager  } = require( './server_manager.js' );

const { FunStuff       } = require( './fun_stuff.js' );
const { RolePlayServer } = require( './rpg/rpg_server.js' );
module.exports.rpg = {};


/**
 * ChatServer()
 */
module.exports.ChatServer = function (new_web_socket) {
	const self = this;

	this.webSocket;

	this.users;
	this.rooms;
	this.calls;

	this.serverData;


	/**
	 * notifyOwnerAboutLogin()
	 * Let the server announce logins audibly. Useful, if it is your private chat and you want your home computer
	 * to play an alarm sound or use a speech synthesizer in order to alert you of new arrivals.
	 */
	this.notifyOwnerAboutLogin = function (new_user_name) {
		if (! SETTINGS.NOTIFY_OWNER.ENABLED) return;

		const host = os.hostname();

		const path
		= SETTINGS.NOTIFY_OWNER.PATH
		+ '?nocache='
		+ unix_timestamp()
		+ '&text=User '
		+ new_user_name
		+ ' logged in at '
		+ host
		;

		if (DEBUG.NOTIFY_OWNER) {
			color_log(
				COLORS.NOTIFY_OWNER,
				'NOTIFY OWNER',
				SETTINGS.NOTIFY_OWNER.DOMAIN + path
			);
		}

		http.get({
			host: SETTINGS.NOTIFY_OWNER.DOMAIN,
			port: 80,
			path: encodeURI( path ),
		});

	}; // notifyOwnerAboutLogin


	/**
	 * sendMessage()
	 */
	this.sendMessage = function (message, recipients = null) {
		if ((recipients !== null) && (recipients[0] == SYSTEM_USER)) {
			return;
		}

		if (message.data == undefined) message.data = null;

		message.time = unix_timestamp();

		if (DEBUG.RESPONSES) {
			color_log(
				COLORS.RESPONSE,
				'RESPONSE',
				((DEBUG.RESPONSE_DATA) ? message : message.type),
			);
		}

		let total_bytes = 0;

		self.webSocket.clients.forEach( (client)=>{
			if (client.readyState === WebSocket.OPEN) {
				const peer    = client._socket._peername;
				const address = peer.address + ':' + peer.port;
				const user    = self.users.data[address];

				const do_send
				=( (recipients === null)
				|| (user && recipients.indexOf( user.name ) >= 0)
				|| (user && recipients.indexOf( address ) >= 0)
				);

				if (do_send) {
					if (DEBUG.RESPONSES) {
						color_log(
							COLORS.RESPONSE,
							'TO',
							COLORS.ADDRESS + address + COLORS.RESET,
						);
					}

					const json = JSON.stringify(
						message,
						(key, value)=>{
							if (key == 'holder') {
								if (value === undefined) {
									return undefined;
								}
								else if (value === null) {
									return null;
								}
								else {
									return '_HOLDER';
								}
							} else {
								return value;
							}
						},
					);

					self.serverData.data.networkStatistics.sentBytes += json.length;
					++self.serverData.data.networkStatistics.sentMessages;

					client.send( json );

					total_bytes += json.length;

					if( (message.room != undefined)
					&&  (REGISTER_ACTIVITY_ROOMS.indexOf( message.type ) >= 0)
					) {
						self.rooms.registerActivity( message.room );
					}
				}
			}
		});

		if (DEBUG.DATA_TRANSMITTED) {
			color_log( COLORS.RESPONSE, 'SENT', total_bytes, 'bytes' );
		}

	} // self.sendMessage


	/**
	 * sendFailure()
	 */
	this.sendFailure = function (error_info, recipients = null) {
		self.sendMessage(
			{
				type: RESPONSE.FAILURE,
				data: error_info,
			},
			(recipients === null) ? self.users.toAll() : recipients,
		);

	}; // sendFailure


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CHAT COMMANDS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * cmd_msg()
	 */
	function cmd_msg (user, params) {
		const recipient_name = params.shift();
		const recipient      = self.users.findByName( recipient_name );

		if (recipient_name == undefined) {
			return { error : FAILURE.USER_NAME_EXPECTED };
		}

		if (recipient === null) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				name  : recipient_name,
			};

		} else {
			const text = params.join( ' ' ).trim();

			if (text == '') {
				return {
					error : FAILURE.MESSAGE_TEXT_MISSING ,
					name  : recipient.name,
				};
			}

			self.sendMessage(
				{
					type: RESPONSE.PRIVATE_MESSAGE_FROM,
					data: {
						to   : recipient.name,
						from : user.name,
						text : text,
					},
				},
				[recipient.name]
			);

			self.sendMessage(
				{
					type: RESPONSE.PRIVATE_MESSAGE_TO,
					data: {
						to   : recipient.name,
						from : user.name,
						text : text,
					},
				},
				[user.name]
			);
		}

	} // cmd_msg


	/**
	 * cmd_html()
	 */
	function cmd_html (user, params, room_name) {
		let joined = params.join( ' ' );

		const parts = [];
		let html = '';
		var pos;

		while ((pos = joined.indexOf( '<')) >= 0) {
			parts.push( joined.substr( 0, pos ) );
			joined = joined.substr( pos );

			pos = joined.indexOf( '>' );
			if (pos >= 0) {
				parts.push( joined.substr( 0, pos + 1 ) );
				joined = joined.substr( pos + 1 );
			}
		}

		console.log( parts );

		for (let i = 0; i < parts.length; ++i) {
			if ((parts[i].substr( 0, 5 ) == '<img ') && (parts[i].indexOf( 'tabindex' ) < 0)) {
				parts[i] = parts[i].replace( /<img /, '<img tabindex="0" ' );
			}
		}

		console.log( parts );

		html = parts.join( '' );

		self.sendMessage(
			{
				type: RESPONSE.PUBLIC_MESSAGE,
				data: {
					name : user.name,
					text : html,
				},
				room: room_name,
			},
			self.users.toAll(),
		);

	} // cmd_html


	/**
	 * cmd_attention()
	 */
	function cmd_attention (user, params) {
		const recipient_name = params.shift();
		const recipient      = self.users.findByName( recipient_name );

		if (recipient_name == undefined) {
			return { error : FAILURE.USER_NAME_EXPECTED };
		}

		if (recipient === null) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				name  : recipient_name,
			};

		} else {
			const text = params.join( ' ' ).trim();

			self.sendMessage(
				{
					type: RESPONSE.ATTENTION_TO,
					data: {
						to   : recipient.name,
						text : text,
					},
				},
				[user.name]
			);

			self.sendMessage(
				{
					type: RESPONSE.ATTENTION_FROM,
					data: {
						from: user.name,
						text: text,
					},
				},
				[recipient.name]
			);

		}

	} // cmd_attention


	/**
	 * cmd_nick()
	 */
	function cmd_nick (user, params) {
		return self.users.changeName({
			sender : user.address,
			data   : {
				name     : params[0],
				password : params[1],
			},
		});

	} // cmd_nick


	/**
	 * cmd_status()
	 */
	function cmd_status (user) {
		self.sendMessage(
			{
				type : RESPONSE.STATUS,
				data : {
					user    : self.users.getUserInfo( user ),
					account : self.accounts.getAccountInfo( user.name ),
				},
			},
			[user.name],
		);

	} // cmd_status


	/**
	 * cmd_execute_script()
	 */
	function cmd_execute_script (user, params) {
		if (! user.isAdmin) {
			return {
				error: FAILURE.INSUFFICIENT_PERMISSIONS,
			};
		}

		if (params.length < 2) {
			return {
				error: FAILURE.INSUFFICIENT_PARAMETERS,
			};
		}

		let recipients = [params[0]];
		if (recipients == '*') {
			recipients = self.users.toAll();
		}
		else if (recipients == '.') {
			recipients = [user.name];
		}

		params.shift();
		const script = params.join( ' ' );

		if (! self.users.recipientsExist( recipients )) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				name  : params[0],
			};
		}

		self.sendMessage(
			{
				type : RESPONSE.SERVER_MESSAGE,
				data : 'Sending script',
			},
			user.name,
		);

		self.sendMessage(
			{
				type : RESPONSE.EXECUTE_SCRIPT,
				data : script,
			},
			recipients,
		);

	} // cmd_execute_script


	/**
	 * cmd_execute_command()
	 */
	function cmd_execute_command (user, params) {
		const recipients = params.shift();
		const new_params = [
			recipients,
			'self.executeCommand("' + params.join( ' ' ) + '")'
		];

		return cmd_execute_script( user, new_params );

	} // cmd_execute_command


	/**
	 * cmd_server()
	 */
	function cmd_server (user, params) {
		return self.serverManager.onServerCommand( user, params );

	} // cmd_server

/*
var config = {
  configurable: true,
  value: function() {
    var alt = {};
    var storeKey = function(key) {
      alt[key] = this[key];
    };
    Object.getOwnPropertyNames(this).forEach(storeKey, this);
    return alt;
  }
};
Object.defineProperty(Error.prototype, 'toJSON', config);
*/

	/**
	 * cmd_rpg_command()
	 */
	function cmd_rpg_command (user, params) {
		new Promise( async ()=>{
			try {
				if (DEBUG.RPG) color_log( COLORS.RPG, 'RPG', 'Reloading rpg_server.js' );
				const RolePlayServer = reRequire( './rpg/rpg_server.js' ).RolePlayServer;

				if (params[0] == 'reset') {
					if (DEBUG.RPG) color_log(
						COLORS.RPG,
						'RPG',
						'Triggering reset'
					);

				}
				self.rpg = await new RolePlayServer( self, params[0] == 'reset' )

				if (DEBUG.RPG) color_log(
					COLORS.RPG,
					'RPG',
					'Calling command "' + params[0] + '"'
				);

				self.rpg.onRpgCommand( user, params );

			} catch (error) {
				self.sendFailure(
					{
						error: FAILURE.RPG,
						text:
							//JSON.stringify( error.toJSON(), null, '<br>' )
							error.stack
							.replace( /\n/g, '<br>' )
							.trim()
					},
					[user.name],
				);
			}
		});

	} // cmd_rpg_command


	/**
	 * execute_chat_command()
	 */
	function execute_chat_command (command, user, params, room_name) {
		switch (command) {
		case SERVER_COMMANDS.NICK            : return cmd_nick              ( user, params );
		case SERVER_COMMANDS.MSG             : return cmd_msg               ( user, params );
		case SERVER_COMMANDS.HTML            : return cmd_html              ( user, params, room_name );
		case SERVER_COMMANDS.ATTENTION       : return cmd_attention         ( user, params );
		case SERVER_COMMANDS.STATUS          : return cmd_status            ( user, params );
		case SERVER_COMMANDS.SERVER          : return cmd_server            ( user, params );
		case SERVER_COMMANDS.EXECUTE_SCRIPT  : return cmd_execute_script    ( user, params );
		case SERVER_COMMANDS.EXECUTE_COMMAND : return cmd_execute_command   ( user, params );
		case SERVER_COMMANDS.PING            : return self.users.onPing     ( user, null   );
		case SERVER_COMMANDS.LIST_USERS      : return self.rooms.listUsers  ( user, params, room_name );
		case SERVER_COMMANDS.LIST_ROOMS      : return self.rooms.sendRooms  ( user, params[0] );
		case SERVER_COMMANDS.TOPIC           : return self.rooms.setTopic   ( user, params, room_name );
		case SERVER_COMMANDS.JOIN_ROOM       : return self.rooms.join       ( user, params[0] );
		case SERVER_COMMANDS.LEAVE_ROOM      : return self.rooms.leave      ( user, params[0] );
		case SERVER_COMMANDS.KICK            : return self.rooms.kick       ( user, params );
		case SERVER_COMMANDS.INVITE          : return self.calls.invite     ( user, params );
		case SERVER_COMMANDS.CANCEL          : return self.calls.cancel     ( user, params );
		case SERVER_COMMANDS.REJECT          : return self.calls.reject     ( user, params );
		case SERVER_COMMANDS.ACCEPT          : return self.calls.accept     ( user, params );
		case SERVER_COMMANDS.HANG_UP         : return self.calls.hangUp     ( user, params );

		case SERVER_COMMANDS.ROLL_DICE       : return self.funStuff.rollDice( user, params );
		case SERVER_COMMANDS.RPG             : return cmd_rpg_command       ( user, params );

		default:
			return {
				error   : FAILURE.UNKNOWN_COMMAND,
				command : command,
			};
		}

	} // execute_chat_command


	/**
	 * process_chat_command()
	 */
	function process_chat_command (message) {
		const user = self.users.data[message.sender];
		let response = null;

		if (! user.loggedIn) {
			response = { error: FAILURE.NOT_LOGGED_IN };
		} else {
			const line      = message.data.substr( 1 ).trim();
			const params    = line.split( ' ' );
			const command   = params.shift().toLowerCase();
			const room_name = message.room;

			response = execute_chat_command( command, user, params, room_name );
		}

		if (response != undefined) {
			self.sendFailure( response, [message.sender] );
		}

	} // process_chat_command


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MESSAGE HANDLERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_request_client_info()
	 */
	function on_request_client_info (message) {
		const user = self.users.findByAddress( message.sender );

		Object.keys( message.data ).forEach( (key)=>{
			user.client[key] = message.data[key];
		});

		self.sendMessage(
			{
				type : RESPONSE.SERVER_INFO,
				data : {
					version: PROGRAM_VERSION,
					avatars: {
						enabled : SETTINGS.AVATARS.ENABLED,
						width   : SETTINGS.AVATARS.WIDTH,
						height  : SETTINGS.AVATARS.HEIGHT,
					},
					accounts: {
						pendingDays : SETTINGS.ACCOUNTS.PENDING_DAYS,
					},
				},
			},
			[message.sender],
		);

		if (user.client.version != PROGRAM_VERSION) {
			color_log(
				COLORS.WARNING,
				'WARNING',
				'Client version differs from server version:', user.client.version
			);
		}

	} // on_request_client_info


	/**
	 * on_request_pong()
	 */
	function on_request_pong (message) {
		self.users.onPong( message.sender );

	} // on_request_pong


	/**
	 * on_request_name_change()
	 */
	function on_request_name_change (message) {
		self.users.changeName( message );

	} // on_request_name_change


	/**
	 * on_request_send_welcome()
	 */
	function on_request_send_welcome (message) {
		self.sendMessage(
			{
				type : RESPONSE.WELCOME,
			},
			[message.sender],
		);

	} // on_request_send_welcome


	/**
	 * on_request_standard_message()
	 */
	function on_request_standard_message (message) {

		if (message.data == '') {
			return;
		}
		else if (message.data.charAt( 0 ) == '/') {
			process_chat_command( message );

		} else {
			self.sendMessage(
				{
					type: RESPONSE.PUBLIC_MESSAGE,
					data: {
						name : self.users.data[message.sender].name,
						text : sanitize( message.data ),
					},
					room: message.room,
				},
				self.users.toAll(),
			);
		}

	} // on_request_standard_message


	/**
	 * on_request_video_callee_ready()
	 */
	function on_request_video_callee_ready (message) {
		const sender    = self.users.findByName( message.data.sender );
		const recipient = self.users.findByName( message.data.recipient );

		self.sendMessage(
			{
				type: RESPONSE.VIDEO_CALLEE_READY,
				data: {
					sender    : sender.name,
					recipient : recipient.name,
				},
			},
			[message.data.recipient],
		);

	} // on_request_video_callee_ready


	/**
	 * on_request_signal()
	 */
	function on_request_signal (message) {
		self.sendMessage(
			{
				type : RESPONSE.SIGNAL,
				data : message.data,
			},
			[message.data.recipient],
		);

	} // on_request_signal


	/**
	 * on_request_update_avatar()
	 */
	function on_request_update_avatar (message) {
		self.accounts.updateAvatar(
			self.users.data[message.sender],
			message.data
		);

	} // on_request_update_avatar



	/**
	 * on_request_client_closed_app()
	 */
	function on_request_client_closed_app (message) {
		const user = self.users.findByAddress( message.sender );

		self.calls.closeAllCalls( user );
		user.loggedIn = false;

		self.sendMessage(
			{
				type: RESPONSE.CLIENT_CLOSED_APP,
				data: {
					name    : sender.name,
					address : message.sender,
				},
			},
			self.users.toAll(),
		);

	} // on_request_client_closed_app


	/**
	 * on_request_remote_error_report()
	 */
	function on_request_remote_error_report (message) {
		const recipients
		= (SETTINGS.REPORT_REMOTE_ERRORS_TO_EVERYONE)
		? self.users.toAll()
		: self.users.toAllAdmins()
		;

		if (message.data.sender == undefined) {
			message.data.sender = message.sender;
		}

		self.sendMessage(
			{
				type   : RESPONSE.REMOTE_ERROR_REPORT,
				data   : message.data,
				sender : message.sender,
			},
			recipients,
		);

	} // on_request_remote_error_report


	/**
	 * on_request_store_preferences()
	 */
	function on_request_store_preferences (message) {
		self.accounts.storePreferences( message );

	} // on_request_store_preferences


	/**
	 * on_request_is_name_registered()
	 */
	function on_request_is_name_registered (message) {
		self.accounts.onIsNameRegistered( message );

	} // on_request_is_name_registered


	/**
	 * on_request_register_account()
	 */
	function on_request_register_account (message) {
		self.accounts.register( message );

	} // on_request_register_account


	/**
	 * on_request_verify_account()
	 */
	function on_request_verify_account (message) {
		self.accounts.onVerify( message );

	} // on_request_verify_account


	/**
	 * onMessage()
	 */
	this.onMessage = function (message, bytes) {
		self.serverData.data.networkStatistics.receivedBytes += bytes;
		++self.serverData.data.networkStatistics.receivedMessages;

		switch (message.type) {
		case REQUEST.CLIENT_INFO         :  on_request_client_info        ( message );  break;
		case REQUEST.PONG                :  on_request_pong               ( message );  break;
		case REQUEST.NAME_CHANGE         :  on_request_name_change        ( message );  break;
		case REQUEST.SEND_WELCOME        :  on_request_send_welcome       ( message );  break;
		case REQUEST.STANDARD_MESSAGE    :  on_request_standard_message   ( message );  break;
		case REQUEST.VIDEO_CALLEE_READY  :  on_request_video_callee_ready ( message );  break;
		case REQUEST.SIGNAL              :  on_request_signal             ( message );  break;
		case REQUEST.UPDATE_AVATAR       :  on_request_update_avatar      ( message );  break;
		case REQUEST.CLIENT_CLOSED_APP   :  on_request_client_closed_app  ( message );  break;
		case REQUEST.REMOTE_ERROR_REPORT :  on_request_remote_error_report( message );  break;
		case REQUEST.STORE_PREFERENCES   :  on_request_store_preferences  ( message );  break;
		case REQUEST.IS_NAME_REGISTERED  :  on_request_is_name_registered ( message );  break;
		case REQUEST.REGISTER_ACCOUNT    :  on_request_register_account   ( message );  break;
		case REQUEST.VERIFY_ACCOUNT      :  on_request_verify_account     ( message );  break;
		}

	} // onMessage


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// USER CONNECTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * onConnect()
	 */
	this.onConnect = function (socket, address) {
		const user = self.users.add({
			socket          : socket,
			client          : {},
			address         : address,
			name            : address,
			loggedIn        : false,
			isAdmin         : false,
			operatorRooms   : [],
			sentInvites     : {},
			receivedInvites : {},
			activeCalls     : {},
			acceptsMessages : true,
			acceptsCalls    : true,
			identifiedName  : null,
			avatar          : null,
			pongPending     : null,
			account         : null,
		});

		self.sendMessage(
			{
				type: RESPONSE.CLIENT_CONNECTED,
				data: {
					address: address,
				},
			},
			self.users.toAll(),
		);

		Object.keys( self.rooms.data ).forEach( (key)=>{
			const room = self.rooms.data[key];

			if (room.mandatory) {
				if (DEBUG.ROOMS) color_log( COLORS.ROOM, 'ROOM', 'join mandatory:', room.name );

				self.rooms.join( user, room.name );
			}
		});


		let ip_address = user.address.substr( 0, user.address.lastIndexOf( ':' ) );
		if (ip_address.substr( 0, 7 ) == '::ffff:') ip_address = ip_address.substr( 7 );

		self.users.sendUserListUpdate();

		if (DEBUG.WHOIS) {
			whois.lookup( ip_address, (error, data)=>{
				if (error) {
					color_log( COLORS.DEFAULT, 'WHOIS', error );
				} else {
					color_log(
						COLORS.DEFAULT,
						'=== WHOIS ===',
						address,
						data.split( '\n' ).filter( (line)=>{
							line = line.toLowerCase().trim();
							return (
								(  (line.indexOf( 'descr' ) >= 0)
								|| (line.indexOf( 'name' ) >= 0)
								|| (line.indexOf( 'net' ) >= 0)
								|| (line.indexOf( 'org' ) >= 0)
								)
								&& !(
								   (line[0] == '#')
								|| (line[0] == '%')
								|| (line.substr( 0, 7 ) == 'comment')
								|| (line.indexOf( 'abuse' ) >= 0)
								|| (line.indexOf( 'orgtech' ) >= 0)
								)
							);
						}),
					);
				}
			});
		}

	}; // onConnect


	/**
	 * onDisconnect()
	 */
	this.onDisconnect = function (address) {
		const user = self.users.findByAddress( address );

		if (user == undefined) {
			color_log(
				COLORS.WARNING,
				'WARNING',
				'onDisconnect: No record for',
				address,
				'\n(Possibly a user with bad connection recently hard kicked for not sending a PONG)'
			);

			return;
		}

		self.sendMessage(
			{
				type: RESPONSE.CLIENT_DISCONNECTED,
				data: {
					name    : user.name,
					address : user.address,
				},
			},
			self.users.toAll(),
		);

		user.socket = null;

		self.rooms.leaveAll( address );
		self.users.remove( address );
		self.users.sendUserListUpdate();

	}; // onDisconnect


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DESTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	this.terminate;   // Set by main.js


	/**
	 * onCleanUp()
	 */
	this.onCleanUp = function () {
		const save_requests = [
			self.serverData.requestSaveData( /*force*/true ),
		];

		return Promise.all( save_requests );

	}; // onCleanUp


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = async function (new_web_socket) {
		self.webSocket = new_web_socket;

		self.serverData = await new FlatFileDB(
			'data/server_data.json',
			{
				created: unix_timestamp(),
				networkStatistics: {
					sentMessages     : 0,
					sentBytes        : 0,
					receivedMessages : 0,
					receivedBytes    : 0,
				},
			},
		);

		self.users = new Users( self );
		self.rooms = new Rooms( self );
		self.calls = new Calls( self );

		self.funStuff = new FunStuff( self );

		self.accounts      = await new Accounts( self );
		self.serverManager = new ServerManager( self );

		SETTINGS.MANDATORY_ROOMS.forEach( (room)=>{
			self.rooms.add({
				name       : room.name,
				opener     : null,
				topic      : room.topic,
				topicUser  : null,
				persistent : true,
				mandatory  : true,
			});
		});

		if (DEBUG.ROOM_DATA) color_log( COLORS.ROOM, 'INIT ROOMS', self.rooms.data );

		//send_mail('harald@ist.org', 'Subj', 'Test');

	}; // init


	// CONSTRUCTOR

	return self.init( new_web_socket ).then( ()=>self );

}; // ChatServer


//EOF