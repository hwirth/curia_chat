// server_manager.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const sizeOf = require( 'image-size' );

const { set_debug, DEBUG, COLORS, color_log } = require( './debug.js' );
const { EXIT_CODES, SETTINGS, RESPONSE, FAILURE } = require( './constants.js' );
const { unix_timestamp } = require( './helpers.js' );


/**
 * ServerManager()
 */
module.exports.ServerManager = function (chat) {
	const self = this;

	/**
	 * send_message()
	 */
	function send_message (user, message) {
		chat.sendMessage(
			{
				type : RESPONSE.SERVER_MESSAGE,
				data : message,
			},
			[user.name],
		);

	} // send_message


	/**
	 * get_toggle()
	 */
	function get_toggle (text) {
		if (text == undefined) return null;

		const value
		= String( text )
		.trim()
		.toLowerCase()
		.replace( '1', 'TRUE' )
		.replace( '0', 'FALSE' )
		.replace( 'on', 'TRUE' )
		.replace( 'off', 'FALSE' )
		.replace( 'true', 'TRUE' )
		.replace( 'false', 'FALSE' )
		;

		if (value == 'TRUE') return true;
		if (value == 'FALSE') return false;
		return null;

	} // get_toggle


	/**
	 * on_set
	 */
	function on_set (user, params) {
		const DATA = {
			SETTINGS : SETTINGS,
			ACCOUNTS : chat.accounts.data,
			DEBUG    : DEBUG,
		}

		if ((params == undefined) || (params[0] == undefined)) {
			chat.sendMessage(
				{
					type : RESPONSE.SERVER_MESSAGE,
					data : DATA,
				},
				[user.name],
			);
			return;
		}

		params[0] = params[0]
		.replace( /\\\[/g, '###OPEN###' ).replace( /\\\]/g, '###CLOSE###' )
		.replace( /\]/g, '' ).replace( /\[/g, '.' )
		.replace( /###OPEN###/g, '[' ).replace( /###CLOSE###/g, ']' )
		;

		const path     = params[0].split( '.' );
		const property = path.pop();

		let parent = DATA;
		for (let i = 0; i < path.length; ++i) {
			if (parent[path[i]] == undefined) {
				return;
			}

			parent = parent[path[i]];
		}

		let value = params[1];
		value = (get_toggle( value ) === null) ? value : get_toggle( value );

		if (params[1] == undefined) {
			path.push( '' );

			const text
			= 'DATA.'
			+ path.join( '.' )
			+ property
			+ ' = '
			+ JSON.stringify( parent[property], null, '\t' )
			;

			chat.sendMessage(
				{
					type : RESPONSE.SERVER_MESSAGE,
					data : parent[property],
				},
				[user.name],
			);
		}
		else if (['boolean', 'number', 'string'].indexOf( typeof parent[property] ) >= 0) {
			parent[property] = value;

			chat.accounts.requestSaveData();

			on_set( user, path );
		}
		else {
			chat.sendMessage(
				{
					type : RESPONSE.SERVER_MESSAGE,
					data : parent,
				},
				[user.name],
			);
		}

	} // on_set


	/**
	 * on_stats()
	 */
	function on_stats (user, params) {
		send_message(
			user,
			chat.serverData.data,
		);

	} // on_stats

	/**
	 * on_account()
	 */
	function on_account (user, params) {
		if ((params == undefined) || (params.length < 2)) return;

		const command = params.shift();

		switch (command) {
		case 'delete':
			const user = chat.accounts.findByName( params[0] );
			if (user !== null) {
				chat.accounts.delete( params[0] );
				send_message( user, 'Account deleted.' );
			}

			break;
		}

	} // on_account


	/**
	 * on_restart()
	 */
	function on_restart (user, params) {
		chat.terminate( EXIT_CODES.REQUESTED_RESTART );

	} // on_restart


	/**
	 * on_hash()
	 */
	function on_hash (user, params) {

		/**
		 * sha512_password()
		 */
		function sha512_password (password, salt) {
			const hash = crypto.createHmac( 'sha512', salt );
			hash.update( password );

			return hash.digest( 'hex' );

		} // sha512_password


		if ((params == undefined) || (params[0] == undefined)) return;

		const password = params[0];
		const salt    =  (params[1] == 'timestamp') ? String( unix_timestamp() ) : (params[1] || '');

		const hash = chat.accounts.sha512Password( password, salt );

		send_message(
			user,
			{
				Password : password,
				Salt     : salt,
				Hash     : hash,
			},
		);

	} // on_restart


	/**
	 * on_gain_op()
	 */
	function on_gain_op (user, params) {
		if ((params == undefined) || (params[0] == undefined)) return;

		const hash = chat.accounts.sha512Password( params[0], SETTINGS.ADMIN_PASSWORD_SALT );

		if (hash == SETTINGS.ADMIN_PASSWORD_HASH) {
			user.isAdmin = true;
			send_message( user, 'Password accepted' );
		}

	} // on_restart


	/**
	 * onServerCommand()
	 */
	this.onServerCommand = function (user, params) {
		const command = params.shift();

		if ((command != 'gainop') && (! user.isAdmin)) {
			return {
				error : FAILURE.INSUFFICIENT_PERMISSIONS,
			};
		}

		switch (command) {
		case 'gainop'  :  on_gain_op ( user, params );  break;
		case 'set'     :  on_set     ( user, params );  break;
		case 'stats'   :  on_stats   ( user, params );  break;
		case 'account' :  on_account ( user, params );  break;
		case 'hash'    :  on_hash    ( user, params );  break;
		case 'restart' :  on_restart ( user, params );  break;
		case 'error'   :  throw new Error( 'Test error' );
		}

	}; // onServerCommand


	/**
	 * init()
	 */
	this.init = function () {
		//SETTINGS.DEBUG = DEBUG;   // Make debug settings available to /server set

	}; // init


	// CONSTRUCTOR

	self.init();

}; // ServerManager


//EOF