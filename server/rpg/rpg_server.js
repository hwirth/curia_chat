// server_manager.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const fs   = require( 'fs' );
const glob = require( 'glob' );
const path = require( 'path' );
const reRequire = require( 're-require-module' ).reRequire;

const { set_debug, DEBUG, COLORS, color_log } = require( '../debug.js' );
const { EXIT_CODES, SETTINGS, RESPONSE, FAILURE } = require( '../constants.js' );
const { unix_timestamp, now } = require( '../helpers.js' );


const rpg = require( '../chat_server.js' ).rpg;


/**
 * RolePlayServer()
 */
module.exports.RolePlayServer = function (chat, do_reset) {
	const self = this;

	this.data;

	var loaded_modules;


	/**
	 * send_message()
	 */
	function send_message (user, text = null, list = null) {
		chat.sendMessage(
			{
				type : RESPONSE.RPG,
				data : {
					text: text,
					list: list,
				}
			},
			[user.name],
		);

	} // send_message


	/**
	 * reset_server()
	 */
	function reset_server () {
		if (DEBUG.RPG) color_log( COLORS.RPG, 'RPG', 'Creating new data' );

		self.data = {};
		chat.rpgData = self.data;
console.log( 'RPG_DATA', chat.rpgData );
console.log( 'RPG', rpg );
try {
		self.data.character = new rpg.Character();
} catch (error) {
	chat.sendFailure({
		error : FAILURE.RPG,
		text  : error.stack
			.replace( /\n/g, '<br>' )
			.trim()
	});
}

	} // resetServer


	/**
	 * on_rpg_reset()
	 */
	function on_rpg_reset (user, params) {
		reset_server( user );
		//self.data.character.update();

		send_message( user, null, self.data );

	} // on_rpg_reset


	/**
	 * on_rpg_test()
	 */
	function on_rpg_test (user, params) {
		send_message( user, 'Test. Data is: ' + self.data.test );

	} // on_rpg_test


	/**
	 * onRpgCommand()
	 */
	this.onRpgCommand = function (user, params) {
		const command = params.shift();

		switch (command) {
		case 'reset'  :  on_rpg_reset( user, params );  break;
		case 'test'   :  on_rpg_test ( user, params );  break;
		default:
			self.data.character.update();
			send_message( user, null, self.data );
		}

	}; // onRpgCommand


	/**
	 * init()
	 */
	this.init = function ( do_reset ) {
		//...if (DEBUG.RPG) color_log( COLORS.RPG, 'RPG', 'Instantiating...' );

		if (chat.loadedRpgModules == undefined) chat.loadedRpgModules = {};
		if (chat.rpgData          == undefined) chat.rpgData = null;

		if (do_reset || (Object.keys( rpg ).length == 0)) {
			chat.loadedRpgModules = {};
			chat.rpgData = null;

			for (const key in rpg) {
				delete rpg[key];
			}

			rpg.items = {
				clothes    : {},
				tools      : {},
				weapons    : {},
				containers : {},
				lights     : {},
				plants     : {},
				furniture  : {},
			};
			rpg.mobs = {
				npcs     : {},
				animals  : {},
				monsters : {},
			};
			rpg.skills = {};

			rpg.now = now;   // Helpers.now()
		}

		return new Promise( async (done)=>{
			const mtimes = [];
			const stat_requests = [];
			await new Promise( (done)=>{
				glob( './rpg/modules/**/*.js', (error, matches)=>{
					matches.forEach( (file_name)=>{
						stat_requests.push(
							fs.promises.stat( file_name ).then( (stats)=>{
								mtimes[file_name] = stats.mtimeMs;
							})
						);
					});
					done();
				});
			})
			.then( ()=>Promise.all( stat_requests ) );

			const load_requests = [];
			Object.keys( mtimes ).forEach( (file_name)=>{
				const module = chat.loadedRpgModules[file_name];

				if ((module == undefined) || (module.mtime < mtimes[file_name])) {
					if (DEBUG.RPG) color_log( COLORS.RPG, 'LOAD', file_name );

					chat.loadedRpgModules[file_name] = {
						mtime: mtimes[file_name],
					};

					load_requests.push(
						new Promise( (done)=>{
							let loaded = {};

							try {
								reRequire( path.resolve( file_name ) );

							} catch (error) {
								chat.sendFailure({
									error : FAILURE.RPG,
									text  : error.stack
										.replace( /\n/g, '<br>' )
										.trim()
								});
							}

							done();
						})
					);
				} else {
					//...if (DEBUG.RPG) color_log( COLORS.RPG, 'UP-TO-DATE', file_name );
				}

			});

			await Promise.all( load_requests );

			self.data = chat.rpgData;
			if (self.data === null) {
				reset_server();
			}

			if (DEBUG.RPG) color_log( COLORS.RPG, 'RPG', 'Server instantiated.' );
			done();
		});

	}; // init


	// CONSTRUCTOR

	return self.init( do_reset ).then( ()=>self );

}; // RolePlayServer


//EOF