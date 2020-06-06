// history.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import { DEBUG } from '../constants.js';


/**
 * History()
 */
export const History = function () {
	const self = this;

	this.entries;
	this.position;


	/**
	 * addEntry()
	 */
	this.addEntry = function (new_entry) {
		for (let i = 0; i < self.entries.length; ++i) {
			if (self.entries[i] == new_entry) {
				self.entries.splice( i, 1 );
				self.addEntry( new_entry );
				return;
			}
		}

		self.entries.push( new_entry );
		self.position = self.entries.length;

		if (DEBUG.HISTORY) console.log( 'History: addEntry:', new_entry, self.entries, self.position );

	}; // addEntry


	/**
	 * previousEntry()
	 */
	this.previousEntry = function (nr_steps = 1) {
		if (DEBUG.HISTORY) console.log( 'History: previousEntry:', self.entries, self.position );

		if (self.entries.length == 0) return '';

		self.position -= nr_steps;

		if (self.position < 0) {
			self.position = self.entries.length;
			return '';
		}

		return self.entries[self.position];

	}; // previousEntry


	/**
	 * nextEntry()
	 */
	this.nextEntry = function (nr_steps = 1) {
		if (DEBUG.HISTORY) console.log( 'History: nextEntry:', self.entries, self.position );

		if (self.entries.length == 0) return '';

		self.position += nr_steps;

		if (self.position == self.entries.length) {
			return '';
		}

		if (self.position > self.entries.length) {
			self.position = 0;
		}

		return self.entries[self.position];

	}; // nextEntry


	/**
	 * removeEntry()
	 */
	this.removeEntry = function (text) {
		const index = self.entries.indexOf( text );

		if (index < 0) {
			throw new Error( 'History: removeEntry: Can\'t remove nonexistent entry: ' + text );
		}

		if (self.position > index) --self.position;

		self.entries.splice( index, 1 );

		if (DEBUG.HISTORY) console.log( 'History: removeEntry:', text, self.entries );

	}; // removeEntry


	/**
	 * init()
	 */
	this.init = function () {
		self.entries  = [];
		self.position = -1;

	}; // init


	// CONSTRUCTOR

	self.init();

}; // History


//EOF