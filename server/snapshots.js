// calls.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const sizeOf = require( 'image-size' );

const { DEBUG, COLORS, color_log } = require( './debug.js' );
const { SETTINGS       } = require( './constants.js' );
const { unix_timestamp } = require( './helpers.js' );


/**
 * Snapshots()
 */
module.exports.Snapshots = function (chat) {
	const self = this;

	this.snapshots;
	this.sendQueue;


	/**
	 * send_next()
	 */
	function send_next () {

		chat.sendMessage(
			{
				type : RESPONSE.AVATAR_ANNOUNCE,
				data : data_uri,
				user : user.address,
			},
			chat.users.toAll()
		);
		chat.users.sendUserListUpdate();


	} // send_next


	/**
	 * on_send_snapshots()
	 */
	function send_snapshots () {
		self.sendQueue = chat.users.data.filter( user => user.address );


		setTimeout( on_send_snapshots, 1000 );

	} // on_send_snapshots


	/**
	 * updateSnapshot()
	 */
	this.updateSnapshot = function (user, data_uri) {
		if (data_uri === null) {
			color_log( COLORS.SNAPSHOT, 'SNAPSHOT', 'Removing image for ' + user.name );
			user.avatar = null;
			chat.users.sendUserListUpdate();
			return;
		}

		let image_data = null;

		if (data_uri.substr( 0, 23 ) == 'data:image/jpeg;base64,') {
			image_data = data_uri.substr( 23 );
		}
		else if (data_uri.substr( 0, 22 ) == 'data:image/png;base64,') {
			image_data = data_uri.substr( 22 );
		}

		if (image_data === null) {
			color_log(
				COLORS.ERROR,
				'ERROR',
				'snapshots.js:updateSnapshot: Invalid image: Neither jpeg nor png data url'
			);
		} else {
			const image      = Buffer.from( image_data, 'base64' );
			const dimensions = sizeOf( image );

			if( (dimensions.width > SETTINGS.AVATAR.WIDTH)
			||  (dimensions.height > SETTINGS.AVATAR.HEIGHT)
			) {
				color_log(
					COLORS.SNAPSHOT,
					'SNAPSHOT',
					'Invalid image: Bad dimensions:',
					dimensions
				);

			} else {
				color_log( COLORS.SNAPSHOT, 'SNAPSHOT', 'Accepted new image for ' + user.name );
				self.data[user.address] = {
					image   : data_uri,
					created : unix_timestamp(),
				};
			}
		}

	}; // updateSnapshot


	/**
	 * init()
	 */
	this.init = function () {
		self.snapshots = {};
		self.sendQueue = [];

		setTimeout( on_send_snapshots, SETTINGS.SEND_SNAPSHOT_INTERVAL );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // Snapshots

//EOF