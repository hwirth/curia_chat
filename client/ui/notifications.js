// notifications.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from '../helpers.js';

import { SETTINGS, CHAT_EVENTS, ICON_DATA } from '../constants.js';
import { localized } from '../localize.js';


/**
 * Notification()
 */
const Notification = function (app, chat, container_element, chat_event, params) {
	const self = this;

	this.containerElement;
	this.element;
	this.timeout;


	/**
	 * on_close()
	 */
	function on_close (event) {
		if( (event != undefined)
		&&  ((event.target.tagName == 'A') || (event.target.tagName == 'BUTTON'))
		) {
			return;
		}

		if (self.timeout !== null) {
			clearTimeout( self.timeout );
		}

		self.element.removeEventListener( 'mouseup', on_close );
		self.element.classList.add( 'faded' );

		setTimeout( ()=>{
			self.element.parentNode.removeChild( self.element );

			self.containerElement = null;
			self.element = null;
			self.timeout = null;

		}, 1000*SETTINGS.NOTIFICATIONS.FADE_TIME);

	} // on_close


	/**
	 * init()
	 */
	this.init = function (container_element, chat_event, params = []) {
		if (typeof params == 'string') params = [params];

		const index   = chat_event.key;
		const icon    = CHAT_EVENTS[index].icon;
		const heading = localized( 'EVENT_HEADING_' + index, ...params );
		const text    = localized( 'EVENT_TEXT_' + index, ...params );

		const li  = document.createElement( 'li' );
		const img = document.createElement( 'img' );
		const h2  = document.createElement( 'h2' );
		const p   = document.createElement( 'p' );

		li.className = 'faded';
		li.appendChild( img );
		li.appendChild( h2 );
		li.appendChild( p );

		img.src = ICON_DATA[icon];
		h2.innerHTML = heading;
		p.innerHTML = text;

		setTimeout( ()=>li.classList.remove( 'faded' ) );

		const delay
		= SETTINGS.NOTIFICATIONS.TIMEOUT
		* chat.preferences.notificationTimeout
		* CHAT_EVENTS[chat_event.key].time
		;

		self.timeout = setTimeout( on_close, delay );
		li.addEventListener( 'mouseup', on_close );

		container_element.appendChild( li );
		self.element = li;

	}; // init


	// CONSTRUCTOR

	self.init( container_element, chat_event, params );

}; // Notification


/**
 * Notifications()
 */
export const Notifications = function (app, chat) {
	const self = this;

	this.containerElement;


	/**
	 * showChatEvent()
	 */
	this.showChatEvent = function (chat_event, params) {
		/*
		 * Defer notification in case we get early errors or warnings
		 */
		setTimeout( ()=>{
			if (chat.preferences.events[chat_event.key].notify !== false) {
				new Notification( app, chat, self.containerElement, chat_event, params );
			}
		});

	}; // showChatEvent


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement = app.dom.ulNotifications;

		Helpers.setDynamicStyle( '--notification-fade-time', SETTINGS.NOTIFICATIONS.FADE_TIME + 's' );

	}; // init


	// CONSTRUCTOR

	self.init();


}; // Notifications


//EOF