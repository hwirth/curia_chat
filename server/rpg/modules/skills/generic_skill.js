// generic_skill.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - CLIENT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const rpg = require( '../../../chat_server.js' ).rpg;


/**
 * GenericSkill()
 */
rpg.skills.GenericSkill = function (properties = {}) {
	const self = this;

	this.name       = null;
	this.verb       = null;
	this.profession = null;
	this.tiers      = null;
	this.difficulty = null;

	this.cap        = null;
	this.skill      = null;
	this.learnMode  = null;

	init( properties );


	/**
	 * getTierName()
	 */
	this.getTierName = function () {
		let tier = 0;

		while (self.tiers[tier].skill && (self.skill > self.tiers[tier].skill)) {
			++tier;
		}

		return self.tiers[tier].name;

	}; // getTierName


	/**
	 * init()
	 */
	function init (properties) {
		self.difficulty = 1;
		self.cap        = 100;
		self.skill      = 0;
		self.learnMode  = 0;

		self.tiers = [
			{ skill:    0, name: 'incapable'  },
			{ skill:   19, name: 'untalented' },
			{ skill:   39, name: 'beginner'   },
			{ skill:   59, name: 'amateur'    },
			{ skill:   79, name: 'journeyman' },
			{ skill:   99, name: 'master'     },
			{ skill:  119, name: 'legendary'  },
			{ skill: null, name: 'superhuman' },
		];

		for (const key in properties) {
			self[key] = properties[key];
		}

	} // init

}; // GenericSkill



/**
 * Procrastination()
 */
rpg.skills.Procrastination = function (properties) {
	const self = this;

	init( properties );


	/**
	 * init()
	 */
	function init (properties) {
		rpg.items.GenericItem.call( self, {
			name       : 'procrastination',
			profession : 'procrastinator',
			verb       : 'procrastinate'
			volume   : 1,
			weight   : 1,
		});

	}; // init

}; // Procrastination


//EOF