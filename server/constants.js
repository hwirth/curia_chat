// constants.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const os = require( 'os' );
const fs = require( 'fs' );


const PROGRAM_NAME    = 'Curia Chat';
const PROGRAM_VERSION = 'v0.4.17a';


module.exports.PROGRAM_NAME    = PROGRAM_NAME;
module.exports.PROGRAM_VERSION = PROGRAM_VERSION;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PARSE CONFIG FILE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const CONGIGURATION_FILE = '/etc/curia_chat.conf';
const config_file = {};

/**
 * load_configuration()
 */
function load_configuration () {
	const lines = fs
	.readFileSync( CONGIGURATION_FILE, 'utf8' )
	.split( '\n' )
	.filter( (line)=>{
		const pos = (line + '#').indexOf( '#' );
		line = line.substr( 0, pos );
		return (
			(line.trim() != '')
		);
	});

	lines.forEach( (line)=>{
		words = line.replace( /\t/g, ' ' ).split( ' ' );
		const variable = words[0];
		words.shift();
		config_file[variable] = words.join( ' ' ).trim();
	})

}; // load_configuration

load_configuration();


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// SETTINGS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const DEV_SERVER = (os.hostname() == 'labor');

const SETTINGS = {
	DEV_SERVER: DEV_SERVER,

	// Hash for command "/server gainop <password>"
	ADMIN_PASSWORD_HASH:
		((DEV_SERVER)
		?	'f8852b9bd3c02d56318d39d32682cb103e5df0065119a209aacd22278113c5cfb'
			+ 'ebdb8a2d985032a37d360737a8677af32e004e747006885161b0bb37ead5e0e'
		: ''
		),
	ADMIN_PASSWORD_SALT: '',
	EVERYONE_IS_ADMIN: DEV_SERVER,   // If set to true, every user will get user.isAdmin set to true

	REPORT_REMOTE_ERRORS_TO_EVERYONE: DEV_SERVER,   // Send client JS errors to all other connected users

	LOG: {
		FILE_NAME     : '/var/log/curia/chat_server.log',         // File name for log output
		TO_CONSOLE    : (config_file.LOG_TO_CONSOLE == 'true'),   // Whether color_log() outputs to STDOUT
		TO_FILE       : DEV_SERVER,                               // Whether color_log() outputs to file
		MAX_FILE_SIZE : ((true) ? 1000*1000 : null),              // After write, file size will be adjusted
		MAX_DEPTH     : ((DEV_SERVER) ? 3 : 3),                   // null or int, objects log detail
	},

	ALLOWED_URI_CHARS  : 'abcdefghijklmnopqrstuvwxyz0123456789_.?&%=-+/:',    // http server white list
	ALLOWED_NAME_CHARS : 'abcdefghijklmnopqrstuvwxyz1234567890_[]()@-/äöüß',  // Chat name white list

	PING_TIMEOUT: 2000,   // How long clients have to react to a RESPONSE.PING

	ACCOUNTS: {
		FILE_NAME           : 'data/user_data.json',   // Where to save account data
		BACKUP_DAYS         : 30,                      // Delete backup files older that this
		PENDING_DAYS        : 1/24,                    // How long we wait for a verification mail
		CODE_LENGTH         : 128,                     // How many characters the verification hash has
		PASSWORD_MIN_LENGTH : 6,                       // Account not created with password below this length
		SAVE_DATA_INTERVAL  : 1000,                    // How often requested data save is checked
	},

	// Users will automatically "force-join" these rooms. Must at least contain "main_room".
	MANDATORY_ROOMS: [
		{
			name  : 'main_room',      // Keep in sync with client's code!
			topic : 'Landing room',
		},
	/*
		{
			name  : 'yard',
			topic : 'Off topic chat',
		},
		{
			name  : 'class_room',
			topic : 'Heavy learning',
		},
	*/
	],

	AVATARS: {
		ENABLED : true, //!DEV_SERVER,   // Whether to distribute avatar data
		WIDTH   : 100,           // Avatar images have a fixed size. The server will only accept correctly
		HEIGHT  : 100,           // sized images.
	},

	SEND_SNAPSHOT_INTERVAL: 1000,   //... How often the server will send snapshot updates to the client

	// After creating a new account on GMS or GMail, make sure to enable IMAP/POP3/Remote/External access,
	// so Curia Chat can send mails through that account.
	EMAIL: {
		USE_ACCOUNT: 'CONFIGURED',
		ACCOUNTS: {
			CONFIGURED: {
				sender: config_file.EMAIL_SENDER_NAME,
				SMTP: {
					host   : config_file.EMAIL_SMTP_HOST,
					port   : config_file.EMAIL_SMTP_PORT,
					secure : (config_file.EMAIL_SMTP_SECURE == 'true'),
					auth: {
						user: config_file.EMAIL_SMTP_AUTH_USER,
						pass: config_file.EMAIL_SMTP_AUTH_PASS,
					},
					tls: {
						rejectUnauthorized: false,
					},
				},
			},
			GMX: {
				sender: 'Curia Chat <curia@YOUR_DOMAIN.com>',
				SMTP: {
					host   : 'mail.gmx.net',
					port   : 587,
					secure : false,   // use STARTTLS
					auth: {
						user: '',
						pass: '',
					},
					tls: {
						rejectUnautorized: false,
					},
				},
			},
			GMAIL: {
				sender: 'Curia Chat <curia@YOUR_DOMAIN.com>',
				SMTP: {
					host   : 'smtp.gmail.com',
					port   : 587,
					secure : false,   // use STARTTLS
					auth: {
						user: '',
						pass: '',
					},
					tls: {
						rejectUnautorized: false,
					},
				},
			},
		},
	},

	SERVER: {
		CURIA_USER    : config_file.CURIA_USER,
		CURIA_GROUP   : config_file.CURIA_GROUP,
		HTTPS_PORT    : config_file.HTTPS_PORT,
		DOCUMENT_ROOT : config_file.CURIA_ROOT + '/client',
	},

	NOTIFY_OWNER: {
		ENABLED : (config_file.NOTIFY_OWNER_ENABLED == 'true'),
		DOMAIN  : config_file.NOTIFY_OWNER_DOMAIN,
		PATH    : config_file.NOTIFY_OWNER_PATH,
	},

}; // SETTINGS


