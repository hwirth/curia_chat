// generic_item.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const rpg = require( '../../../chat_server.js' ).rpg;


/**
 * GenericItem()
 */
rpg.items.GenericItem = function (properties = {}) {
	const self = this;

	this.holder = null;

	this.name   = null;
	this.image  = null;
	this.volume = null;
	this.weight = null;

	init( properties );


	/**
	 * moveTo()
	 */
	this.moveTo = function (target, key = null) {
		if (this.holder instanceof Array) {
			const index = self.holder.indexOf( self );
			self.holder.splice( index, 1 );
		}
		else if (self.holder instanceof Object) {
			for (const key in self.holder) {
				if (self.holder[key] === self) {
					self.holder[key] = null;
				}
			}
		}

		if (target === null) return;

		if (target instanceof Array) {
			target.push( self );
		}
		else {
			target[key] = self;
		}

		self.holder = target;

		if (target.update != undefined) target.update();

	}; // move


	/**
	 * set()
	 */
	this.set = function (key, value) {
		if (self[key] != undefined) {
			self[key] = value;
			if (self.update) self.update();

		} else {
			throw new Error( 'Item "' + self.name + '" does not have a property "' + key + '"' );
		}

	}; // set


	/**
	 * update()
	 */
	this.update = function () {
console.log( 'generic update', self.name );
	}; // update


	/**
	 * destroy()
	 */
	this.destroy = function () {
		if (self.holder !== null) {
			if (self.holder == undefined) {
				throw new Error( 'Item "' + self.name + '" does not have a holder' );
			} else {
				self.moveTo( null );
			}
		}

	}; // destroy


	/**
	 * init()
	 */
	function init (properties) {
		for (const key in properties) {
			//self[key] = properties[key];
			self.name   = properties.name;
			self.image  = properties.image;
			self.volume = properties.volume;
			self.weight = properties.weight;
		}

	} // init

}; // GenericItem


//EOF