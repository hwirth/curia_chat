// constants.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

export const PROGRAM_NAME = document.title;
export const PROGRAM_VERSION = 'v0.4.17a';

export const PREFERENCES_FORMAT_VERSION = 3;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DEBUG
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

const ENABLE_DEBUG = !false;

export const DEBUG = {
	ERROR_HANDLER            : ENABLE_DEBUG && false,
	REMOTE_ERRORS_TO_CONSOLE : ENABLE_DEBUG && !false,
	COOKIES                  : ENABLE_DEBUG && false,
	KEY_CODES                : ENABLE_DEBUG && false,

	LOCALIZATION             : ENABLE_DEBUG && false,
	SOUNDS                   : ENABLE_DEBUG && false,

	CHAT_EVENTS              : ENABLE_DEBUG && !false,
	CHAT_CONNECTION          : ENABLE_DEBUG && !false,
	RECONNECT                : ENABLE_DEBUG && false,

	SHOW_MESSAGE             : ENABLE_DEBUG && false,
	MESSAGE_JSON             : ENABLE_DEBUG && false,
	OUTGOING_MESSAGES        : ENABLE_DEBUG && !false,
	INCOMING_MESSAGES        : ENABLE_DEBUG && !false,

	VIDEO_CONNECT            : ENABLE_DEBUG && !false,
	VIDEO_STATES             : ENABLE_DEBUG && !false,
	ICE_CANDIDATES           : ENABLE_DEBUG && false,
	PLAYED_SOUNDS            : ENABLE_DEBUG && false,

	TABS                     : ENABLE_DEBUG && false,
	HISTORY                  : ENABLE_DEBUG && false,
	COMMAND_BUTTONS          : ENABLE_DEBUG && false,
	ROOMS                    : ENABLE_DEBUG && false,

	USER_LIST                : ENABLE_DEBUG && false,

	PREFERENCES              : ENABLE_DEBUG && !false,

	VIDEO_CALL               : ENABLE_DEBUG && !false,
	VIDEO_STREAMS            : ENABLE_DEBUG && !false,
	STILL_PICTURE            : ENABLE_DEBUG && !false,

	AUDIO_ANALYSER           : ENABLE_DEBUG && !false,
	AUTO_COMPLETE            : ENABLE_DEBUG && false,

	INSTANCES                : ENABLE_DEBUG && !false,

}; // DEBUG


