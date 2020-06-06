// user_interface.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import {
	PROGRAM_NAME, PROGRAM_VERSION, DEBUG, SETTINGS, CHAT_CONNECTION,
	ICON_DATA, COMMAND_BUTTONS, ROOMS, CHAT_EVENTS,

} from '../constants.js';

import { localized      } from '../localize.js';
import { KnobController } from '../ui/knobs.js';
import { CommandButtons } from '../ui/command_buttons.js';
import { TabbedPages    } from '../ui/tabbed_pages.js';
import { Notifications  } from '../ui/notifications.js';
import { History        } from '../extensions/history.js';


/**
 * UserInterface
 */
export const UserInterface = function (app, chat) {
	const self = this;

	this.hasFocus;

	this.alertIconNr;
	this.iconInterval;

	this.notifications;

	self.tabbedPages    = new TabbedPages( app, chat );
	self.commandButtons = new CommandButtons( app, chat );


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MISCELLANEOUS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * toggleLoginForm()
	 */
	this.toggleLoginForm = function (show_login) {
		app.dom.formLogin.classList.toggle( 'hidden', !show_login );

		app.dom.formInput  .classList.toggle( 'hidden', show_login );
		app.dom.divVideos  .classList.toggle( 'hidden', show_login );
		app.dom.divCommands.classList.toggle( 'hidden', show_login );

	} // toggleLoginForm


	/**
	 * toggleInputForm()
	 */
	this.toggleInputForm = function (show_form) {
		const hide = (chat.connectionState != CHAT_CONNECTION.ONLINE) || (! show_form);
		app.dom.formInput.classList.toggle( 'hidden', hide );

	} // toggleInputForm


	/**
	 * focusInput()
	 */
	this.focusInput = function () {
		setTimeout( ()=>{
			app.dom.inputText.focus();
		});

	}; // focusInput


	/**
	 * scrollDown()
	 */
	this.scrollDown = function () {
		app.dom.divTabPages.querySelectorAll( '.page' ).forEach( (element)=>{
			if (element.dataset.scrolling != "false") {
				element.scrollTop += 99999;
			}
		});

	}; // scrollDown


	/**
	 * setIconAlert()
	 */
	this.setIconAlert = function (alert_enabled, chat_event) {
		if (alert_enabled && chat.preferences.events[chat_event.key].blinkIcon) {
			if (self.iconInterval === null) {
				self.alertIconNr = 0;
				self.iconInterval = setInterval( ()=>{
					self.alertIconNr = ++self.alertIconNr & 1;
					app.dom.linkFavicon.href
					= (self.alertIconNr)
					? ICON_DATA.ALERT
					: ICON_DATA.CURIA
					;
				}, 700);
			}
		} else {
			if (self.iconInterval !== null) {
				clearInterval( self.iconInterval );
				self.iconInterval = null;
				app.dom.linkFavicon.href = ICON_DATA.CURIA;
			}
		}

	}; // setIconAlert


	/**
	 * setIconOffline()
	 */
	this.setIconOffline = function (offline) {
		app.dom.linkFavicon.href = (offline) ? ICON_DATA.OFFLINE : ICON_DATA.CURIA;

	}; // setIconOffline


	/**
	 * hintAtElement()
	 */
	this.hintAtElement = function (element) {
		element.classList.remove( 'hint_at' );

		setTimeout( ()=>{
			element.classList.add( 'hint_at' );
			setTimeout( ()=>{
				element.classList.remove( 'hint_at' );
			}, 2500);
		}, 50);

	}; // hintAtElement


	/**
	 * hintAtSelector()
	 */
	this.hintAtSelector = function (selector) {
		setTimeout( ()=>{
			document.body.querySelectorAll( selector ).forEach( (element)=>{
				element.classList.add( 'hint_at' );
				setTimeout( ()=>{
					element.classList.remove( 'hint_at' );
				}, 500);
			});
		}, 50);

	}; // hintAtSelector


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// COMMAND BUTTONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	this.addCommandButton    = self.commandButtons.addCommandButton;
	this.removeCommandButton = self.commandButtons.removeCommandButton;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// TABS, ROOMS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	this.moveTabContent      = self.tabbedPages.moveTabContent;
	this.toggleTabVisibility = self.tabbedPages.toggleTabVisibility;

	this.findTab     = self.tabbedPages.findTab;
	this.raiseTab    = self.tabbedPages.raiseTab;
	this.raiseTabNr  = self.tabbedPages.raiseTabNr;
	this.addTab      = self.tabbedPages.addTab;
	this.updateTab   = self.tabbedPages.updateTab;
	this.closeTab    = self.tabbedPages.closeTab;
	this.renamePmTab = self.tabbedPages.renamePmTab;

	this.findPageElement      = self.tabbedPages.findPageElement;
	this.getActivePageElement = self.tabbedPages.getActivePageElement;
	this.getActiveRoomName    = self.tabbedPages.getActiveRoomName;
	this.roomExists           = self.tabbedPages.roomExists;
	this.appendToRoomElement  = self.tabbedPages.appendToRoomElement;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// RESIZERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_element_resize()
	 */
	function on_element_resize (event) {
		if (! event.target.classList.contains( 'resizer' )) return;
		if (event.button != 0) return;

		const resizer = event.target;
		const parent  = resizer.parentNode;

		const resize_direction = (resizer.classList.contains( 'vertical' ) ? 'vertical' : 'horizontal');
		const resize_invert_x = resizer.dataset.invertX  || false;
		const resize_invert_y = resizer.dataset.invertY  || false;
		const collapse_below  = resizer.dataset.collapse || 100;

		const start_x = event.screenX;   const start_width  = parent.offsetWidth;
		const start_y = event.screenY;   const start_height = parent.offsetHeight;

		function on_mouse_move (event) {
			var delta_x, delta_y;

			if (resize_invert_x) {
				delta_x = event.screenX - start_x;
			} else {
				delta_x = start_x - event.screenX;
			}

			if (resize_invert_y) {
				delta_y = start_y - event.screenY;
			} else {
				delta_y = event.screenY - start_y;
			}

			switch (resize_direction) {
			case 'horizontal':
				let new_width = start_width + delta_x;
				parent.classList.toggle( 'collapsed', (new_width < collapse_below) );
				parent.style.width  = new_width + 'px';
			break;
			case 'vertical':
				let new_height = start_height + delta_y;
				parent.classList.toggle( 'collapsed', (new_height < collapse_below) );
				parent.style.height = new_height + 'px';
			break;
			default: throw new Error( 'ChatClient: on_element_resize: Parent node has no resize mode' );
			}

			chat.onResize();
		}

		function on_mouse_up (event) {
			if ((event.screenX == start_x) && (event.screenY == start_y)) {
				event.target.parentNode.classList.toggle( 'collapsed' );
			}

			removeEventListener( 'mousemove', on_mouse_move );
			removeEventListener( 'mouseup', on_mouse_up );
			document.body.classList.remove( 'noselect' );

			chat.onResize();

			event.stopPropagation();
			event.preventDefault();
		}

		addEventListener( 'mousemove', on_mouse_move );
		addEventListener( 'mouseup', on_mouse_up );
		document.body.classList.add( 'noselect' );

	} // on_element_resize


	/**
	 * on_knob_change()
	 */
	function on_knob_change (event) {
		//console.log( event );

	} // on_knob_change


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// FLOATING WINDOWS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_floating_window_mouse_down()
	 */
	function on_floating_window_mouse_down (event) {
		if (event.target.classList.contains( 'floating_window' )) {
			const floating_window = event.target;

			const start_left = floating_window.offsetLeft;
			const start_top  = floating_window.offsetTop;
			const start_x = event.screenX;
			const start_y = event.screenY;

			function on_mouse_move (event) {
				const delta_x = event.screenX - start_x;
				const delta_y = event.screenY - start_y;

				floating_window.style.left = (start_left + delta_x) + 'px';
				floating_window.style.top  = (start_top  + delta_y) + 'px';
			}

			function on_mouse_up (event) {
				removeEventListener( 'mousemove', on_mouse_move );
				removeEventListener( 'mouseup', on_mouse_up );

				document.body.classList.remove( 'noselect' );
			}

			addEventListener( 'mousemove', on_mouse_move );
			addEventListener( 'mouseup', on_mouse_up );

			document.body.classList.add( 'noselect' );
		}

	} // on_floating_window_mouse_down


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = function () {
		self.alertIconNr  = null;
		self.iconInterval = null;

		self.knobs = new KnobController( app );
		addEventListener( "change", on_knob_change );

		self.notifications = new Notifications(app, chat);

		self.hasFocus = true;
		addEventListener( 'mousemove', ()=>{ self.hasFocus = true; } );
		addEventListener( 'focus', ()=>{ self.hasFocus = true; } );
		addEventListener( 'blur', ()=>{ self.hasFocus = false; } );

		addEventListener( 'mousedown', on_floating_window_mouse_down );

		document.querySelectorAll( '.resizer' ).forEach( (element)=>{
			element.addEventListener( 'mousedown', on_element_resize );
		});

	}; // init;


	// CONSTRUCTOR

	self.init();

}; // UserInterface


//EOF