module.exports.DEV_SERVER = DEV_SERVER;
module.exports.SETTINGS   = SETTINGS;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// FROM CONFIG FILE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const SSL_KEYS = {
	PRIVATE : config_file.SSL_PRIVATE_KEY_FILE,
	PUBLIC  : config_file.SSL_PUBLIC_KEY_FILE,
};


const HTTPS_OPTIONS = {
	key  : fs.readFileSync( SSL_KEYS.PRIVATE ),
	cert : fs.readFileSync( SSL_KEYS.PUBLIC ),
	port : config_file.HTTPS_PORT,                        // 443, if https is running as standalone web server
	//...agent: new https.Agent({ keepalive: true; }),
};


const WSS_OPTIONS = {
	port : config_file.HTTPS_PORT,
};


const TURN_OPTIONS = {
	SERVER_URI         : config_file.TURN_SERVER_DOMAIN + ':' + config_file.TURN_SERVER_PORT,
	LEASE_TIME         : config_file.TURN_LEASE_TIME,
	ALGORITHM          : config_file.TURN_ALGORITHM,
	USER_NAME          : config_file.TURN_USER_NAME,
	SECRET_KEY         : config_file.TURN_SECRET_KEY,
	STATIC_AUTH_SECRET : config_file.TURN_STATIC_SECRET,

}; // TURN_OPTIONS


