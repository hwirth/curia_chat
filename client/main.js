// main.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from './helpers.js'
import { PROGRAM_NAME, PROGRAM_VERSION, DOM, SETTINGS, DEBUG, ROOMS, REQUEST } from './constants.js';
import { check_browser_language, set_language, localized, localized_room_name } from './localize.js';
import { ChatClient } from './chat_client.js';


/**
 * Application()
 */
export const Application = function (GET_parameters, dom_elements, css_variables, preload_items) {
	const self = this;

	this.dom;
	this.css;
	this.GET;

	this.hardErrorCount;
	this.softErrorCount;
	this.chat;


	/**
	 * onError()
	 */
	this.onError = function (event) {
		var file_name, line_nr, col_nr, stack;

console.groupCollapsed( '%cApplication.onError()', 'color:#800' );
console.log( event );
console.groupEnd();

		++self.hardErrorCount;

		/**
		 * extract_error_position
		 */
		function extract_error_position (stack) {
			if ((stack == undefined) || (stack == '')) return;

			if (DEBUG.ERROR_HANDLER) {
				console.log( 'onError: Evaluating stack' );
			}

			stack
			= stack
			.replace( /\(/g, '' )
			.replace( /\)/g, '' )
			;

			var lines;

			if (stack.indexOf( ' at ') < 0) {
				lines = stack.split( '\n' );
			} else {
				lines = stack.split( ' at ' );
			}

			if (DEBUG.ERROR_HANDLER) {
				console.groupCollapsed( 'onError: Stack lines' );
				lines.forEach( (line)=>console.log( line ) );
				console.groupEnd();
			}

			let error_location = lines.find( (line)=>{
				//return (line.substr( 0, 4 ) == 'http');
				return (line.indexOf('http') >= 0);
			});

if (error_location == undefined) return;

			const pos = error_location.indexOf( 'http' );
			if (pos > 0) error_location = error_location.substr( pos );


			error_location = error_location.trim().replace( '://', '###COLONSLASHSLASH###' );
			const parts = error_location.split( ':' );
			file_name = parts[0].replace( '###COLONSLASHSLASH###', '://' );
			line_nr   = parts[1];
			col_nr    = parts[2];

			if (DEBUG.ERROR_HANDLER) console.log( 'onError: From stack:', line_nr, col_nr );

		} // extract_error_position


		if (DEBUG.ERROR_HANDLER) console.log( 'onError:', event );

		if (SETTINGS.SIMPLE_ERROR_HANDLER) {
			if (DEBUG.ERROR_HANDLER) console.log( 'onError: simple error handler' );

			let stack = null;
			if (event.reason) stack = event.reason.stack;
			if (event.error)  stack = event.error.stack;

			if (stack !== null) {
				console.trace();
			} else {
				console.log( stack );
			}

		} else {
			var message;

			if (event.filename != undefined) file_name = event.filename;
			if (event.lineno   != undefined) line_nr   = event.lineno;
			if (event.colno    != undefined) col_nr    = event.colno;

			message = 'Failed at failing';

			if (event.error != undefined) {
				if (DEBUG.ERROR_HANDLER) console.log( 'onError: Found event.error' );

				message = event.error.message;

				if( (file_name == undefined)
				||  (line_nr == undefined)
				||  (col_nr == undefined)
				) {
					console.log( 'Stack:' + event.error.stack );
				}
			}
			else if (event.reason != undefined) {
				if (event.reason.message != undefined) {
					if (DEBUG.ERROR_HANDLER) {
						console.log(
							'onError: Found event.reason.message:',
							line_nr,
							col_nr,
						);
					}

					message   = event.reason.message;
					file_name = event.reason.fileName;
					line_nr   = event.reason.lineNumber;
					col_nr    = event.reason.columnNumber;

					if (DEBUG.ERROR_HANDLER) {
						console.log(
							'onError:',
							line_nr,
							col_nr,
						);
					}

					if( (col_nr == undefined) &&  (event.reason.stack != undefined)) {
						extract_error_position( event.reason.stack );

						if( (file_name == undefined)
						||  (line_nr == undefined)
						||  (col_nr == undefined)
						) {
							console.log( 'Stack:' + event.reason.stack );
						}
					}
				} else {
					if (DEBUG.ERROR_HANDLER) console.log( 'onError: reason.message undefined' );

					message = event.reason;
				}
			}
			else if (event.message) {
				message = event.message;
			}

			if (file_name != undefined) {
				const parts = file_name.split( '/' );
				parts[parts.length - 1] = '<b>' + parts[parts.length - 1] + '</b>';
				file_name = '<br>in file: ' + parts.join( '/' );
			}

			if ((line_nr  != undefined) && !isNaN(line_nr )) {
				line_nr = '<br>in line: <b>' + line_nr + '</b>';
			}
			if ((col_nr   != undefined) && !isNaN( col_nr )) {
				col_nr = ', column: <b>' + col_nr + '</b>';
			}


			message += file_name + line_nr + col_nr;

			const message_text
			= message
			.replace( /<br>/g,  '\n' )
			.replace( /<b>/g,   '' )
			.replace( /<\/b>/g, '' )
			;

			console.groupCollapsed(
				'%cERROR%c:',
				'color:red', 'color:black',
				message_text
			);
			console.log( event );
			console.log( stack );
			console.trace();
			console.groupEnd();

			const p_noscript = document.querySelector( '.noscript p' );
			if (p_noscript !== null) {
				p_noscript.innerHTML = '<strong>Error</strong><br>' + message;
				p_noscript.classList.add( 'error' );
			}

			if (SETTINGS.ERRORS_TO_MAIN_ROOM) {
				if (self.chat != undefined) {
					self.chat.ui.addTab(
						ROOMS.ERRORS,
						localized_room_name( ROOMS.ERRORS ),
						null,
						/*activate*/false,
					);
					self.chat.showMessage( message, ROOMS.ERRORS, 'internal_error' );
					self.chat.sendMessage(
						REQUEST.REMOTE_ERROR_REPORT,
						{
							browser : Helpers.getBrowserName(),
							sender  : self.chat.name,
							error   : message,
						}
					);
				}
			} else {
				Helpers.showErrorMessage( message );
			}


			if (! DEBUG.LOG_ERRORS) event.preventDefault();
		}

	}; // onError


	/**
	 * setTitle()
	 */
	this.setTitle = function (text = null) {
		document.title
		= ((text === null) ? '' : text + ' - ')
		+ PROGRAM_NAME
		+ ' '
		+ Helpers.greekVersion( PROGRAM_VERSION, /*use_unicode*/true )
		;

	}; // setTitle


	/**
	 * init()
	 */
	this.init = async function (GET_parameters, dom_elements, css_variables, preload_items) {
		window.APP = self;

		self.hardErrorCount = 0;
		self.softErrorCount = 0;

		self.dom = dom_elements;
		self.css = css_variables;
		self.GET = GET_parameters;

		self.setTitle();
		self.dom.h1Title.innerHTML = PROGRAM_NAME + ' - ' + Helpers.greekVersion( PROGRAM_VERSION );
		console.log( '%c*** ' + document.title + ' ***', 'font-weight:bold; color:black' );

		check_browser_language();
		if (self.GET.lang != undefined) {
			set_language( self.GET.lang );
		}

		addEventListener( 'error', (error)=>self.onError( error ) );
		addEventListener( 'unhandledrejection', (rejection)=>self.onError( rejection ) );

		Helpers.upgradeDOM( self );

		const href = window.location.href;
		const end = href.indexOf( '/', 'https://'.length+1 );
		const domain = href.substr( 0, end ).replace( 'https://', '' ).replace( 'http://', '' );
		SETTINGS.SERVER_NAME = domain;

		if (window.location.protocol == 'https:') {
			if (domain.substr(-5) == SETTINGS.WEB_SOCKET_URL) {
				SETTINGS.WEB_SOCKET_URL = 'wss://' + domain;
			} else {
				SETTINGS.WEB_SOCKET_URL = 'wss://' + domain + SETTINGS.WEB_SOCKET_URL ;
			}
		} else {
			window.location.href = window.location.href.replace( 'http', 'https' );
			return;
		}

		const dark_mode
		= Helpers.isDarkModeEnabled()
		? 'Dark mode'
		: 'Light mode'
		;

		console.log( 'SETTINGS.WEB_SOCKET_URL', SETTINGS.WEB_SOCKET_URL );
		console.groupCollapsed( 'Device Info (' + dark_mode + ')' );
		console.table( Helpers.getDeviceInfo() );
		console.groupEnd();

		addEventListener( 'orientationchange', ()=>{
			console.log( 'Screen orientation changed:', screen.orientation.angle );
		});

		self.chat = new ChatClient( self );

		/*
		 * Remove splash screen
		 */
		self.dom.allNoscript.forEach( (element)=>{
			document.body.removeChild( element );
		});

	}; // init


	// CONSTRUCTOR

	self.init( GET_parameters, dom_elements, css_variables, preload_items );

}; // Application


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PROGRAM ENTRY POINT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * onLoad
 */
