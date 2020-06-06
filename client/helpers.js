// helpers.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// HELPERS - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import { ERROR, DOM } from './constants.js';
import { Prompt }     from './ui/dialog.js';


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// EXTEND DOM
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * upgradeDOM
 */
export function upgradeDOM (app) {
	window.requestAnimationFrame
	=( window.requestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.oRequestAnimationFrame
	|| window.msRequestAnimationFrame
	|| function (callback) { window.setTimeout( callback, 1000 / 60 ) }
	);

	navigator.getUserMedia
	=( navigator.getUserMedia
	|| navigator.webkitGetUserMedia
	|| navigator.mozGetUserMedia
	|| navigator.msGetUserMedia
	);

	navigator.getDisplayMedia
	=( navigator.getDisplayMedia
	|| navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
	);

	//if (!app.audioContext.createGain)  app.audioContext.createGain  = app.audioContext.createGainNode;
	//if (!app.audioContext.createDelay) app.audioContext.createDelay = app.audioContext.createDelayNode;

	//if (!app.audioContext.createScriptProcessor) {
	//	app.audioContext.createScriptProcessor = app.audioContext.createJavaScriptNode;
	//}

	Math.frac = function (float_value) {
		const sign = Math.sign( float_value );
		const abs  = Math.abs( float_value );
		const int  = Math.floor( abs );
		const frac = abs - int;
		return sign * frac;
	}

} // upgradeDOM


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MISCELLANEOUS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * now()
 */
export function now() {
	const now = new Date();
	return now.getTime();

} // now


/**
 * unixTimestamp()
 */
export function unixTimestamp (date = null) {
	if (date == null) date = new Date();
	return Math.round( date.getTime() / 1000 );

} // unixTimestamp


/**
 * decodeURL()
 */
export function decodeURL( str ) {
   return decodeURIComponent( (str+'').replace( /\+/g, '%20' ) );

} // decodeURL


/**
 * round()
 */
export function round (value, precision) {
	if (precision == undefined) throw new Error( 'round: precision undefined' );

	const sign = Math.sign( value );
	let result = Math.abs( Math.round( value / precision )) * precision;

	// Only useful, if precision is a lot of zeroes followed by a single digit, like 0.01, not 0.025
	//const nr_digits = Math.log10( prescision );

	if (String( precision ).indexOf('.') >= 0) {
		const parts             = String( precision ).split( '.' );
		const int_digits        = parts[0].length;
		const fract_digits      = parts[1].length;
		const additional_digits = String( Math.floor( result ) ).length;
		const total_digits      = int_digits + /*dot*/1 + fract_digits + additional_digits;

		result = String( result ).substr( 0, total_digits );
		result = Math.round( result * 10**fract_digits ) / 10**fract_digits;
		result = String( result ).substr( 0, total_digits );
		result = parseFloat( result );
	}

	return sign * result;

} // round


/**
 * isPowerOf2()
 */
export function isPowerOf2 (value) {
	return (value & (value - 1)) == 0;

} // isPowerOf2


/**
 * toHex()
 */
export function toHex (number, nr_digits = 2) {
	let hex = number.toString( 16 );

	while (hex.length < nr_digits) {
		hex = '0' + hex;
	}

	return hex;

} // toHex


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// COLORS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * colorSetAlpha
 */
