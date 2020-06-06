// users.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const { DEBUG, COLORS, color_log } = require( './debug.js' );
const { SETTINGS, RESPONSE, FAILURE, SYSTEM_USER } = require( './constants.js' );


/**
 * Users()
 */
module.exports.Users = function (chat) {
	const self = this;

	this.data;
	this.pongTimout;


	/**
	 * add()
	 */
	this.add = function (new_data) {
		const address = new_data.address;

		self.data[address] = new_data;

		return self.data[address];

	}; // add


	/**
	 * remove()
	 */
	this.remove = function (address) {
		const user_name = self.data[address].name;
		color_log( COLORS.USERS, 'USERS', 'Users.remove: ', user_name, address );
		delete self.data[address];

	}; // remove


	/**
	 * isNameValid()
	 */
	this.isNameValid = function (name) {
		if (name.trim().length == 0) return false;

		name = name.toLowerCase();
		let name_is_valid = true;

		for (let i = 0; i < name.length; ++i) {
			if (SETTINGS.ALLOWED_NAME_CHARS.indexOf( name[i] ) < 0) {
				name_is_valid = false;
			}
		}

		return name_is_valid;

	}; // isNameValid


	/**
	 * toAll()
	 */
	this.toAll = function () {
		let found_users = [];

		Object.keys( self.data ).forEach( (address)=>{
			found_users.push( address );
		});

		return found_users;

	}; // toAll


	/**
	 * toAllAdmins()
	 */
	this.toAllAdmins = function () {
		let found_admins = [];

		Object.keys( self.data ).forEach( (name)=>{
			if (self.data[name].isAdmin) {
				found_admins.push( name );
			}
		});

		return found_admins;

	}; // toAll


	/**
	 * findByName()
	 */
	this.findByName = function (find_name) {
		if (find_name == undefined) return null;

		find_name = find_name.toLowerCase();
		let found_user = null;

		Object.keys( self.data ).forEach( (key)=>{   //... user .find
			const user = self.data[key];

			if (user.name.toLowerCase() == find_name) {
				found_user = user;
			}
		});

		return found_user;

	}; // findByName


	/**
	 * findByAccountName()
	 */
	this.findByAccountName = function (find_name) {
		if (find_name == undefined) return null;

		find_name = find_name.toLowerCase();
		let found_user = null;

		Object.keys( self.data ).forEach( (key)=>{   //... user .find
			const user = self.data[key];
			const test_name = (user.account === null) ? null : user.account.name.toLowerCase();

			if (test_name == find_name) {
				found_user = user;
			}
		});

		return found_user;

	}; // findByName


	/**
	 * findByAddress()
	 */
	this.findByAddress = function (address) {
		if (self.data[address] == undefined) {
			return null;
		} else {
			return self.data[address];
		}

	}; // findByAddress


	/**
	 * recipientsExist()
	 */
	this.recipientsExist = function (recipients) {
		let exist = true;

		if (!(recipients instanceof Array)) return false;

		recipients.forEach( (name_or_address)=>{
			const user = self.data[name_or_address] || self.findByName( name_or_address );
			if (user === null) {
				exist = false;
			}
		});

		return exist;

	}; // recipientsExist


	/**
	 * getUserInfo()
	 */
	this.getUserInfo = function (user) {
		const sent_invites      = {};
		const received_invites  = {};
		const active_calls      = {};

		Object.keys( user.sentInvites ).forEach( (name)=>{
			sent_invites[name] = user.sentInvites[name];
		});

		Object.keys( user.receivedInvites ).forEach( (name)=>{
			received_invites[name] = user.receivedInvites[name];
		});

		Object.keys( user.activeCalls ).forEach( (name)=>{
			active_calls[name] = user.activeCalls[name];
		});

		return {
			client          : user.client,
			address         : user.address,
			name            : user.name,
			avatar          : user.avatar,

			loggedIn        : user.loggedIn,
			isAdmin         : user.isAdmin,

			accountInfo     : chat.accounts.getAccountInfo( user.name ),

			operatorRooms   : user.operatorRooms,

			sentInvites     : sent_invites,
			receivedInvites : received_invites,
			activeCalls     : active_calls,
		};

	}; // getUserInfo


	/**
	 * sendUserListUpdate()
	 */
	this.sendUserListUpdate = function (recipient = null) {
		const collected_data = [];

		Object.keys( self.data ).forEach( (address)=>{
			const user = self.data[address];

			if (user.loggedIn) {
				collected_data.push( self.getUserInfo( user ) );
			}
		});

		chat.sendMessage(
			{
				type: RESPONSE.USER_LIST_UPDATE,
				data: collected_data,
			},
			(recipient !== null) ? [recipient] : self.toAll(),
		);

	}; // sendUserListUpdate


	/**
	 * changeName()
	 */
	this.changeName = function (message) {
		const user     = self.data[message.sender];
		const new_name = (message.data.name || '').replace( / /g, '_' );
		const password = message.data.password;

		const lowercase_name = new_name.toLowerCase();

		if (lowercase_name == user.name.toLowerCase()) {
			chat.sendMessage(
				{
					type: RESPONSE.NAME_ALREADY_SET,
				},
				[message.sender],
			);

			return;
		}

		let abort = false;
		let ping_name = null;

		Object.keys( self.data ).forEach( (address)=>{
			const test_user = self.data[address];

			if( (test_user.loggedIn)
			&&  (test_user.address !== user.address)
			&&  (  (lowercase_name == test_user.name.toLowerCase())
			    || (  (test_user.account !== null)
			       && (lowercase_name == test_user.account.name.toLowerCase())
			       )
			    )
			) {
				const account_name = (test_user.account === null) ? '' : test_user.account.name;
				const using_name = test_user.name;

				const show_name
				= (account_name.toLowerCase() == new_name.toLowerCase())
				? account_name
				: using_name
				;

				ping_name = test_user.name;
				if (using_name == account_name) {
					chat.sendMessage(
						{
							type: RESPONSE.NAME_IN_USE,
							data: show_name,
						},
						[message.sender],
					);
				} else {
					chat.sendMessage(
						{
							type: RESPONSE.NAME_IN_USE_2NAMES,
							data: {
								usingName   : using_name,
								accountName : account_name,
							}
						},
						[message.sender],
					);
				}

				abort = true;
			}
		});

		if (abort) {
			self.onPing( user, ping_name );
			return;
		}

		if (! self.isNameValid( new_name )) {
			let symbols = '';
			let uppercase = '';
			let lowercase = '';

			for (let i = 0; i < SETTINGS.ALLOWED_NAME_CHARS.length; ++i) {
				const char = SETTINGS.ALLOWED_NAME_CHARS[i];
				if (char.toLowerCase() == char.toUpperCase()) {
					symbols += char;
				} else {
					lowercase += char.toLowerCase();
					uppercase += char.toUpperCase();
				}
			}

			const allowed_chars_display = uppercase + '<br>' + lowercase + '<br>' + symbols;

			chat.sendMessage(
				{
					type: RESPONSE.NAME_INVALID,
					data: {
						newName : new_name,
						allowed : allowed_chars_display,
					},
				},
				[message.sender],
			);

			return;
		}

		if (DEBUG.USER_DATA) console.log( "Users: changeName: ", user );

		const password_already_provided
		=  (user.account !== null)
		&& (user.account.name != undefined)
		&& (user.account.name.toLowerCase() == new_name.toLowerCase())
		;

		if( (! password_already_provided)
		&&  (! chat.accounts.verifyPassword( new_name, password ))
		) {
			chat.sendFailure(
				{
					error : FAILURE.PASSWORD_MISMATCH,
					name  : new_name,
				},
				[message.sender],
			);

			return;
		}


		/*
		 * Login/name change success
		 */

		if (! user.loggedIn) {
			chat.notifyOwnerAboutLogin( new_name );
		}

		const old_name    = user.name;
		user.name         = new_name;

		const account = chat.accounts.findByName( new_name );
		if (account !== null) {   // Only assign, if exists; Don't erase a possible existing login
			user.account = account;
		}

		user.isAdmin = (user.account === null) ? SETTINGS.EVERYONE_IS_ADMIN : user.account.data.isAdmin;

		const account_info = chat.accounts.getAccountInfo( new_name );

		chat.sendMessage(
			{
				type: RESPONSE.NAME_CHANGE_ACCEPTED,
				data: {
					newName  : new_name,
					loggedIn : user.loggedIn,
					account  : account_info,
				},
			},
			[message.sender],
		);

		chat.sendMessage(
			{
				type: RESPONSE.NAME_CHANGE_ANNOUNCE,
				data: {
					oldName  : old_name,
					newName  : new_name,
					loggedIn : user.loggedIn,
				},
			},
			self.toAll(),
		);

		user.loggedIn = true;

		self.sendUserListUpdate();

	}; // changeName


	/**
	 * onPing()
	 */
	this.onPing = function (user, test_name = null) {
		if ((test_name === null) && (! user.isAdmin)) {
			return {
				error : FAILURE.INSUFFICIENT_PERMISSIONS,
			};
		}

		if (self.pongTimeout === null) {
			/*
			 * Find users to ping
			 */
			const ping_addresses = [];

			if (test_name === null) {
				Object.keys( self.data ).forEach( (address)=>{
					ping_addresses.push( address );
				});
			} else {
				const test_user = self.findByName( test_name );
				if (test_user !== null) {
					ping_addresses.push( test_user.address );
				}
			}

			/*
			 * Send pings
			 */
			ping_addresses.forEach( (address)=>{
				const test_user = self.data[address];

				test_user.pongPending = true;

				if (test_user.pongPending !== null) {
					chat.sendMessage(
						{
							type: RESPONSE.PING,
						},
						test_user.name,
					);
				}
			});

			/*
			 * Wait a short while, giving clients chance to send the pongs
			 */
			self.pongTimout = setTimeout( ()=>{
				/*
				 * Check, who responded with a pong
				 */
				ping_addresses.forEach( (address)=>{
					const test_user = self.data[address];

					if (test_user != undefined) {
						if (test_user.pongPending === true) {
							user.socket.close();
							chat.onDisconnect( test_user.address );

							chat.sendMessage(
								{
									type : RESPONSE.USER_PONG_FAILURE,
									name : test_user.name
								},
								[user.name],
							);
						}
						else if (test_user.pongPending === false) {
							chat.sendMessage(
								{
									type : RESPONSE.USER_PONG_SUCCESS,
									name : test_user.name
								},
								[user.name],
							);
						}

						test_user.pongPending = null;
					}
				});

				self.pongTimeout = null;

			}, SETTINGS.PING_TIMEOUT);
		}

	}; // onPing


	/**
	 * onPong()
	 */
	this.onPong = function (sender) {
		const user = self.data[sender];

		if (user == undefined) {
			//... error
		} else {
			user.pongPending = false;
		}

	}; // onPong


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = async function () {
		self.data = {};
		self.pongTimeout = null;

	}; // init


	// CONSTRUCTOR

	self.init();

}; // Users


//EOF