addEventListener("load", async ()=>{
	//const preload_items = await new PreloadItems();
	const preload_items = null;

	var click_handler, keydown_handler;

	function start () {
		if (SETTINGS.WAIT_FOR_CLICK) {
			//document.body.removeEventListener( "click", start );
			document.body.removeEventListener( "keydown", start );
		}

		window.APP = new Application(
			(function GET_parameters () {
				const result = {};
				Object.keys( DOM.GET_DEFAULTS ).forEach( (key)=>{
					result[key] = DOM.GET_DEFAULTS[key];
				});
				const query = window.location.href.split( "?" )[1];
				if (query) query.split("&").forEach( (parameter)=>{
					const parts = parameter.split( "=" );
					const param_name = parts[0];
					//const default_value = DOM.GET_DEFAULTS[param_name];
					result[parts[0]] = parts[1] || null;
				});

				return result;

			}) (),

			(function gather (dom_elements) {
				const result = {};
				Object.keys( dom_elements ).forEach( (entry)=>{
					let selector = dom_elements[entry];
					if (selector.substr( 0, 4 ) == "ALL ") {
						result[entry] = document.querySelectorAll( selector.substr( 4 ) );
					} else {
						result[entry] = document.querySelector( selector );
					}
				});
				return result;

			}) (DOM.GATHER_ELEMENTS),

			(function gather (css_variables) {
				const result = {};
				Object.keys( css_variables ).forEach( (entry)=>{
					result[entry] = Helpers.getCSSVariable( DOM.GATHER_VARIABLES[entry] );
					if (!isNaN( result[entry] )) result[entry] = parseFloat( result[entry] );
				});
				return result;

			}) (DOM.GATHER_VARIABLES),
			preload_items,
		);
	}

	//start();

	if (SETTINGS.WAIT_FOR_CLICK) {
		const divNoscript = document.querySelector( "div.noscript" );
		divNoscript.innerHTML = HINTS_HTML; //"Click or press a key to start";
		click_handler   = document.body.addEventListener( "click", start );
		keydown_handler = document.body.addEventListener( "keydown", start );
	} else {
		start();
	}


}); // onLoad


//EOF