export function colorSetAlpha (color, alpha) {

	function report_error () { throw new Error( 'Can\'t process color "' + color + '"' ); }

	const hex_digits = '0123456789abcdef';
	var R, G, B;

	if (color.charAt(0) == '#') {
		color = color.toLowerCase();

		if (color.length == '4') {
			R = (hex_digits.indexOf( color.charAt(1) ) << 4) + hex_digits.indexOf( color.charAt(1) );
			G = (hex_digits.indexOf( color.charAt(2) ) << 4) + hex_digits.indexOf( color.charAt(2) );
			B = (hex_digits.indexOf( color.charAt(3) ) << 4) + hex_digits.indexOf( color.charAt(3) );
		}
		else if (color.length == '7') {
			const R1 = hex_digits.indexOf( color.charAt(1) );
			const R0 = hex_digits.indexOf( color.charAt(2) ) & 0x0f;
			const G1 = hex_digits.indexOf( color.charAt(3) );
			const G0 = hex_digits.indexOf( color.charAt(4) ) & 0x0f;
			const B1 = hex_digits.indexOf( color.charAt(5) );
			const B0 = hex_digits.indexOf( color.charAt(6) ) & 0x0f;

			R = (R1 << 4) + R0;
			G = (G1 << 4) + G0;
			B = (B1 << 4) + B0;
		}
		else {
			report_error();
			return;
		}
	}
	else if (color.substr( 0, 3 ) == 'rgb') {
		const values = color.split( ')' )[0].split( '(' )[1].split( ',' );
		R = values[0];
		G = values[1];
		B = values[2];
	}
	else {
		report_error();
		return;
	}

	return 'rgba(' + R + ',' + G + ',' + B + ',' + alpha + ')';

} // colorSetAlpha


/**
 * rgb_to_hsl()
 */
// HSL <--> RGB conversions taken from
// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
export function rgb_to_hsl (r, g, b) {
	r /= 255, g /= 255, b /= 255;
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, l = (max + min) / 2;

	if (max == min){
		h = s = 0; // achromatic
	} else {
		var d = max - min;
		s
		= (l > 0.5)
		? d / (2 - max-min)
		: d / (max + min)
		;
		switch(max){
		case r:  h = (g - b) / d + (g < b ? 6 : 0);  break;
		case g:  h = (b - r) / d + 2;                break;
		case b:  h = (r - g) / d + 4;                break;
	}
		h /= 6;
	}

	return [h, s, l];

} // rgb_to_hsl


/**
 * hsl_to_rgb()
 */
export function hsl_to_rgb (h, s, l) {
	var r, g, b;

	if (s == 0) {
	r = g = b = l; // achromatic
	} else {
		var hue2rgb = function hue2rgb( p, q, t ) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q
		= (l < 0.5)
		? l * (1 + s)
		: l + s - l * s
		;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h      );
		b = hue2rgb(p, q, h - 1/3);
	}

	return [
		Math.round(r * 255),
		Math.round(g * 255),
		Math.round(b * 255)
	];

} // hsl_to_rgb


/**
 * rgb_to_html_color()
 */
export function rgb_to_html_color (r, g, b) {
	return 'rgb(' + r + ',' + g + ',' + b + ')';

} // rgb_to_html_color


/**
 * hsl_to_html_color()
 */
export function hsl_to_html_color (h, s, l) {
	const rgb = hsl_to_rgb( h, s, l );
	//const r = hex( rgb[0], 2 );
	//const g = hex( rgb[1], 2 );
	//const b = hrx( rgb[2], 2 );
	//return '#' + r + g + b;

	return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';

} // hsl_to_html_color


/**
 * html_color_to_rgb()
 */
export function html_color_to_rgb (html_color) {
	if (html_color.length == 4) {
		html_color
		= html.color.charAt(0)
		+ html.color.charAt(1)
		+ html.color.charAt(1)
		+ html.color.charAt(2)
		+ html.color.charAt(2)
		+ html.color.charAt(3)
		+ html.color.charAt(3)
		;
	}

	return [
		parseInt( html_color.substr(1, 2), 16 ),
		parseInt( html_color.substr(3, 2), 16 ),
		parseInt( html_color.substr(5, 2), 16 ),
	];

} // html_color_to_rgb


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DOM
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * isDarkModeEnabled()
 */
export function isDarkModeEnabled () {
    return window.matchMedia && window.matchMedia( '(prefers-color-scheme: dark)' ).matches;

} // isDarkModeEnabled


