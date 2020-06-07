// accounts.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const fs     = require( 'fs' );
const path   = require( 'path' );
const crypto = require( 'crypto' );
const sizeOf = require( 'image-size' );
const read   = require( 'read');

const { send_mail } = require( './helpers.js' );
const { DEBUG, COLORS, color_log } = require( './debug.js' );
const { EXIT_CODES, HTTPS_OPTIONS, SETTINGS, REGISTRATION_MAIL, RESPONSE } = require( './constants.js' );
const { unix_timestamp } = require( './helpers.js' );


const EMPTY_DATA_TEMPLATE = JSON.stringify({
	fileFormat: 1,
	pending: {},
	registered: {},
});


/**
 * Accounts()
 */
module.exports.Accounts = function (chat) {
	const self = this;

	this.data;
	this.dataWriteRequested;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// INITIAL ADMIN ACCOUNT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * initial_admin_account()
	 */
	async function initial_admin_account () {

		/**
		 * read_line()
		 */
		function read_line (prompt, silent = false) {
			return new Promise( (done)=>{
				read(
					{
						prompt: prompt,
						silent: silent,
					},
					(error, result, isDefault)=>{
						if (error === null) {
							done( result );
						}
						else if (error.message == 'canceled') {
							console.log( '\nAborting.');
							process.exit();
						}
						else {
							throw error;
						}
					},
				);
			});

		} // read_line


		/**
		 * show_valid_chars()
		 */
		function show_valid_chars () {
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

			console.log( 'Valid characters:' );
			console.log( '\t' + uppercase );
			console.log( '\t' + lowercase );
			console.log( '\t' + symbols );

		} // show_valid_chars


		/**
		 * get_user_name()
		 */
		async function get_user_name () {
			let user_name = null;

			while (user_name === null) {
				const new_name = await read_line( 'Choose a user name: ' );
				if (chat.users.isNameValid( new_name )) {
					user_name = new_name;
				} else {
					console.log( 'Name contains invalid characters.' );
					show_valid_chars();
				}
			}

			return user_name;

		} // get_user_name


		/**
		 * valid_password()
		 */
		function valid_password (password) {
			const valid = (
				password.length >= 8
			);

			if (! valid) {
				console.log( 'ERROR: Use at least 8 characters.\n' );
			}

			return valid;

		} // valid_password


		console.log(
			'\nNew data file will be created:\n'
			+ __dirname + '/' + SETTINGS.ACCOUNTS.FILE_NAME
			+ '\n\nSetting up the administrator account.'
			+ '\nYou will be seen in the chat with this account, better not to name it "admin" ;-)'
			+ '\nI'\d suggest, you simply use your name:'
		);

		const user_name = await get_user_name();

		let password1 = null;
		let password2 = null;
		while ((password1 === null) || (password2 === null)) {
			const new_password1 = await read_line( 'Password: ', /*silent*/true );

			if (valid_password( new_password1 )) {
				password1 = new_password1;
				const new_password2 = await read_line( 'Repeat: ', /*silent*/true );

				if (valid_password( new_password2 )) {
					password2 = new_password2;

					if (password1 !== password2) {
						console.log( 'Passwords do not match. Try again:\n' );
						password1 = null;
					}
				} else {
					password1 = null;
				}
			}
		}

		self.data = {
			pending: {},
			registered: {},
		};

		self.create( user_name, password1, { isOwner: true, isAdmin: true } );

		return self.data;

	} // initial_admin_account


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PRIVATE METHODS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * assert_data_file_exists()
	 */
	async function assert_data_file_exists () {

		/**
		 * report_and_die()
		 */
		function report_and_die (error, circumstance, exit_code) {
			color_log( COLORS.ERROR, 'ERROR', circumstance + '\n', error );
			process.exit( exit_code );

		} // report_and_die


		const file_name = SETTINGS.ACCOUNTS.FILE_NAME;
		const pos  = file_name.lastIndexOf( '/' ) + 1;
		const path = file_name.substr( 0, pos );

		return fs.promises.mkdir( path, {recursive: true} )
		.catch( (error)=>{
			if (error.code != 'EEXIST') {
				report_and_die(
					error, 'while trying to create ' + path,
					EXIT_CODES.ACCOUNTS_MKDIR,
				);
			}
		})
		.then( ()=>{
			return fs.promises.access( file_name, fs.constants.R_OK | fs.constants.W_OK )
		})
		.catch( async (error)=>{
			if (error.code != 'ENOENT') {
				report_and_die(
					error, 'while trying to access ' + file_name,
					EXIT_CODES.ACCOUNTS_ACCESS_FILE,
				);
			} else {
				if (chat.commandLineOptions.firstRun) {
					const new_data = await initial_admin_account();
					return fs.promises.writeFile( file_name, JSON.stringify( new_data ) );
				}

				report_and_die(
					'',
					'Data directory not found. Did you mean to start me with --first-run?',
					EXIT_CODES.DATA_DIR_NOT_FOUND
				);
			}
		})
		.catch( (error)=>{
			report_and_die(
				error, 'while trying to create ' + file_name,
				EXIT_CODES.ACCOUNTS_CREATE_FILE,
			);
		});

		// deadbeat: keep in mind that the final result can be one of the results of either "access" or
		// "writeFile"  if you continue to work with the returned Promise

	} // assert_data_file_exists


	/**
	 * prune_backup_files()
	 */
	function prune_backup_files () {
		const pos  = SETTINGS.ACCOUNTS.FILE_NAME.indexOf( '/' ) + 1;
		const path = SETTINGS.ACCOUNTS.FILE_NAME.substr( 0, pos );
		const base = SETTINGS.ACCOUNTS.FILE_NAME.substr( pos );

		const current_timestamp = unix_timestamp();

		return fs.promises
		.readdir( path )
		.then( (files)=>{
			const unlink_promises = [];

			files.filter( (file_name)=>{
				return (
					(file_name.substr( 0, base.length ) == base)
					&& (file_name.length > base.length)
				);
			})
			.sort()
			.filter( (file_name, index)=>{
				const file_extension = file_name.substr( file_name.lastIndexOf( '.' ) + 1 );
				const file_timestamp = parseInt( file_extension );
				const age_in_days = (current_timestamp - file_timestamp) / (60*60*24);

				return (age_in_days >= SETTINGS.ACCOUNTS.BACKUP_DAYS);
			})
			.forEach( (file_name)=>{
				unlink_promises.push(
					fs.promises.unlink( path + file_name )
					.then( ()=>{
						color_log(
							COLORS.ACCOUNTS,
							'ACCOUNTS',
							'Pruned: ' + file_name
						);
					})
					.catch( (error)=>{
						color_log(
							COLORS.ERROR,
							'ACCOUNTS',
							'accounts.js: prune_backup_files: While pruning '
							+ file_name + ':',
							error
						);
					})
				);
			});

			return Promise.all( unlink_promises );
		});

	} // prune_backup_files


	/**
	 * create_backup()
	 */
	function create_backup () {
		const backup_file_name = SETTINGS.ACCOUNTS.FILE_NAME + '.' + unix_timestamp();

		return fs.promises
		.rename( SETTINGS.ACCOUNTS.FILE_NAME, backup_file_name )
		.then( ()=>{
			color_log(
				COLORS.ACCOUNTS,
				'ACCOUNTS',
				'Renaming ' + SETTINGS.ACCOUNTS.FILE_NAME + ' --> ' + backup_file_name
			);
		})
		.catch( (error)=>{
			color_log(
				COLORS.ERROR,
				'ACCOUNTS',
				'accounts.js: create_backup:',
				error
			);
		});

	} // create_backup


	/**
	 * load_user_data()
	 */
	function load_user_data () {
		return fs.promises
		.readFile( SETTINGS.ACCOUNTS.FILE_NAME, 'utf8' )
		.then( (new_data)=>{
			color_log(
				COLORS.ACCOUNTS,
				'ACCOUNTS',
				'Read ' + SETTINGS.ACCOUNTS.FILE_NAME
			);

			return JSON.parse( new_data );
		})
		.catch( (error)=>{
			color_log(
				COLORS.ERROR,
				'ERROR',
				'accounts.js: load_user_data: Error while reading file '
				+ SETTINGS.ACCOUNTS.FILE_NAME
			);
			color_log(
				COLORS.ERROR,
				'error:',
				error,
			);
		});

	}; // load_user_data


	/**
	 * save_user_data()
	 */
	async function save_user_data () {
		if (DEBUG.ACCOUNTS) color_log( COLORS.ACCOUNTS, 'ACCOUNTS', 'Executing data write' );

		await prune_backup_files();
		await create_backup();

		const json = JSON.stringify( self.data );

		return fs.promises
		.writeFile( SETTINGS.ACCOUNTS.FILE_NAME, json, 'utf8' )
		.then( ()=>{
			color_log(
				COLORS.ACCOUNTS,
				'ACCOUNTS',
				'Saved ' + SETTINGS.ACCOUNTS.FILE_NAME
			);
		})
		.catch( (error)=>{
			color_log(
				COLORS.ERROR,
				'ERROR',
				'accounts.js: save_user_data: writeFile ' + SETTINGS.ACCOUNTS.FILE_NAME,
			);
			color_log(
				COLORS.ERROR,
				'error:',
				error,
			);
		}).then( ()=>{
			self.dataWriteRequested = false;
		});

	}; // save_user_data


	/**
	 * check_data_write_request()
	 */
	function check_data_write_request () {
		if (self.dataWriteRequested) {
			save_user_data().then( ()=>{
				setTimeout(
					check_data_write_request,
					SETTINGS.ACCOUNTS.SAVE_DATA_INTERVAL
				);
			});
		} else {
			setTimeout(
				check_data_write_request,
				SETTINGS.ACCOUNTS.SAVE_DATA_INTERVAL
			);
		}

	} // check_data_write_request


	/**
	 * self.requestSaveData()
	 */
	this.requestSaveData = function () {
		if (DEBUG.ACCOUNTS) color_log( COLORS.ACCOUNTS, 'ACCOUNTS', 'Data write requested' );

		self.dataWriteRequested = true;

	} // request_save_user_data


	/**
	 * sha512Password()
	 */
	this.sha512Password = function (password, salt) {
		if ((password == undefined) || (salt == undefined)) {
			return false;
		}

		const hash = crypto.createHmac( 'sha512', salt );
		hash.update( password );

		return hash.digest( 'hex' );

	}; // sha512Password


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PUBLIC METHODS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * findByName()
	 */
	this.findByName = function (name) {
		const index   = name.toLowerCase();
		const account = self.data.registered[index];

		return ((account == undefined) ? null : account);
	};


	/**
	 * verifyPassword()
	 */
	this.verifyPassword = function (user_name, password = '') {
		const account = self.findByName( user_name );

		if (account == undefined) {
			return (password == '');
		}

		const salt = account.name.toLowerCase() + String( account.created );
		const input_hash  = self.sha512Password( password, salt );
		const stored_hash = account.hash;

		return (input_hash === stored_hash);

	} // verifyPassword


	/**
	 * create()
	 */
	this.create = function (user_name, password, new_data = {}) {
		const index   = user_name.toLowerCase();
		const account = self.findByName( user_name );

		if (account !== null) {
			throw new Error( 'Can\'t create new user record: Entry already exists.' );
		}

		const now  = unix_timestamp();
		const salt = user_name.toLowerCase() + String( now );
		const hash = self.sha512Password( password, salt );

		if (new_data.isOwner == undefined) new_data.isOwner = false;
		if (new_data.isAdmin == undefined) new_data.isAdmin = false;

		self.data.registered[index] = {
			name        : user_name,
			created     : now,
			hash        : hash,
			data        : new_data,
			preferences : {},
		};

		self.requestSaveData();

	}; // create


	/**
	 * update()
	 */
	this.update = function (user_name, new_data) {
		const account = self.findByName( user_name );

		if (!account) throw new Error( 'Can\'t update user record: Entry "' + user_name + '" not found.' );

		Object.keys( new_data ).forEach( (key)=>{
			account[key] = new_data[key];
		});

		self.requestSaveData();

	} // update


	/**
	 * delete()
	 */
	this.delete = function (user_name) {
		const index   = user_name.toLowerCase();
		const account = self.findByName( user_name );

		if (account === null) {
			throw new Error( 'Can\'t delete user record: Entry "' + user_name + '" not found.' );
		}

		delete self.data.registered[index];

		self.requestSaveData();

	} // delete


	/**
	 * getAccountInfo()
	 */
	this.getAccountInfo = function (name) {
		const account = self.findByName( name );

		if (account == undefined) return null;

		return {
			name        : account.name,
			created     : account.created,
			isAdmin     : account.data.isAdmin || SETTINGS.EVERYONE_IS_ADMIN,
			isOwner     : account.data.isOwner,
			preferences : account.preferences,
		};

	}; // getAccountInfo


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// REGISTRATION
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * prune_pending()
	 */
	async function prune_pending () {
		const new_pending = {};
		const send_cancel = {};
		const now = unix_timestamp();
		let entry_removed = false;

		for (let key in self.data.pending) {
			if (self.data.pending[key].pendingUntil > now) {
				new_pending[key] = self.data.pending[key];
			} else {
				send_cancel[key] = self.data.pending[key];
				entry_removed = true;
			}
		}

		if (entry_removed) {
			self.data.pending = new_pending;
			self.requestSaveData();
		}

		for (let key in send_cancel) {
			const language = send_cancel[key].language;
			const email    = send_cancel[key].email;
			const subject  = REGISTRATION_MAIL.TIMEOUT_SUBJECT[language];
			const body     = REGISTRATION_MAIL.TIMEOUT_BODY[language]
			.trim()
			.replace( /#/, send_cancel[key].name )
			.replace( /#/, send_cancel[key].baseDir )
			;

			send_mail( email, subject, body ).then( (result)=>{
				//...log it?
			}).catch( (error)=>{
				color_log( COLORS.EMAIL, 'EMAIL', error );
			});
		}

	} // prune_pending


	/**
	 * getAvailability()
	 */
	this.getAvailability = function (name) {
		prune_pending();

		const registered = (self.getAccountInfo( name ) !== null);
		const pending    = (self.data.pending[name] != undefined);

		let response = 'available';
		if (registered) response = 'registered';
		if (pending) response = 'pending';

		return response;

	}; // getAvailability


	/**
	 * registration_valid()
	 */
	function registration_valid (name, password, email, base_dir) {
		const name_available = (self.getAvailability( name ) == 'available');
		const password_valid = (password.length >= SETTINGS.ACCOUNTS.PASSWORD_MIN_LENGTH);

		return name_available && password_valid;

	} // registration_valid


	/**
	 * onIsNameRegistered()
	 */
	this.onIsNameRegistered = function (message) {
		chat.sendMessage(
			{
				type : RESPONSE.NAME_AVAILABILITY,
				data : self.getAvailability( message.data ),
			},
			[message.sender],
		);

	}; // onIsNameRegistered


	/**
	 * register()
	 */
	this.register = function (message) {
		const user         = chat.users.findByAddress( message.sender );
		const index        = user.name.toLowerCase();
		const language     = user.client.language;
		const new_name     = message.data.name;
		const new_password = message.data.password;
		const new_email    = message.data.email;
		const base_dir     = message.data.baseDir;

		if (registration_valid(new_name, new_password, new_email, base_dir)) {
			const verification_code = self.sha512Password( new_name, new_password );
			const url
			= base_dir
			+ '/verify.html?lang=' + language
			+ '&name='   + encodeURI( new_name )
			+ '&port='   + HTTPS_OPTIONS.port
			+ '&verify=' + verification_code
			;

			let formatted_code = '';
			for (let i = 0; i < 8; ++i) {
				formatted_code += verification_code.substr( i*16, 16 ) + '\n';
			}
			formatted_code = formatted_code.trim();

			const subject = REGISTRATION_MAIL.REQUEST_SUBJECT[language];
			const body    = REGISTRATION_MAIL.REQUEST_BODY[language]
			.trim()
			.replace( /#/, new_name )
			.replace( /#/, base_dir )
			.replace( /#/, formatted_code )
			.replace( /#/, url )
			;

			send_mail( new_email, subject, body ).then( (result)=>{
				if (DEBUG.REGISTRATION) color_log( COLORS.EMAIL, 'EMAIL', 'Result:', result );

				const pending_until = unix_timestamp() + SETTINGS.ACCOUNTS.PENDING_DAYS * 60*60*24;

				self.data.pending[index] = {
					pendingUntil     : pending_until,
					name             : new_name,
					password         : new_password,
					email            : new_email,
					verificationCode : verification_code,
					language         : language,
					baseDir          : base_dir,
					senderAddress    : message.sender
				};

				self.requestSaveData();

				user.loggedIn = true;
				user.account  = self.data.registered[index];

				chat.sendMessage(
					{
						type : RESPONSE.REGISTER_ACCEPT,
					},
					[message.sender],
				);

				if (DEBUG.REGISTRATION) {
					color_log( COLORS.REGISTRATION, 'REGISTRATION', url );
					color_log( COLORS.REGISTRATION, 'REGISTRATION', self.data.pending );
					//color_log( COLORS.REGISTRATION, 'REGISTRATION', self.data.pending[new_name] );
				}
			}).catch( (error)=>{
				color_log( COLORS.EMAIL, 'EMAIL', error );
			});

		} else {
		}

	}; // register


	/**
	 * onVerify()
	 */
	this.onVerify = function (message) {
		console.log( 'ON VERIFY:', message );

		prune_pending();

		const index = message.data.name.toLowerCase();
		const entry = self.data.pending[index];

		if (entry == undefined) {
			chat.sendMessage(
				{
					type : RESPONSE.REGISTER_ERROR,
				},
				[message.sender],
			);
		} else {
			if (entry.verificationCode != message.data.code) {
			} else {
				self.create(
					entry.name,
					entry.password,
				);

				const address = self.data.pending[index].senderAddress;
				const user = chat.users.findByAddress( address );
				if (user !== null) {
					chat.sendMessage(
						{
							type : RESPONSE.REGISTER_ACCEPT,
						},
						[address],
					);
				}

				delete self.data.pending[index];

				if (DEBUG.REGISTRATION) {
					color_log(
						COLORS.REGISTRATION,
						'REGISTRATION',
						'Account verified and created',
						self.data.registered[index],
					);
				}

				chat.sendMessage(
					{
						type : RESPONSE.REGISTER_COMPLETE,
					},
					[message.sender],
				);
			}
		}

	}; // onVerify


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// AVATAR / SNAPSHOT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * updateAvatar()
	 */
	this.updateAvatar = function (user, data_uri) {
		if (data_uri === null) {
			color_log(
				COLORS.ACCOUNTS,
				'AVATAR',
				'Removing image for ' + user.name
			);
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
				'accounts.js:updateAvatar: Invalid image: Neither jpeg nor png data url'
			);
		} else {
			const image      = Buffer.from( image_data, 'base64' );
			const dimensions = sizeOf( image );

			if( (dimensions.width > SETTINGS.AVATARS.WIDTH)
			||  (dimensions.height > SETTINGS.AVATARS.HEIGHT)
			) {
				console.log( 'AVATAR: Invalid image: Bad dimensions:', dimensions );

			} else {
				color_log(
					COLORS.ACCOUNTS,
					'AVATAR',
					'accounts.js: update_avatar: Accepted new image for ' + user.name
				);
				//...self.update( user.name, { avatar: data_uri } );

			/*
				chat.sendMessage(
					{
						type : RESPONSE.AVATAR_ANNOUNCE,
						data : data_uri,
						user : user.address,
					},
					chat.users.toAll()
				);
			*/

				user.avatar = data_uri;
				chat.users.sendUserListUpdate();
			}
		}

	}; // updateAvatar


	/**
	 * storePreferences()
	 */
	this.storePreferences = function (message) {
		const user    = chat.users.findByAddress( message.sender );
		const account = self.findByName( user.name );

		account.preferences = message.data;

	}; // storePreferences


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = function () {
		if( (SETTINGS.ACCOUNTS.FILE_NAME == undefined)
		||  (SETTINGS.ACCOUNTS.FILE_NAME.indexOf( '/' ) < 0)
		) {
			throw new Error( 'SETTINGS.ACCOUNTS.FILE_NAME invalid: Expecting <path>/<file name>' );
		}

		self.dataWriteRequested = false;
		check_data_write_request();

		return assert_data_file_exists()
		.then( load_user_data )
		.then( (new_data)=>{
			self.data = new_data;

			prune_pending();

			const nr_entries = Object.keys( self.data.registered ).length;
			const plural = (nr_entries == 1) ? '' : 's';

			color_log(
				COLORS.ACCOUNTS,
				'ACCOUNTS',
				'Loaded ' + nr_entries + ' user record' + plural + '.',
			);

			if (DEBUG.ACCOUNT_DATA) {
				color_log(
					COLORS.ACCOUNTS,
					'ACCOUNTS',
					'data =',
					self.data
				);
			}
		});

	}; // init


	// CONSTRUCTOR

	return self.init().then( ()=>self );

}; // Accounts


//EOF