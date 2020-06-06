// rooms.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const { DEBUG, COLORS, color_log } = require( './debug.js' );

const {
	SETTINGS, RESPONSE, FAILURE,

} = require( './constants.js' );


const { unix_timestamp } = require( './helpers.js' );


/**
 * Rooms()
 */
module.exports.Rooms = function (chat) {
	const self = this;

	this.data;


	/**
	 * sendRooms()
	 */
	this.sendRooms = function (recipient = null) {
		if (DEBUG.ROOM_DATA) color_log( COLORS.ROOM, 'ROOM', 'self.sendRooms', self.data );

		const cloned_rooms = JSON.parse( JSON.stringify( self.data ) );

		const now = unix_timestamp();

		if ((recipient !== null) && (recipient.name != undefined)) {
			recipient = recipient.name;
		}

		Object.keys( cloned_rooms ).forEach( (key)=>{
			const room = cloned_rooms[key];
			room.lastActivitySecondsAgo = now - room.lastActivity;
			room.openedSecondsAgo = now - room.openedDate;
		});

		chat.sendMessage(
			{
				type: (recipient === null) ? RESPONSE.ROOM_LIST_UPDATE : RESPONSE.ROOM_LIST,
				data: cloned_rooms,
			},
			(recipient !== null) ? [recipient] : chat.users.toAll(),
		);

	} // sendRooms


	/**
	 * listUsers()
	 */
	this.listUsers = function (user, params, room_name) {
		const addresses_in_room = self.findUsersInRoom( room_name ).map( user => user.address );
		const users_in_room = [];
		const users_in_chat = [];

		Object.keys( chat.users.data ).forEach( (key)=>{
			const user = chat.users.data[key];

			if (addresses_in_room.indexOf( user.address ) < 0) {
				users_in_chat.push( user.name );
			} else {
				users_in_room.push( user.name );
			}
		});

		chat.sendMessage(
			{
				type: RESPONSE.USER_LIST,
				data: {
					inRoom: users_in_room,
					inChat: users_in_chat,
				},
			},
			[user.name],
		);

	} // listUsers


	/**
	 * findUserRooms()
	 */
	this.findUserRooms = function (address) {
		const in_rooms = [];

		Object.keys( self.data ).forEach( (key)=>{
			const room = self.data[key];

			if (room.users[address] != undefined) {
				in_rooms.push( room.name );
			}
		});

		return in_rooms;

	}; // findUserRooms


	/**
	 * isUserInRoom()
	 */
	this.isUserInRoom = function (user, room_name) {
		const room = self.data[room_name];

		if (room == undefined) {
			return {
				error: FAILURE.ROOM_NOT_FOUND,
				roomName: room_name,
			};

		} else {
			return (room.users[user.address] != undefined);
		}

	}; // isUserInRoom


	/**
	 * findUsersInRoom()
	 */
	this.findUsersInRoom = function (room_name) {
		const found_users = [];

		Object.keys( chat.users.data ).forEach( (key)=>{
			const user = chat.users.data[key];

			if (self.isUserInRoom( user, room_name )) {
				found_users.push( user );
			}
		});

		return found_users;

	}; // findUsersInRoom


	/**
	 * add()
	 */
	this.add = function (params) {
		const new_room_name = params.name;
		const new_topic     = params.topic || null;
		const persistent    = !!params.persistent;
		const mandatory     = !!params.mandatory;

		const index = new_room_name.toLowerCase();
		const room  = self.data[index];

		if (room != undefined) {
			if (DEBUG.ROOMS) color_log( COLORS.ROOM, 'ROOM', 'add_room: Already exists:', new_room_name );

		} else {
			if (DEBUG.ROOMS) color_log( COLORS.ROOM, 'ROOM', 'add_room:', new_room_name );

			const now = unix_timestamp();

			self.data[index] = {
				name                   : new_room_name,
				openedDate             : now,
				openedSecondsAgo       : 0,
				topic                  : new_topic,
				topicUser              : params.topicUser,
				lastActivity           : now,
				lastActivitySecondsAgo : 0,
				users                  : {},
				persistent             : persistent,
				mandatory              : mandatory,
			};
		}

	}; // add


	/**
	 * remove()
	 */
	this.remove = function (room_name) {
		const index = room_name.toLowerCase();
		const room = self.data[index];

		if (DEBUG.ROOMS) color_log( COLORS.ROOM, 'ROOM', 'remove_room:', room_name );

		if (room == undefined) {
			throw new Error( 'Rooms.remove(): Room "' + room_name + '" not found.' );

		} else {
			if (Object.keys( room.users ).length > 0) {
				throw new Error(
					'Rooms.remove(): Tried to remove "'
					+ room_name
					+ '", while there are still users in the room.'
				);
			} else {
				delete self.data[index];
			}
		}

	}; // remove


	/**
	 * registerActivity()
	 */
	this.registerActivity = function (room_name) {
		const room = self.data[room_name];

		if (DEBUG.ROOMS) color_log( COLORS.ROOM, 'ROOM', 'Registering activity: ', room_name );

		room.lastActivity = unix_timestamp();

	}; // registerActivity


	/**
	 * sayTopic()
	 */
	this.sayTopic = function (user, room_name) {
		const room = self.data[room_name];

		const set_by_name = (room.topicUser) ? room.topicUser.name : null;

		chat.sendMessage(
			{
				type: RESPONSE.ROOM_TOPIC,
				data: {
					roomName   : room.name,
					topic      : room.topic,
					topicSetBy : set_by_name,
				},
			},
			(user === null) ? null : [user.name],
		);

	}; // sayTopic


	/**
	 * setTopic()
	 */
	this.setTopic = function (user, params, room_name) {
		if (self.data[room_name] == undefined) {
			return {
				error    : FAILURE.ROOM_NOT_FOUND,
				roomName : room_name,
			};
		}

		if (! self.isUserInRoom( user, room_name )) {
			return {
				error    : FAILURE.USER_NOT_IN_ROOM,
				roomName : room_name,
			};
		}

		if (params[0] == undefined) {
			return self.sayTopic( user, room_name );
		} else {
			const room = self.data[room_name];

			room.topic = params.join( ' ' );
			room.topicUser = user;

			self.sendRooms();
			self.registerActivity( room.name );
			self.sayTopic( null, room.name );
		}

	}; // setTopic


	/**
	 * join()
	 */
	this.join = function (user, room_name) {
		if (room_name == undefined) {
			return { error: FAILURE.ROOM_NAME_EXPECTED };
		}

		const index   = room_name.toLowerCase();
		const address = user.address;
		let room      = self.data[index];

		if (DEBUG.ROOMS) {
			const user_info = (DEBUG.USER_DATA) ? user : user.name;
			color_log( COLORS.ROOM, 'ROOM', 'join_room:', user_info, room_name );
		}

		if (room == undefined) {
			self.add({
				name: room_name,
			});
			room = self.data[index];

			if (DEBUG.ROOMS) color_log( COLORS.ROOM, 'ROOM', 'join: created new room:', room_name );
		}

		if (Object.keys( room.users ).length == 0) {
			user.operatorRooms.push( index );
		}

		if (room.users[address] != undefined) {
			return {
				error    : FAILURE.USER_ALREADY_IN_ROOM,
				roomName : room_name,
			};

		} else {
			const timestamp = unix_timestamp();

			room.users[address] = {
				joinDate     : timestamp,
				lastActivity : timestamp,
			};

			self.sendRooms();

			if (user.loggedIn) {
				const topic_set_by_name = (room.topicUser) ? room.topicUser.name : null;

				chat.sendMessage(
					{
						type: RESPONSE.USER_JOINED_ROOM,
						data: {
							userName   : user.name,
							roomName   : room.name,
							topic      : room.topic,
							topicSetBy : topic_set_by_name,
						},
					},
				);
			}
		}

		if (DEBUG.ROOM_DATA) color_log( COLORS.ROOM, 'ROOM', 'join_room: self.data:', self.data );

	}; // join


	/**
	 * leave()
	 */
	this.leave = function (user, room_name, force_leave = false) {
		if (room_name == undefined) {
			color_log( COLORS.ERROR, 'ERROR', 'leave_room: room_name is undefined' );
			return;
		}

		const index   = room_name.toLowerCase();
		const room    = self.data[index];
		const address = user.address;

		if (DEBUG.ROOMS) {
			const user_info = (DEBUG.USER_DATA) ? user : user.name;
			color_log( COLORS.ROOM, 'ROOM', 'leave_room:', user_info, room_name );
		}

		if (room == undefined) {
			if (DEBUG.ROOMS) {
				color_log(
					COLORS.ROOM,
					'ROOM',
					'leave_room: room undefined:',
					user.name,
					room_name,
				);
			}

			return {
				error: FAILURE.ROOM_NOT_FOUND,
				roomName: room_name,
			};

			return;
		}

		if (room.users[address] == undefined) {
			if (DEBUG.ROOMS) {
				color_log(
					COLORS.ROOM,
					'ROOM',
					'leave_room: user not in room',
					user.name,
					room_name,
				);
			}

			return {
				error: FAILURE.USER_NOT_IN_ROOM,
				roomName: room.name,
			};

			return;
		}

		const user_in_rooms = self.findUserRooms( address );

		if ((force_leave == false) && (user_in_rooms.length == 1)) {
			if (DEBUG.ROOMS) {
				color_log(
					COLORS.ROOM,
					'ROOM',
					'leave_room: can\'t leave last room:',
					user.name,
					room_name,
				);
			}

			return { error: FAILURE.CANT_LEAVE_LAST_ROOM };

		} else {
			delete room.users[address];

			if ((Object.keys( room.users ).length == 0) && (room.persistent == false)) {
				chat.sendMessage(
					{
						type: RESPONSE.LAST_USER_LEFT_ROOM,
						data: {
							roomName: room.name
						},

					},
				);

				self.remove( room.name );
			}

			if (user.loggedIn) {
				chat.sendMessage(
					{
						type: RESPONSE.USER_LEFT_ROOM,
						data: {
							userName: user.name,
							roomName: room.name,
						},
					}
				);
			}

			self.sendRooms();
		}

		if (DEBUG.ROOM_DATA) color_log( COLORS.ROOM, 'ROOM', 'leave_room: self.data:', self.data );

	}; // leave


	/**
	 * leaveAll()
	 */
	this.leaveAll = function (address) {
		const user = chat.users.data[address];

		Object.keys( self.data ).forEach( (key)=>{
			const room = self.data[key];

			self.leave(
				user,
				room.name,
				/*force_leave*/true,
			);
		});

	}; // leaveAll


	/**
	 * kick()
	 */
	this.kick = function (user, params) {
		if (params[0] == undefined) {
			return { error: FAILURE.USER_NAME_EXPECTED };
		}

		const kick_user = chat.users.findByName( params[0] );

		if (kick_user === null) {
			return {
				error: FAILURE.USER_NAME_UNKNOWN,
				name: params[0],
			};
		}

		self.sendMessage(
			{
				type: RESPONSE.USER_KICKED,
				data: kick_user.name,
			},
			[user.name],
		);

		//...register_room_activity( room.name );

	}; // kick


	/**
	 * init()
	 */
	this.init = function () {
		self.data = {};

	}; // init


	// CONSTRUCTOR

	self.init();

}; // Rooms


//EOF