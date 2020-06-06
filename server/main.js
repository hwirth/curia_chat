// curia_server.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// Debian:
// apt install nodejs npm
// cd <curia_dir>
// npm install ws follow-redirects
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// [Unit]
// Description=Curia Chat Websocket
//
// [Service]
// Type=simple
// ExecStart=/var/www/clients/client1/web5/web/stubs/web_rtc/chat/server/start_server.sh
//
// [Install]
// WantedBy=network.target
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// ufw allow 3443
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// https://nodejs.dev/
// https://nodejs.org/

console.time( '| READY. Boot time' );

const os         = require( 'os' );
const fs         = require( 'fs' );
const path       = require( 'path' );
const http       = require( 'follow-redirects' ).http;
const https      = require( 'https' );
const WebSocket  = require( 'ws' );

const {
	DEBUG,
	COLORS,
	color_log

} = require( './debug.js' );


const {
	PROGRAM_NAME, PROGRAM_VERSION,
	EXIT_CODES, SETTINGS, ALLOWED_URI_CHARS,
	SSL_KEYS, MIME_TYPES, HTTPS_OPTIONS, WSS_OPTIONS,

} = require( './constants.js' );


const { ChatServer } = require( './chat_server.js' );


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// INIT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * init()
 */
async function init () {
	console.log( '.' + '-'.repeat(78) );
	console.log( '| ' + PROGRAM_NAME + ' - ' + PROGRAM_VERSION + ' - https/wss server starting' );
	console.log( '|' + '-'.repeat(78) );
	console.log( '| HOST NAME         ', os.hostname() );
	console.log( '| PORT              ', HTTPS_OPTIONS.port );
	console.log( '| PRIVATE KEY       ', SSL_KEYS.PRIVATE );
	console.log( '| PUBLIC KEY        ', SSL_KEYS.PUBLIC );
	console.log( '| DOCUMENT_ROOT     ', SETTINGS.SERVER.DOCUMENT_ROOT );
	console.log( '| LOG TO CONSOLE    ', SETTINGS.LOG.TO_CONSOLE );
	console.log( '| LOG TO FILE       ', SETTINGS.LOG.TO_FILE, SETTINGS.LOG.FILE_NAME );
	console.log( '| LOG MAX FILE SIZE ', Math.round( SETTINGS.LOG.MAX_FILE_SIZE / 1024 ), 'K' );
	console.log( '| LOG MAX DEPTH     ', SETTINGS.LOG.MAX_DEPTH );
	console.log( "'" + '-'.repeat(78) );
	//process.argv.forEach( (value, index)=>console.log( index + ': ' + value ) );


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// HTTPS SERVER
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	const https_server = https.createServer( HTTPS_OPTIONS ).listen( HTTPS_OPTIONS.port );

	let on_chat_verify = function () {};

	https_server.on( 'request', (request, response)=>{

		function return_http_error (response, code) {
			response.statusCode = code;
			response.end( '<h1>' + code + '</h1><p>' + http.STATUS_CODES[code] );

		} // return_http_error


		if ( DEBUG.HTTP_GET_ALL || (DEBUG.HTTP_GET_ROOT && (request.url == '/')) ) {
			color_log( COLORS.HTTPS, 'GET', request.url );
		}

		if (request.url == '/public_ip') {
			response.setHeader( 'Content-Type', MIME_TYPES.txt + '; charset=utf8' );
			response.writeHead( 200 );
			response.end( request.connection.remoteAddress );

			return;
		}

		if (request.url.substr( 0, 8 ) == '/verify?') {
			on_chat_verify( request.url )
		}

		let request_url_tainted = request.url;
		let request_url_clean = '';
		for (let i = 0; i < request_url_tainted.length; ++i) {
			const char = request_url_tainted[i].toLowerCase();
			if (SETTINGS.ALLOWED_URI_CHARS.indexOf(char) >= 0) {
				request_url_clean += char;
			}
		}

		if (request_url_clean != request_url_tainted) {
			color_log( COLORS.ERROR, 'ERROR', 'Invalid URL: ' + request_url_tainted );
			return_http_error( response, 404 );
			return;
		}

		const file_name
		= SETTINGS.SERVER.DOCUMENT_ROOT
		+ ((request_url_clean == '/') ? '/index.html' : request_url_clean)
		;

		if (! fs.existsSync( file_name )) {
			color_log( COLORS.ERROR, 'ERROR', 'File not found: ' + file_name );
			return_http_error( response, 404 );
			return;
		}

		fs.stat( file_name, (error)=>{
			if (error !== null) {
				color_log( COLORS.ERROR, 'ERROR', error.code );
				return_http_error( response, 404 );
				return;
			}
		});

		if (! fs.statSync( file_name ).isFile()) {
			color_log( COLORS.ERROR, 'ERROR', 'Not a file ' + file_name );
			return_http_error( response, 404 );
			return;
		}

		fs.readFile( file_name, (error, data)=>{
			if (error) {
				console.log( error );
				return;
			} else {
				const file_extension = path.extname( file_name ).substr( 1 );
				let mime_type = MIME_TYPES[file_extension];
				if (mime_type == undefined) mime_type = 'text/plain';

				response.setHeader( 'Content-Type', mime_type + '; charset=utf8' );
				response.writeHead( 200 );
				response.end( data );
			}
		});

	}); // https_server.onRequest


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB SOCKET
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

//...if (/*client !== socket && */ client.readyState === WebSocket.OPEN) {
//...client_ip_address = request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];

	const wss_server = new WebSocket.Server({
		noServer: true,
		//...port : WSS_OPTIONS.port,
		//...server : https_server,
	});

	var chat_server;

	try {
		process.setgid( SETTINGS.SERVER.CURIA_GROUP );
		process.setuid( SETTINGS.SERVER.CURIA_USER );

		const after = os.userInfo();

		color_log(
			COLORS.RUNNING_AS,
			'PRIVILEGES DROPPED:',
			'User:', COLORS.RUNNING_AS + after.username + COLORS.DEFAULT,
			'UID:',  after.uid,
			'GID:',  after.gid,
		);

		chat_server = await new ChatServer( wss_server );
		//...on_chat_verify = chat_server.accounts.onVerify;

	} catch (error) {
		console.log( error );
		console.log('Cowardly refusing to keep the process alive as root.');
		process.exit(1);
	}


	https_server.on( 'upgrade', (request, socket, head)=>{
		color_log( COLORS.SOCKET, 'UPGRADE', COLORS.ADDRESS + socket.remoteAddress + ':' + socket.remotePort );

		wss_server.handleUpgrade( request, socket, head, (socket)=>{
			wss_server.emit( 'connection', socket, request );
		});

	}); // wss_server.onUpgrade


	wss_server.on( 'connection', (socket, request)=>{
		var client_address;

		if (request.headers['x-forwarded-for'] == undefined) {
			client_address = request.connection.remoteAddress + ':' + request.connection.remotePort;
		} else {
			client_address = request.headers['x-forwarded-for'];   //... not tested
		}

		color_log( COLORS.SOCKET, 'CONNECTION', COLORS.ADDRESS + client_address );

		socket.on( 'message', (data)=>{
			if (DEBUG.DATA_TRANSMITTED) color_log( COLORS.MESSAGE, 'RECEIVED', data.length, 'bytes' );

			const message = JSON.parse( data );
			message.sender = client_address;
			if (DEBUG.REQUESTS) {
				color_log(
					COLORS.MESSAGE,
					'MESSAGE',
					COLORS.ADDRESS + client_address + COLORS.RESET,
					((DEBUG.MESSAGE_DATA) ? message : message.type),
				);
			}
			chat_server.onMessage( message, data.length );
		});

		socket.on( 'close', ()=>chat_server.onDisconnect( client_address ) );

		chat_server.onConnect( socket, client_address );

	}); // wss_server.onConnection


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// GLOBAL ERROR HANDLER
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	function cleanup (event) {
		if (event == 'SIGINT') console.log();

		console.log( '.' + '-'.repeat(78) );
		console.log( '| EXIT - Received:', event, '- cleaning up...' );
		console.log( "'" + '-'.repeat(78) );

		const exit_code = ((typeof event == 'number') ? event : EXIT_CODES.UNKNOWN);

		process.removeListener( 'uncaughtException', global_error_handler );
		process.removeListener( 'unhandledRejection', global_error_handler );
		process.removeListener( 'SIGINT',  cleanup );
		process.removeListener( 'SIGQUIT', cleanup );
		process.removeListener( 'SIGUSR1', cleanup );
		process.removeListener( 'SIGUSR2', cleanup );
		process.removeListener( 'exit',    cleanup );

		DEBUG.FLAT_FILE_DB = true;

		chat_server.onCleanUp().then( ()=>{
			color_log( COLORS.EXIT, 'EXIT', 'Server terminating with exit code', exit_code );
			process.exit( exit_code );
		});

	} // cleanup


	chat_server.terminate = cleanup;


	/**
	 * global_error_handler()
	 */
	function global_error_handler (error) {
		color_log( COLORS.ERROR, 'ERROR', 'ChatServer: ', error );
		console.log( COLORS.ERROR, 'error', error );

		cleanup( EXIT_CODES.GLOBAL_ERROR_HANDLER );

	} // global_error_handler

	process.on( 'uncaughtException', global_error_handler );
	process.on( 'unhandledRejection', global_error_handler );
	process.on( 'SIGINT',  cleanup );
	process.on( 'SIGQUIT', cleanup );
	process.on( 'SIGTERM', cleanup );
	process.on( 'SIGUSR1', cleanup );
	process.on( 'SIGUSR2', cleanup );
	process.on( 'exit',    cleanup );


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DONE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	console.log( '.' + '-'.repeat(78) );
	console.timeEnd( '| READY. Boot time' );
	console.log( "'" + '-'.repeat(78) );

} // init


init();


//EOF