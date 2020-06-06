// preferences.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from '../helpers.js';

import { PROGRAM_VERSION, PREFERENCES_FORMAT_VERSION, DEBUG, CHAT_EVENTS, REQUEST, ROOMS } from '../constants.js';
import { localized } from '../localize.js';


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// PREFERENCES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * EditPreferences
 */
const EditPreferences = function (app, chat, prefs) {
	const self = this;

	this.containerElement;


	/**
	 * on_master_change()
	 */
	function on_master_change (event) {
		const new_volume = event.target.value;

		chat.synth.setVolume( new_volume );

		prefs.masterVolume = new_volume;
		prefs.setChangesUnsaved();

	} // on_master_change


	/**
	 * on_master_mouseup()
	 */
	function on_master_mouseup (event) {
		const input = event.target;

		on_master_change( event );

		if (event.button == 1) {
			const default_value = input.dataset.defaultValue || 1;
			input.value = default_value;
			on_master_change( event );
		}

		chat.synth.beep( 440, 0, 0.5 );

	} // on_master_mouseup


	/**
	 * on_notification_timeout_change()
	 */
	function on_notification_timeout_change (event) {
		prefs.notificationTimeout = event.target.value;
		prefs.setChangesUnsaved();

	} // on_notification_timeout_change


	/**
	 * on_embed_change()
	 */
	function on_embed_change (event) {
		setTimeout( ()=>{
			prefs.autoEmbedMedia = (event.target.checked);
			prefs.setChangesUnsaved();
		});

	}; // on_embed_change


	/**
	 * on_system_log_change()
	 */
	function on_system_log_change (event) {
		setTimeout( ()=>{
			prefs.systemLog = (event.target.checked);
			prefs.setChangesUnsaved();
		});

	}; // on_system_log_change


	/**
	 * on_remote_errors_change()
	 */
	function on_remote_errors_change (event) {
		setTimeout( ()=>{
			prefs.remoteErrors = (event.target.checked);
			prefs.setChangesUnsaved();
		});

	}; // on_remote_errors_change


	/**
	 * on_submit()
	 */
	function on_submit (event) {
		event.preventDefault();

		chat.preferences.save();

		return false;

	} // on_submit


	/**
	 * update()
	 */
	this.update = function (changes_saved) {
		app.dom.rngMasterVolume       .value = prefs.masterVolume;
		app.dom.rngNotificationTimeout.value = prefs.notificationTimeout;
		app.dom.cbxSystemLog        .checked = prefs.systemLog;
		app.dom.cbxRemoteErrors     .checked = prefs.remoteErrors;

		app.dom.submitPreferencesEdit.classList.toggle( 'disabled', changes_saved );

	}; // update


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement = app.dom.formProfilePreferences;

		/*
		 * Master Volume
		 */
		const master = app.dom.rngMasterVolume;
		master.value = prefs.masterVolume;
		master.addEventListener( 'change',  on_master_change );
		master.addEventListener( 'input',   on_master_change );
		master.addEventListener( 'mouseup', on_master_mouseup );

		/*
		 * Notification Timeout
		 */
		const timeout = app.dom.rngNotificationTimeout;
		timeout.value = prefs.notificationTimeout;
		timeout.addEventListener( 'change', on_notification_timeout_change );
		timeout.addEventListener( 'input',  on_notification_timeout_change );

		/*
		 * Embed Media
		 */
		app.dom.cbxAutoEmbed.checked = (prefs.autoEmbedMedia);
		app.dom.cbxAutoEmbed.addEventListener( 'mouseup', on_embed_change );

		/*
		 * System Log
		 */
		app.dom.cbxSystemLog.checked = (prefs.systemLog);
		app.dom.cbxSystemLog.addEventListener( 'mouseup', on_system_log_change );

		/*
		 * Remote Errors
		 */
		app.dom.cbxRemoteErrors.checked = (prefs.remoteErrors);
		app.dom.cbxRemoteErrors.addEventListener( 'mouseup', on_remote_errors_change );


		app.dom.formPreferencesEdit.addEventListener( 'submit',  on_submit );

		self.update();

	}; // init


	// CONSTRUCTOR

	self.init();

}; // EditPreferences


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// EVENTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * EditEvents
 */
