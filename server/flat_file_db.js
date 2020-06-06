// flat_file_db.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const fs     = require( 'fs' );
const path   = require( 'path' );

const { DEBUG, COLORS, color_log } = require( './debug.js' );
const { EXIT_CODES } = require( './constants.js' );
const { unix_timestamp } = require( './helpers.js' );


/**
 * FlatFileDB()
 */
module.exports.FlatFileDB = function (db_file_name, template_data = {}, backup_days = 30, save_data_interval = 1000) {
	const self = this;

	this.data;
	this.dataWriteRequested;


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


		const pos  = db_file_name.lastIndexOf( '/' ) + 1;
		const path = db_file_name.substr( 0, pos );

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
			return fs.promises.access( db_file_name, fs.constants.R_OK | fs.constants.W_OK )
		})
		.catch( async (error)=>{
			if (error.code != 'ENOENT') {
				report_and_die(
					error, 'while trying to access ' + db_file_name,
					EXIT_CODES.ACCOUNTS_ACCESS_FILE,
				);
			} else {
				color_log( COLORS.FLAT_FILE_DB, 'NEW FILE', db_file_name );
				return fs.promises.writeFile( db_file_name, JSON.stringify( template_data ) );
			}
		})
		.catch( (error)=>{
			report_and_die(
				error, 'while trying to create ' + db_file_name,
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
		const pos  = db_file_name.indexOf( '/' ) + 1;
		const path = db_file_name.substr( 0, pos );
		const base = db_file_name.substr( pos );

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

				return (age_in_days >= backup_days);
			})
			.forEach( (file_name)=>{
				unlink_promises.push(
					fs.promises.unlink( path + file_name )
					.then( ()=>{
						color_log(
							COLORS.FLAT_FILE_DB,
							'FLAT_FILE_DB',
							'Pruned: ' + file_name
						);
					})
					.catch( (error)=>{
						color_log(
							COLORS.ERROR,
							'FLAT_FILE_DB',
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
		const backup_file_name = db_file_name + '.' + unix_timestamp();

		return fs.promises
		.rename( db_file_name, backup_file_name )
		.then( ()=>{
			color_log(
				COLORS.FLAT_FILE_DB,
				'FLAT_FILE_DB',
				'Renaming ' + db_file_name + ' --> ' + backup_file_name
			);
		})
		.catch( (error)=>{
			color_log(
				COLORS.ERROR,
				'FLAT_FILE_DB',
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
		.readFile( db_file_name, 'utf8' )
		.then( (new_data)=>{
			color_log(
				COLORS.FLAT_FILE_DB,
				'FLAT_FILE_DB',
				'Read ' + db_file_name
			);

			return JSON.parse( new_data );
		})
		.catch( (error)=>{
			color_log(
				COLORS.ERROR,
				'ERROR',
				'accounts.js: load_user_data: Error while reading file '
				+ db_file_name
			);
			color_log(
				COLORS.ERROR,
				'error:',
				error,
			);
			process.exit( EXIT_CODES.FLAT_FILE_DB_READ_ERROR );
		});

	}; // load_user_data


	/**
	 * save_user_data()
	 */
	async function save_user_data () {
		if (DEBUG.FLAT_FILE_DB) color_log( COLORS.FLAT_FILE_DB, 'FLAT_FILE_DB', 'Executing data write' );

		await prune_backup_files();
		await create_backup();

		const json = JSON.stringify( self.data );

		return fs.promises
		.writeFile( db_file_name, json, 'utf8' )
		.then( ()=>{
			color_log(
				COLORS.FLAT_FILE_DB,
				'FLAT_FILE_DB',
				'Saved ' + db_file_name
			);
		})
		.catch( (error)=>{
			color_log(
				COLORS.ERROR,
				'ERROR',
				'accounts.js: save_user_data: writeFile ' + db_file_name,
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
					save_data_interval
				);
			});
		} else {
			setTimeout(
				check_data_write_request,
				save_data_interval
			);
		}

	} // check_data_write_request


	/**
	 * self.requestSaveData()
	 */
	this.requestSaveData = function (force = false) {
		if (DEBUG.FLAT_FILE_DB) color_log( COLORS.FLAT_FILE_DB, 'FLAT_FILE_DB', 'Data write requested' );

		self.dataWriteRequested = true;

		if (force) {
			return save_user_data();
		}

	} // request_save_user_data


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = function () {
		if( (db_file_name == undefined)
		||  (db_file_name.indexOf( '/' ) < 0)
		) {
			throw new Error( 'db_file_name invalid: Expecting <path>/<file name>' );
		}

		self.dataWriteRequested = false;
		check_data_write_request();

		return assert_data_file_exists()
		.then( load_user_data )
		.then( (new_data)=>{
			self.data = new_data;

			if (DEBUG.FLAT_FILE_DB) {
				color_log(
					COLORS.FLAT_FILE_DB,
					'FLAT_FILE_DB',
					'data =',
					self.data
				);
			}
		});

	}; // init


	// CONSTRUCTOR

	return self.init().then( ()=>self );

}; // FlatFileDB


//EOF