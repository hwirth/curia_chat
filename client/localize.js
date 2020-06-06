// localize.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import { DEBUG, CLIENT_COMMANDS, SERVER_COMMANDS } from './constants.js';


const AVAILABLE_LANGUAGES = ['en', 'de'];
const FALLBACK_LANGUAGE   = 'en';

export var CURRENT_LANGUAGE = 'en';


/**
 * set_language()
 */
export function set_language (language) {
	language = language.toLowerCase();

	if (AVAILABLE_LANGUAGES.indexOf( language ) >= 0) {
		CURRENT_LANGUAGE = language;
		document.querySelector( 'html' ).setAttribute( 'lang', language );
	}

} // set_language


/**
 * check_browser_language()
 */
export function check_browser_language () {
	const lang = (navigator.language || navigator.userLanguage).slice( 0, 2 );

	if (DEBUG.LOCALIZATION) console.log( 'localization: check_browser_language:', lang );

	set_language( lang );

	return lang;

} // check_browser_language


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// REPLACE TEMPLATE WITH LOCALIZED STRING
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * localized()
 */
export function localized (template, ...fragments) {
	let language = CURRENT_LANGUAGE;

	if (TEXT[template] == undefined) {
		console.groupCollapsed(
			'%cERROR%c: localized: Unknown template:' + template,
			'color:red', 'color:black',
		);
		console.trace();
		console.groupEnd();

		throw new Error( 'localized: Unknown template: "' + template + '"' );
	}

	template = TEXT[template];

	if (template[CURRENT_LANGUAGE] == undefined) {
		language = FALLBACK_LANGUAGE;
	}

	template = template[language];

	[...fragments].forEach( (fragment)=>{
		template = template.replace( '*', fragment );
	});

	return template;

} // localized


/**
 * localized_help()
 */
export function localized_help (template) {
	let language = CURRENT_LANGUAGE;

	if (HELP_TEXT[template] == undefined) {
		console.log(
			'%cERROR%c: localized_help: Template undefined: "' + template + '"',
			'color:red', 'color:black',
		);
	}

	template = HELP_TEXT[template];

	if (template[CURRENT_LANGUAGE] == undefined) {
		language = FALLBACK_LANGUAGE;
	}

	return template[language];

} // localized_help


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// LOCALIZED ROOM NAMES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * localized_room_name()
 */
export function localized_room_name (room_name) {
	let language = CURRENT_LANGUAGE;
	const index = room_name.toLowerCase();

	if (DEBUG.ROOMS) console.log( 'localized_room_name:', room_name, ROOM_NAMES[index] );

	if (ROOM_NAMES[index] == undefined) return room_name;

	const template = ROOM_NAMES[index];

	if (template[CURRENT_LANGUAGE] == undefined) {
		language = FALLBACK_LANGUAGE;
	}

	return template[language];

} // localized_room_name


/**
 * delocalized_room_name()
 */
export function delocalized_room_name (caption) {
	let delocalized_name = caption;

	console.log( 'delocalized_room_name:', caption );

	caption = caption.toLowerCase();

	Object.keys( ROOM_NAMES ).forEach( (key)=>{
		const template = ROOM_NAMES[key];

		Object.keys( template ).forEach( (language)=>{
			const localized_name = template[language];

			if (localized_name.toLowerCase() == caption) {
				delocalized_name = key;
			}
		});
	});

	return delocalized_name;

} // delocalized_room_name


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// LOCALIZATION TEMPLATES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * TEXT{}
 */