const EditEvents = function (app, chat, prefs) {
	const self = this;

	this.containerElement;


	/**
	 * on_preference_change()
	 */
	function on_preference_change (event) {
		const chat_event_name = event.target.dataset.chatEvent;
		if (chat_event_name == undefined) return;

		const input = event.target;

		switch (event.target.type) {
		case 'checkbox':
			if (event.type == 'input') return;
			const type = input.dataset.eventType;
			prefs.events[chat_event_name][type] = input.checked;
			prefs.setChangesUnsaved();
			break;

		case 'range':
			prefs.events[chat_event_name].volume = input.value;
			prefs.setChangesUnsaved();
			break;
		}

	} // on_preference_change


	/**
	 * on_preference_mouseup()
	 */
	function on_preference_mouseup (event) {
		if (event.button == 2) return;

		const chat_event_name = event.target.dataset.chatEvent;
		if (chat_event_name == undefined) return;

		const input = event.target;

		if (input.type == 'range') {
			if (event.button == 1) {
				const default_value = input.dataset.defaultValue || 1;
				input.value = default_value;
				on_preference_change( event );
			}

			chat.synth.playEventSound( CHAT_EVENTS[chat_event_name] );
		}

	} // on_preference_mouseup


	/**
	 * on_submit()
	 */
	function on_submit (event) {
		event.preventDefault();

		chat.preferences.save();

		return false;

	} // on_submit


	/**
	 * update()
	 */
	this.update = function (changes_saved) {
		const fragment = document.createDocumentFragment();

		const tr = document.createElement( 'tr' );
		tr.innerHTML
		= '<tr><th title="'
		+ localized( 'TITLE_PREFERENCES_EVENT' )
		+ '">'
		+ localized( 'TH_PREFERENCES_EVENT' ).replace( / /, '<br>' )
		+ '</th><th title="'
		+ localized( 'TITLE_PREFERENCES_VOLUME' )
		+ '">'
		+ localized( 'TH_PREFERENCES_VOLUME' ).replace( / /, '<br>' )
		+ '</th><th title="'
		+ localized( 'TITLE_PREFERENCES_BLINK_TAB' )
		+ '">'
		+ localized( 'TH_PREFERENCES_BLINK_TAB' ).replace( / /, '<br>' )
		+ '</th><th title="'
		+ localized( 'TITLE_PREFERENCES_BLINK_ICON' )
		+ '">'
		+ localized( 'TH_PREFERENCES_BLINK_ICON' ).replace( / /, '<br>' )
		+ '</th><th title="'
		+ localized( 'TITLE_PREFERENCES_NOTIFY' )
		+ '">'
		+ localized( 'TH_PREFERENCES_NOTIFY' ).replace( / /, '<br>' )
		+ '</th></tr>'
		;

		fragment.appendChild( tr );

		for (let key in prefs.events) {
			const tr    = document.createElement( 'tr' );
			const td0   = document.createElement( 'td' );
			const td1   = document.createElement( 'td' );
			const td2   = document.createElement( 'td' );
			const td3   = document.createElement( 'td' );
			const td4   = document.createElement( 'td' );
			const volume    = document.createElement( 'input' );
			const blinkIcon = document.createElement( 'input' );
			const blinkTab  = document.createElement( 'input' );
			const notify    = document.createElement( 'input' );
			fragment.appendChild( tr );
			tr      .appendChild( td0 );
			tr      .appendChild( td1 );
			tr      .appendChild( td2 );
			tr      .appendChild( td3 );
			tr      .appendChild( td4 );
			td1     .appendChild( volume );
			td2     .appendChild( blinkTab );
			td3     .appendChild( blinkIcon );
			td4     .appendChild( notify );

			td0.innerHTML = key;

			volume.type = 'range';
			volume.min = 0;
			volume.max = 1;
			volume.step = 'any';
			volume.value = prefs.events[key].volume;
			volume.dataset.defaultValue = 0.5;
			volume.dataset.chatEvent = key;
			volume.dataset.eventType = 'volume';

			blinkTab.type = 'checkbox';
			blinkTab.checked = prefs.events[key].blinkTab;
			blinkTab.dataset.chatEvent = key;
			blinkTab.dataset.eventType = 'blinkTab';

			blinkIcon.type = 'checkbox';
			blinkIcon.checked = prefs.events[key].blinkIcon;
			blinkIcon.dataset.chatEvent = key;
			blinkIcon.dataset.eventType = 'blinkIcon';

			notify.type = 'checkbox';
			notify.checked = prefs.events[key].notify;
			notify.dataset.chatEvent = key;
			notify.dataset.eventType = 'notify';
		}

		app.dom.tablePreferencesEvents.innerHTML = '';
		app.dom.tablePreferencesEvents.appendChild( fragment );

		app.dom.submitPreferencesEvents.classList.toggle( 'disabled', changes_saved );

	}; // update


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement = app.dom.formProfilePreferences;

		self.update();

		app.dom.tablePreferencesEvents.addEventListener( 'change',  on_preference_change );
		app.dom.tablePreferencesEvents.addEventListener( 'input',   on_preference_change );
		app.dom.tablePreferencesEvents.addEventListener( 'mouseup', on_preference_mouseup );
		app.dom.formPreferencesEvents .addEventListener( 'submit',  on_submit );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // EditEvents


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MAIN
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * Preferences()
 */
export const Preferences = function (app, chat) {
	const self = this;

	this.containerElement;
	this.pages;

	this.version;

	this.notificationTimeout;
	this.avatar;
	this.masterVolume;
	this.autoEmbedMedia;

	this.systemLog;
	this.remoteErrors;

	this.events;


	var changes_saved = false;


	/**
	 * gatherPreferences()
	 */
	this.gatherPreferences = function () {
		const dont_add = ['containerElement', 'pages'];
		const data = {};

		for (let key in self) {
			if( (! (self[key] instanceof Function))
			&&  (dont_add.indexOf( key ) < 0)
			) {
				data[key] = self[key];
			}
		}

		return data;

	} // self.gatherPreferences


	/**
	 * save_to_local_storage()
	 */
	function save_to_local_storage () {
		const preferences = self.gatherPreferences();

		if (DEBUG.PREFERENCES) {
			console.groupCollapsed( 'Saving preferences to local storage' );
			console.log( preferences );
			console.groupEnd();
		}

		localStorage.setItem( 'curia_preferences', JSON.stringify( preferences ) );

	}; // save_to_local_storage


	/**
	 * load_from_local_storage()
	 */
	function load_from_local_storage () {
		const json = localStorage.getItem( 'curia_preferences' );

		if (json !== null) {
			const preferences = JSON.parse( json );

			if (DEBUG.PREFERENCES) {
				console.groupCollapsed( 'Loaded preferences from local storage' );
				console.log( preferences );
				console.groupEnd();
			}

			for (let key in preferences) {
				self[key] = preferences[key];
			}

			if (chat.profile != undefined) {
				self.update();
			}
		}

	} // load_from_local_storage


	/**
	 * send_to_server()
	 */
	function send_to_server () {
		const preferences = self.gatherPreferences();

		if (DEBUG.PREFERENCES) {
			console.groupCollapsed( 'Sending preferences to server' );
			console.log( preferences );
			console.groupEnd();
		}

		chat.sendMessage(
			REQUEST.STORE_PREFERENCES,
			preferences,
		);

	} // send_to_server


	/**
	 * receive_from_server()
	 */
	function receive_from_server (data) {
		if (DEBUG.PREFERENCES) {
			console.groupCollapsed( 'Received preferences from server' );
			console.log( data );
			console.groupEnd();
		}

		for (let key in data) {
			self[key] = data[key];
		}

	}; // receive_from_server


	/**
	 * save()
	 */
	this.save = function () {
		if (chat.account == null) {
			save_to_local_storage();
		} else {
			send_to_server();
		}

		changes_saved = true;
		self.update();

	}; // save


	/**
	 * load()
	 */
	this.load = function (data_from_server = null) {
		if (data_from_server) {
			receive_from_server( data_from_server );
		} else {
			load_from_local_storage();
		}

		changes_saved = true;
		self.update();

	} // load


	/**
	 * show()
	 */
	this.show = function (page_name, activate, force_visible = false) {
		const visible = chat.ui.toggleTabVisibility( ':preferences', activate, force_visible );

		let form_id    = null;
		let button_id  = null;

		switch (page_name) {
		case 'edit'   :  form_id = 'preferences_edit';    button_id="btnPreferencesEdit";    break;
		case 'events' :  form_id = 'preferences_events';  button_id="btnPreferencesEvents";  break;
		default:
			throw new Error( 'Preferences: show: Unknwon page "' + page_name + '"' );
		}

		app.dom.ulPreferencesMenu.querySelectorAll( 'button' ).forEach( (button)=>{
			button.classList.toggle( 'highlight', (button.id == button_id) );
		});

		self.containerElement.querySelectorAll( 'form' ).forEach( (form)=>{
			form.classList.toggle( 'hidden', form.id != form_id );

			const page = self.pages[page_name];

			if ((form.id == form_id) && (page.onShow)) {
				page.onShow();
			}
		});

	}; // show


	/**
	 * on_menu_button_click
	 */
	function on_menu_button_click (event) {
		self.show( event.target.dataset.show, /*activate*/true, /*force_visible*/true );

	}; //on_menu_button_click


	/**
	 * update()
	 */
	this.update = function () {
		if (self.version != PREFERENCES_FORMAT_VERSION) {
			self.reset( /*hard*/true );

			chat.showMessage(
				localized( 'PREFERENCES_VERSION_MISMATCH' ),
				ROOMS.LOG_AND_CURRENT,
				'warning'
			);
		}

		for (let key in self.pages) {
			const page = self.pages[key];

			if (page.update != undefined) {
				page.update( changes_saved );
			}
		};

	}; // update


	/**
	 * setChangesUnsaved()
	 */
	this.setChangesUnsaved = function () {
		changes_saved = false;
		self.update();

	}; // setChangesUnsaved


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * reset()
	 */
	this.reset = function (hard = false) {
		self.version             = PREFERENCES_FORMAT_VERSION;
		self.avatar              = null,
		self.masterVolume        = 0.5;
		self.notificationTimeout = 0.5;
		self.autoEmbedMedia      = true;
		self.systemLog           = true;
		self.remoteErrors        = true;
		self.events              = {};

		/*
		 * Get Events defaults
		 */
		for (let key in CHAT_EVENTS) {
			const definition = CHAT_EVENTS[key];
			self.events[key] = {
				volume    : 0.5,
				blinkIcon : definition.blinkIcon,
				blinkTab  : definition.blinkTab,
				notify    : definition.notify,
			};
		}

		/*
		 * Triggered with /resetprefs
		 */
		if (hard) {
			console.log( 'Preferences were hard-reset:' );
			const prefs_without_events = Helpers.clone( self.gatherPreferences() );
			delete prefs_without_events.events;

			console.table( prefs_without_events );
			console.table( self.events );
			self.pages.events.update();
			self.save();
		}

		changes_saved = true;
		self.update();

	}; // reset


	/**
	 * localize()
	 */
	function localize () {
		/*
		 * Menu
		 */
		app.dom.btnPreferencesEdit  .innerHTML = localized( 'BTN_PREFERENCES_EDIT_CAPTION'   );
		app.dom.btnPreferencesEvents.innerHTML = localized( 'BTN_PREFERENCES_EVENTS_CAPTION' );
		app.dom.btnPreferencesEdit  .title     = localized( 'BTN_PREFERENCES_EDIT_TITLE'   );
		app.dom.btnPreferencesEvents.title     = localized( 'BTN_PREFERENCES_EVENTS_TITLE' );

		/*
		 * Preferences
		 */
		app.dom.labelMasterVolume       .innerHTML = localized( 'LABEL_PREFERENCES_MASTER_VOLUME' );
		app.dom.labelNotificationTimeout.innerHTML = localized( 'LABEL_PREFERENCES_NOTIFICATION_TIMEOUT' );
		app.dom.labelAutoEmbed          .innerHTML = localized( 'LABEL_PREFERENCES_EMBED_MEDIA' );
		app.dom.labelSystemLog          .innerHTML = localized( 'LABEL_PREFERENCES_SYSTEM_LOG' );
		app.dom.labelRemoteErrors       .innerHTML = localized( 'LABEL_PREFERENCES_REMOTE_ERRORS' );
		app.dom.submitPreferencesEdit   .innerHTML = localized( 'BTN_PREFERENCES_EDIT_SUBMIT' );

		/*
		 * Events
		 */
		app.dom.submitPreferencesEvents.innerHTML = localized( 'BTN_PREFERENCES_EVENTS_SUBMIT' );

	} // localize


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement = app.dom.divPreferences;
		localize();

		self.reset();

		self.pages = {
			edit   : new EditPreferences( app, chat, self ),
			events : new EditEvents     ( app, chat, self ),
		};

		app.dom.divPreferences.querySelectorAll( '.menu button' ).forEach( (button)=>{
			button.addEventListener( 'mouseup', on_menu_button_click );
		});

		load_from_local_storage();

		setTimeout( self.update );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // Preferences


//EOF