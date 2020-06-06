// calls.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const os        = require( 'os' );
const WebSocket = require( 'ws' );
const http      = require( 'follow-redirects' ).http;
const crypto    = require( 'crypto' );
const mailer    = require( 'nodemailer' );

const { DEBUG, COLORS, color_log } = require( './debug.js' );

const {
	TURN_OPTIONS,
	RESPONSE,
	FAILURE,

} = require( './constants.js' );

const { unix_timestamp } = require( './helpers.js' );


/**
 * Calls()
 */
module.exports.Calls = function (chat) {
	const self = this;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PRIVATE METHODS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * create_turn_credentials()
	 */
	function create_turn_credentials () {
		const timestamp = unix_timestamp() + 60*60*24;
		const user_name = timestamp + ':' + TURN_OPTIONS.USER_NAME;

		const hmac = crypto.createHmac( TURN_OPTIONS.ALGORITHM, TURN_OPTIONS.STATIC_AUTH_SECRET );
		hmac.setEncoding( 'base64' );
		hmac.write( user_name );
		hmac.end();

		return {
			server     : TURN_OPTIONS.SERVER_URI,
			userName   : user_name,
			credential : hmac.read(),
		};

	} // create_turn_credentials


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// INVITES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * add_invite()
	 */
	function add_invite (user, category, peer_name) {
		user[category][peer_name] = unix_timestamp();

	} // add_invite


	/**
	 * remove_invite()
	 */
	function remove_invite (user, category, peer_name) {
		if (user[category][peer_name] == undefined) {
			return false;

		} else {
			delete user[category][peer_name];
			return true;
		}

	} // remove_invite


	/**
	 * create_invite()
	 */
	function create_invite (user, peer_name) {
		const peer = chat.users.findByName( peer_name );

		if (peer == undefined) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				name  : peer_name,
			};
		}

		if (! peer.loggedIn) {
			return { error: FAILURE.USER_UNNAMED };
		}

		if (user.receivedInvites[peer.name] != undefined) {
			return this.accept( user, [peer.name] );
		}

		add_invite( user, 'sentInvites', peer.name );
		add_invite( peer, 'receivedInvites', user.name );

		chat.sendMessage(
			{
				type: RESPONSE.VIDEO_INVITE,
				data: {
					sender    : user.name,
					recipient : peer.name,
				},
			},
			[user.name, peer.name],
		);

		chat.users.sendUserListUpdate();

	} // create_invite


	/**
	 * cancel_invite()
	 */
	function cancel_invite (user, peer_name) {
		const peer = chat.users.findByName( peer_name );

		if (peer == undefined) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				name  : peer_name,
			};
		}

		if (user.sentInvites[peer_name] == undefined) {
			return {
				error : FAILURE.CANCEL_NOT_INVITED,
				name  : peer_name,
			};
		}

		remove_invite( user, 'sentInvites', peer.name );
		remove_invite( peer, 'receivedInvites', user.name );

		chat.sendMessage(
			{
				type: RESPONSE.VIDEO_CANCEL,
				data: {
					sender    : user.name,
					recipient : peer.name,
				},
			},
			[user.name, peer.name],
		);

		chat.users.sendUserListUpdate();

	} // cancel_invite


	/**
	 * reject_invite()
	 */
	function reject_invite (user, peer_name) {
		const peer = chat.users.findByName( peer_name );

		if (peer == undefined) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				name  : peer_name,
			};
		}

		if (user.receivedInvites[peer.name] == undefined) {
			return {
				error : FAILURE.REJECT_NOT_INVITED,
				name  : peer.name,
			};
		}

		remove_invite( user, 'receivedInvites', peer.name );
		remove_invite( peer, 'sentInvites', user.name );

		chat.sendMessage(
			{
				type: RESPONSE.VIDEO_REJECT,
				data: {
					sender    : user.name,
					recipient : peer.name,
				},
			},
			[user.name, peer.name],
		);

		chat.users.sendUserListUpdate();

	} // reject_invite


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CALLS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * add_call()
	 */
	function add_call (user, peer_name) {
		user.activeCalls[peer_name] = unix_timestamp();

	} // add_call


	/**
	 * remove_call()
	 */
	function remove_call (user, peer_name) {
		if (user.activeCalls[peer_name] == undefined) {
			return false;

		} else {
			delete user.activeCalls[peer_name];
			return true;
		}

	} // remove_call


	/**
	 * end_call()
	 */
	function end_call (user, peer_name, reason = '') {
		const peer = chat.users.findByName( peer_name );

		if (peer == undefined) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				name  : peer_name,
			};
		}
		else if (user.activeCalls[peer.name] == undefined) {
			return {
				error : FAILURE.NO_PEER_CONNECTION,
				name  : peer.name,
			};

		} else {
			chat.sendMessage(
				{
					type: RESPONSE.VIDEO_HANG_UP,
					data: {
						sender    : user.name,
						recipient : peer.name,
						reason    : reason,
					},
				},
				[user.name, peer.name],
			);

			remove_call( user, peer.name );
			remove_call( peer, user.name );

			chat.users.sendUserListUpdate();
		}

	} // end_call


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PUBLIC METHODS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * closeAllCalls()
	 */
	this.closeAllCalls = function (user) {
		if (user !== null) {
			Object.keys( user.activeCalls ).forEach( (peer)=>{
				end_call( user, peer );
			});

			Object.keys( user.sentInvites ).forEach( (peer_name)=>{
				cancel_invite( user, peer_name );
			});

			Object.keys( user.receivedInvites ).forEach( (peer_name)=>{
				reject_invite( user, peer_name );
			});
		}

	} // closeAllCalls


	/**
	 * invite()
	 */
	this.invite = function (user, params) {
		if (params[0] != '') {
			return create_invite( user, params[0] );
		} else {
			return { error: FAILURE.USER_NAME_EXPECTED };
		}

	}; // invite


	/**
	 * cancel()
	 */
	this.cancel = function (user, params) {
		if (Object.keys( user.sentInvites ).length == 0) {
			return { error: FAILURE.CANCEL_NONE_PENDING };
		}

		if (params[0] != undefined) {
			const error = cancel_invite( user, params[0] );
			if (error) return error;
		}
		else {
			Object.keys( user.sentInvites ).forEach( (recipient)=>{
				const error = cancel_invite( user, recipient );
				if (error) return error;
			});
		}

		chat.users.sendUserListUpdate();

	}; // cancel


	/**
	 * reject()
	 */
	this.reject = function (user, params) {
		if (Object.keys( user.receivedInvites ).length == 0) {
			return { error: FAILURE.REJECT_NONE_PENDING };
		}

		if (params[0] != undefined) {
			const error = reject_invite( user, params[0] );
			if (error) return error;
		}
		else {
			Object.keys( user.receivedInvites ).forEach( (recipient)=>{
				const error = reject_invite( user, recipient );
				if (error) return error;
			});
		}

		chat.users.sendUserListUpdate();

	}; // reject


	/**
	 * accept()
	 */
	this.accept = function (user, params) {
		let recipient_name = params.shift();
		let recipient      = chat.users.findByName( recipient_name );

		if (Object.keys( user.receivedInvites ).length == 0) {
			return { error: FAILURE.ACCEPT_NONE_PENDING };
		}

		if (recipient_name == undefined) {
			recipient_name = Object.keys( user.receivedInvites )[0];
			const recipient = chat.users.findByName( recipient_name );
		}

		if (recipient === null) {
			return {
				error : FAILURE.USER_NAME_UNKNOWN,
				recipient_name,
			};
		}

		if (user.receivedInvites[recipient.name]) {
			chat.sendMessage(
				{
					type: RESPONSE.VIDEO_ACCEPT,
					data: {
						sender    : user.name,
						recipient : recipient.name,
						turnInfo  : create_turn_credentials(),
					},
				},
				[user.name, recipient.name],
			);

			remove_invite( user, 'receivedInvites', recipient.name );
			remove_invite( recipient, 'sentInvites', user.name );

			add_call( user, recipient.name );
			add_call( recipient, user.name );

			chat.users.sendUserListUpdate();

		} else {
			return {
				error : FAILURE.ACCEPT_NOT_INVITED,
				name  : recipient.name,
			};
		}

	}; // accept


	/**
	 * hangUp()
	 */
	this.hangUp = function (user, params) {
		if (Object.keys( user.activeCalls ).length == 0) {
			return { error: FAILURE.HANGUP_NO_CALLS };
		}

		if (params[0] != undefined) {
			const error = end_call( user, params[0], params[1] );
			if (error) return error;
		}
		else {
			Object.keys( user.activeCalls ).forEach( (recipient)=>{
				const error = end_call( user, recipient, params[1] );
				if (error) return error;
			});
		}

		chat.users.sendUserListUpdate();

	}; // hangUp


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = function () {
	}; // init


	// CONSTRUCTOR

	self.init();

}; // Calls


// EOF