export const TEXT = {

	/*
	 * Time
	 */
	YEAR     : { en: 'year',      de: 'Jahr'     },
	YEARS    : { en: 'years',     de: 'Jahre'    },
	MONTH    : { en: 'month',     de: 'Monat'    },
	MONTHS   : { en: 'months',    de: 'Monate'   },
	DAY      : { en: 'day',       de: 'Tag'      },
	DAYS     : { en: 'days',      de: 'Tage'     },
	HOUR     : { en: 'hour',      de: 'Stunde'   },
	HOURS    : { en: 'hours',     de: 'Stunden'  },
	MINUTE   : { en: 'minute',    de: 'Minute'   },
	MINUTES  : { en: 'minutes',   de: 'Minuten'  },
	SECOND   : { en: 'second',    de: 'Sekunde'  },
	SECONDS  : { en: 'seconds',   de: 'Sekunden' },
	JUST_NOW : { en: 'Right now', de: 'Gerade eben' },


	/*
	 * General client messages
	 */

	UNDER_DEVELOPMENT: {
		en: `
<h2>Alpha Version</h2>
<p>Curia Chat is currently under active development; <b>Expect glitches and hickups</b>!
<br>Page reloads may be neccessary, when something has crashed.
<br>Your <b>preferences will be reverted</b>, when new options have been added.
</p>
		`,
		de: `
<h2>Alphaversion</h2>
<p>Der Curia Chat befindet sich in aktiver Entwicklung; <b>Rechne mit Problemen und Abstürzen</b>!
<br>Möglicherweise musst du die Seite neu laden, wenn etwas abstürzt.
<br>Deine <b>Einstellungen werden zurückgesetzt</b>, wenn neue Optionen programmiert wurden.
</p>
		`,
	},
	VOIP_INSTRUCTIONS: {
		en: `
<h2>Video Call</h2>
<ul>
	<li>Command buttons are located in the panel at the bottom of the screen.
	<li>Start a call: Open the users tab (button <q>Users</q>).
	<li>Accept a call: Click the button that appears at the bottom.
	<li>Enable microphone and/or camera, <b>after</b> the connection was made.
</ul>
		`,
		de: `
<h2>Videotelefonie</h2>
<ul>
	<li>Befehlsschaltflächen befinden sich im Kommandopanel am unteren Bildschirmrand.
	<li>Anruf starten: Öffne die Benutzerliste (Schaltfläche <q>Benutzer</q>).
	<li>Anruf entgegennehmen: Klicke auf die Schaltfläche, die unten erscheint.
	<li>Aktiviere Mikrofon und/oder Kamera, <b>nachdem</b> die Verbindung hergestellt wurde.
</ul>
		`,
	},


	ACTIVATE_STREAMS_FOR_THE_CALL: {
		en: 'You don\'t have any stream sources enabled.',
		de: 'Du hast noch keine Streamquellen aktiviert.',
	},
	ACTIVE_CALLS: {
		en: 'Active calls',
		de: 'Aktive Telefonate',
	},
	ALLOWED_CHARS_ARE: {
		en: 'Allowed characters:<tt class="allowed">*</tt>',
		de: 'Erlaubte Zeichen:<tt class="allowed">*</tt>',
	},
	ANONYMOUS: {
		en: 'anonymous',
		de: 'anonym',
	},
	ATTENTION_REQUEST_FROM: {
		en: 'User * asks for your attention.',
		de: 'Benutzer * bittet um deine Aufmerksamkeit.',
	},
	ATTENTION_REQUEST_TO: {
		en: 'Asking * for attention.',
		de: 'Bitte * um Aufmerksamkeit.',
	},
	CALL_SOMEONE_FIRST: {
		en: 'No active connection. Call someone first!',
		de: 'Keine aktive Verbindung. Rufe zuerst jemanden an!',
	},
	CANDIDATE_PAIR_UNEXPECTEDLY_NULL: {
		en: 'Candidate pair is (unexpectedly) <q>null</q>.',
		de: 'Candidate pair ist (unerwarteterweise) <q>null</q>.',
	},
	CHOOSE_A_NAME: {
		en: 'Choose a name:',
		de: 'Wähle einen Namen:',
	},
	CLIENT: {
		en: 'Client',
		de: 'Client',
	},
	CLIENT_CLOSED_WINDOW: {
		en: 'Client * has closed the chat window.',
		de: 'Client * hat das Chatfenster geschlossen.',
	},
	CLIENT_CONNECTED: {
		en: 'Client * connected to the chat.',
		de: 'Client * hat sich zum Chat verbunden.',
	},
	CLIENT_DISCONNECTED: {
		en: 'Client * disconnected from the chat.',
		de: 'Client * hat die Verbindung zum Chat getrennt.',
	},
	COMMAND: {
		en: 'Command',
		de: 'Befehl',
	},
	CONNECTING_TO_SERVER: {
		en: 'Connecting to *...',
		de: 'Verbindung zu * wird aufgebaut...',
	},
	CONNECTION_TERMINATED: {
		en: 'Connection to server terminated.',
		de: 'Verbindung zum Server wurde getrennt.',
	},
	CONTAINS_INVALID_CHARS: {
		en: 'The name <q>*</q> contains invalid characters.<br>Allowed characters are: <tt class="allowed">*</tt>',
		de: 'Der Name <q>*</q> beinhaltet nicht erlaubte Zeichen.<br>Erlaubte Zeichen: <tt class="allowed">*</tt>',
	},
	COULD_NOT_AQUIRE_LOCAL_STREAM: {
		en: 'Could not aquire local stream: ',
		de: 'Connte den lokalen Stream nicht aktivieren: ',
	},
	COULD_NOT_CONNECT_TO_SERVER: {
		en: 'Could not connect to server.',
		de: 'Konnte keine Verbindung zum Server aufbauen.',
	},
	DESCRIPTION: {
		en: 'Description',
		de: 'Beschreibung',
	},
	DEVICE_ALREADY_ENABLED: {
		en: 'Device <q>*</q> is already enabled.',
		de: 'Gerät <q>*</q> ist bereits aktiv.',
	},
	DEVICE_ALREADY_DISABLED: {
		en: 'Device <q>*</q> is not enabled.',
		de: 'Gerät <q>*</q> ist nicht aktiv.',
	},
	DEVICE_DISABLED: {
		en: 'Device <q>*</q> disabled.',
		de: 'Gerät <q>*</q> wurde deaktiviert.',
	},
	DEVICE_ENABLED: {
		en: 'Device <q>*</q> enabled.',
		de: 'Gerät <q>*</q> wurde aktiviert.',
	},
	DOT: {
		en: 'dot',
		de: 'Punkt',
	},
	ENDING_RTC_SESSION_WITH: {
		en: 'Ending video call with *.',
		de: 'Telefonat mit * wurde beendet.',
	},
	ERROR: {
		en: 'Error',
		de: 'Fehler',
	},
	HAS_CANCELED_THE_INVITATION: {
		en: '* has canceled the invitation for a video call.',
		de: '* hat die Einladung zum Telefonat zurückgenommen.',
	},
	HAS_ENDED_RTC_SESSION: {
		en: '* has ended the video call.',
		de: '* hat das Telefonat beendet.',
	},
	HAS_REJECTED_THE_INVITATION: {
		en: '* has rejected your invitation to a video call.*',
		de: '* hat deine Einladung zum Telefonat abgelehnt.*',
	},
	INPUT_DEVICES: {
		en: 'Input Devices',
		de: 'Eingabegeräte',
	},
	INTERNAL_ERROR: {
		en: 'Internal error',
		de: 'Systemfehler',
	},
	INVITATION_WAS_CANCELED: {
		en: 'Invitation for a video call to *  was canceled.',
		de: 'Einladung an * zum Telefonat wurde zurückgenommen.',
	},
	KBD_ALT: {
		en: 'Alt',
		de: 'Alt',
	},
	KBD_CTRL: {
		en: 'Ctrl',
		de: 'Strg',
	},
	KBD_SHIFT: {
		en: 'Shift',
		de: 'Umschalt',
	},
	KNOWN_COMMANDS: {
		en: 'Known commands',
		de: 'Bekannte Befehle',
	},
	LOCAL_ICE: {
		en: 'Local <abbr title="Interactive Connectivity Establishment">ICE</abbr>',
		de: 'Lokales <abbr title="Interactive Connectivity Establishment">ICE</abbr>',
	},
	LOG_IN: {
		en: 'Start',
		de: 'Start',
	},
	LOGIN_NAME: {
		en: 'Nickname',
		de: 'Chatname',
	},
	MESSAGE_FROM: {
		en: '<i>Message from *: *</i>',
		de: '<i>Nachricht von *: *</i>',
	},
	MESSAGE_TO: {
		en: '<i>Message to *: *</i>',
		de: '<i>Nachricht an *: *</i>',
	},
	NAME: {
		en: 'Name',
		de: 'Name',
	},
	NO_CALLS_IN_PROGRESS: {
		en: 'No calls in progress',
		de: 'Keine aktiven Telefonate',
	},
	NO_PENDING_INVITES: {
		en: 'No pending invites',
		de: 'Keine ausstehenden Einladungen',
	},
	NO_SESSION_WITH_USER_FOUND: {
		en: 'No session with user * found.',
		de: 'Keine Verbindung mit Benutzer * gefunden.',
	},
	NOTICE: {
		en: 'Notice',
		de: 'Hinweis',
	},
	OPTIONAL_PASSWORD: {
		en: 'Password (optional)',
		de: 'Passwort (optional)',
	},
	PAGE_CLEARED: {
		en: '<i>Page contents were cleared.</i>',
		de: '<i>Seiteninhalt wurde gelöscht.</i>',
	},
	PEER_CONNECTION_UNEXPECTEDLY_NULL: {
		en: 'peerConnection unexpectedly <q>null</q>.',
		de: 'peerConnection unerwarteterweise <q>null</q>.',
	},
	PEER_TO_PEER_CONNECTION: {
		en: 'Peer-to-peer connection.',
		de: 'Peer-to-peer Verbindung.',
	},
	PORT: {
		en: 'port',
		de: 'Port',
	},
	PREFERENCES_VERSION_MISMATCH: {
		en: 'The preference data format has changed. Your preferences were reset.',
		de: 'Das Einstellungsdatenformat hat sich geändert. Deine Einstellungen wurden zurückgesetzt.',
	},
	PRIVACY_CONCERN: {
		en: 'If you are concerned about your <strong>privacy</strong>, you should assume, that my server logs everything.<br>Nothing is being logged, though. Question is, do you believe me?',
		de: 'Wenn dir deine <strong>Privatsphäre</strong> wichtig ist, dann gehe davon aus, dass mein Server alles mitschreibt.<br>Tatsächlich wird nichts geloggt. Die Frage ist nur, glaubst du mir das?',
	},
	PRIVATE_CONVERSATION: {
		en: 'Private conversation',
		de: 'Private Unterhaltung',
	},
	RECEIVED_INVITES: {
		en: 'Received invites',
		de: 'Empfangene Einladungen',
	},
	RECONNECT_GIVING_UP: {
		en: 'Maximum reconnection attempts reached, giving up.',
		de: 'Maximale Anzahl der Wiederverbindungsversuche erreicht, gebe auf.',
	},
	RECONNECT_TO_SERVER: {
		en: 'Retry',
		de: 'Erneut versuchen',
	},
	RECONNECTING_IN_SECONDS: {
		en: 'Trying again in <span id="reconnect_countdown">*</span> seconds...',
		de: 'Erneuter Verbindungsversuch in <span id="reconnect_countdown">*</span> Sekunden...',
	},
	REMOTE_ICE: {
		en: 'Remote <abbr title="Interactive Connectivity Establishment">ICE</abbr>',
		de: 'Gegenstelle',
	},
	ROOM_TOPIC_IS: {
		en: 'Topic for room <q><b>*</b></q> is <q><b>*</b></q>.',
		de: 'Thema für Raum <q><b>*</b></q> ist <q><b>*</b></q>.',
	},
	ROOM_TOPIC_IS_NULL: {
		en: '<b>No topic</b> is set for room <q><b>*</b></q>.',
		de: 'Für den Raum <q><b>*</b></q> ist <b>kein Thema</b> gesetzt.',
	},
	ROOM_TOPIC_SET_BY: {
		en: 'Topic for room <q><b>*</b></q>, set by *: <q><b>*</b></q>.',
		de: 'Thema für Raum <q><b>*</b></q>, gesetzt von *: <q><b>*</b></q>.',
	},
	RPG_MESSAGE: {
		en: 'Role play',
		de: 'Rollenspiel',
	},
	SERVER_VERSION_MISMATCH: {
		en: 'Version mismatch: Client: *, Server: *.',
		de: 'Versionsdiskrepanz: Client: *, Server: *.',
	},
	SAYS: {
		en: 'says',
		de: 'sagt',
	},
	SENT_INVITES: {
		en: 'Sent invites',
		de: 'Gesendete Einladungen',
	},
	SERVER_MESSAGE: {
		en: 'Server',
		de: 'Server',
	},
	SESSION_ALREADY_EXISTS: {
		en: 'Session with * already exists.',
		de: 'Verbindung mit * existiert bereits.',
	},
	SHORTCUT: {
		en: 'Shortcut',
		de: 'Tastatur',
	},
	STARTING_RTC_SESSION_WITH: {
		en: 'Starting RTC session with *.<br>End the call with <a class="command">/hangup *</a>.',
		de: 'Starte RTC-Sitzung mit *.<br>Beende die Verbindung mit <a class="command">/hangup *</a>.',
	},
	TRANSPORT_MODE_COULD_NOT_BE_DETERMINED: {
		en: 'Transport mode could not reliably determined.',
		de: 'Transportmechanismus konnte nicht mit Sicherheit festgestellt werden.',
	},
	TURN_SERVER_IS_RELAYING_DATA: {
		en: 'TURN server is relaying data.',
		de: 'Daten werden über einen TURN Server übertragen.',
	},
	TYPE_YOUR_MESSAGE_HERE: {
		en: 'Type your message here',
		de: 'Gib deine Textnachricht hier ein',
	},
	UNKNOWN_COMMAND: {
		en: 'Unknown command: <q>*</q>',
		de: 'Unbekannter Befehl: <q>*</q>',
	},
	UNKNOWN_DEVICE_OPTIONS_ARE: {
		en: 'Unknown device <q>*</q>, available options:',
		de: 'Unbekanntes Gerät <q>*</q>, verfügbare Optionen:',
	},
	UNKNOWN_PARAMETER: {
		en: 'The parameter <q>*</q> is unknown.',
		de: 'Der Parameter <q>*</q> ist unbekannt.',
	},
	USE_HELP_DETAILED: {
		en: '<ul>'
			+ '<li>Hover your mouse over the commands to see detailed descriptions.'
			+ '<li>The <a class="command">/manual</a> shows detailed descriptions for all commands.'
			+ '<li>Commands can be issued by clicking them.'
			+ '</ul>',
		de: '<ul>'
			+ '<li>Zeige mit der Maus auf einen Befehl, um eine Beschreibung zu sehen.'
			+ '<li>Das Handbuch (<a class="command">/manual</a>) zeigt eine Beschreibung aller Befehle. '
			+ '<li>Befehle können durch Anklicken ausgeführt werden.'
			+ '</ul>',
	},
	USER_CHOSE_NAME: {
		en: 'Client * chose the name *.',
		de: 'Client * wählte den Namen *.',
	},
	USER_JOINED_THE_ROOM: {
		en: '* entered the room.',
		de: '* betritt den Raum.',
	},
	USER_KNOWN_AS: {
		en: '* is now known as *.',
		de: '* änderte den Namen auf *.',
	},
	USER_LEFT_THE_ROOM: {
		en: '* left the room.',
		de: '* verlässt den Raum.',
	},
	USER_WAS_KICKED: {
		en: 'User * was kicked.',
		de: 'Benutzer * wurde entfernt.',
	},
	USERS_IN_CHAT: {
		en: 'Users in chat: *',
		de: 'Benutzer im Chat: *',
	},
	USERS_IN_ROOM: {
		en: 'Users in room: *.',
		de: 'Benutzer im Raum: *.',
	},
	WARNING: {
		en: 'Warning',
		de: 'Warnung',
	},
	WELCOME_TO_CURIA_CHAT: {
		en: 'Welcome to Curia Chat!',
		de: 'Willkommen im Curia-Chat!',
	},
	WELCOME_TO_THE_CHAT: {
		en: 'Welcome to the chat!',
		de: 'Wilkommen im Chat!',
	},
	YOU_ARE_CONNECTED_VIA_HTTP: {
		en: 'You are connected via <b>http</b> (No encryption).',
		de: 'Du bist per <b>http</b> verbunden (Keine Verschlüsselung).',
	},
	YOU_ARE_CONNECTED_VIA_HTTPS: {
		en: 'You are connected via <b>https</b> (SSL encrypted).',
		de: 'Du bist per <b>https</b> verbunden (SSL verschlüsselt).',
	},
	YOU_HAVE_INVITED: {
		en: 'You have invited * to a video chat.<br>Cancel the invitation with <a class="command">/cancel *</a>.',
		de: 'Du hast * zu einem Telefonat eingeladen.<br>Nimm die Einladung mit <a class="command">/cancel *</a> zurück.',
	},
	YOU_REJECTED_THE_INVITATION: {
		en: 'You rejected the invitation to a video call from *.',
		de: 'Du hast die Einladung zum Telefonat von * abgelehnt.',
	},
	YOU_WERE_INVITED: {
		en: '* invited you to a video chat.<br>Acccept the invitation with <a class="command">/accept *</a> or decline it with <a class="command">/reject *</a>.',
		en: '* hat dich zu einem Telefonat eingeladen.<br>Nimm die Einladung mit <a class="command">/accept *</a> an, oder weise sie mit <a class="command">/reject *</a> zurück.',
	},
	YOUR_BROWSER_DOES_NOT_SUPPORT_GET_USER_MEDIA: {
		en: 'Your browser does not support getUserMedia().',
		de: 'Dein Browser unterstützt getUserMedia() nicht.',
	},


	/*
	 * ROOMS
	 */
	ROOM_EMPTY: {
		en: 'Room is empty',
		de: 'Niemand im Raum',
	},
	ROOM_LAST_ACTIVITY: {
		en: 'Last activity',
		de: 'Letzte Aktivität',
	},
	ROOM_NAME: {
		en: 'Name',
		de: 'Name',
	},
	ROOM_CREATED: {
		en: 'Created',
		de: 'Angelegt',
	},
	ROOM_TOPIC: {
		en: 'Topic',
		de: 'Thema',
	},
	ROOM_LIST: {
		en: 'Room list',
		de: 'Raumliste',
	},

	ROOM_USERS: {
		en: 'Users',
		de: 'Benutzer',
	},


	/*
	 * Various elements
	 */

	TITLE_VIDEOS: {
		en: 'Video panel: Click/drag to toggle/resize',
		de: 'Videopanel: Klicke/ziehe um umzuschalten/die Größe zu ändern',
	},
	TITLE_COMMANDS: {
		en: 'Commands panel: Click/drag to toggle/resize',
		de: 'Kommandopanel: Klicke/ziehe um umzuschalten/die Größe zu ändern',
	},

	NAME_CONTEXT_MSG: {
		en: 'Start private conversation',
		de: 'Private Unterhaltung starten',
	},
	NAME_CONTEXT_ATTENTION: {
		en: 'Request user\'s attention',
		de: 'Benutzer um Aufmerksamkeit bitten',
	},
	NAME_CONTEXT_CALL: {
		en: 'Initiate call',
		de: 'Anruf starten',
	},


	/*
	 * Preferences
	 */

	BTN_PREFERENCES_EDIT_CAPTION: { en: 'Preferences', de: 'Einstellungen' },
	BTN_PREFERENCES_EDIT_TITLE: {
		en: 'General settings',
		de: 'Allgemeine Einstellungen',
	},
	BTN_PREFERENCES_EVENTS_CAPTION: { en: 'Events', de: 'Ereignisse' },
	BTN_PREFERENCES_EVENTS_TITLE: {
		en: 'Configures event sounds and notifications',
		de: 'Konfiguriert Ereignisklänge und Notifkationen',
	},

	H2_PREFERENCES_EDIT: {
		en: 'Preferences',
		de: 'Einstellungen',
	},
	H2_PREFERENCES_EVENTS: {
		en: 'Events',
		de: 'Ereignisse',
	},

	BTN_PREFERENCES_EDIT_SUBMIT: {
		en: 'Save<br>Changes',
		de: 'Änderungen<br>speichern',
	},
	BTN_PREFERENCES_EVENTS_SUBMIT: {
		en: 'Save<br>Changes',
		de: 'Änderungen<br>speichern',
	},

	LABEL_PREFERENCES_MASTER_VOLUME: {
		en: 'Master volume:',
		de: 'Allgemeine Lautstärke:',
	},
	LABEL_PREFERENCES_NOTIFICATION_TIMEOUT: {
		en: 'Notification timeout:',
		de: 'Notifikations-Anzeigezeit:',
	},
	LABEL_PREFERENCES_EMBED_MEDIA: {
		en: 'Embed media files:',
		de: 'Mediendateien einbetten:',
	},
	LABEL_PREFERENCES_SYSTEM_LOG: {
		en: 'System log:',
		de: 'Systemlog:',
	},
	LABEL_PREFERENCES_REMOTE_ERRORS: {
		en: 'Remote client errors:',
		de: 'Fehler anderer Clients:',
	},

	TH_PREFERENCES_EVENT: {
		en: 'Event',
		de: 'Ereignis',
	},
	TH_PREFERENCES_VOLUME: {
		en: 'Volume',
		de: 'Lautstärke',
	},
	TH_PREFERENCES_BLINK_TAB: {
		en: 'Blink Tab',
		de: 'Reiter blinkt',
	},
	TH_PREFERENCES_BLINK_ICON: {
		en: 'Blink Icon',
		de: 'Animiere Icon',
	},
	TH_PREFERENCES_NOTIFY: {
		en: 'Notification',
		de: 'Notifikation',
	},
	TITLE_PREFERENCES_EVENT: {
		en: 'Events, that can trigger different kinds of action',
		de: 'Ereignisse, die verschiedne Reaktionen auslösen können',
	},
	TITLE_PREFERENCES_VOLUME: {
		en: 'Volume of the associated sound effect',
		de: 'Lautstärke des entsprechenden Klanges',
	},
	TITLE_PREFERENCES_BLINK_TAB: {
		en: 'Lets the related chat tab blink',
		de: 'Läßt den entsprechenden Reiter im Chat blinken',
	},
	TITLE_PREFERENCES_BLINK_ICON: {
		en: 'Lets the page\'s browser tab icon blink in your browser',
		de: 'Läßt das Icon des Browsertabs blinken',
	},
	TITLE_PREFERENCES_NOTIFY: {
		en: 'Shows a popup window',
		de: 'Zeigt ein Nachrichtenfenster',
	},


	/*
	 * User Profile
	 */

	BTN_PROFILE_EDIT_CAPTION: { en: 'Profile', de: 'Profil' },
	BTN_PROFILE_EDIT_TITLE: {
		en: 'Personal information about you (registered users only)',
		de: 'Persönliche Informationen über dich (Nur für registrierte Benutzer)',
	},
	BTN_PROFILE_AVATAR_CAPTION: { en: 'Avatar', de: 'Avatar' },
	BTN_PROFILE_AVATAR_TITLE: {
		en: 'Upload a picture (Non-registered users, too)',
		de: 'Bild einstellen (auch für nicht registrierte Benutzer)',
	},
	BTN_PROFILE_REGISTER_CAPTION: { en: 'Register', de: 'Registrieren' },
	BTN_PROFILE_REGISTER_TITLE: {
		en: 'Create a user account',
		de: 'Erstelle ein Benutzerkonto',
	},

	H2_PROFILE_EDIT: {
		en: 'User Profile',
		de: 'Benutzerprofil',
	},
	H2_PROFILE_AVATAR: {
		en: 'Edit Avatar',
		de: 'Avatar bearbeiten',
	},
	H2_PROFILE_REGISTER: {
		en: 'Register Account',
		de: 'Konto erstellen',
	},

	BTN_PROFILE_EDIT_SUBMIT: {
		en: 'Save<br>Changes',
		de: 'Änderungen<br>speichern',
	},
	BTN_PROFILE_AVATAR_SUBMIT: {
		en: 'Save<br>Changes',
		de: 'Änderungen<br>speichern'
	},
	BTN_PROFILE_REGISTER_ACCOUNT: {
		en: 'Create<br>Account',
		de: 'Konto<br>erstellen',
	},

	NO_FILE_SELECTED: {
		en: 'No file chosen',
		de: 'Keine Datei ausgewählt',
	},
	LABEL_PROFILE_AVATAR_ZOOM: {
		en: 'Size:',
		de: 'Größe:',
	},
	LABEL_PROFILE_AVATAR_OFFSET_X: {
		en: 'Horizontal:',
		de: 'Horizontal:',
	},
	LABEL_PROFILE_AVATAR_OFFSET_Y: {
		en: 'Vertical:',
		de: 'Vertikal:',
	},
	LABEL_PROFILE_AVATAR_BG_COLOR: {
		en: 'Background:',
		de: 'Hintergrund:',
	},
	BTN_PROFILE_AVATAR_CLEAR: {
		en: 'Clear<br>Image',
		de: 'Bild<br>löschen',
	},
	BTN_PROFILE_AVATAR_RESTORE: {
		en: 'Restore<br>Image',
		de: 'Bild<br>wiederherstellen',
	},
	BTN_PROFILE_AVATAR_ZOOM_FILL: {
		en: 'Fill<br>Picture',
		de: 'Bild<br>füllen',
	},
	BTN_PROFILE_AVATAR_ZOOM_FULL: {
		en: 'Whole<br>Image',
		de: 'Ganzes<br>Bild',
	},

	LABEL_PROFILE_REGISTER_NAME: {
		en: 'Name:',
		de: 'Name:',
	},
	LABEL_PROFILE_REGISTER_AVAILABLE: {
		en: 'Availability:',
		de: 'Verfügbarkeit:',
	},
	LABEL_PROFILE_REGISTER_VERIFY: {
		en: 'Code:',
		de: 'Code:',
	},
	BTN_PROFILE_REGISTER_VERIFY: {
		en: 'Confirm Account:',
		de: 'Konto bestätigen:',
	},
	LABEL_PROFILE_REGISTER_PASSWORD_1: {
		en: 'Password:',
		de: 'Passwort:',
	},
	LABEL_PROFILE_REGISTER_PASSWORD_2: {
		en: 'Confirm:',
		de: 'Bestätigen:',
	},
	PASSWORD_TOO_SHORT: {
		en: 'The password too short.<br>Minimum: * characters.',
		de: 'Das Passwort ist zu kurz.<br>Minimum: * Zeichen.',
	},
	PASSWORDS_MISMATCH: {
		en: 'The passwords are not identical.',
		de: 'Die Passwörter stimmen nicht überein.',
	},
	PASSWORD_STRENGTH_0: {
		en: 'Pretty weak.',
		de: 'Ziemlich schwach.',
	},
	PASSWORD_STRENGTH_1: {
		en: 'Could be stronger.',
		de: 'Könnte besser sein.',
	},
	PASSWORD_STRENGTH_2: {
		en: 'Good.',
		de: 'Gut.',
	},
	PASSWORD_STRENGTH_3: {
		en: 'Very good.',
		de: 'Sehr gut.',
	},
	LABEL_PROFILE_REGISTER_STRENGTH: {
		en: 'Strength:',
		de: 'Stärke:',
	},
	LABEL_PROFILE_REGISTER_EMAIL: {
		en: 'Email:',
		de: 'E-Mail:',
	},
	SPAN_PROFILE_REGISTER_EMAIL_HINT: {
		en: 'You will be sent an activation code,<br>make sure to enter a valid address.',
		de: 'Du wirst einen Aktivierungscode erhalten,<br>gib also eine gültige Adresse an.',
	},
	NAME_IS_AVAILABLE: {
		en: 'This name is available.',
		de: 'Dieser Name ist verfügbar.',
	},
	REGISTRATION_PENDING: {
		en: 'Registration for this name is pending,<br>awaiting verification.',
		de: 'Registrierung für diesen Namen läuft,<br>warte auf die Bestätigung.',
	},
	REGISTRATION_REGISTERED: {
		en: 'This name is registered.',
		de: 'Dieser Name ist registriert.',
	},


	/*
	 * Command Buttons
	 */

	BTN_USER_LIST_CAPTION: { en: 'User List', de: 'Benutzer' },
	BTN_USER_LIST_TITLE: {
		en: 'Show/hide a list of currently connected users',
		de: 'Zeige/verstecke die Liste eingeloggter Benutzer',
	},
	BTN_PROFILE_CAPTION: { en: 'Profile', de: 'Profil' },
	BTN_PROFILE_TITLE: {
		en: 'Personal information about you (registered users only)',
		de: 'Persönliche Informationen über dich (Nur für registrierte Benutzer)',
	},
	BTN_PREFERENCES_CAPTION: { en: 'Preferences', de: 'Einstellungen' },
	BTN_PREFERENCES_TITLE: {
		en: 'Configure chat client settings',
		de: 'Einstellungen für den Chatclient'
	},
	BTN_HELP_CAPTION: { en: 'Help', de: 'Hilfe' },
	BTN_HELP_TITLE: {
		en: 'Show a list of available commands',
		de: 'Zeigt eine Liste aller verfügbaren Befehle',
	},

	BTN_ENABLE_MICROPHONE_CAPTION: { en: 'Microphone Disabled', de: 'Mikrofon inaktiv' },
	BTN_ENABLE_MICROPHONE_TITLE: {
		en: 'Send sound from your microphone in video calls',
		de: 'Beginne die Übertragung des Mikrofons',
	},
	BTN_DISABLE_MICROPHONE_CAPTION: { en: 'Microphone Enabled', de: 'Mikrofon aktiv' },
	BTN_DISABLE_MICROPHONE_TITLE: {
		en: 'Stop sending sounds from your microphone',
		de: 'Beende die Übertragung des Mikrofons',
	},
	BTN_ENABLE_CAMERA_CAPTION: { en: 'Camera Disabled', de: 'Kamera inaktiv' },
	BTN_ENABLE_CAMERA_TITLE: {
		en: 'Send video from your webcam in video calls',
		de: 'Beginne die Übertragung des Kamerabildes',
	},
	BTN_DISABLE_CAMERA_CAPTION: { en: 'Camera Enabled', de: 'Kamera aktiv' },
	BTN_DISABLE_CAMERA_TITLE: {
		en: 'Stop sending images from your webcam',
		de: 'Beende das Senden des Kamerabildes',
	},
	BTN_ENABLE_WHITEBOARD_CAPTION: { en: 'Whiteboard Disabled', de: 'Whiteboard inaktiv' },
	BTN_ENABLE_WHITEBOARD_TITLE: {
		en: 'Start sending drawings',
		de: 'Beginne die Übertragung des Zeichenbretts',
	},
	BTN_DISABLE_WHITEBOARD_CAPTION: { en: 'Whiteboard Enabled', de: 'Whiteboard aktiv' },
	BTN_DISABLE_WHITEBOARD_TITLE: {
		en: 'Stop transmitting drawings',
		de: 'Beende die Übertragung des Zeichenbretts',
	},
	BTN_ENABLE_SCREEN_CAPTION: { en: 'Screen Disabled', de: 'Bildschirm inaktiv' },
	BTN_ENABLE_SCREEN_TITLE: {
		en: 'Stream your screen or a specific window in video calls',
		de: 'Beginne die Übertragung des Bildschirminhalts oder eines Fensters',
	},
	BTN_DISABLE_SCREEN_CAPTION: { en: 'Screen Enabled', de: 'Bildschirm inaktiv' },
	BTN_DISABLE_SCREEN_TITLE: {
		en: 'Stop sending your screen',
		de: 'Beende die Übertraung des Bildschirminhalts oder Fensters',
	},

	BTN_CALL_CAPTION: { en: 'Call', de: 'Anrufen' },
	BTN_CALL_TITLE: {
		en: 'Create an RTC connection to the user',
		de: 'Stellt RTC-Verbindung zum Benutzer her',
	},
	BTN_MESSAGE_CAPTION: { en: 'Text', de: 'Text' },
	BTN_MESSAGE_TITLE: {
		en: 'Start private conversation',
		de: 'Private Unterhaltung starten',
	},

	BTN_CANCEL_CAPTION: { en: 'Cancel Call', de: 'Anruf abbrechen' },
	BTN_CANCEL_TITLE: {
		en: 'Revoke call invitation',
		de: 'Einladung zum Anruf zurücknehmen',
	},
	BTN_REJECT_CAPTION: { en: 'Reject', de: 'Anruf ablehnen' },
	BTN_REJECT_TITLE: {
		en: 'Reject call invitation',
		de: 'Eingehenden Anruf ablehnen',
	},
	BTN_ACCEPT_CAPTION: { en: 'Answer Call', de: 'Anruf annehmen' },
	BTN_ACCEPT_TITLE: {
		en: 'Accept incoming call',
		de: 'Eingehnenden Anruf annehmen',
	},
	BTN_HANG_UP_CAPTION: { en: 'Hang Up', de: 'Anruf beenden' },
	BTN_HANG_UP_TITLE: {
		en: 'Close connection',
		de: 'Verbindung trennen',
	},


	/*
	 * Notifications
	 */

	EVENT_HEADING_TEXT_TO_SPEECH: { en: 'Speech synthesizer', de: 'Sprachsynthesizer' },
	EVENT_TEXT_TEXT_TO_SPEECH: {
		en: 'Text: <q>*</q>',
		de: 'Text: <q>*</q>',
	},
	EVENT_HEADING_SUCCESS: { en: 'Success', de: 'Erfolg' },
	EVENT_TEXT_SUCCESS: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_FAILURE: { en: 'Error', de: 'Fehler' },
	EVENT_TEXT_FAILURE: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_WARNING: { en: 'Warning', de: 'Warnung' },
	EVENT_TEXT_WARNING: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_CLIENT_CONNECTED: { en: 'Client connected', de: 'Client hat sich verbunden' },
	EVENT_TEXT_CLIENT_CONNECTED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_CLIENT_DISCONNECTED: { en: 'Client disconnected', de: 'Client hat die Verbindung getrennt' },
	EVENT_TEXT_CLIENT_DISCONNECTED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_SYSTEM_MESSAGE: { en: 'System message', de: 'Systemnachricht' },
	EVENT_TEXT_SYSTEM_MESSAGE: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_PRIVATE_MESSAGE: { en: 'Private message', de: 'Private Nachricht' },
	EVENT_TEXT_PRIVATE_MESSAGE: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_MESSAGE_RECEIVED: { en: 'Message received', de: 'Nachricht erhalten' },
	EVENT_TEXT_MESSAGE_RECEIVED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_MESSAGE_SENT: { en: 'Message sent', de: 'Nachricht gesendet' },
	EVENT_TEXT_MESSAGE_SENT: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_NAME_CHANGE: { en: 'Name change', de: 'Namensänderung' },
	EVENT_TEXT_NAME_CHANGE: {
		en: '* is now known as *',
		de: '* änderte den Namen auf *',
	},
	EVENT_HEADING_NAME_MENTIONED: { en: 'Your name was mentioned', de: 'Dein Name wurde erwähnt' },
	EVENT_TEXT_NAME_MENTIONED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_ATTENTION_REQUEST: { en: 'Attention!', de: 'Achtung!' },
	EVENT_TEXT_ATTENTION_REQUEST: {
		en: '* asks for your attention',
		de: '* bittet um deine Aufmerksamkeit',
	},
	EVENT_HEADING_DEVICE_ENABLED: { en: 'Device enabled', de: 'Gerät aktiviert' },
	EVENT_TEXT_DEVICE_ENABLED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_DEVICE_DISABLED: { en: 'Device disabled', de: 'Gerät deaktiviert' },
	EVENT_TEXT_DEVICE_DISABLED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_CALL_INCOMING: { en: 'Incomming call', de: 'Eingehender Anruf' },
	EVENT_TEXT_CALL_INCOMING: {
		en: '*<br><button class="command" data-command="/accept *">Accept</button> <button class="command" data-command="/reject *">Reject</button>',
		de: '*<br><button class="command" data-command="/accept *">Annehmen</button> <button class="command" data-command="/reject *">Ablehnnen</button>',
	},
	EVENT_HEADING_CALL_OUTGOING: { en: 'Outgoing call', de: 'Ausgehender Anruf' },
	EVENT_TEXT_CALL_OUTGOING: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_CALL_ACCEPTED: { en: 'Call was accepted', de: 'Verbindung wurde angenommen' },
	EVENT_TEXT_CALL_ACCEPTED: {
		en: 'You are now connected to *.',
		de: 'Du bist jetzt mit * verbunden.',
	},
	EVENT_HEADING_CALL_CANCELED: { en: 'Call was canceled', de: 'Anruf wurde abgebrochen' },
	EVENT_TEXT_CALL_CANCELED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_CALL_REJECTED: { en: 'Call was rejected', de: 'Anruf wurde nicht angenommen' },
	EVENT_TEXT_CALL_REJECTED: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_RINGING_STARTS: { en: 'It\'s ringing', de: 'Es klinglt' },
	EVENT_TEXT_RINGING_STARTS: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_RINGING_STOPS: { en: 'Ringing stopped', de: 'Klingeln hat aufgehört' },
	EVENT_TEXT_RINGING_STOPS: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_HANG_UP: { en: 'Call ended', de: 'Anruf wurde beendet' },
	EVENT_TEXT_HANG_UP: {
		en: '*',
		de: '*',
	},
	EVENT_HEADING_RELOADING: { en: 'Reloading', de: 'Lade neu' },
	EVENT_TEXT_RELOADING: {
		en: '*',
		de: '*',
	},


	/*
	 * Error messages from server
	 */

	ACCEPT_NOT_INVITED: {
		en: 'The user * has not invited you to a call.',
		de: 'Der Benutzer * hat dich nicht zu einem Anruf eingeladen.',
	},
	ACCEPT_NONE_PENDING: {
		en: 'There are no pending invitations.',
		de: 'Du hast keine aktiven Einladungen.',
	},
	CANCEL_NOT_INVITED: {
		en: 'You did not invite * to a call.',
		de: 'Du hast * nicht zu einem Anruf eingeladen.',
	},
	CANCEL_NONE_PENDING: {
		en: 'There are no pending invitations.',
		de: 'Du hast keine aktiven Einladungen.',
	},
	CANT_LEAVE_LAST_ROOM: {
		en: 'You can\'t leave the last remaining room.',
		de: 'Du kannst den letzten verbleibenden Raum nicht verlassen.',
	},
	HANGUP_NO_CALLS: {
		en: 'You are not connected.',
		de: 'Du bist nicht verbunden.',
	},
	INSUFFICIENT_PARAMETERS: {
		en: 'Not enough parameters.',
		de: 'Nicht genügend Parameter.',
	},
	INSUFFICIENT_PERMISSIONS: {
		en: 'You don\'t have the required credentials for this operation.',
		de: 'Du hast nicht die erforderlichen Rechte für diese Operation.',
	},
	MESSAGE_TEXT_MISSING: {
		en: 'You have not provided any text, the message was not sent.',
		de: 'Die Nachricht hatte keinen Text und wurde nicht versendet.',
	},
	NAME_ALREADY_IN_USE: {
		en: 'The name * is already in use.',
		de: 'Der Name * ist bereits in Verwendung.',
	},
	NAME_ALREADY_IN_USE_2NAMES: {
		en: 'The name * (*) is already in use.',
		de: 'Der Name * (*) ist bereits in Verwendung.',
	},
	NAME_ALREADY_SET: {
		en: 'You are using this name already.',
		de: 'Du benutzt den Namen bereits.',
	},
	PASSWORD_MISMATCH: {
		en: 'Password not correct. Provide the password for * or choose another name.',
		de: 'Passwort inkorrekt. Gib das Passwort für * ein oder wähle einen anderen Namen.',
	},
	NO_PEER_CONNECTION: {
		en: 'No connection to user *',
		de: 'Du bist nicht mit <q>*</q> verbunden.',
	},
	NOT_LOGGED_IN: {
		en: 'You are not yet logged in. Choose a name first!',
		de: 'Du bist noch nicht eingeloggt. Wähle zuerst einen Namen!',
	},
	REJECT_NOT_INVITED: {
		en: 'The user * has not invited you to a call.',
		de: 'Der Benutzer * hat dich nicht zu einem Anruf eingeladen.',
	},
	REJECT_NONE_PENDING: {
		en: 'There are no pending invitations.',
		de: 'Du hast keine aktiven Einladungen.',
	},
	ROOM_NAME_EXPECTED: {
		en: 'This command expectes a room name as parameter.',
		de: 'Dieser Befehl erwartet einen Raumnamen als Parameter.',
	},
	ROOM_NOT_FOUND: {
		en: 'Unknown room name: <q>*</q>.',
		de: 'Raumname unbekannt: <q>*</q>.',
	},
	RPG: {
		en: 'RPG error: *',
		de: 'RPG Fehler: *',
	},
	UNKNOWN_ERROR_CODE: {
		en: 'Server sent an unknown error code: <q>*</q>.',
		de: 'Der Server hat einen unbekannten Fehlercode gesendet: <q>*</q>.',
	},
	UNKNOWN_COMMAND: {
		en: 'Unknown command: /*',
		de: 'Unbekannter Befehl: /*',
	},
	USER_ALREADY_IN_ROOM: {
		en: 'You already joined the room <q>*</q>.',
		de: 'Du bist bereits im Raum <q>*</q>.',
	},
	USER_NAME_EXPECTED: {
		en: 'This command expects a user name.',
		de: 'Dieser Befehl erwartet einen Benutzernamen.',
	},
	USER_NAME_UNKNOWN: {
		en: 'The user name <q>*</q> is unknown.',
		de: 'Der Benutzername <q>*</q> ist unbekannt.',
	},
	USER_NOT_IN_ROOM: {
		en: 'You have not yet joined the room <q>*</q>.',
		de: 'Du hast den Raum <q>*</q> noch nicht betreten.',
	},
	USER_PONG_SUCCESS: {
		en: 'Connection to * was verified.',
		de: 'Verbindung zu * wurde verifiziert.',
	},
	USER_PONG_FAILURE: {
		en: 'Connection to * could not be verified. The user was removed from the chat.',
		de: 'Verbindung zu * konnte nicht verifiziert werden. Der Benutzer wurde vom Chat entfernt.',
	},
	USER_UNNAMED: {
		en: 'The user has not yet chosen a name.',
		de: 'Der Benutzer hat noch keinen Namen gewählt.',
	},


	/*
	 * EXPERIMENTAL / FUN STUFF
	 */
	BTN_EMBED_MEDIA_FILE: {
		en: 'Embed',
		de: 'Einbetten',
	},
	BTN_REMOVE_EMBED: {
		en: 'Remove',
		de: 'Entfernen',
	},
	UNKNOWN_DICE_TYPE: {
		en: 'Unknown dice type. Known types: w2, w4, w6, w8, w10, w12, w20.',
		en: 'Unbekannter Würfeltyp. Bekannte typen: w2, w4, w6, w8, w10, w12, w20.',
	},
	USER_ROLLS_DICE: {
		en: 'User * rolls *w*: *',
		de: 'Benutzer * würfelt *w*: *',
	},

}; // TEXT


