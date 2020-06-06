// command_buttons.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from '../helpers.js';

import {
	PROGRAM_NAME, PROGRAM_VERSION, DEBUG, SETTINGS, CHAT_CONNECTION,
	ICON_DATA, COMMAND_BUTTONS, ROOMS,

} from '../constants.js';

import { localized } from '../localize.js';
import { History   } from '../extensions/history.js';


/**
 * CommandButtons()
 */
export const CommandButtons = function (app, chat) {
	const self = this;

	this.activeCommandButtons;


	/**
	 * update_command_buttons()
	 */
	function update_command_buttons () {
		app.dom.divCommands.querySelectorAll( 'button' ).forEach( (button)=>{
			app.dom.divCommands.removeChild( button );
		});

		self.activeCommandButtons.sort( (a, b)=>{
			if (a.sortName > b.sortName) return 1;
			if (a.sortName < b.sortName) return -1;
			return 0;

		}).forEach( (definition)=>{
			definition = Helpers.clone( definition );

			const button  = document.createElement( 'button' );
			const image   = document.createElement( 'img' );
			const title   = localized( definition.title );
			let   caption = localized( definition.caption ); //.replace( ' ', '<br>' );

			if (definition.parameter !== null) {
				//...caption += '<br>' + definition.parameter;
				definition.command += ' ' + definition.parameter;
			}

			if (ICON_DATA[definition.icon]) {
				button.innerHTML = '';

				image.src = ICON_DATA[definition.icon];
				image.alt = 'Icon: definition.icon';
				image.width = 32;
				image.height = 32; //...

				button.appendChild( image );
				button.innerHTML += '<small>' + caption + '</small>';
			} else {
				button.innerHTML = caption;
			}

			button.className        = 'command ' + definition.className || 'command';
			button.dataset.sortName = definition.sortName  || caption;
			button.dataset.command  = definition.command;
			button.title            = title || '';

			app.dom.divCommands.appendChild( button );
		});

	} // update_command_buttons


	/**
	 * addCommandButton()
	 */
	this.addCommandButton = function (definition_name, parameter = null) {
		const new_definition = Helpers.clone( COMMAND_BUTTONS[definition_name] );

		if (new_definition == undefined) {
			throw new Error( 'addCommandButton: Definition undefined: ' + definition_name );
		};

		let already_displayed = false;

		self.activeCommandButtons.forEach( (definition)=>{
			if (definition.sortName == new_definition.sortName) {
				already_displayed = true;
			}
		});

		if (already_displayed) {
			console.groupCollapsed(
				'%cWARNING%c: Command already displayed: ' + new_definition.sortName,
				'color:red', 'color:black'
			);
			console.log( new_definition );
			console.groupEnd();

		} else {
			new_definition.parameter = parameter;
			self.activeCommandButtons.push( new_definition );
			update_command_buttons();
		}

	}; // add_command_button


	/**
	 * removeCommandButton()
	 */
	this.removeCommandButton = function (definition_name) {
		const definition = COMMAND_BUTTONS[definition_name];

		if (definition == undefined) {
			throw new Error( 'addCommandButton: Definition undefined: ' + definition_name );
		};

		for (let i = 0; i < self.activeCommandButtons.length; ++i) {
			if (self.activeCommandButtons[i].sortName == definition.sortName) {
				self.activeCommandButtons.splice( i, 1 );

				if (DEBUG.COMMAND_BUTTONS) {
					console.groupCollapsed( 'Removing Command Button: ' + definition_name );
					console.trace();
					console.groupEnd();
				}

				update_command_buttons();
				return;
			}
		}

		console.log(
			'%cERROR%c: Command button could not be removed: ' + definition_name,
			'color:red', 'color:black',
		);
		console.trace();

	}; // removeCommandButton


	/**
	 * init()
	 */
	this.init = function () {
		self.activeCommandButtons = [];

	}; // init


	// CONSTRUCTOR

	self.init();

}; // CommandButtons