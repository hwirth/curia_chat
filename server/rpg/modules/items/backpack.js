// backpack.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const rpg = require( '../../../chat_server.js' ).rpg;


/**
 * Backpack()
 */
rpg.items.containers.Backpack = function (properties = {}) {
	const self = this;

	init( properties );


	/**
	 * update()
	 */
	this.update = function () {
console.log( 'Backpack update' );

		self.items.forEach( (item)=>{
			item.update();
		});

	}; // update


	/**
	 * init()
	 */
	function init (properties) {
		rpg.items.GenericContainer.call( self, {
			name      : 'Backpack',
			weight    : 5,
			volume    : 5,
			maxWeight : 50,
			maxVolume : 50,
		});

	} // init

}; // Backpack


//EOF