export const HELP_TEXT = {
	[SERVER_COMMANDS.NICK]: {
		en: '/nick <new name>\\Changes the user name.',
		de: '/nick <new name>\\Ändert den Benutzernamen.',
	},
	[SERVER_COMMANDS.MSG]: {
		en: '/msg <user name> <message>\\Sends a private message to another user.',
		de: '/msg <Benutzername> <Nachricht>\\Schickt eine private Nachricht an einen anderen Bentutzer.',
	},
	[SERVER_COMMANDS.ATTENTION]: {
		en: '/attention <user name>\\Ask user for attention.',
		de: '/attention <Benutzername>\\Benutzer um Aufmerksamkeit bitten.',
	},
	[SERVER_COMMANDS.INVITE]: {
		en: '/call <user name>\\Invites another user to a call.',
		de: '/call <Benutzername>\\Lädt einen anderen Benutzer zu einem Telefonat ein.',
	},
	[SERVER_COMMANDS.CANCEL]: {
		en: '/cancel [<user name>]\\Revokes an invitation to a call. If more than one users were invited, and no name is given, all invitations will be canceled.',
		de: '/cancel [<Benutzername>]\\Nimmt Einladungen zu einem Telefonat zurück. Wenn mehr als ein Benutzer eingeladen wurde und kein Name angegeben wird, dann werden alle Einladungen zurückgenommen.',
	},
	[SERVER_COMMANDS.REJECT]: {
		en: '/reject [<user name>]\\Rejects an invitation to a call. If several invitations are pending, select which one to reject by adding the user\'s name. If no user name is given, all invites will be canceled.',
		de: '/reject [<Benutzername>]\\Weist eine Einladung zu einem Telefonat zurück. Wenn mehrere Einladungen aktiv sind, und kein Name angegeben wird, dann werden alle Einladungen zurückgewiesen.',
	},
	[SERVER_COMMANDS.ACCEPT]: {
		en: '/accept [<user name>]\\Starts a call, you were invited to. If several invites exist, select which one to start by adding the user\'s name. If no user name is given, the most recent invite will be accepted.',
		de: '/accept [<Benutzername>]\\Startet ein Telefonat, zu dem du eingeladen wurdest. Wenn mehrere Einladungen existieren und keine Benutzername angegeben wird, werden Verbindungen zu allen einladenden Benutzern aufgebaut.',
	},
	[SERVER_COMMANDS.HANG_UP]: {
		en: '/hangup [<user name>]\\Ends a call. If no user name is given, all active calls will be terminated.',
		de: '/hangup [<Benutzername>]\\Beendet ein Telefonat. Wenn kein Name angegeben wird, werden alle aktiven Telefonate beendet.',
	},
	[SERVER_COMMANDS.LIST_ROOMS]: {
		en: '/rooms\\List all chat rooms and associated users.',
		de: '/rooms\\Zeigt alle Chaträume und die jeweiligen Benutzer.',
	},
	[SERVER_COMMANDS.JOIN_ROOM]: {
		en: '/join <room name>\\Joins/creates a room.',
		de: '/join <Raumname>\\Betritt/öffnet einen Raum.',
	},
	[SERVER_COMMANDS.LEAVE_ROOM]: {
		en: '/leave\\Closes the current room\'s tab.',
		de: '/leave\\Verlassen des aktuellen Raumes',
	},
	[SERVER_COMMANDS.TOPIC]: {
		en: '/topic [<new topic>]\\Shows/changes the topic for the current room.',
		de: '/topic [<Neues Thema>]\\Zeigst/ändert das Thema des aktuellen Raumes.',
	},
	[SERVER_COMMANDS.KICK]: {
		en: '/kick <user name>\\Remove a user from a chat room.',
		de: '/kick <Benutzername>\\Entfernt einen Benutzer aus einem Chatraum.',
	},
	[SERVER_COMMANDS.STATUS]: {
		en: '/status\\Show statistics, including pending VoIP/video chat invites from and to other users.',
		de: '/status\\Zeigt Benutzerstatistik, wie z. B. aktive Einladungen und Telefonate.',
	},


	[CLIENT_COMMANDS.CLEAR]: {
		en: '/clear [embed]\\Removes all text or embedded media from the current page.',
		de: '/clear [embed]\\Entfernt allen Text oder eingebettete Mediendateien von der aktuellen Seite.',
	},
	[CLIENT_COMMANDS.HELP]: {
		en: '/help [all]\\Shows this list.',
		de: '/help [all]\\Zeigt diese Liste.',
	},
	[CLIENT_COMMANDS.MANUAL]: {
		en: '/manual\\Shows the Curia Chat manual.',
		de: '/manual\\Öffnet das Handbuch für den Curia Chat.',
	},
	[CLIENT_COMMANDS.USER_PROFILE]: {
		en: '/profile\\Shows the user\'s profile settings.',
		de: '/profile\\Öffnet das Benutzerprofil.',
	},
	[CLIENT_COMMANDS.USER_LIST]: {
		en: '/users\\Toggles the list of users connected to the chat.',
		de: '/users\\Zeigt/versteckt die Liste der eingeloggten Benutzer.',
	},
	[CLIENT_COMMANDS.LIST_DEVICES]: {
		en: '/devices\\Lists all available input devices.',
		de: '/devices\\Zeigt alle verfügbaren Eingabegeräte.',
	},
	[CLIENT_COMMANDS.ENABLE_DEVICE]: {
		en: '/enable [camera | screen | microphone]\\Activates device for use in video calls.',
		de: '/enable [camera | screen | microphone]\\Aktiviert ein Gerät für Telefonate.',
	},
	[CLIENT_COMMANDS.DISABLE_DEVICE]: {
		en: '/disable [camera | screen | microphone]\\Stops using device in video calls.',
		de: '/disable [camera | screen | microphone]\\Deaktiviert ein Gerät für Telefonate.',
	},
	[CLIENT_COMMANDS.RTC_STATS]: {
		en: '/rtcstats\\Shows information about the current WebRTC connection.',
		de: '/rtcstats\\Zeigt Informationen über die aktuelle WebRTC-Verbindung.',
	},
	[CLIENT_COMMANDS.AUDIO_ANALYSER]: {
		en: '/analyser [on | off]\\Shows/removes visialisation of current audio streams.\\CTRL+ALT+A',
		de: '/analyser [on | off]\\Zeigt/entfernt Visualisierung aller aktiven Audiostreams.\\CTRL+ALT+A',
	},
	[CLIENT_COMMANDS.ROTATE_SCREEN]: {
		en: '/rotate\\Rotates the screen by 90°.\\CTRL+ALT+R',
		de: '/rotate\\Dreht den Bildschirm um 90°.\\CTRL+ALT+R',
	},

	[SERVER_COMMANDS.ROLL_DICE]: {
		en: '/roll [<amount>[W<faces>]]\\Roll dice. Example: /roll 2w8 rolls 2 dice with 8 faces.',
		de: '/roll [<amount>[W<faces>]]\\Würfelt. Beispiel: /roll 2w8 würfelt 2 acht-seitige Würfel.',
	},
	[CLIENT_COMMANDS.ORF_NEWS]: {
		en: '/orf [speak]\\Show headlines from orf.at, optionally use text-to-speech to read them.',
		de: '/orf [speak]\\Zeige Schlagzeilen von orf.at, verwende optional einen Sprachsynthesizer zum Vorlsesen.',
	},

}; // HELP_TEXT


