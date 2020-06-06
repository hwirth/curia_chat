// fun_stuff.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const { RESPONSE, FAILURE } = require( './constants.js' );


module.exports.FunStuff = function (chat) {
	const self = this;


	/**
	 * on_roll_dice()
	 */
	this.rollDice = function (user, params) {
		let nr_dice  = 2;
		let nr_faces = 6;

		if (params[0] != undefined) {
			let parameter = params[0].toLowerCase();
			const pos = parameter.indexOf( 'w' );

			if (pos >= 0) {
				const type = parameter.substr( pos );
				parameter = parameter.substr( 0, pos );

				switch (type) {
				case 'w2'  :  nr_faces =  2;  break;
				case 'w4'  :  nr_faces =  4;  break;
				case 'w6'  :  nr_faces =  6;  break;
				case 'w8'  :  nr_faces =  8;  break;
				case 'w10' :  nr_faces = 10;  break;
				case 'w12' :  nr_faces = 12;  break;
				case 'w20' :  nr_faces = 20;  break;
				default:
					return {
						error : FAILURE.UNKNOWN_DICE_TYPE,
					};
				}
			}

			const nr = parseInt( parameter );
			if (! isNaN( nr )) nr_dice = nr;
		}


		const eyes = [];

		for (let i = 0; i < nr_dice; ++i) {
			eyes.push( Math.ceil( Math.random() * nr_faces ) );
		}

		chat.sendMessage(
			{
				type: RESPONSE.DICE_RESULT,
				data: {
					name: user.name,
					type: nr_faces,
					eyes: eyes,
				},
			},
			chat.users.toAll(),
		);

	} // on_roll_dice


	/**
	 * init()
	 */
	this.init = function () {
	}; // init


	// CONSTRUCTOR

	self.init();

}; // FunStuff


//EOF