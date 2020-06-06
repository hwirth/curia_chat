// sounds.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import { DEBUG, SETTINGS, CHAT_EVENTS } from '../constants.js';
import { CURRENT_LANGUAGE, localized } from '../localize.js';


const SOUNDS = {
	MESSAGE_SENT        :  [440, 660],
	MESSAGE_RECEIVED    :  [660, 440],
	SYSTEM_MESSAGE      :  [440, 440],
	NAME_MENTIONED      :  [880, 770, 550, 660],
	RELOADING           :  [660, 880, 770],
	CLIENT_CONNECTED    :  [110, 220, 330],
	CLIENT_DISCONNECTED :  [330, 220, 110],
	NAME_CHANGE         :  [110, 220, 440],
	PRIVATE_MESSAGE     :  [110, 220, 440],
	HANG_UP             :  [660, 550, 220],
	SUCCESS             :  [660, 770, 880],
	WARNING             :  [440, 110],
	FAILURE             :  [220, 55],
	DEVICE_ENABLED      :  [220, 440],
	DEVICE_DISABLED     :  [440, 220],

}; // SOUNDS


const MORSE_CODES = {
	'a': '.-',      'b': '-...',    'c': '-.-.',    'd': '-..',     'e': '.',       'f': '..-.',    'g': '--.',
	'h': '....',    'i': '..',      'j': '.---',    'k': '-.-',     'l': '.-..',    'm': '--',      'n': '-.',
	'o': '---',     'p': '.--.',    'q': '--.-',    'r': '.-.',     's': '...',     't': '-',       'u': '..-',
	'v': '...-',    'w': '.--',     'x': '-..-',    'y': '-.--',    'z': '--..',
	'1': '.----',   '2': '..---',   '3': '...--',   '4': '....-',   '5': '.....',
	'6': '-....',   '7': '--...',   '8': '---..',   '9': '---..',   '0': '-----',
	' ': ' ',  '.': '',
};


/**
 * Synth()
 */