/**
 * computedStyle()
 */
export function computedStyle( element ) {
	return element.currentStyle || window.getComputedStyle(element);

} // computedStyle


/**
 * get_element_text()
 */
export function get_element_text (element) {
	const html = module_item.innerHTML;

	if (html.indexOf( '<' ) < 0) {
		return html;
	} else {
		return html.substr( 0, html.indexOf( '<' ) );
	}

} // get_element_text


/**
 * getCSSVariable()
 */
export function getCSSVariable (variable_name) {
	const style = computedStyle(document.body);
	return style.getPropertyValue( '--' + variable_name ).trim();

} // getCSSVariable


/**
 * setDynamicStyle()
 */
export function setDynamicStyle (variable_name, new_value) {
	const dynamic_styles = document.querySelector( '#dynamic_styles' );

	const lines = dynamic_styles.innerHTML.split( '\n' );
	const var_len = variable_name.length;

	let new_text = '';
	lines.forEach( (line)=>{
		line = line.trim();
		if (line.slice( 0, 2 ) == '--') {
			if (line.slice( 0, var_len ) != variable_name) {
				new_text += line + '\n';
			}
		}
	});
	new_text += variable_name + ': ' + new_value + ';\n';

	dynamic_styles.innerHTML
	= ':root {\n'
	+ new_text
	+ '}'
	;

	//...console.log( dynamic_styles.innerHTML );

} // setDynamicStyle


/**
 * getAbsoluteCoordinates()
 */
export function getAbsoluteCoordinates (element, stop_at_element) {
	let left = element.offsetLeft;
	let top  = element.offsetTop;

	while ((element.offsetParent != undefined) && (element.offsetParent !== stop_at_element)) {
		element = element.offsetParent;
		left += element.offsetLeft;
		top  += element.offsetTop;
	}

	return {
		x : left,
		y : top,
	};

} // getAbsoluteCoordinates


/**
 * overlapping()
 */
export function overlapping (x1, y1, w1, h1,  x2, y2, w2, h2) {
	const left1   = x1;
	const right1  = x1 + w1;
	const top1    = y1;
	const bottom1 = y1 + h1;

	const left2   = x2;
	const right2  = x2 + w2;
	const top2    = y2;
	const bottom2 = y2 + h2;

	return (
		(bottom1 >= top2)
	&&	(top1 <= bottom2)
	&&	(right1 >= left2)
	&&	(left1 <= right2)
	);


} // overlapping


/**
 * bringToFront()
 */
export async function bringToFront (element, group_selector, zindex_base, zindex_ontop ) {
	element.style.zIndex = DOM.Z_INDEX.SORT_MAX.index;

	if (zindex_ontop == undefined) zindex_ontop = zindex_base;

	let windows = Array.from( document.querySelectorAll( group_selector ) );
	let sorted_windows = windows.sort( function( window1, window2 ) {
		const style1 = computedStyle( window1 );
		const style2 = computedStyle( window2 );
		let z1 = style1.zIndex;
		let z2 = style2.zIndex;
		return (z1 < z2) ? -1 : (z1 > z2);
	});

	for( let i = 0 ; i < sorted_windows.length ; ++i ) {
		const base_zindex
		= sorted_windows[i].classList.contains('stayontop')
		? zindex_ontop
		: zindex_base
		;

		sorted_windows[i].style.zIndex = base_zindex + i;
	}

} // bringToFront


/**
 * initializeCanvas()
 */
export function initializeCanvas (canvas, new_width, new_height, offset = false) {
	canvas.setAttribute( 'width',  canvas.width  = new_width  );
	canvas.setAttribute( 'height', canvas.height = new_height );

	if (offset) canvas.getContext('2d').translate(0.5, 0.5);

	// This also seems to clear the canvas

} // initializeCanvas


/**
 * selectOption()
 */
