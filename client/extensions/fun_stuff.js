// fun_stuff.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import { ROOMS } from '../constants.js';
import { localized } from '../localize.js';


/**
 * on_orf_news()
 */
export function on_orf_news (chat, params) {
	fetch( '../scripts/orf.php' ).then( (response)=>{
		if (response.ok) {
			return response.text();
		} else {
			return Promise.reject( file_name + ': ' + response.statusText );
		}

	}).then( (html)=>{
		const parser = new DOMParser();
		const my_document = parser.parseFromString( html, 'text/html' );
		return my_document;

	}).then( (orf)=>{
		chat.ui.addTab( ':orf', 'ORF' );

		chat.ui.findPageElement( ':orf' ).innerHTML = '';

		chat.showMessage( chat.timestampAndText(null, 'ORF.at news'), ':orf', 'notice' );

		const articles = orf.querySelectorAll( 'article' );

		let headlines = '';

		articles.forEach( (article)=>{
			const heading = article.querySelector( '.ticker-story-headline' ).innerText;
			const href = 'https://orf.at/stories/' + article.dataset.id;

			chat.showMessage(
				'<a href='
				+ href
				+ ' target="curia_orf">'
				+ heading
				+ '</a>'
				, ':orf'
			);

			headlines += heading.trim() + '.\n';
		});

		if (params[0] == 'speak') {
			chat.synth.say( headlines, 'de' );
		}
	});

}; // on_orf_news


/**
 * on_response_dice_result()
 */
export function on_response_dice_result (chat, message) {
	const name = message.data.name;
	const type = message.data.type;
	const eyes = message.data.eyes;

	let dice = '';

	if (false && type == 6) {
		for (let i = 0; i < eyes.length; ++i) {
			dice += '<big class="dice_w6">&#x' + String(2680 - 1 + eyes[i]) + ';</big> ';
		}
		dice = dice.slice( 0, -1 );

	} else {
		for (let i = 0; i < eyes.length; ++i) {
			dice += '<b class="dice_wx">' + eyes[i] + '</b>, ';
		}
		dice = dice.slice( 0, -2 );
	}

	chat.showMessage(
		localized( 'USER_ROLLS_DICE',
			chat.colorSpan( name ),
			eyes.length,
			type,
			dice,
		)
	);

} // on_response_dice_result


//EOF