// tabbedPages will try to use *:title, if null was given as topic
export const ROOM_NAMES = {
	':log': {
		en: 'Log',
		de: 'Log',
	},
	':log:title': {
		en: 'The system log shows various debugging information',
		de: 'Der Systemlog zeigt diverse Debuginformationen',
	},
	':errors': {
		en: 'Errors',
		de: 'Fehler',
	},
	':errors:title': {
		en: 'The error log shows error messages of all connected users',
		de: 'Der Fehlerlog zeigt Fehlermeldungen aller verbundenen Benutzer',
	},
	main_room: {
		en: 'Aula',
		de: 'Aula',
	},
	yard: {
		en: 'Yard',
		de: 'Pausenhof',
	},
	class_room: {
		en: 'Class',
		de: 'Klassenzimmer',
	},

	':manual': {
		en: 'Manual',
		de: 'Handbuch',
	},
	':users': {
		en: 'Users',
		de: 'Benutzer',
	},
	':users:title': {
		en: 'List of all users connected to the chat',
		de: 'Liste aller zum Chat verbundenen Benutzer',
	},
	':preferences': {
		en: 'Preferences',
		de: 'Einstellungen',
	},
	':preferences:title': {
		en: 'Configures the chat client',
		de: 'Konfiguriert das Clientprogramm',
	},
	':profile': {
		en: 'Profile',
		de: 'Profil',
	},
	':profile:title': {
		en: 'Personal information about you',
		de: 'Persönliche Informationen über dich',
	},

}; // ROOM_NAMES


//EOF