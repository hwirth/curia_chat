// tabbed_pages.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import {
	PROGRAM_NAME, PROGRAM_VERSION, DEBUG, SETTINGS, CHAT_CONNECTION,
	ICON_DATA, COMMAND_BUTTONS, TAB_DEFINITION, ROOMS,

} from '../constants.js';

import { localized, localized_room_name, ROOM_NAMES } from '../localize.js';
import { History } from '../extensions/history.js';


/**
 * TabbedPages
 */
export const TabbedPages = function (app, chat) {
	const self = this;

	this.containerElement;
	this.tabHistory;


	/**
	 * move_content_to_first_page()
	 */
	function move_content_to_first_page (new_page) {
		if (DEBUG.TABS) console.log( 'TabbedPages: Moving previous content to first room' );

		const move_nodes = [];

		app.dom.divTabPages.childNodes.forEach( (node)=>{
			if ((node.classList == undefined) || (! node.classList.contains( 'no_page' ))) {
				move_nodes.push( node );
			}
		});

		move_nodes.forEach( (node)=>{
			new_page.appendChild( node );
		});

		app.dom.divTabPages.classList.add( 'has_tabs' );

	} // move_content_to_first_page


	/**
	 * moveTabContent()
	 */
	this.moveTabContent = function (page, page_name = null) {
		if (DEBUG.TABS) {
			console.groupCollapsed( 'TabbedPages: moveTabContent: Tab:', page_name );
			console.trace();
			console.groupEnd();
		}

		if (page_name === null) {
			page.classList.add( 'hidden' );

		} else {
			const page = self.findPageElement( page_name );

			if (page === null) {
				throw new Error( 'TabbedPages: moveTabContent: Page not found:', page_name );
			} else {
				page.appendChild( content );
				page.classList.remove( 'hidden' );
			}
		}

	} // moveTabContent


	/**
	 * toggleTabVisibility()
	 */
	this.toggleTabVisibility = function (page_name, show_tab = null, force_visible = false) {
		const definition = TAB_DEFINITION[page_name];
		const content    = app.dom[definition.domName];

		const tab = chat.ui.findTab( page_name );

		if (force_visible && tab && tab.classList.contains( 'active' )) {
			return;
		}

		if ( (tab === null) || (! tab.classList.contains( 'active' )) ) {
			chat.ui.addTab( page_name, localized_room_name( page_name ), null, show_tab );
			const page = chat.ui.findPageElement( page_name );
			page.appendChild( content );
			content.classList.remove( 'hidden' );

			return true;

		} else {
			content.classList.add( 'hidden' );
			app.dom.divHiddenContent.appendChild( content );
			chat.ui.closeTab( page_name );

			return false;
		}

	}; // toggleTabVisibility


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// TABS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * findTab()
	 */
	this.findTab = function (page_name) {
		if (page_name == undefined) return null;

		page_name = page_name.toLowerCase();

		let found_tab = null;

		self.containerElement.querySelectorAll( '.tab' ).forEach( (element)=>{
			if (element.dataset.roomName.toLowerCase() == page_name) {
				found_tab = element;
			}
		});

		return found_tab;

	}; // findTab


	/**
	 * raiseTab()
	 */
	this.raiseTab = function (page_name, first_tab = false) {
		if (DEBUG.TABS) console.log( 'TabbedPages: raiseTab:', page_name );

		const active_page = self.getActiveRoomName();

		if (!first_tab && (active_page === null)) {
			if (DEBUG.TABS) {
				console.log(
					'%cWARNING%c: TabbedPages: raiseTab: No active tab found.',
					'color:red', 'color:black',
				 );
			}
		}

		if (active_page == page_name) {
			if (DEBUG.TABS) console.log( 'TabbedPages: raiseTab: Tab already raised.' );
		}
		else if (! first_tab) {
			chat.onBlur();
		}

		self.containerElement.querySelectorAll( '.tab' ).forEach( (element)=>{
			element.classList.toggle(
				'active',
				(element.dataset.roomName == page_name)
			);
		});

		app.dom.divTabPages.querySelectorAll( '.page' ).forEach( (element)=>{
			element.classList.toggle(
				'active',
				(element.dataset.roomName == page_name)
			);
		});

		const current_tab = self.findTab( page_name );
		if (current_tab !== null) {
			current_tab.classList.remove( 'alert' );
			current_tab.classList.remove( 'activity' );
			current_tab.classList.remove( 'has_changes' );

			current_tab.scrollIntoView();
		}

		if (DEBUG.TABS) {
			console.log( 'TabbedPages: raiseTab: page_name:', page_name );
		}

		const room_element = self.findPageElement( page_name );
		if (room_element === null) {
			console.log(
				'%cWARNING%c: TabbedPages: raiseTab: room_element is null',
				'color:red', 'color:black',
			);
		}

		chat.ui.focusInput();
		const show_input = (current_tab !== null) && (current_tab.dataset.hideInput != 'true');
		chat.ui.toggleInputForm( show_input );

		setTimeout( chat.ui.scrollDown );


		self.tabHistory.addEntry( page_name );

	}; // raiseTab


	/**
	 * raiseTabNr()
	 */
	this.raiseTabNr = function (number) {
		const page = app.dom.divTabPages.querySelectorAll( '.page' )[number - 1];
		if (page != undefined) self.raiseTab( page.dataset.roomName );

	}; // raiseTabNr


	/**
	 * addTab()
	 */
	this.addTab = function (new_page_name, new_caption, new_topic, activate = false) {
		activate = activate || (self.containerElement.querySelectorAll( '.active' ).length == 0);

		if (DEBUG.TABS) {
			console.log(
				'TabbedPages: addTab:',
				new_page_name,
				new_caption,
				'- activate:',
				activate,
			);
		}

		const tab_element = self.findTab( new_page_name );
		if (tab_element !== null) {
			if (DEBUG.TABS) console.log( 'TabbedPages: addTab: Tab already existing.' );
			if (activate) self.raiseTab( new_page_name );
			return tab_element;
		}

		if (DEBUG.TABS) console.log( 'TabbedPages: addTab: New tab:', new_page_name, new_caption );


		const list_item       = document.createElement( 'li' );
		const caption_element = document.createElement( 'span' );
		const close_button    = document.createElement( 'button' );
		const close_icon      = document.createElement( 'img' );

		list_item     .appendChild( caption_element );
		close_button  .appendChild( close_icon );
		list_item     .appendChild( close_button );
		self.containerElement.appendChild( list_item );

		if ((new_topic === null) && (ROOM_NAMES[new_page_name + ':title'] != undefined)) {
			new_topic = localized_room_name( new_page_name + ':title' );
		}

		list_item.className = 'tab';
		list_item.title     = (new_topic) ? new_topic : '';
		list_item.dataset.roomName = new_page_name;

		close_button.className = 'close';

		close_icon.src = ICON_DATA.CLOSE_TAB;

		caption_element.innerHTML = new_caption;
		caption_element.className = 'caption';

		const new_page = document.createElement( 'div' );

		new_page.className = 'page';
		new_page.dataset.roomName = new_page_name;

		new_page.dataset.scrolling
		= list_item.dataset.scrolling
		= (TAB_DEFINITION[new_page_name] == undefined)
		? true
		: TAB_DEFINITION[new_page_name].scrolling
		;

		new_page.dataset.hideInput
		= list_item.dataset.hideInput
		= (TAB_DEFINITION[new_page_name] == undefined)
		? false
		: TAB_DEFINITION[new_page_name].hideInput
		;

		const nr_tabs = app.dom.divTabPages.querySelectorAll( '.page' ).length;

		if (nr_tabs == 0) {
			move_content_to_first_page( new_page );
		}

		app.dom.divTabPages.appendChild( new_page );

		if (activate) self.raiseTab( new_page_name, /*first_tab*/(nr_tabs == 0) );

		self.tabHistory.addEntry( new_page_name );

		return list_item;

	}; // addTab


	/**
	 * updateTab()
	 */
	this.updateTab = function (page_name, params) {
		const tab_element = self.findTab( page_name );

		if (tab_element === null) throw new Error( 'updateTab: room not found:' + page_name );

		if (params.caption) {
			tab_element.querySelector( '.caption' ).innerHTML = params.caption;
		}

		if (params.title) {
			tab_element.title = params.title;
		}

	}; // updateTab


	/**
	 * closeTab()
	 */
	this.closeTab = function (remove_name) {
		const page_name = remove_name.toLowerCase();

		self.containerElement.querySelectorAll( '.tab' ).forEach( (element)=>{
			if (element.dataset.roomName.toLowerCase() == page_name) {
				self.containerElement.removeChild( element );
			}
		});

		app.dom.divTabPages.querySelectorAll( '.page' ).forEach( (element)=>{
			if (element.dataset.roomName.toLowerCase() == page_name) {
				app.dom.divTabPages.removeChild( element );
			}
		});

		self.tabHistory.removeEntry( remove_name );

		const previous_room = self.tabHistory.previousEntry();

		if (DEBUG.TABS) console.log( 'TabbedPages: closeTab: previous_room:', previous_room );

		self.raiseTab( previous_room );

	}; // closeTab


	/**
	 * renamePmTab()
	 */
	this.renamePmTab = function (old_name, new_name) {
		const tab_element = self.findTab( 'PM:' + old_name );

		if (tab_element !== null) {
			const room_element = self.findPageElement( 'PM:' + old_name );

			tab_element.querySelector( '.caption' ).innerHTML = new_name;
			tab_element.dataset.roomName = 'PM:' + new_name;
			room_element.dataset.roomName = 'PM:' + new_name;
		}

	}; // renamePmTab


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// ROOMS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * findPageElement()
	 */
	this.findPageElement = function (page_name) {
		let found_element = null;

		page_name = page_name.toLowerCase();

		app.dom.divTabPages.querySelectorAll( '.page' ).forEach( (element)=>{
			if (element.dataset.roomName.toLowerCase() == page_name) {
				found_element = element;
			}
		});

		return found_element;

	}; // findPageElement


	/**
	 * getActivePageElement()
	 */
	this.getActivePageElement = function () {
		return (
			app.dom.divTabPages.querySelector( '.page.active' )
			|| app.dom.divTabPages
		);

	}; // getActivePageElement


	/**
	 * getActiveRoomName()
	 */
	this.getActiveRoomName = function () {
		const active_page = self.getActivePageElement();
		const page_name = active_page.dataset.roomName;

		if (page_name && (page_name[0] == ':')) {
			return ROOMS.MAIN;
		}

		return page_name || null;

	}; // getActiveRoomName


	/**
	 * roomExists()
	 */
	this.roomExists = function (page_name) {
		if (page_name === null) return false;

		const rooms = app.dom.divTabPages.querySelectorAll( '.page' );

		page_name = page_name.toLowerCase();
		let room_exists = false;

		rooms.forEach( (room)=>{
			if (room.dataset.roomName.toLowerCase() == page_name) {
				room_exists = true;
			}
		});

		return room_exists;

	}; // roomExists


	/**
	 * appendToRoomElement()
	 */
	this.appendToRoomElement = function (new_element, page_name = null, indicate_activity = true) {
		var room_element;

		if (page_name === null) {
			room_element = self.getActivePageElement();
		} else {
			room_element = self.findPageElement( page_name );
			if (room_element === null) {
				if (DEBUG.TABS) {
					console.log(
						'%cWARNING%c: TabbedPages: appendToRoomElement: Room not found: '
						+ page_name
						, 'color:red'
						, 'color:black',
					);
				}

				room_element = self.getActivePageElement();
			}
		}

		room_element.appendChild( new_element );

		if (chat.connectionState == CHAT_CONNECTION.ONLINE) {
			const page_name = room_element.dataset.roomName;
			const tab_element = self.findTab( page_name );

			if ((tab_element !== null) && !tab_element.classList.contains( 'active' )) {
				if (page_name.substr( 0, 3 ) == 'PM:') {
					tab_element.classList.add( 'alert' );
					indicate_activity = true;
				}

				if (indicate_activity) {
					tab_element.classList.add( 'activity' );
					tab_element.classList.add( 'has_changes' );
				}

				setTimeout( ()=>{
					tab_element.classList.remove( 'activity' );
				}, 500);
			}
		}

	}; // appendToRoomElement


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DOM EVENTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * on_mouse_down()
	 */
	function on_mouse_down (event) {
		if (event.target.classList.contains( 'tab')) {
			const page_name = event.target.dataset.roomName;
			self.raiseTab( page_name );
		}
		else if (event.target.classList.contains( 'close' )) {
			const page_name = event.target.parentNode.dataset.roomName;

			if (page_name.substr( 0, 3 ) == 'PM:') {
				self.closeTab( page_name );
			} else {
				chat.executeCommand( '/leave ' + page_name );
			}
		}

	} // on_mouse_down


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CONSTRUCTOR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

	/**
	 * init()
	 */
	this.init = function () {
		self.tabHistory = new History();

		self.containerElement = document.createElement( 'ul' );
		app.dom.divTabs.appendChild( self.containerElement );

		addEventListener( 'mousedown', on_mouse_down );

	}; // init;


	// CONSTRUCTOR

	self.init();

}; // TabbedPages


//EOF