module.exports.SSL_KEYS      = SSL_KEYS;
module.exports.HTTPS_OPTIONS = HTTPS_OPTIONS;
module.exports.WSS_OPTIONS   = WSS_OPTIONS;
module.exports.TURN_OPTIONS  = TURN_OPTIONS;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// EMAIL TEMPLATES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const REGISTRATION_MAIL = {
	REQUEST_SUBJECT: {
		en: 'Curia Chat registration',
		de: 'Curia Chat Registrierung',
	},
	REQUEST_BODY: {
		en:
//----------------------------------------------------------------------------------------------------------------119:-
`Registration of the name

"#"

was requested on Curia Chat at

#

The verification code is:

#

Copy and paste this code to the form in the chat or use the following link:

#

If you did not request this registration, just ignore
this email.`,
//----------------------------------------------------------------------------------------------------------------119:-
		'de':
//----------------------------------------------------------------------------------------------------------------119:-
`Die Registrierung des Namens

"#"

wurde im Curia Chat auf

#

beantragt. Der Verifizierungscode ist:

#

Kopiere diesen Code in das Formular im Chat oder benutze den folgenden Link:

#

Solltest du die Registrierung nicht beantragt haben,
dann ignoriere diese E-Mail einfach.`,
//----------------------------------------------------------------------------------------------------------------119:-
	},
	TIMEOUT_SUBJECT: {
		en: 'Curia Chat registration canceled',
		de: 'Curia Chat Registrierung abgebrochen',
	},
	TIMEOUT_BODY: {
		en:
//----------------------------------------------------------------------------------------------------------------119:-
`The verification code for registering the name

"#"

was not provided in time and the registration request was canceled.
Feel free to re-request the registration.

#`,
//----------------------------------------------------------------------------------------------------------------119:-
		de:
//----------------------------------------------------------------------------------------------------------------119:-
`Der Verifizierungscode für die Registrierung des Namens

"#"

wurde nicht rechtzeitig gesendet. Die Registrierungsanfrage wurde gelöscht.
Du kannst gerne eine erneute Anforderung stellen.

#`,
//----------------------------------------------------------------------------------------------------------------119:-
	},

}; // REGISTRATION_MAIL


module.exports.REGISTRATION_MAIL = REGISTRATION_MAIL;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MAIN SCRIPT (HTTPS- and WSS SERVER)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const EXIT_CODES = {
	REQUESTED_RESTART       : 1,
	UNKNOWN                 : 2,
	DATA_DIR_NOT_FOUND      : 3,
	FIRST_RUN_DONE          : 4,   // 1..4 need to be in synch with  start_server.sh

	GLOBAL_ERROR_HANDLER    : 4,
	UNDETERMINED_HOST       : 5,
	ACCOUNTS_MKDIR          : 6,
	ACCOUNTS_ACCESS_FILE    : 7,
	ACCOUNTS_CREATE_FILE    : 8,
	FLAT_FILE_DB_READ_ERROR : 9,

}; // EXIT_CODES




// https://www.sitepoint.com/mime-types-complete-list/
const MIME_TYPES = {
	html : 'text/html',
	css  : 'text/css',
	js   : 'application/javascript',
	txt  : 'text/plain',
	png  : 'image/png',
	jpg  : 'image/jpeg',
	jpeg : 'image/jpeg',
	ico  : 'image/x-icon',

}; // MIME_TYPES


module.exports.EXIT_CODES = EXIT_CODES;
module.exports.MIME_TYPES    = MIME_TYPES;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CHAT PROTOCOL
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const REQUEST = {
	CLIENT_INFO         : 'client_info',              // Client tells us its configuration, browser, etc.
	PONG                : 'pong',                     // Client responds to RESPONSE.PING
	NAME_CHANGE         : 'name_change',              // Client wants to set a new name (login/nick change)
	SEND_WELCOME        : 'send_welcome',             // Client wants us to send RESPONSE.WELCOME
	STANDARD_MESSAGE    : 'standard_message',         // Client wants to talk in channel or send a chat command
	VIDEO_CALLEE_READY  : 'video_callee_ready',       // Client is ready to start WebRTC ICE
	SIGNAL              : 'signal',                   // Client wants to send a signal to its WebRTC peer
	UPDATE_AVATAR       : 'update_avatar',            // Client changed profile or is sending a snapshot
	UNLOAD              : 'unload',                   // Client closed the chat web page
	REMOTE_ERROR_REPORT : 'remote_error_report',      // Client encountered a JavaScript error
	STORE_PREFERENCES   : 'store_preferences',        // Client wants to save user preferences in account
	IS_NAME_REGISTERED  : 'is_name_registered',       // Registration form needs to know if name is available
	REGISTER_ACCOUNT    : 'register_account',         // Form filled out, create pending registration
	VERIFY_ACCOUNT      : 'verify_account',           // User got email and sends the verfication code

};  // REQUEST


