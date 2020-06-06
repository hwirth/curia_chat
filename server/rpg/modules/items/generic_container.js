// generic_container.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const rpg = require( '../../../chat_server.js' ).rpg;


/**
 * GenericContainer()
 */
rpg.items.GenericContainer = function (properties = {}) {
	const self = this;

	this.maxWeight;
	this.maxVolume;
	this.items;

	this.itemsWeight;
	this.itemsVolume;

	init( properties );



	/**
	 * update()
	 */
	this.update = function () {
		self.itemsWeight = 0;
		self.itemsVolume = 0;

		self.items.forEach( (item)=>{
			self.itemsVolume += item.weight;
			self.itemsWeight += item.volume;
		});

	}; // update


	/**
	 * addItem()
	 */
	this.addItem = function (item) {
		self.update();

		if( (self.itemsVolume + item.volume <= self.maxVolume)
		&&  (self.itemsWeight + item.weight <= self.maxWeight)
		) {
			self.items.push( item );
			self.update();

			return true;
		} else {
			return false;
		}

	}; // addItem


	/**
	 * removeItem()
	 */
	this.removeItem = function (item) {
		const i = self.items.indexOf( item );

		if (i >= 0) {
			self.items.splice( i, 1 );
		}

		self.update();

		return (i >= 0);

	}; // removeItem


	/**
	 * init()
	 */
	function init (properties) {
		rpg.items.GenericItem.call( self, properties );

		self.maxWeight   = properties.maxWeight || Number.POSITIVE_INFINITY;
		self.maxVolume   = properties.maxVolume || Number.POSITIVE_INFINITY;
		self.items       = [];

		self.update();

	} // init

}; // GenericContainer


//EOF