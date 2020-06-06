// user_list.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from '../helpers.js';

import {
	PROGRAM_NAME, PROGRAM_VERSION, DEBUG, SETTINGS, CHAT_CONNECTION,
	ICON_DATA, COMMAND_BUTTONS, ROOMS,

} from '../constants.js';

import { localized } from '../localize.js';


/**
 * UserList
 */
export const UserList = function (app, chat) {
	const self = this;

	this.containerElement;
	this.data;


	/**
	 * color_span_from_html()
	 */
	function color_span_from_html (name) {
		const span_html = chat.colorSpan( name );
		const temp      = document.createElement( 'div' );
		temp.innerHTML  = span_html;

		return temp.querySelector( 'span' );

	} // color_span_from_html


	/**
	 * remove_no_longer_existing()
	 */
	function remove_no_longer_existing (users) {
		const all_cards = self.containerElement.querySelectorAll( '.user' );
		const all_user_ids = users.map( user => user.address );

		const remove_cards = Array.from( all_cards ).filter( (card)=>{
			return (all_user_ids.indexOf( card.dataset.userId ) < 0);
		});

		if (DEBUG.USER_LIST) {
			console.log(
				'UserList: Gone user\'s cards:', remove_cards,
				'\nall_user_ids:', all_user_ids,
				'\nusers:', users,
			);
		}

		if (typeof remove_cards != 'undefined') {
			remove_cards.forEach( (card)=>{
				if (DEBUG.USER_LIST) {
					console.log(
						'UserList: Removing',
						card.dataset.userName,
						card.dataset.userId,
					);
				}

				self.containerElement.removeChild( card );
			});
		}

	} // remove_no_longer_existing


	/**
	 * update_existing()
	 */
	function update_existing (users) {
		var command, definition;

		const existing_cards = self.containerElement.querySelectorAll( '.user' );
		const existing_user_ids = Array.from( existing_cards ).map( card => card.dataset.userId );

		existing_cards.forEach( (list_item)=>{
			const span_name      = list_item     .querySelector( '.name'     );
			const span_buttons   = list_item     .querySelector( '.commands' );
			const button_message = span_buttons  .querySelector( '.message'  );
			const button_call    = span_buttons  .querySelector( '.call'     );
			const small_message  = button_message.querySelector( '.caption'  );
			const small_call     = button_call   .querySelector( '.caption'  );
			const img_message    = button_message.querySelector( 'img'       );
			const img_call       = button_call   .querySelector( 'img'       );
			const img_avatar     = list_item     .querySelector( '.avatar'   );

			if (DEBUG.USER_LIST) {
				console.log(
					'UserList: Updating',
					list_item.dataset.userName,
					list_item.dataset.userId,
				);
				console.log( users );
			}

			const user = users.find( (user)=>{
				return (user.address == list_item.dataset.userId);
			});

			span_name.innerHTML = user.name;

			img_avatar.src
			= (user.avatar === null)
			? ICON_DATA.ANON
			: user.avatar
			;

			if (user.receivedInvites[chat.name] == undefined) {
				command = '/call ' + user.name;
				definition = COMMAND_BUTTONS.CALL;
			} else {
				command = '/cancel ' + user.name;
				definition = COMMAND_BUTTONS.CANCEL;
			}

			button_call.dataset.command = command;
			small_call.innerText = localized( definition.caption );
			img_call.src = ICON_DATA[definition.icon];

			list_item.classList.toggle( 'inviting', (user.sentInvites[chat.name] != undefined) );
			list_item.classList.toggle( 'invited',  (user.receivedInvites[chat.name] != undefined) );
			list_item.classList.toggle( 'calling',  (Object.keys( user.activeCalls ).length > 0) );
		});

		return existing_user_ids;

	} // update_existing


	/**
	 * add_new()
	 */
	function add_new (users, existing_user_ids) {
		var definition, command;

		const new_users = users.filter( (user)=>{
			return (existing_user_ids.indexOf( user.address ) < 0);
		});

		new_users.forEach( (user)=>{
			if (DEBUG.USER_LIST) console.log( 'UserList: Addding', user.name, user.address );

			const list_item      = document.createElement( 'li' );
			const span_buttons   = document.createElement( 'span' );
			const button_message = document.createElement( 'button' );
			const button_call    = document.createElement( 'button' );
			const small_message  = document.createElement( 'small' );
			const small_call     = document.createElement( 'small' );
			const img_message    = document.createElement( 'img' );
			const img_call       = document.createElement( 'img' );
			const img_avatar     = document.createElement( 'img' );

			span_buttons .className = 'commands';
			small_message.className = 'caption';
			small_call   .className = 'caption';

			list_item.className        = 'user';
			list_item.dataset.userId   = user.address;
			list_item.dataset.userName = user.name;

			list_item.appendChild( color_span_from_html( user.name ) );
			list_item.appendChild( img_avatar );
			list_item.appendChild( span_buttons );
			span_buttons.appendChild( button_message );
			span_buttons.appendChild( button_call );

			/*
			 * Insert node to UL, alphabetically sorted
			 */
			const all_cards = self.containerElement.querySelectorAll( '.user' );
			self.containerElement.appendChild( list_item );

			if (all_cards !== null) {
				const found_card = Array.from( all_cards ).find( (card)=>{
					return (card.dataset.userName > user.name);
				});

				if (DEBUG.USER_LIST) {
					console.log(
						'UserList: add_new: Inserting before',
						found_card
					);
				}

				if (typeof found_card != 'undefined') {
					self.containerElement.insertBefore( list_item, found_card );
				}
			}


			/*
			 * Avatar
			 */
			img_avatar.className = 'avatar';
			img_avatar.src
			= (user.avatar === null)
			? ICON_DATA.ANON
			: user.avatar
			;

			/*
			 * Button: Message
			 */
			button_message.dataset.command = '/msg ' + user.name;
			button_message.className = 'command message';
			button_message.title = localized( 'BTN_MESSAGE_TITLE' );
			button_message.appendChild( img_message );
			button_message.appendChild( small_message );
			small_message.innerText = localized( 'BTN_MESSAGE_CAPTION' );
			img_message.src = ICON_DATA.MESSAGE;

			/*
			 * Button: Call
			 */
			if (user.receivedInvites[chat.name] == undefined) {
				command = '/call ' + user.name;
				definition = COMMAND_BUTTONS.CALL;
			} else {
				command = '/cancel ' + user.name;
				definition = COMMAND_BUTTONS.CANCEL;
			}
			button_call.dataset.command = command;
			button_call.className = 'command call';
			button_call.appendChild( img_call );
			button_call.appendChild( small_call );
			small_call.innerText = localized( definition.caption );
			img_call.src = ICON_DATA[definition.icon];

			/*
			 * Current user?
			 */
			const enabled = user.loggedIn && (user.name != chat.name);
			button_message.classList.toggle( 'disabled', !(enabled || user.acceptsMessages) );
			button_call   .classList.toggle( 'disabled', !(enabled || user.acceptsCalls) );

			if (user.name == chat.name) {
				img_avatar.addEventListener( 'mouseup', ()=>{
					chat.userProfile.show( 'avatar', /*activate*/true );
				});
				img_avatar.classList.add( 'clickable' );
			}

			list_item.classList.toggle( 'inviting', (user.sentInvites[chat.name] != undefined) );
			list_item.classList.toggle( 'invited',  (user.receivedInvites[chat.name] != undefined) );
			list_item.classList.toggle( 'calling',  (Object.keys( user.activeCalls ).length > 0) );

			if (user.client.browser != undefined) {
				list_item.classList.add( 'browser' );
				list_item.classList.add( user.client.browser.name );
			}
		});

	} // add_new


	/**
	 * update()
	 */
	this.update = function (users = null) {
		remove_no_longer_existing( users );
		const existing_user_ids = update_existing( users );
		add_new( users, existing_user_ids );

		self.data = {};
		users.forEach( (user)=>{
			self.data[user.address] = user;
		});

	}; // update


	/**
	 * init()
	 */
	this.init = function () {
		self.data = null;
		self.containerElement = app.dom.ulUserList;
		chat.ui.moveTabContent( self.containerElement, null );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // UserList


//EOF