const RESPONSE = {
	SERVER_INFO           : 'server_info',            // Tell client about certain settings (Avatar size, ...)

	PING                  : 'ping',                   // Client shall respond with REQUEST.PONG
	USER_PONG_SUCCESS     : 'user_pong_success',      // Tell user
	USER_PONG_FAILURE     : 'user_pong_failure',      // Tell user

	CLIENT_CONNECTED      : 'client_connected',       // Announcement
	CLIENT_DISCONNECTED   : 'client_disconnected',    // Announcement
	CLIENT_CLOSED_APP     : 'client_closed_app',      // Announcement

	SERVER_MESSAGE        : 'server_message',         // Feedback of "/server" command
	SYSTEM_MESSAGE        : 'system_message',         // Generic system message (Text response to commands)
	PUBLIC_MESSAGE        : 'public_message',         // Chat message
	PRIVATE_MESSAGE_TO    : 'private_message_to',     // Chat message
	PRIVATE_MESSAGE_FROM  : 'private_message_from',   // Chat message
	ATTENTION_TO          : 'attention_to',           // Tell user
	ATTENTION_FROM        : 'attention_from',         // Tell user

	NAME_CHANGE_ACCEPTED  : 'name_change_accepted',   // Tell user
	NAME_ALREADY_SET      : 'name_already_set',       // Tell user
	NAME_IN_USE           : 'name_in_use',            // Tell user
	NAME_IN_USE_2NAMES    : 'name_in_use_2names',     // Tell user (other user not using same name as account name)
	NAME_INVALID          : 'name_invalid',           // Tell user
	NAME_CHANGE_ANNOUNCE  : 'name_change_announce',   // Announcement

	WELCOME               : 'welcome',                // Let client know about successful login
	STATUS                : 'status',                 // User & account info, current calls

	USER_LIST_UPDATE      : 'user_list_update',       // Tell client who is logged in
	USER_LIST             : 'user_list',              // Response to "/who" command, lists users in room

	ROOM_LIST_UPDATE      : 'room_list_update',       // Tell client existing rooms
	ROOM_LIST             : 'room_list',              // Feedback to user, "/who" command
	ROOM_TOPIC            : 'room_topic',             // Feedback to user, room's topic
	USER_JOINED_ROOM      : 'user_joined_room',       // Announcement
	USER_LEFT_ROOM        : 'user_left_room',         // Announcement
	LAST_USER_LEFT_ROOM   : 'last_user_left_room',    // Announcement
	USER_KICKED           : 'user_kicked',            // Announcement

	VIDEO_INVITE          : 'video_invite',           // Tell client/user
	VIDEO_CANCEL          : 'video_cancel',           // Tell client/user
	VIDEO_REJECT          : 'video_reject',           // Tell client/user
	VIDEO_ACCEPT          : 'video_accept',           // Tell client/user
	VIDEO_HANG_UP         : 'video_hang_up',          // Tell client/user
	VIDEO_CALLEE_READY    : 'video_callee_ready',     // Tell client
	SIGNAL                : 'signal',                 // Tell client

	NAME_AVAILABILITY     : 'name_availability',      // Answer REQUEST.IS_NAME_REGISTERED
	REGISTER_ACCEPT       : 'register_accept',        // Email with verification code was sent
	REGISTER_COMPLETE     : 'register_complete',      // Have the registration form closed in the client
	REGISTER_ERROR        : 'register_error',         // Probably klicked verification link after timeout

	FAILURE               : 'failure',                // Tell user
	REMOTE_ERROR_REPORT   : 'remote_error_report',    // Tell client/user

	EXECUTE_SCRIPT        : 'execute_script',         // Feedback of "/script" or "/exec" command

	DICE_RESULT           : 'dice_result',            // Feedback of "/roll" command
	RPG                   : 'rpg',                    // Feedback of "/rpg" command

}; // RESPONSE