export function selectOption (element, find_content) {
	find_content = String( find_content ).toLowerCase();
	for (let i = 0; i < element.childNodes.length; ++i) {
		const option_content = element.options[i].text.toLowerCase();
		if (option_content == find_content) {
			element.selectedIndex = i;
			break;
		}
	}

} // selectOption


/**
 * delay()
 */
export function delay (milliseconds) {
	return new Promise( (resolve)=>{
		setTimeout( resolve, milliseconds )
	});

} // delay


/**
 * SeededRandom()
 */
export const SeededRandom = function (state1, state2) {
	let mod1 = 2294967087;
	let mul1 = 65539;
	let mod2 = 4294965887;
	let mul2 = 65537;

	if (typeof state1 != 'number') {
		state1 = new Date();
	}

	if (typeof state2 != 'number') {
		state2 = state1;
	}

	state1 %= (mod1 - 1) + 1;
	state2 %= (mod2 - 1) + 1;

	return function random (limit) {
		state1 = (state1 * mul1) % mod1;
		state2 = (state2 * mul2) % mod2;

		if ((state1 < limit) && (state2 < limit) && (state1 < mod1 % limit) && (state2 < mod2 % limit)) {
			return random( limit );
		}
		return (state1 + state2) % limit;
	};

}; // SeededRandom


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// JS HELPERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * clone()
 */
export function clone (object) {
	return JSON.parse( JSON.stringify( object ) );

} // clone


/**
 * ucFirst()
 */
export function ucFirst (string) {
	return string.charAt( 0 ).toUpperCase() + string.slice(1)

} // ucFirst


/**
 * get_function_name()
 */
export function get_function_name (fun) {
	let ret = fun.toString();
	ret = ret.substr( 'function '.length );
	ret = ret.substr( 0, ret.indexOf( '(' ) );
	return ret;

} // get_function_name


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// COOKIES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * getCookie()
 */
export function getCookie (find_cookie) {
	let found_cookie = null;

	const all_cookies = document.cookie.split( ';' );

	all_cookies.forEach( (cookie)=>{
		const pos = cookie.indexOf( '=' );
		const key = cookie.substr( 0, pos ).trim();
		const val = cookie.substr( pos + 1 );

		if (key == find_cookie) {
			found_cookie = val;
		}
	});

	if (found_cookie === null) {
		return null;
	} else {
		return decodeURIComponent( found_cookie );
	}

} // getCookie


/**
 * setCookie()
 */
export function setCookie (cookie_name, value, attributes = null) {
	const known_attributes = ['path', 'domain', 'max-age', 'secure', 'samesite'];
	let new_cookie = cookie_name + '=' + encodeURIComponent( value );

	if (attributes === null) attributes = { path: '/' };

	Object.keys( attributes ).forEach( (key)=>{
		if (known_attributes.indexOf( key ) < 0) {
			throw new Error( 'Helpers: setCookie: Unknown attribute "' + key + '"' );
		}
		new_cookie += ';' + key + '=' + attributes[key];
	});

	document.cookie = new_cookie + ';SameSite=Lax';

} // setCookie


/**
 * deleteCookie()
 */
export function deleteCookie (cookie_name, attributes = null) {
	const known_attributes = ['path', 'domain', 'max-age', 'secure', 'samesite'];

	if (attributes === null) attributes = { path: '/' };

	cookie_name += '=';

	Object.keys( attributes ).forEach( (key)=>{
		if (known_attributes.indexOf( key ) < 0) {
			throw new Error( 'Helpers: setCookie: Unknown attribute "' + key + '"' );
		}
		cookie_name += ';' + key + '=' + attributes[key];
	});

	document.cookie = cookie_name + ';expires=Thu, 01 Jan 1970 00:00:00 GMT;';

} // deleteCookie


/**
 * getDeviceInfo()
 */
