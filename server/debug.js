// debug.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const fs   = require( 'fs' );
const util = require( 'util' );

const { DEV_SERVER, SETTINGS } = require( './constants.js' );


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTANTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const DEBUG_ENABLED = !false;

/**
 * DEBUG
 * Flags controlling, what is logged and to which extent the output should contain details.
 */
const DEBUG = {
	/*
	 * What to log
	 */
	PROGRAM_FLOW     : DEBUG_ENABLED && !false,
	DATA_TRANSMITTED : DEBUG_ENABLED && false,

	HTTP_GET_ALL     : DEBUG_ENABLED && !false,   // Log all GET requests
	HTTP_GET_ROOT    : DEBUG_ENABLED && !false,   // Log GET / requests
	WHOIS            : DEBUG_ENABLED && !false,   // Log WHOIS info for every connecting client

	FLAT_FILE_DB     : DEBUG_ENABLED && false,   // Flat file manager

	REQUESTS         : DEBUG_ENABLED && !false,   // Incoming message meta data
	RESPONSES        : DEBUG_ENABLED && !false,   // Outgoing message
	ROOMS            : DEBUG_ENABLED && !false,   // Joins/leaves
	ACCOUNTS         : DEBUG_ENABLED && !false,   // Persistent user data
	REGISTRATION     : DEBUG_ENABLED && !false,   // Account registration and verification requests
	EMAIL            : DEBUG_ENABLED && false,    // Mails sent by the server
	NOTIFY_OWNER     : DEBUG_ENABLED && !false,   // HTTP request to my home server, if someone logs in


	/*
	 * Details
	 */
	ACCOUNT_DATA     : DEBUG_ENABLED && false,    // Show loaded data on server start
	RESPONSE_DATA    : DEBUG_ENABLED && false,    // Outgoing message meta data
	MESSAGE_DATA     : DEBUG_ENABLED && false,    // Message content
	ROOM_DATA        : DEBUG_ENABLED && false,    // Associated room object
	USER_DATA        : DEBUG_ENABLED && false,    // Associated user object

	RPG              : DEBUG_ENABLED && !false,

}; // DEBUG


/**
 * ANSI_COLORS
 * Reservoir of ANSI-escape codes to create colored output on the console
 */
const ANSI_COLORS = {
	RESET   : '\x1b[0m',
	BRIGHT  : '\x1b[1m',
	DIM     : '\x1b[2m',
	BLACK   : '\x1b[30m',
	RED     : '\x1b[31m',
	GREEN   : '\x1b[32m',
	YELLOW  : '\x1b[33m',
	BLUE    : '\x1b[34m',
	MAGENTA : '\x1b[35m',
	CYAN    : '\x1b[36m',
	WHITE   : '\x1b[37m',

}; // ANSI_COLORS


/**
 * COLORS
 * Actual colors used with  color_log()
 */
const COLORS = {
	DEFAULT      : ANSI_COLORS.WHITE + ANSI_COLORS.BRIGHT,
	RUNNING_AS   : ANSI_COLORS.YELLOW + ANSI_COLORS.BRIGHT,
	EXIT         : ANSI_COLORS.RED + ANSI_COLORS.BRIGHT,
	ERROR        : ANSI_COLORS.RED + ANSI_COLORS.BRIGHT,
	WARNING      : ANSI_COLORS.YELLOW + ANSI_COLORS.BRIGHT,
	HTTPS        : ANSI_COLORS.WHITE + ANSI_COLORS.DIM,
	SOCKET       : ANSI_COLORS.YELLOW,
	FLAT_FILE_DB : ANSI_COLORS.YELLOW,
	ADDRESS      : ANSI_COLORS.GREEN,
	MESSAGE      : ANSI_COLORS.BLUE + ANSI_COLORS.BRIGHT,
	RESPONSE     : ANSI_COLORS.GREEN + ANSI_COLORS.BRIGHT,
	NOTIFY_OWNER : ANSI_COLORS.YELLOW,
	ROOM         : ANSI_COLORS.MAGENTA,
	ACCOUNTS     : ANSI_COLORS.CYAN + ANSI_COLORS.DIM,
	USERS        : ANSI_COLORS.CYAN,
	SNAPSHOT     : ANSI_COLORS.CYAN + ANSI_COLORS.DIM,

	REGISTRATION : ANSI_COLORS.YELLOW + ANSI_COLORS.BRIGHT,
	EMAIL        : ANSI_COLORS.YELLOW + ANSI_COLORS.BRIGHT,

	RPG          : ANSI_COLORS.CYAN + ANSI_COLORS.BRIGHT,

	WEIRD        : ANSI_COLORS.MAGENTA + ANSI_COLORS.BRIGHT,
	RESET        : ANSI_COLORS.RESET,

}; // COLORS


module.exports.DEBUG         = DEBUG;
module.exports.COLORS        = COLORS;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// HELPERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * color_log
 * Creates nice output to the console while debugging, and/or writes text sans color to a log file.
 * See also  constants.js: SETTINGS.LOG.*
 */
function color_log (colors, heading, ...text) {
	const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ';

	util.inspect.defaultOptions.depth = SETTINGS.LOG.MAX_DEPTH;

	if (SETTINGS.LOG.TO_CONSOLE) {
		const colored_heading
		= (heading.slice(-1) == ':')
		? heading.slice( 0, -1 ) + COLORS.RESET + ':'
		: heading + COLORS.RESET
		;

		console.log( date + colors + colored_heading, ...text, COLORS.RESET );
	}

	if (SETTINGS.LOG.TO_FILE) {
		try {
			const file_name = SETTINGS.LOG.FILE_NAME;
			const pos  = file_name.lastIndexOf( '/' );
			const path = file_name.substr( 0, pos + 1 );

			fs.existsSync( path ) || fs.mkdirSync( path, { recursive: true } );

			let data = date + heading;

			[...text].forEach( (entry)=>{
				if (typeof entry == 'string') {
					entry = entry.replace( /\x1b\[[0-9;]*m/g, '' );
				}

				data += JSON.stringify( entry, null, '\t' ) + '\n';
			});

			fs.appendFileSync( file_name, data );

			if (SETTINGS.LOG.MAX_FILE_SIZE !== null) {
				const size = fs.statSync( file_name ).size;

				if (size > SETTINGS.LOG.MAX_FILE_SIZE) {
					const truncated_log
					= fs
					.readFileSync( file_name )
					.toString()
					.substr( SETTINGS.LOG.MAX_FILE_SIZE / 2 )
					;

					fs.writeFileSync(
						file_name,
						'\n*** TRUNCATED: ' + date + '\n' + truncated_log
					);
				}
			}

		} catch (error) {
			console.log( 'ERROR: Log to file failed:', error );
		}

	}

} // color_log


module.exports.color_log = color_log;


//EOF