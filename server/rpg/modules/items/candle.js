// candle.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const rpg = require( '../../../chat_server.js' ).rpg;


/**
 * Candle()
 */
rpg.items.lights.Candle = function () {
	const self = this;

	this.burning           = null;
	this.burningSince      = null;
	this.remainingBurnTime = null;

	var burn_timeout = null;

	init();


	/**
	 * update()
	 */
	this.update = function () {
console.log( 'candle update' );
		if (self.burningSince !== null) {
			const elapsed_ms = rpg.now() - self.burningSince;
			const burned_weight = elapsed_ms * self.burnRate;

			self.weight = Math.max( 0, self.weight - burned_weight );
		}

		self.remainingBurnTime = self.weight / self.burnRate;

		if (self.weight == 0) {
			self.destroy();
		}

	}; // update


	/**
	 * toggle()
	 */
	this.toggle = function (new_state) {
		self.burning = new_state;

		if (self.timeout !== null) {
			clearTimeout( burn_timeout );
			self.timeout = null;
		}

		self.update();

		if (self.burning) {
			self.burningSince = rpg.now();
			burn_timeout = setTimeout( self.update, self.remainingBurnTime );
		}

	}; // toggle


	/**
	 * init()
	 */
	function init () {
		rpg.items.GenericItem.call( self, {
			name     : 'Candle',
			volume   : 1,
			weight   : 1,
		});

		self.burnRate = 3 / (60*60*1000);
		self.burning  = false;

		self.update();

	} // init

}; // Candle


//EOF