export const Synth = function (app, chat) {
	const self = this;

	this.analyser;

	this.enabled;
	this.volume;
	this.ringTone;


	/**
	 * sigmoid_transform()
	 */
	function sigmoid_transform (value) {
		return (1 - Math.cos(value * Math.PI)) / 2;

	} // sigmoid_transform


	/**
	 * adjusted_volume()
	 */
	function adjusted_volume (chat_event) {
		const range_value = chat.preferences.events[chat_event.key].volume;
		const result = sigmoid_transform( range_value );

		if (DEBUG.SOUNDS) console.log( 'adjusted_volume:', chat_event.key, range_value, result );

		return result * self.volume;

	} // adjusted_volume


	/**
	 * ring()
	 */
	this.ring = function (start = true) {
		if (! self.enabled) return;

		const volume = adjusted_volume( CHAT_EVENTS.RINGING_STARTS );

		if (start && (self.ringTone === null)) {
			self.ringTone = {
				oscillator1  : self.audioContext.createOscillator(),
				oscillator2  : self.audioContext.createOscillator(),
				oscillator3  : self.audioContext.createOscillator(),
				gain1        : self.audioContext.createGain(),
				gain2        : self.audioContext.createGain(),
				gain3        : self.audioContext.createGain(),
			};

			self.ringTone.oscillator1.type = 'square';
			self.ringTone.oscillator1.frequency.value = 10;
			self.ringTone.oscillator1.connect( self.ringTone.gain1 );

			self.ringTone.gain1.gain.value = 100;
			self.ringTone.gain1.connect( self.ringTone.oscillator2.frequency );

			self.ringTone.oscillator2.type = 'square';
			self.ringTone.oscillator2.frequency.value = 440;
			self.ringTone.oscillator2.connect( self.ringTone.gain2 );

			self.ringTone.oscillator3.type = 'square';
			self.ringTone.oscillator3.frequency.value = 0.5;
			self.ringTone.oscillator3.connect( self.ringTone.gain2.gain );

			self.ringTone.gain2.gain.value = 0.85;
			self.ringTone.gain2.connect( self.ringTone.gain3 );

			self.ringTone.gain3.gain.value = 0.01 * volume;
			self.ringTone.gain3.connect( self.audioContext.destination );

			self.ringTone.oscillator1.start();
			self.ringTone.oscillator2.start();
			self.ringTone.oscillator3.start();
		}
		else if (!start && (self.ringTone !== null)) {
			self.ringTone.oscillator1.stop();
			self.ringTone.oscillator2.stop();
			self.ringTone.oscillator3.stop();
			self.ringTone = null;
		}

	}; // ring


	/**
	 * beep()
	 */
	this.beep = function (frequency = 440, t_offset = 0, event_volume) {
		if (! self.enabled) return;

		if (DEBUG.SOUNDS) console.log( 'Beep:', frequency, t_offset, event_volume );

		const envelope = [
			[0,   0.01],
			[1,   0.02],
			[0.3, 0.1 ],
			[0.3, 0.65],
			[0,   0.7 ],
		];


		let oscillator1  = self.audioContext.createOscillator();
		let gain1        = self.audioContext.createGain();

		oscillator1.connect( gain1 );
		gain1      .connect( self.audioContext.destination );

		// Properties
		oscillator1.setPeriodicWave(
			self.audioContext.createPeriodicWave(
				new Float32Array( [0, 1, 2, 3, 4, 5] ),
				new Float32Array( [0, 0, 0, 0, 0, 0] ),
				{ disableNormalization: false }
			)
		);

		const t0 = self.audioContext.currentTime + t_offset;

		if (DEBUG.SOUNDS) console.log( 'tOffs = ' + t_offset + ', f = ' + frequency );

		envelope.forEach( (entry)=>{
			const volume = event_volume * entry[0];
			const at_time = t0 + entry[1] * SETTINGS.SOUNDS.SPEED_FACTOR;

			if (DEBUG.SOUNDS) console.log( 'at_time = ' + at_time + ', v = ' + volume );

			gain1.gain.linearRampToValueAtTime( volume, at_time );
		});


		oscillator1.frequency.value = frequency;
		oscillator1.start();
		gain1.gain.setValueAtTime( 0, self.audioContext.currentTime );

		const stop_time = envelope[envelope.length-1][1] * 1000;   //... * SPEED_FACTOR

		if (DEBUG.SOUNDS) console.log( 'stop_at = ' + (stop_time/1000 + t0) );

		setTimeout( ()=>{
			oscillator1.stop();
			gain1.disconnect();
			oscillator1.disconnect();

			gain1 = null;
			oscillator1 = null;

			if (DEBUG.SOUNDS) console.log( 'Stop', frequency );

		}, stop_time);


	}; // beep


	/**
	 * play()
	 */
	this.play = function (chat_event) {
		if (DEBUG.SOUNDS) console.log( 'Play: enabled:', self.enabled, 'chat_event:', chat_event.key );

		if (! self.enabled) return;

		const frequencies = SOUNDS[chat_event.key];
		const volume = adjusted_volume( chat_event );

		if (DEBUG.SOUNDS) console.log( 'Play: Freqencies:', frequencies, 'Volume:', volume );

		let t = 0;
		frequencies.forEach( (frequency)=>{
			self.beep( frequency, t, volume );
			t += SETTINGS.SOUNDS.SPEED_FACTOR;
		});

	}; // play


	/**
	 * morse()
	 */
	this.morse = function (text = 'cq', wpm = 35) {
		const volume = adjusted_volume( CHAT_EVENTS.ATTENTION_REQUEST );

		// Nodes
		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator1  = audioContext.createOscillator();
		const gain1        = audioContext.createGain();
		const gain2        = audioContext.createGain();

		// Properties
		oscillator1.type      = "square";
		oscillator1.frequency.value = 880;
		gain1      .gain     .value = 0;
		gain2      .gain     .value = 0.1;

		// Connections
		oscillator1.connect( gain1 );
		gain1      .connect( gain2 );
		gain2      .connect( audioContext.destination );

		text = text.toLowerCase()

		const dit_length = 1.200 / wpm;
		const flank_time = Math.max( 0.001, dit_length/10 );

		let time = 0;
		let beep = '';
		for (let i = 0; i < text.length; ++i) {
			const char = text[i];
			const code = MORSE_CODES[char];

			beep += char;

			for (let j = 0; j < code.length; ++j) {
				switch (code[j]) {
				case '.':  beep += '*.';  break;
				case '-':  beep += '***.';  break;
				case ' ':  beep += '....';  break;
				}
			}

			beep += '..';
		}

		console.log( beep );

		let previous_value = 0;
		for (let i = 0; i < beep.length; ++i) {
			gain1.gain.setValueAtTime( previous_value, time );
			if (beep[i] == '*') {
				gain1.gain.linearRampToValueAtTime( volume, time + flank_time );
				previous_value = 1;
			}
			else if (beep[i] == '.') {
				gain1.gain.linearRampToValueAtTime( 0, time + flank_time );
				previous_value = 0;
			}
			time += dit_length;
		}

		// Start Nodes
		oscillator1.start();

	}; // morse


	/**
	 * on_play_attention_request()
	 */
	this.attention = function () {
	}; // on_play_attention_request


	/**
	 * playEventSound()
	 */
	this.playEventSound = function (chat_event) {
		if (!self.enabled) return;

		const volume = chat.preferences.events[chat_event.key].volume;

		//if (DEBUG.SOUNDS) {
			console.log( '%cSOUND%c:', 'color:#064', 'color:#000', chat_event.key, 'Volume:', volume );
		//}

		if (volume == 0) return;

		switch (chat_event.key) {
		case CHAT_EVENTS.TEXT_TO_SPEECH     .key :  self.say( 'Welcome' );    break;
		case CHAT_EVENTS.SUCCESS            .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.FAILURE            .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.WARNING            .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.CLIENT_CONNECTED   .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.CLIENT_DISCONNECTED.key :  self.play( chat_event );  break;
		case CHAT_EVENTS.SYSTEM_MESSAGE     .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.PRIVATE_MESSAGE    .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.MESSAGE_RECEIVED   .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.MESSAGE_SENT       .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.NAME_MENTIONED     .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.ATTENTION_REQUEST  .key :  self.morse();             break;
		case CHAT_EVENTS.DEVICE_ENABLED     .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.DEVICE_DISABLED    .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.RINGING_STARTS     .key :  self.ring( true );        break;
		case CHAT_EVENTS.RINGING_STOPS      .key :  self.ring( false );       break;
		case CHAT_EVENTS.HANG_UP            .key :  self.play( chat_event );  break;
		case CHAT_EVENTS.RELOADING          .key :  self.play( chat_event );  break;
		}

	}; // playEventSound


	/**
	 * say()
	 */
	this.say = function (content, language = null) {
		if( (! self.responsiveVoiceLoaded)
		||  (chat.preferences.events[CHAT_EVENTS.TEXT_TO_SPEECH.key].volume == 0)
		) {
			return;
		}

		if (content instanceof HTMLElement) {
			const div = content.cloneNode( true );
			const name = div.querySelector( '.name' );
			const meta = div.querySelector( '.meta' );
			content = (name === null) ? '' : name.innerText + ' ' + localized( 'SAYS' ) + ':... ';
			if (meta !== null) div.removeChild( meta );
			content += div.innerText;
		}


		if (content) {
			const words = content.split( ' ' );
			for (let i = 0; i < words.length; ++i) {
				if (words[i].substr( 0, 7 ) == '::ffff:') {
					words[i]
					= words[i]
					.substr( 7 )
					.replace( '.', localized( 'DOT' ) )
					.replace( ':', ', ' + localized( 'PORT' ) )
					;
				}
			}
			content = words.join( ' ' );

			if (CURRENT_LANGUAGE == 'de' || language == 'de') {
				responsiveVoice.setDefaultVoice( 'Deutsch Female' );
			}

			const volume = self.volume * adjusted_volume( CHAT_EVENTS.TEXT_TO_SPEECH );
			responsiveVoice.speak( content, null, { volume: volume } );

			//...console.log( '%cSay%c:', 'color:green', 'color:black', content );
		}

	}; // say


	/**
	 * setVolume()
	 */
	this.setVolume = function (value) {
		self.volume = sigmoid_transform( value ) * 2;
		if (DEBUG.SOUNDS) console.log( 'Master volume:', value, '-->', self.volume );

	}; // setVolume


	/**
	 * init()
	 */
	this.init = function () {
		self.enabled = false;
		self.ringTone = null;
		self.volume = SETTINGS.SOUNDS.VOLUME;

		self.responsiveVoiceLoaded = (app.dom.scriptResponsiveVoice !== null);

		/**
		 * enable_sound()
		 * Sound must not be played before the user made a "gesture" (click, key press).
		 */
		function enable_sound () {
			removeEventListener( 'mousedown', enable_sound );
			removeEventListener( 'keydown',   enable_sound );

			self.enabled = true;
			self.audioContext = new (window.AudioContext || window.webkitAudioContext)();

			self.say( localized( 'WELCOME_TO_CURIA_CHAT' ) );

		} // enable_sound

		addEventListener( 'keydown',   enable_sound );
		addEventListener( 'mousedown', enable_sound );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // Synth


//EOF