export const ERROR = {
	DIALOG_ABORTED : 'canceled dialog',   // Uncaught Promise reject value: Show the fact in the console
	INTERNAL       : '#INTERNAL#',        // Prefix for nice error message composition in prompt...
	USER           : '#USER#',            // ... so we can simply  throw new Error( USER_ERROR + 'message' )
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CHAT GENERAL
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

export const SETTINGS = {
	WINDOW_ANIMATION_TIME : 150,
	SIMPLE_ERROR_HANDLER  : false,

	ERRORS_TO_MAIN_ROOM   : !false,
	LOCALIZE_ROOM_NAMES   : true,

	WEB_SOCKET: {
		URL  : ((location.protocol == 'https:') ? 'wss' : 'ws') + '://' + location.hostname,
		PORT : ((location.protocol == 'https:') ? 443 : 80),
	},

	FORCE_HTTPS: true,

	PUBLIC_IP_URL: '/public_ip',

	AUTO_RECONNECT_SECONDS  : 3,   // null or initial number of seconds to wait before reloading the chat
	CONNECTION_ATTEMPTS     : 10,
	RECONNECT_DELAY_FACTOR  : 3,   // Add this amount of seconds for each successive attempt

	HELP_FILE   : 'manual.html',
	README_FILE : '../README',

	SHOW_PM_PREFIX : false,

	BUTTON_COMMANDS_IMMEDIATE : true,   // false: First put the command in the input, execute on second click.

	NOTIFICATIONS: {
		TIMEOUT   : 17000,
		FADE_TIME : 0.75,
	},

	ENABLE_VIDEO  : !true,

	SOUNDS: {
		VOLUME       : 2,
		SPEED_FACTOR : 0.125,
	},

	REMOTE_VOLUME : 1,
	CLEAR_INPUT   : true,

	COOKIE_SAVE_NICK_ON_LOGIN       : true,
	COOKIE_SAVE_NICK_ON_NAME_CHANGE : false,

	USER_COLORS: {
		MINIMUM  : 80,   // Minimum luminosity
		VARIANCE : 100,   // Range of colors (r, g, b each)
		DISTANCE : 20,    // Multiplier to make colors more distinguishable
	},

	ACCOUNTS: {
		CODE_LENGTH         : 128,
		PASSWORD_MIN_LENGTH : 6,
	},

	AVATARS: {
		ENABLED : false,
		WIDTH   : 100,
		HEIGHT  : 100,
		BG_MODE : ['default', 'topleft', 'average', 'identical'][1],
	},

	SNAPSHOT_INTERVAL : 3000,

	ENABLE_SPEECH_SYNTHESIZER: !true,

}; // SETTINGS


export const CHAT_CONNECTION = {
	INITIALIZING      : 'initializing',
	CONNECTING        : 'connecting',
	CONNECTED         : 'connected',
	DISCONNECTED      : 'disconnected',
	CONNECTION_FAILED : 'connection_failed',
	RECONNECTING      : 'reconnecting',
	LOGIN             : 'login',
	ONLINE            : 'online',
	OFFLINE           : 'offline',
};


export const CHAT_EVENTS = {
	TEXT_TO_SPEECH      : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	SUCCESS             : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	FAILURE             : { blinkIcon: false, blinkTab: false, notify: true,  time: 1, icon: 'EVENT' },
	WARNING             : { blinkIcon: false, blinkTab: false, notify: true,  time: 1, icon: 'EVENT' },
	CLIENT_CONNECTED    : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	CLIENT_DISCONNECTED : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	SYSTEM_MESSAGE      : { blinkIcon: true,  blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	PRIVATE_MESSAGE     : { blinkIcon: true,  blinkTab: true,  notify: true,  time: 1, icon: 'EVENT' },
	MESSAGE_RECEIVED    : { blinkIcon: true,  blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	MESSAGE_SENT        : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	NAME_MENTIONED      : { blinkIcon: true,  blinkTab: true,  notify: true,  time: 1, icon: 'EVENT' },
	NAME_CHANGE         : { blinkIcon: false, blinkTab: false, notify: true,  time: 1, icon: 'EVENT' },
	ATTENTION_REQUEST   : { blinkIcon: true,  blinkTab: true,  notify: true,  time: 1, icon: 'EVENT' },
	DEVICE_ENABLED      : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	DEVICE_DISABLED     : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	CALL_INCOMING       : { blinkIcon: true,  blinkTab: true,  notify: true,  time: 1, icon: 'EVENT' },
	CALL_OUTGOING       : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	CALL_ACCEPTED       : { blinkIcon: false, blinkTab: false, notify: true,  time: 1, icon: 'EVENT' },
	CALL_CANCELED       : { blinkIcon: false, blinkTab: false, notify: true,  time: 1, icon: 'EVENT' },
	CALL_REJECTED       : { blinkIcon: false, blinkTab: false, notify: true,  time: 1, icon: 'EVENT' },
	RINGING_STARTS      : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	RINGING_STOPS       : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },
	HANG_UP             : { blinkIcon: true,  blinkTab: false, notify: true,  time: 1, icon: 'EVENT' },
	RELOADING           : { blinkIcon: false, blinkTab: false, notify: false, time: 1, icon: 'EVENT' },

}; // CHAT_EVENT


export const ROOMS = {
	MAIN             : 'main_room',   // Keep in sync with the server's constant!
	ALL              : ':all',
	CURRENT          : null,
	CURRENT_AND_LOG  : ':current_and_log',
	LOG              : ':log',
	ERRORS           : ':errors',

}; // ROOMS


export const TAB_DEFINITION = {
	':users': {
		domName   : 'ulUserList',
		scrolling : false,
		hideInput : true,
	},
	':preferences': {
		domName   : 'divPreferences',
		scrolling : false,
		hideInput : true,
	},
	':profile': {
		domName   : 'divProfile',
		scrolling : false,
		hideInput : true,
	},
	':manual': {
		domName   : 'divManual',
		scrolling : false,
		hideInput : true,
	},

}; // TAB_DEFINITION


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CHAT PROTOCOL
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

export const REQUEST = {
	CLIENT_INFO         : 'client_info',
	PONG                : 'pong',
	NAME_CHANGE         : 'name_change',
	SEND_WELCOME        : 'send_welcome',
	STANDARD_MESSAGE    : 'standard_message',
	VIDEO_CALLEE_READY  : 'video_callee_ready',
	SIGNAL              : 'signal',
	UPDATE_AVATAR       : 'update_avatar',
	UNLOAD              : 'unload',
	REMOTE_ERROR_REPORT : 'remote_error_report',
	STORE_PREFERENCES   : 'store_preferences',
	IS_NAME_REGISTERED  : 'is_name_registered',
	REGISTER_ACCOUNT    : 'register_account',
	VERIFY_ACCOUNT      : 'verify_account',

}; // REQUEST


export const RESPONSE = {
	SERVER_INFO           : 'server_info',

	PING                  : 'ping',
	USER_PONG_SUCCESS     : 'user_pong_success',
	USER_PONG_FAILURE     : 'user_pong_failure',

	CLIENT_CONNECTED      : 'client_connected',
	CLIENT_DISCONNECTED   : 'client_disconnected',
	CLIENT_CLOSED_APP     : 'client_closed_app',

	SERVER_MESSAGE        : 'server_message',
	SYSTEM_MESSAGE        : 'system_message',
	PUBLIC_MESSAGE        : 'public_message',
	PRIVATE_MESSAGE_TO    : 'private_message_to',
	PRIVATE_MESSAGE_FROM  : 'private_message_from',
	ATTENTION_TO          : 'attention_to',           // Tell user
	ATTENTION_FROM        : 'attention_from',         // Tell user

	NAME_CHANGE_ACCEPTED  : 'name_change_accepted',
	NAME_ALREADY_SET      : 'name_already_set',
	NAME_IN_USE           : 'name_in_use',
	NAME_IN_USE_2NAMES    : 'name_in_use_2names',
	NAME_INVALID          : 'name_invalid',
	NAME_CHANGE_ANNOUNCE  : 'name_change_announce',

	WELCOME               : 'welcome',
	STATUS                : 'status',

	USER_LIST_UPDATE      : 'user_list_update',
	USER_LIST             : 'user_list',

	ROOM_LIST_UPDATE      : 'room_list_update',
	ROOM_LIST             : 'room_list',
	ROOM_TOPIC            : 'room_topic',
	USER_JOINED_ROOM      : 'user_joined_room',
	USER_LEFT_ROOM        : 'user_left_room',
	LAST_USER_LEFT_ROOM   : 'last_user_left_room',
	USER_KICKED           : 'user_kicked',

	VIDEO_INVITE          : 'video_invite',
	VIDEO_CANCEL          : 'video_cancel',
	VIDEO_REJECT          : 'video_reject',
	VIDEO_ACCEPT          : 'video_accept',
	VIDEO_HANG_UP         : 'video_hang_up',
	VIDEO_CALLEE_READY    : 'video_callee_ready',
	SIGNAL                : 'signal',

	NAME_AVAILABILITY     : 'name_availability',
	REGISTER_ACCEPT       : 'register_accept',
	REGISTER_COMPLETE     : 'register_complete',
	REGISTER_ERROR        : 'register_error',          //... only used in verify.html

	FAILURE               : 'failure',
	REMOTE_ERROR_REPORT   : 'remote_error_report',

	EXECUTE_SCRIPT        : 'execute_script',

	DICE_RESULT           : 'dice_result',
	RPG                   : 'rpg',

}; // RESPONSE


export const FAILURE = {
	NOT_LOGGED_IN            : 'not_logged_in',              //
	PASSWORD_MISMATCH        : 'password_mismatch',          //

	MESSAGE_TEXT_MISSING     : 'message_text_missing',       //

	USER_NAME_EXPECTED       : 'user_name_expected',         //
	USER_NAME_UNKNOWN        : 'user_name_unknown',          // name
	USER_UNNAMED             : 'user_unnamed',               //

	ROOM_NAME_EXPECTED       : 'room_name_expected',         //
	USER_ALREADY_IN_ROOM     : 'user_already_in_room',       // roomName
	CANT_LEAVE_LAST_ROOM     : 'cant_leave_last_room',       //
	ROOM_NOT_FOUND           : 'room_not_found',             // roomName
	USER_NOT_IN_ROOM         : 'user_not_in_room',           // roomName

	NO_PEER_CONNECTION       : 'no_peer_connection',         // name
	HANGUP_NO_CALLS          : 'hangup_no_calls',            //
	ACCEPT_NOT_INVITED       : 'accept_not_invited',         // name
	REJECT_NOT_INVITED       : 'reject_not_invited',         // name
	CANCEL_NOT_INVITED       : 'cancel_not_invited',         // name
	ACCEPT_NONE_PENDING      : 'accept_none_pending',        //
	REJECT_NONE_PENDING      : 'reject_none_pending',        //
	CANCEL_NONE_PENDING      : 'cancel_none_pending',        //

	INSUFFICIENT_PARAMETERS  : 'insufficient_parameters',    //
	INSUFFICIENT_PERMISSIONS : 'insufficient_permissions',   //

	UNKNOWN_COMMAND          : 'unknown_command',            // command

	UNKNOWN_DICE_TYPE        : 'unknown_dice_type',          //
	RPG                      : 'rpg'                         //

}; // FAILURE


export const SIGNALS = {
	VIDEO_OFFER   : 'video_offer',
	VIDEO_ANSWER  : 'video_answer',
	CANDIDATE     : 'ice_candidate',
	HANG_UP       : 'hang_up',

	REMOVE_STREAM : 'remove_stream'

}; // SIGNALS


export const CLIENT_COMMANDS = {
	CLEAR             : 'clear',
	HELP              : 'help',
	MANUAL            : 'manual',
	USER_LIST         : 'users',
	USER_PROFILE      : 'profile',
	PREFERENCES       : 'preferences',
	LIST_DEVICES      : 'devices',
	ENABLE_DEVICE     : 'enable',
	DISABLE_DEVICE    : 'disable',
	RTC_STATS         : 'rtcstats',
	AUDIO_ANALYSER    : 'analyser',
	ROTATE_SCREEN     : 'rotate',

	TEST_ERROR        : 'error',
	RESET_PREFERENCES : 'resetprefs',

	ORF_NEWS          : 'orf',

}; // CLIENT_COMMANDS


export const SERVER_COMMANDS = {   // Used in the client only with HELP_TEXT[]
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

}; // SERVER_COMMANDS


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEBRTC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

export const STREAM_SOURCES = {
	CAMERA     : 'camera',
	SCREEN     : 'screen',
	MICROPHONE : 'microphone',
};


export const MEDIA_CONSTRAINTS = {
	WEBCAM: {
		audio: true,
		video: SETTINGS.ENABLE_VIDEO,
		//audio: {
		//	audioGainControl: false,
		//	channelCount: 2,
		//	echoCancellation: true,
		//	noiseSuppression: true,
		//	sampleRate: 44100
    		//},
		//video: {
		//	//width  : { min: 1280, ideal:1280, max:1280 },
		//	//height : { min:  720, ideal: 720, max: 720 },
		//	facingMode: 'user',  // 'environment'
		//	frameRate: { ideal:10, max:15 },
		//},
	},
	XSCREEN: {
		audio: true,
		video: {
			//mediaSource: 'screen',
			//chromeMediaSource: 'screen',
			cursor: 'always',
			//logicalSurface: true,
		},
		//video: {
		//	mandatory: {
		//		chromeMediaSource: 'screen',
		//	},
		//},
	},
	old___CAMERA: {
		video: true,
	},
	CAMERA: {
		video: true,
	},
/*
		video: {
			frameRate: 1000 / SETTINGS.STILL_PICTURE.INTERVAL,
		},
	},
*/
	CAMERA_FACE: {
		video      : true,
		facingMode : 'user',
	},
	CAMERA_ENVIRONMENT: {
		video      : true,
		facingMode : 'environment',
	},
	SCREEN: {
		video: true,
		audio: true,
	},
	MICROPHONE: {
		audio        : true,
		channelCount : 1,
		//	audioGainControl: false,
		//	echoCancellation: true,
		//	noiseSuppression: true,
		//	sampleRate: 44100
	},

}; // MEDIA_CONSTRAINTS


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// USER INTERFACE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

export const ICON_DATA = {
	CURIA:
		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABlUlEQVRYw+1XsU4CQRB9M4d3EiQoKhW'
		+ 'FwS+QwsLGD+APoLAxoaez9i+wpqWg0daGr8DEnp5yzwaSyYXHLifHNWwyyWQyN+/N3M7uLHBa/1gC7Qi0UwZwT6AzgaZrmQm0Vy'
		+ 'ioStQU6EigCwOclYVARypR85DZdgX6IdDVDuCsrNbfdHOBRlqJBToQ6HwPUCZzgQ4ircQh2bYF+i7Q5QGAs7Jcx24z8GkBoEymG'
		+ '9yK4fAF4PNojbTjN/QLzLzvZSLQOwBPBWU+T+F+Qzbjm2H9YOxDY3809oGxDzMtvLG/bj1fCIcL4uOMfmv0mPg44uMlUDd6Snyu'
		+ 'fMEBnBu9sQ+BKiFgiSUkU+vTzEvAgl6SIBHxbwToXgI2oxsSxAWUOiGEvQTOjF4jekLKXgvYnF4CcUCQBukaF5BU7i4QQqBOfBz'
		+ 'Z2F4CbKBICIEq8bHVu85bAaZrQKvW8xJgbdUKOPFaASfq9stIoM8A7gu+in9SuG92CU2OMIxMtgGPjzgNbWRs/0tawrsmBQARaB'
		+ 'ngsDPhy+mRWeb6A7Ay25/Bp6ClAAAAAElFTkSuQmCC',
	ALERT:
		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA5UlEQVRYw+2X3Q2DMAyEfRYb0TEYKgP'
		+ 'ima4P/VEq0RBsQ0vVe4pE4tifcxBE/jqzOAs5CyMxENn8JdDFF0s/TREZ1UcoILT5eB8a3EmcqwWL1T/kpKCRvpuZmFn3GUnxPG'
		+ 'chSZZSKCIUEZZSSJL1nFQCTfS1qme9SajXchG7+l0wMmdObwLd6AOtUC++aZoWx1tjaRp65xpNRe9oBVZxNRIAbsvJRpKG5gdL0'
		+ '9FvjIFd0K+QqCnoru/vDldoBD2A5znwtkJ3R7/iiiGEkvFkcVj1bw7k0PLsEfqOO+GRFsz4mfktXQFjupRkhuqsGQAAAABJRU5E'
		+ 'rkJggg==',
	OFFLINE:
		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB0ElEQVRYw8WXvU4CQRDH/zMgaIRgzo+'
		+ 'KwvgEamFh4wPwBlJY+NVjpYWNTwHUtBTEREtteAo09vaUcxYcZrjc3u4ex3HJJHebvf39d3ZmdhdY80NFwkIgzFUAgY9mA8t3Fv'
		+ 'gy4BaBRwQOIxsRuJUGN5kzlKkUELhD4IkCx21C4A5TKcgNTuBTAvcJPE0Bx21K4H5meInLFQK3CTz2gC5YJjiBmwR+IfBvVrANT'
		+ 'uCmCT5cBuoIn9twzi0rDe8A3pbJDoH0jEEMvnNKfwJfrnDml9ZCROBDAOeeMx+kzLytPsch5Mcl9R6V6hPVfq/az2x5HqXwvP9N'
		+ 'ssDkp2boI+p9Py2laOZd3b/iI6C+WEkT3f5qgQPApmpu+AjYMgioR3CkrPmD+gyyCtDQHT2IBR4HNbIK0JQ95fZnCzwOquoK7yN'
		+ 'gQ71v2/ZzBj/F+ycEnvgI0D9WHKK9ZgPFJuWeBQLpOkR73VDcxBDYVgGBQ7R3DYNXDZ7c9fKAQ7RzWqomvLsLEMixQ7SLwdUHDh'
		+ 'U1eTMi8IVAPlLg1zmcab9CyKf36TWPw0pkg6Tdr1cQXFvvf10Ecuuw5iu4KAFkqXArv66VU+BXhVxODRfGwi6tvE44APwBt7hkW'
		+ 'tzpyS4AAAAASUVORK5CYII=',
	ANON:
		'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAGFBMVEUEBAQuLi5PT09wcHCRkZGwsLD'
		+ 'T09Px8fHVO8igAAAEbklEQVRYw+2Xy3KjOhCGWyRnL7CzNyKZdczF6wm3fWxE1hMj8QIz8PqnhbANAnxZTtXIVUmVk4++6u8G5M'
		+ 'MH/i5ESF4+hoiYMS9/CDlQAFiVDyBigwSQ1/J+ZA+gmbsRbUQx0b1Ib0Qxu/uQsxE8Tn4XcjGC5/UeRLwPEZLfgRzpEIH1HcjHi'
		+ 'JgzYyLV2MicGbgWvDpWeQMZB9+d6AYy8Qvb8wYy8WsmAXA1X7PlhMVmuSQgv4bMhILn5RqynyNMM3AzlEk54WYoKmnlIjIfCp63'
		+ 'RWS/QIy7BhZDcZhrz5qBUSgXx5ywlCKN6UzXwGwoxCvbVj3k4E7FZogcz65Hsm5bBfGiZwbaOUQ+TzYyKRXRNlLwZGOagWn0JCo'
		+ '1oRie+tQwA5NCEgy8bk+MSHzbkMEh0j8uuxAd4hpdA2b0JBwgzYE5zKbjcoJZe5upBOvzJ/awnj1yvp1gRk8GTBKgCfxoz35Mkb'
		+ '6NiROkXx1RhS5xGKVG04AZfdcsXDFNuiVexs9Ns54gVWcCHM+nJOKYgSqhq7LVg1OdpwnSJYyQkPOEWhmGwzckr9umcq8j1Mlk2'
		+ '8T0Ba0I+xV/yuKGFbrKapXcnYolyLtaLiPfXVWw9vjfIlMJUzSuDackX0Fk0zYq/BRjF2nq29cR4qRpEGBjfrVNJkUQMOY6ffkX'
		+ 'EIv5noJKTBWvQkXY9g3EdQPX9tIdOlce1FVh4PSOPS/UhRJfdWCOqS4z4TuMhbE9lmYDATvwfJaJXN38KhNFkNeVvdRj2sprfQi'
		+ 'yIqvRMdmKFLugEX35d/OIlStdKfW9P13M7dJ96VTs6XRVmgtSbMdaDmO1OCMqlt5IsRnleIpIA8EGoEty0SHWQCukJnjfl28zCv'
		+ 'OuZc9AeNFr35yO/eySzM+eNVKqtjm4dDz+TYQpz7RzTVtkHI0wOp5KJuKjQHBtSdYiCbCXg3HCTAQCxwvSstGjohSFa6/3xlQ2p'
		+ 'e+V2aGsGzUtRJo3+GX0YYw+08pTst1h0Emu9PirlR9O9j5O2MSKVcQv6NTR4cU2Qnbj8U4uB/sSGEOMZOlKaQx1XECZqUhYdZfS'
		+ 'mh1839pn7u7q5qgjLlwrO9rjhA0RPZDX4sNi3gasDRaJwir/vIJoHbeEFuG3734KbukyoqcFyTM17EmObep4USp1vzzLKxP5R1G'
		+ 'LwvfD1EU5+xPpUJYQXYC1QGGVIgnxV7PP9+4VpB/iVpmeb/PBk1vXXBZh8oJAdqLAIjT4SYJIMGoufjBdLl4EtmOATYzx5Edn8m'
		+ 'IG0y1xJdFIrBLMi6+9O3kxOyPCv7xN4WXGIq24KKR/WbhCE4nP25v9pm7lu4o4+80uWx2O5xFyGP5JyeU7PLeyPPulH+Zl5QkR8'
		+ 'XB3XaHud0gjY2OntVEbFCIKf/SXlVr6OisVm6zBTolI4dvGJq2G2E+FHOzpAryCua+dSLaf8F8r4tmtee5B+BLe/oKXVrizyOzO'
		+ 'jtL8jUk+0PsRXD4R4Vt44JBoD+uEPoKA7YPjwr/z7xjnfycSa6EjfrV9AAAAAElFTkSuQmCC',

	HELP               : 'images/icons/help.png',
	PROFILE            : 'images/icons/profile.png',
	PREFERENCES        : 'images/icons/settings.png',
	USER_LIST          : 'images/icons/user_list.png',
	WHITE_BOARD        : 'images/icons/white_board.png',
	ENABLE_CAMERA      : 'images/icons/webcam.png',
	ENABLE_SCREEN      : 'images/icons/screen.png',
	ENABLE_MICROPHONE  : 'images/icons/microphone.png',
	DISABLE_CAMERA     : 'images/icons/webcam.png',
	DISABLE_SCREEN     : 'images/icons/screen.png',
	DISABLE_MICROPHONE : 'images/icons/microphone.png',
	MESSAGE            : 'images/icons/message_new.png',
	CALL_START         : 'images/icons/call_accept.png',   //...
	CALL_CANCEL        : 'images/icons/call_cancel.png',
	CALL_REJECT        : 'images/icons/call_reject.png',
	CALL_ACCEPT        : 'images/icons/call_accept.png',
	CALL_HANG_UP       : 'images/icons/call_hangup.png',

	CLOSE_TAB          : 'images/icons/call_cancel.png',//...

	EVENT              : 'images/icons/warning.png',

}; // ICON_DATA


export const COMMAND_BUTTONS = {
	USER_LIST : {
		sortName  : 'aaa1_UserList',
		command   : '/users',
		caption   : 'BTN_USER_LIST_CAPTION',
		title     : 'BTN_USER_LIST_TITLE',
		icon      : 'USER_LIST',
		className : 'option',
	},
	PROFILE : {
		sortName  : 'aaa2_Profile',
		command   : '/profile',
		caption   : 'BTN_PROFILE_CAPTION',
		title     : 'BTN_PROFILE_TITLE',
		icon      : 'PROFILE',
		className : 'option',
	},
	PREFERENCES : {
		sortName  : 'aaa3_Preferences',
		command   : '/preferences',
		caption   : 'BTN_PREFERENCES_CAPTION',
		title     : 'BTN_PREFERENCES_TITLE',
		icon      : 'PREFERENCES',
		className : 'option',
	},
	HELP: {
		sortName  : 'aaa4_Help',
		command   : '/manual',
		caption   : 'BTN_HELP_CAPTION',
		title     : 'BTN_HELP_TITLE',
		icon      : 'HELP',
		className : 'option',
	},

	ENABLE_MICROPHONE : {
		sortName  : 'zzz_device4',
		command   : '/enable microphone',
		caption   : 'BTN_ENABLE_MICROPHONE_CAPTION',
		title     : 'BTN_ENABLE_MICROPHONE_TITLE',
		icon      : 'ENABLE_MICROPHONE',
		className : 'device microphone',
	},
	DISABLE_MICROPHONE : {
		sortName  : 'zzz_device4',
		command   : '/disable microphone',
		caption   : 'BTN_DISABLE_MICROPHONE_CAPTION',
		title     : 'BTN_DISABLE_MICROPHONE_TITLE',
		icon      : 'DISABLE_MICROPHONE',
		className : 'device microphone active',
	},
	ENABLE_CAMERA : {
		sortName  : 'zzz_device3',
		command   : '/enable camera',
		caption   : 'BTN_ENABLE_CAMERA_CAPTION',
		title     : 'BTN_ENABLE_CAMERA_TITLE',
		icon      : 'ENABLE_CAMERA',
		className : 'device camera',
	},
	DISABLE_CAMERA : {
		sortName  : 'zzz_device3',
		command   : '/disable camera',
		caption   : 'BTN_DISABLE_CAMERA_CAPTION',
		title     : 'BTN_DISABLE_CAMERA_TITLE',
		icon      : 'DISABLE_CAMERA',
		className : 'device camera active',
	},
	ENABLE_WHITEBOARD : {
		sortName  : 'zzz_device2',
		command   : '/enable whiteboard',
		caption   : 'BTN_ENABLE_WHITEBOARD_CAPTION',
		title     : 'BTN_ENABLE_WHITEBOARD_TITLE',
		icon      : 'WHITE_BOARD',
		className : 'device whiteboard disabled',
	},
	DISABLE_WHITEBOARD : {
		sortName  : 'zzz_device2',
		command   : '/disable whiteboard',
		caption   : 'BTN_DISABLE_WHITEBOARD_CAPTION',
		title     : 'BTN_DISABLE_WHITEBOARD_TITLE',
		icon      : 'WHITE_BOARD',
		className : 'device whiteboard active disabled',
	},
	ENABLE_SCREEN : {
		sortName  : 'zzz_device1',
		command   : '/enable screen',
		caption   : 'BTN_ENABLE_SCREEN_CAPTION',
		title     : 'BTN_ENABLE_SCREEN_TITLE',
		icon      : 'ENABLE_SCREEN',
		className : 'device screen',
	},
	DISABLE_SCREEN : {
		sortName  : 'zzz_device1',
		command   : '/disable screen',
		caption   : 'BTN_DISABLE_SCREEN_CAPTION',
		title     : 'BTN_DISABLE_SCREEN_TITLE',
		icon      : 'DISABLE_SCREEN',
		className : 'device screen active',
	},

	CALL : {
		sortName  : 'call_Call',
		command   : '/call',
		caption   : 'BTN_CALL_CAPTION',
		title     : 'BTN_CALL_TITLE',
		icon      : 'CALL_START',
		className : 'call',
	},
	CANCEL : {
		sortName  : 'call_Cancel',
		command   : '/cancel',
		caption   : 'BTN_CANCEL_CAPTION',
		title     : 'BTN_CANCEL_TITLE',
		icon      : 'CALL_CANCEL',
		className : 'call',
	},
	REJECT : {
		sortName  : 'call_Reject',
		command   : '/reject',
		caption   : 'BTN_REJECT_CAPTION',
		title     : 'BTN_REJECT_TITLE',
		icon      : 'CALL_REJECT',
		className : 'call',
	},
	ACCEPT : {
		sortName  : 'call_Accept',
		command   : '/accept',
		caption   : 'BTN_ACCEPT_CAPTION',
		title     : 'BTN_ACCEPT_TITLE',
		icon      : 'CALL_ACCEPT',
		className : 'call',
	},
	HANG_UP : {
		sortName  : 'call_HangUp',
		command   : '/hangup',
		caption   : 'BTN_HANG_UP_CAPTION',
		title     : 'BTN_HANG_UP_TITLE',
		icon      : 'CALL_HANG_UP',
		className : 'call',
	},

}; // COMMAND_BUTTONS


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DOM
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

export const DOM = {
	Z_INDEX: {
		DIALOG       : { index: 600, selector: '.dialog'       },
		NOSCRIPT     : { index: 800, selector: null            },
		ERROR_DIALOG : { index: 900, selector: '.dialog.error' },
		SORT_MAX     : { index: 999, selector: null            },
	},

	GATHER_ELEMENTS  : {
		divDpiMeasure            : '#dpi_measure',

		/*
		 * MAIN
		 */
		html                     : 'html',
		head                     : 'head',
		linkFavicon              : '#favicon',
		dynamicStyles            : '#dynamic_styles',
		divNoscript              : 'div.noscript',
		pNoscript                : 'div.noscript p',
		allNoscript              : 'ALL .noscript',

		scriptResponsiveVoice    : '#responsive_voice',

		/*
		 * LOGIN
		 */
		formLogin                : '#login',
		labelLogin               : '#login label',
		inputLoginName           : '#login_name',
		inputLoginPassword       : '#login_password',
		buttonLogin              : '#login button',

		/*
		 * SEND TEXT
		 */
		formInput                : '#inputs',
		inputName                : '#name',
		inputText                : '#text',
		buttonSend               : '#send',

		/*
		 * CHAT
		 */
		h1Title                  : '#title',
		smallVersion             : '#version',

		divVideos                : '#videos',
		divVideosResizer         : '#videos .resizer',

		divTabs                  : '#tabs',
		divTabPages              : '#pages',

		divCommands              : '#commands',
		divCommandsResizer       : '#commands .resizer',

		divHiddenContent         : '#hidden_content',
		ulUserList               : '#user_list',

		/*
		 * NOTIFICATIONS
		 */
		ulNotifications          : '#notifications',

		/*
		 * PREFERENCES
		 */
		divPreferences           : '#preferences',
		ulPreferencesMenu        : '#preferences ul.menu',
		btnPreferencesEdit       : '#btnPreferencesEdit',
		btnPreferencesEvents     : '#btnPreferencesEvents',

		/* EDIT */
		formPreferencesEdit      : '#preferences_edit',
		h2PreferencesEdit        : '#preferences_edit h2',
		rngMasterVolume          : '#rngMasterVolume',
		rngNotificationTimeout   : '#rngNotificationTimeout',
		cbxAutoEmbed             : '#cbxAutoEmbed',
		cbxSystemLog             : '#cbxSystemLog',
		cbxRemoteErrors          : '#cbxRemoteErrors',
		labelMasterVolume        : 'label[for=rngMasterVolume]',
		labelNotificationTimeout : 'label[for=rngNotificationTimeout]',
		labelAutoEmbed           : 'label[for=cbxAutoEmbed]',
		labelSystemLog           : 'label[for=cbxSystemLog]',
		labelRemoteErrors        : 'label[for=cbxRemoteErrors]',
		submitPreferencesEdit    : '#submitPreferencesEdit',

		/* EVENTS */
		formPreferencesEvents    : '#preferences_events',
		h2PreferencesEvents      : '#preferences_events h2',
		tablePreferencesEvents   : '#preferences_events .preferences',
		submitPreferencesEvents  : '#submitPreferencesEvents',


		/*
		 * PROFILE
		 */
		divProfile               : '#profile',
		ulProfileMenu            : '#profile ul.menu',
		btnProfileAvatar         : '#btnProfileAvatar',
		btnProfileEdit           : '#btnProfileEdit',
		btnProfileRegister       : '#btnProfileRegister',

		/* AVATAR */
		formProfileAvatar        : '#profile_avatar',
		h2ProfileAvatar          : '#profile_avatar h2',
		imgAvatar                : '#imgProfileAvatar',
		fileAvatar               : '#fileProfileAvatar',
		btnAvatarClear           : '#btnAvatarClear',
		btnAvatarRestore         : '#btnAvatarRestore',
		rngAvatarZoom            : '#rngAvatarZoom',
		rngAvatarOffsetX         : '#rngAvatarOffsetX',
		rngAvatarOffsetY         : '#rngAvatarOffsetY',
		btnAvatarZoomFill        : '#btnAvatarZoomFill',
		btnAvatarZoomFull        : '#btnAvatarZoomFull',
		colorAvatarBg            : '#colorAvatarBg',
		labelAvatarZoom          : 'label[for=rngAvatarZoom]',
		labelAvatarOffsetX       : 'label[for=rngAvatarOffsetX]',
		labelAvatarOffsetY       : 'label[for=rngAvatarOffsetY]',
		labelAvatarZoomFill      : 'label[for=btnAvatarZoomFill]',
		labelAvatarZoomFull      : 'label[for=btnAvatarZoomFull]',
		labelAvatarColorBg       : 'label[for=colorAvatarBg]',
		submitProfileAvatar      : '#submitProfileAvatar',

		/* EDIT */
		formProfileEdit          : '#profile_edit',
		h2ProfileEdit            : '#profile_edit h2',
		submitProfileEdit        : '#submitProfileEdit',

		/* REGISTER */
		formRegisterProfile      : '#profile_register',
		h2ProfileRegister        : '#profile_register h2',
		labelRegisterName        : 'label[for=txtRegisterName]',
		labelRegisterAvailable   : 'label[for=spanRegisterAvailable]',
		labelProfileVerify       : 'label[for=txtRegisterVerify]',
		labelRegisterPassword1   : 'label[for=pwdRegisterPassword1]',
		labelRegisterPassword2   : 'label[for=pwdRegisterPassword2]',
		labelRegisterStrength    : 'label[for=spanRegisterStrength]',
		labelRegisterEmail       : 'label[for=txtRegisterEmail]',
		txtRegisterName          : '#txtRegisterName',
		spanRegisterAvailable    : '#spanRegisterAvailable',
		txtRegisterVerify        : '#txtRegisterVerify',
		btnRegisterVerify        : '#btnRegisterVerify',
		pwdRegisterPassword1     : '#pwdRegisterPassword1',
		pwdRegisterPassword2     : '#pwdRegisterPassword2',
		spanRegisterStrength     : '#spanRegisterStrength',
		txtRegisterEmail         : '#txtRegisterEmail',
		spanRegisterEmailHint    : '#spanRegisterEmailHint',
		submitRegisterAccount    : '#submitRegisterAccount',

		divManual                : '#manual',

		divStatus                : '#status',
	},

	GATHER_VARIABLES: {
		notificationFadeTime: 'notification-fade-time',
	},

	GET_DEFAULTS: {
		//renderer: 'shadows',
	},

}; // DOM


//EOF