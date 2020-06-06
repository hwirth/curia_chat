// character.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const rpg = require( '../../chat_server.js' ).rpg;


/**
 * Inventory()
 */
const Inventory = function (properties = {}) {
	const self = this;

	this.itemsWeight;

	this.head      = null;
	this.neck      = null;
	this.torso     = null;
	this.back      = null;
	this.cloak     = null;
	this.arms      = null;
	this.leftHand  = null;
	this.rightHand = null;
	this.belt      = null;
	this.legs      = null;
	this.feet      = null;


	/**
	 * update()
	 */
	this.update = function () {
console.log( 'Inventory update' );
		self.itemsWeight = 0;

		Object.keys( self ).forEach( (key)=>{
			const item = self[key];
			if (item && (item.update)) {
				item.update();
				self.itemsWeight += item.weight;
			}
		});

	}; // update


	/**
	 * init()
	 */
	this.init = function (properties) {
		for (const key in self) {
			if (properties[key]) {
				self[key] = properties[key];
			}
		}

		self.update();

	}; // init


	// CONSTRUCTOR

	self.init( properties );

}; // Inventory


/**
 * Stats()
 */
const Stats = function (properties = {}) {
	const self = this;

	this.strength     = null;
	this.dexterity    = null;
	this.intelligence = null;
	this.appearance   = null;
	this.charisma     = null;
	this.aura         = null;

	this.limit        = null;


	/**
	 * init()
	 */
	this.init = function (properties) {
		for (const key in properties) {
			self[key] = properties[key];
		}

	}; // init


	// CONSTRUCTOR

	self.init( properties );

}; // Stats


/**
 * Skills()
 */
const Skills = function (properties = {}) {
	const self = this;

	this.procrastination = null;

	this.limit = null;


	/**
	 * init()
	 */
	this.init = function (properties) {

		for (const key in properties) {
			self[key] = properties[key];
		}

	}; // init


	// CONSTRUCTOR

	self.init( properties );

}; // Skills


/**
 * Character()
 */
rpg.Character = function () {
	const self = this;

	this.name      = null;
	this.fame      = null;
	this.karma     = null;

	this.stats     = null;
	this.skills    = null;
	this.inventory = null;


	/**
	 * update()
	 */
	this.update = function () {
console.log( 'Character update' );
		self.inventory.update();

	}; // update


	/**
	 * init()
	 */
	function init () {
		self.stats     = new Stats();
		self.skills    = new Skills();
		self.inventory = new Inventory();

		const backpack = new rpg.items.containers.Backpack();
		const candle   = new rpg.items.lights.Candle();

		backpack.moveTo( self.inventory, 'back' );
		candle.moveTo( backpack.items );

candle.set( 'weight', 0.25 );
candle.toggle( true );

	} // init


	// CONSTRUCTOR

	init();

}; // Character


//EOF