export function getDeviceInfo () {
	const div = document.createElement( 'div' );
	div.style.position = 'absolute';
	div.style.left = '-100%';
	div.style.top  = '-100%';
	div.style.height = '1in';
	div.style.width  = '1in';
	document.body.appendChild( div );

	return {
		dpi: div.offsetHeight,
		pixelRatio: window.devicePixelRatio,
		orientationType  : screen.orientation.type,
		orientationAngle : screen.orientation.angle,
	};

} // getDeviceInfo


/**
 * getBrowserName()
 */
export function getBrowserName () {
	var browser = (function (agent) {
	switch (true) {
	case agent.indexOf("edge") > -1: return "edge";
	case agent.indexOf("edg") > -1: return "chromium based edge (dev or canary)";
	case agent.indexOf("opr") > -1 && !!window.opr: return "opera";
	case agent.indexOf("chrome") > -1 && !!window.chrome: return "chrome";
	case agent.indexOf("trident") > -1: return "ie";
	case agent.indexOf("firefox") > -1: return "firefox";
	case agent.indexOf("safari") > -1: return "safari";
	default: return "other";
	}
	})(window.navigator.userAgent.toLowerCase());

	return {
		agent: window.navigator.userAgent,
		name: browser,
	};

} // getBrowserName


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// APPLICATION HELPERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * greekVersion()
 */
export function greekVersion (version, use_unicode = false) {
	if (use_unicode) {
		return version.replace( /a/, 'α' ).replace( /b/, 'β' ).replace( /g/, 'γ' );
	} else {
		return version.replace( /a/, '&alpha;' ).replace( /b/, '&beta;' ).replace( /g/, '&gamma;' );
	}

} // greekVersion



/**
 * showErrorMessage()
 */
export function showErrorMessage (new_message, new_title = 'Mischief!') {

	function show_prompt (new_message) {
		new Prompt({
			useClass : 'error',
			title    : new_title,
			message  : new_message,
			buttons  : [
				{ text: 'OK', useClass: 'confirm' },
			],
		});

		const all_dialogs = document.body.querySelectorAll( '.dialog.error' );
		return all_dialogs[all_dialogs.length - 1];
	}

	function reduce_white_space (text) {
		let error_type = '#NONE#';

		if (text.indexOf( ERROR.USER     ) >= 0) error_type = ERROR.USER;
		if (text.indexOf( ERROR.INTERNAL ) >= 0) error_type = ERROR.INTERNAL;

		return (error_type + text)
			.substr( (error_type + text).lastIndexOf( error_type ) + error_type.length )
			.trim()
			.replace( new RegExp( '\t', 'g' ), ' ' )
			.replace( new RegExp( '  ', 'g' ), ' ' )
		;
	}

	new_message = reduce_white_space( new_message );

	const previous_dialogs = document.querySelectorAll( '.dialog.error' );
	let title = 'Mischief!';
	var new_dialog;

	if (new_message.substr( 0, ('Uncaught').length) == 'Uncaught') {
		new_message = new_message.substr( ('Uncaught ').length );
	}

	if (previous_dialogs.length > 0) {
		let message_repeated = false;

		previous_dialogs.forEach( (previous_dialog)=>{
			const inner_text       = previous_dialog.querySelector( 'p' ).innerHTML;
			const previous_message = reduce_white_space( inner_text );

			if (previous_message == reduce_white_space( new_message )) {
				const H1     = previous_dialog.querySelector( 'h1' );
				const title  = H1.innerText;
				const parts  = title.split( ' (' );
				const number = parseInt( parts[1] ) || 1;
				H1.innerText = parts[0] + ' (' + (number + 1) + ')';

				message_repeated = true;
				new_dialog       = previous_dialog;
			}
		});

		if (message_repeated == false) {
			new_dialog = show_prompt( new_message, title );
		}
	} else {
		new_dialog = show_prompt( new_message, title );
	}

	bringToFront( new_dialog, '.dialog.error', DOM.Z_INDEX.ERROR_DIALOG.index );

} // showErrorMessage


//EOF