const FAILURE = {
	NOT_LOGGED_IN            : 'not_logged_in',
	PASSWORD_MISMATCH        : 'password_mismatch',

	MESSAGE_TEXT_MISSING     : 'message_text_missing',

	USER_NAME_EXPECTED       : 'user_name_expected',
	USER_NAME_UNKNOWN        : 'user_name_unknown',
	USER_UNNAMED             : 'user_unnamed',

	ROOM_NAME_EXPECTED       : 'room_name_expected',
	USER_ALREADY_IN_ROOM     : 'user_already_in_room',
	CANT_LEAVE_LAST_ROOM     : 'cant_leave_last_room',
	ROOM_NOT_FOUND           : 'room_not_found',
	USER_NOT_IN_ROOM         : 'user_not_in_room',

	NO_PEER_CONNECTION       : 'no_peer_connection',
	HANGUP_NO_CALLS          : 'hangup_no_calls',
	ACCEPT_NOT_INVITED       : 'accept_not_invited',
	REJECT_NOT_INVITED       : 'reject_not_invited',
	CANCEL_NOT_INVITED       : 'cancel_not_invited',
	ACCEPT_NONE_PENDING      : 'accept_none_pending',
	REJECT_NONE_PENDING      : 'reject_none_pending',
	CANCEL_NONE_PENDING      : 'cancel_none_pending',

	INSUFFICIENT_PARAMETERS  : 'insufficient_parameters',
	INSUFFICIENT_PERMISSIONS : 'insufficient_permissions',

	UNKNOWN_COMMAND          : 'unknown_command',

	UNKNOWN_DICE_TYPE        : 'unknown_dice_type',
	RPG                      : 'rpg',

}; // FAILURE


const SERVER_COMMANDS = {
	PING            : 'ping',

	NICK            : 'nick',
	MSG             : 'msg' ,
	HTML            : 'html',
	ATTENTION       : 'attention',

	LIST_USERS      : 'who',
	LIST_ROOMS      : 'rooms',
	TOPIC           : 'topic',
	JOIN_ROOM       : 'join',
	LEAVE_ROOM      : 'leave',
	KICK            : 'kick',

	INVITE          : 'call',
	CANCEL          : 'cancel',
	REJECT          : 'reject',
	ACCEPT          : 'accept',
	STATUS          : 'status',
	HANG_UP         : 'hangup',

	SERVER          : 'server',
	EXECUTE_SCRIPT  : 'script',
	EXECUTE_COMMAND : 'exec',

	ROLL_DICE       : 'roll',
	RPG             : 'rpg',

}; // COMMAND


module.exports.REQUEST                 = REQUEST;
module.exports.RESPONSE                = RESPONSE;
module.exports.FAILURE                 = FAILURE;
module.exports.SERVER_COMMANDS         = SERVER_COMMANDS


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MISCELLANEOUS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const SYSTEM_USER = ':SYSTEM';   // For calling functions not triggered by a client request

const REGISTER_ACTIVITY_ROOMS = [
	RESPONSE.PUBLIC_MESSAGE,
	RESPONSE.NAME_CHANGE_ANNOUNCE,
	RESPONSE.WELCOME,
	//...RESPONSE.USER_KICKED,
	//...RESPONSE.USER_JOINED_ROOM,
	//...RESPONSE.USER_LEFT_ROOM,

]; // REGISTER_ACTIVITY_ROOMS


module.exports.SYSTEM_USER             = SYSTEM_USER;
module.exports.REGISTER_ACTIVITY_ROOMS = REGISTER_ACTIVITY_ROOMS;


//EOF