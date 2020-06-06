// analyser.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// JSynthLab - copy(l)eft 2019 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from '../helpers.js';
import { DEBUG } from '../constants.js';

const SCOPE = {
	USE_FLOAT          : true,   // Internet Explorer and Safari do not support analyser.getFloatTimeDomainData
	UPDATE_INTERVAL    : 0,
	SUSPENDED_INTERVAL : 250,    // Save CPU while nothing is to be rendered
	SCALE_X            : 1,
	SCALE_Y            : 1,
	TRIGGER_PRECISION  : 10,
	GRID_COLOR         : "#000",
	GRID_LINE_WIDTH    : 0.5,
	ALPHA_FROM_SPEED   : true,
	ALPHA_SPEED_FACTOR : 10,
};

const CHANNEL_RIGHT   = 0;
const CHANNEL_LEFT    = 1;
const CHANNEL_DEFAULT = 0;

const TRIGGER_OFF     = false;
const TRIGGER_PEAK    = 1;
const TRIGGER_ZERO    = 2;


/**
 * Analyser
 */
export const Analyser = function (app, new_container_element, new_audio_source) {
	const self = this;

	this.containerElement;
	this.canvasGraph;
	this.canvasGrid;
	this.renderingContextGraph;

	this.inputTime;
	this.inputAmplitude;
	this.selectTrigger;
	this.selectMode;

	this.width;
	this.height;
	this.mid_y;
	this.range;

	this.brightness;
	this.blur;
	this.saveCPU;

	this.analyser;
	this.destination;
	this.streamSource;

	this.running;


	/**
	 * trigger()
	 */
	this.trigger = function (data, level = +1) {
		const precision     = SCOPE.TRIGGER_PRECISION;
		const buffer_length = Math.min( data.length, self.width );

		if (level == TRIGGER_PEAK) {
			let extreme = Number.NEGATIVE_INFINITY;
			let index   = 0;

			for (let i = 0 ; i < buffer_length ; ++i) {
				const value = (SCOPE.USE_FLOAT) ? data[i] : ((data[i] - 128) / 256) * 2;
				const y = Math.round( value * precision );
				if (y > extreme) {
					extreme = y;
					index   = i;
				}
			}

			return index;
		}

		if (level == TRIGGER_ZERO) {
			let previous_value = (SCOPE.USE_FLOAT) ? data[0] : ((data[0] - 128) / 256) * 2;

			for (let i = 1 ; i < buffer_length ; ++i) {
				const value = (SCOPE.USE_FLOAT) ? data[i] : ((data[i] - 128) / 256) * 2;
				const current_value = value;

				if ((current_value >= 0) &&  (previous_value < 0)) {
					return i;
				}
				previous_value = current_value;
			}

			return 0;   // No trigger point found
		}

		throw new Error( 'Trigger possible only at zero or peak' );

	}; // trigger


	/**
	 * drawXYData()
	 */
	this.drawXYData = function (data_left, data_right, zoom_x, zoom_y) {
		const ctx        = self.renderingContextGraph;
		const nr_samples = data_right.length;

		zoom_x *= self.range;
		zoom_y *= self.range;

		let all_zeroes = true;

		ctx.lineWidth = 1;
		ctx.beginPath();

		let previous_x = data_right[0];
		let previous_y = data_left[0];
		if (! SCOPE.USE_FLOAT) {
			previous_x = ((previous_x - 128) / 256) * 2 ;
			previous_y = ((previous_y - 128) / 256) * 2 ;
		}

		ctx.moveTo(
			self.mid_x + previous_x * zoom_x,
			self.mid_y + previous_y * zoom_y
		);

		for (let i = 1 ; i < nr_samples ; ++i) {
			let current_x = data_right[i];
			let current_y = data_left[i];
			if (! SCOPE.USE_FLOAT) {
				current_x = ((current_x - 128) / 256) * 2;
				current_y = ((current_x - 128) / 256) * 2;
			}

			if ((current_x != 0) || (current_y != 0)) all_zeroes = false;

			if (SCOPE.ALPHA_FROM_SPEED) {
				ctx.stroke();

				const delta = Math.sqrt( (current_x - previous_x)**2 + (current_y - previous_y)**2 );
				const speed = Math.sqrt( delta ) * SCOPE.ALPHA_SPEED_FACTOR;
				const alpha = Math.min( 1, Math.max( 0, 1 - speed / self.brightness ) );

				ctx.strokeStyle = Helpers.colorSetAlpha( self.lineColor, 0.25 + alpha );
				ctx.lineWidth   = 0.25 + alpha;

				ctx.beginPath();
				ctx.moveTo(
					self.mid_x + previous_x * zoom_x,
					self.mid_y - previous_y * zoom_y
				);
				previous_x = current_x;
				previous_y = current_y;
			}

			ctx.lineTo(
				self.mid_x + current_x * zoom_x,
				self.mid_y - current_y * zoom_y
			);
		}

		ctx.stroke();

		if (all_zeroes) {
			ctx.fillStyle = self.lineColor;
			ctx.fillRect( self.mid_x - 0.825, self.mid_y - 0.825, 1.25, 1.25 );
			ctx.fillStyle = self.backgroundColor;
		}

	}; // drawXYData


	/**
	 * drawData()
	 */
	this.drawData = function (data, domain, offset_i, offset_y, zoom_x, zoom_y) {
		const ctx = self.renderingContextGraph;

		zoom_y   *= ((domain == 'time') ? 1 : 1 - Math.abs(offset_y)) * self.range;
		offset_y  = self.mid_y - self.mid_y*offset_y - ((domain == 'frequency') ? self.range : 0);

		let previous_x  = (SCOPE.USE_FLOAT) ? data[0] : ((data[0] - 128) / 256) * 2;
		let initial_y   = data[0 + offset_i];
		if (! SCOPE.USE_FLOAT) initial_y = ((initial_y - 128) / 256) * 2;

		const increment = data.length / self.width;

		ctx.beginPath();
		ctx.moveTo( previous_x, offset_y - initial_y * zoom_y );

		for (let i = 1 ; i < data.length ; i += increment) {
			const index     = Math.floor( i * zoom_x ) + offset_i;
			const magnitude = (SCOPE.USE_FLOAT) ? data[index] : ((data[index] - 128) / 256) * 2;

			const x = (i * self.width / data.length) % self.width;
			const y = magnitude * zoom_y;

			if (x > previous_x) {
				ctx.lineTo( x, offset_y - y );
			} else {
				ctx.moveTo( x, offset_y - y );
			}
			previous_x = x;
		}

		ctx.stroke();

	}; // drawData


	/**
	 * updateScreen()
	 */
	this.updateScreen = function () {
		var use_trigger;                     // false, 0 (zero) or +1 (peak)
		var show_left, show_right;           // Whether the channel is to be considered/rendered
		var offset_y_left, offset_y_right;   // 'Stereo' clicked: show both channels (top and bottom wave)
		var xy_mode;

		function get_time_domain( analyser, return_array ) {
			if (app.audioContext.state == 'running') {
				if (SCOPE.USE_FLOAT) analyser.getFloatTimeDomainData( return_array );
				else                  analyser.getByteTimeDomainData( return_array );
			}
		}

		function get_frequency_domain( analyser, return_array ) {
			if (app.audioContext.state == 'running') {
				if (SCOPE.USE_FLOAT) analyser.getFloatFrequencyData( return_array );
				else                  analyser.getByteFrequencyData( return_array );
			}
		}

		function graph_domain( domain, use_trigger ) {
			let zoom_x   = parseFloat( self.inputTime.value );
			let zoom_y   = parseFloat( self.inputAmplitude.value );
			let offset_i = 0;   // Move wave to the right by i samples (trigger)
			let offset_y = 0;

			if (self.checkboxStereo.checked) {
				self.range  = (self.mid_y - 5) / 2;

				const F  = SCOPE.USE_FLOAT;
				const BC = self.analyser_left.frequencyBinCount;
				const data_left  = (F) ? new Float32Array( BC ) : new Uint8Array( BC );
				const data_right = (F) ? new Float32Array( BC ) : new Uint8Array( BC );

				show_left = show_right = xy_mode = false;

				switch (self.selectMode.value) {
				case 'Spectrum':   // Fall through
				case 'Left+Right':
					offset_y_left  = -self.range / self.mid_y;   // Top graph
					offset_y_right = +self.range / self.mid_y;   // Bottom graph
					show_left      = true;
					show_right     = true;
					zoom_y        /= 1;
				break;
				case 'Left':
					offset_y_left  = 0;
					offset_y_right = 0;
					show_left      = true;
				break;
				case 'Right':
					offset_y_left  = 0;
					offset_y_right = 0;
					show_right     = true;
				break;
				case 'X/Y':
					xy_mode        = true;
					zoom_x        *= 2;
					zoom_y        *= 2;
				break;
				}


				switch (domain) {
				case 'time':
					if (show_left) {
						get_time_domain( self.analyser_left, data_left );
						if (use_trigger) offset_i = self.trigger( data_left, use_trigger );
					}
					if (show_right) {
						get_time_domain( self.analyser_right, data_right );
						if (use_trigger) offset_i = self.trigger( data_right, use_trigger );
					}

					if (show_left) {
						self.drawData(
							data_left, domain,
							offset_i, offset_y_left, zoom_x, zoom_y
						);
					}
					if (show_right) {
						self.drawData(
							data_right, domain,
							offset_i, offset_y_right, zoom_x, zoom_y
						);
					}
				break;

				case 'frequency':
					zoom_y *= 0.005;

					if (show_left) {
						get_frequency_domain( self.analyser_left, data_left );
						self.drawData(
							data_left, domain,
							offset_i, offset_y_left, zoom_x, zoom_y
						);
					}
					if (show_right) {
						get_frequency_domain( self.analyser_right, data_right );
						self.drawData(
							data_right, domain,
							offset_i, offset_y_right, zoom_x, zoom_y
						);
					}
				break;

				case 'timexy':
					get_time_domain( self.analyser_right, data_right );
					get_time_domain( self.analyser_left,  data_left  );
					self.drawXYData( data_left, data_right, zoom_x, zoom_y );
				break;
				}

			} else {
				// Mono
				self.range  = self.mid_y - 5;

				const F  = SCOPE.USE_FLOAT;
				const BC = self.analyser_mono.frequencyBinCount;
				const data_mono = (F) ? new Float32Array( BC ) : new Uint8Array( BC );

				if (domain == 'time') {
					get_time_domain( self.analyser_mono, data_mono );
					if (use_trigger) offset_i = self.trigger( data_mono, use_trigger )
				} else {
					zoom_y *= 0.005;
					get_frequency_domain( self.analyser_mono, data_mono );
				}
				self.drawData( data_mono, domain, offset_i, offset_y, zoom_x, zoom_y );
			}

		} // graph_domain


		function float (value) {
			value = parseFloat( value );
			if (isNaN( value )) return 0.5; else return value;
		}
		self.brightness = float( self.inputBrightness.value );
		self.blur       = (1 - float( self.inputBlur.value ));

		self.renderingContextGraph.strokeStyle = Helpers.colorSetAlpha( self.lineColor, self.brightness );
		self.renderingContextGraph.fillStyle   = Helpers.colorSetAlpha( self.backgroundColor, self.blur );
		self.renderingContextGraph.fillRect( -1, -1, self.width + 1, self.height + 1 );

		switch (self.selectTrigger.value) {
		case 'Off'  :  use_trigger = TRIGGER_OFF;    break;
		case 'Peak' :  use_trigger = TRIGGER_PEAK;   break;
		case 'Zero' :  use_trigger = TRIGGER_ZERO;   break;
		}

		switch (self.selectMode.value) {
		case 'Spectrum' :  graph_domain( 'frequency' );          break;
		case 'X/Y'      :  graph_domain( 'timexy'    );          break;
		default         :  graph_domain( 'time', use_trigger );  break;
		}

		if (self.running) {
			const interval = (self.saveCPU) ? SCOPE.SUSPENDED_INTERVAL : SCOPE.UPDATE_INTERVAL;
			setTimeout( self.updateScreen, interval );
		}
		else if (DEBUG.AUDIO_ANALYSER) {
			console.log( 'Analyser terminating' );
		}

	}; // updateScreen


	/**
	 * setFFTSize()
	 */
	this.setFFTSize = function (new_fft_size) {
		self.analyser_mono.fftSize
		= self.analyser_right.fftSize
		= self.analyser_left.fftSize
		= new_fft_size
		;
	};


	/**
	 * connectStream()
	 */
	this.connectStream = function (stream) {
		if (DEBUG.AUDIO_ANALYSER) {
			console.groupCollapsed( 'Analyser: Connecting stream:', stream.id );
			console.log( stream );
			console.groupEnd();
		}

		const audio_tracks = stream.getAudioTracks();

		if (audio_tracks.length == 0) return null;

		const source = app.audioContext.createMediaStreamSource( stream );
		source.connect( self.destination );

		return source;

	}; // connectStream


	/**
	 * disconnectStream()
	 */
	this.disconnectStream = function (stream) {
		if (DEBUG.AUDIO_ANALYSER) {
			console.groupCollapsed( 'Analyser: Disconnecting stream:', stream.mediaStream.id );
			console.log( stream.mediaStream );
			console.groupEnd();
		}

		if (stream !== null) {
			stream.disconnect();
		}

	}; // disconnectStream


	/**
	 * init()
	 */
	this.init = function (container_element, audio_source) {

		function draw_grid () {
			const ctx       = self.renderingContextGrid;
			const mid_x     = Math.round( self.width  / 2 );
			const mid_y     = Math.round( self.height / 2 );
			const step_size = Math.round( self.height / 4.25 );

			ctx.strokeStyle = SCOPE.GRID_COLOR;
			ctx.lineWidth   = SCOPE.GRID_LINE_WIDTH;

			ctx.clearRect( -1, -1, self.width + 1, self.height + 1 );

			ctx.beginPath();
			for (let i = 0; i < self.width; i+=step_size) {
				ctx.moveTo( mid_x - i, 0 );   ctx.lineTo( mid_x - i, self.height );
				ctx.moveTo( mid_x + i, 0 );   ctx.lineTo( mid_x + i, self.height );
				ctx.moveTo( 0, mid_y - i );   ctx.lineTo( self.width, mid_y - i );
				ctx.moveTo( 0, mid_y + i );   ctx.lineTo( self.width, mid_y + i );
			}
			ctx.stroke();
		}


		self.containerElement = container_element;   // DIV holding the 'screen'
		const screen_element = container_element.querySelector( '.screen' );


		// Fetch DOM elements from Item window

		self.inputTime        = container_element.querySelector( '.Time'       );
		self.inputAmplitude   = container_element.querySelector( '.Amplitude'  );
		self.inputBrightness  = container_element.querySelector( '.Brightness' );
		self.inputBlur        = container_element.querySelector( '.Blur'       );
		self.selectTrigger    = container_element.querySelector( '.Trigger'    );
		self.selectMode       = container_element.querySelector( '.Mode'       );
		self.checkboxStereo   = container_element.querySelector( '.Stereo'     );


		// Extract info from CSS

		const style           = Helpers.computedStyle( screen_element );
		self.lineColor        = style.color;
		self.backgroundColor  = style.backgroundColor;

		const border_x = parseInt( style.borderLeftWidth  ) + parseInt( style.borderRightWidth  );
		const border_y = parseInt( style.borderTopWidth  ) + parseInt( style.borderBottomWidth  );

		self.width  = parseInt( style.width  ) - border_x;
		self.height = parseInt( style.height ) - border_y;

		self.mid_x  = Math.round( self.width / 2 );
		self.mid_y  = Math.round( self.height / 2 );
		self.range  = self.mid_y - 5;


		// Create <canvas> elements

		screen_element.appendChild( self.canvasGraph = document.createElement( 'canvas' ) );
		screen_element.appendChild( self.canvasGrid  = document.createElement( 'canvas' ) );
		screen_element.appendChild( self.shadow      = document.createElement( 'div' )    );
		self.canvasGraph.className = 'graph';
		self.canvasGrid.className  = 'grid';
		self.shadow.className      = 'shadow';

		self.renderingContextGraph = self.canvasGraph.getContext( '2d' );
		self.renderingContextGrid  = self.canvasGrid.getContext( '2d' );

		Helpers.initializeCanvas( self.canvasGraph, self.width, self.height );
		Helpers.initializeCanvas( self.canvasGrid,  self.width, self.height );


		// Oscilloscope: Initial background

		self.renderingContextGraph.fillStyle  = self.backgroundColor;
		self.renderingContextGraph.fillRect( -1, -1, self.width + 1, self.height + 1 );


		// Draw raster etched into the glass of the CRT

		self.gridColor = Helpers.colorSetAlpha( self.lineColor, 0.25 );
		self.renderingContextGrid.strokeStyle = self.gridColor;
		draw_grid();


		// Analyser

		const fft_size_input  = container_element.querySelector( '.fftSize' );
		const fft_size        = parseInt( fft_size_input.value );

		self.destination      = app.audioContext.createMediaStreamDestination();
		self.streamSource     = app.audioContext.createMediaStreamSource( self.destination.stream );

		self.splitter         = app.audioContext.createChannelSplitter( 2 );

		self.analyser_mono    = app.audioContext.createAnalyser();
		self.analyser_right   = app.audioContext.createAnalyser();
		self.analyser_left    = app.audioContext.createAnalyser();

		self.analyser_mono .fftSize = fft_size;
		self.analyser_right.fftSize = fft_size;
		self.analyser_left .fftSize = fft_size;

		self.streamSource.connect( self.analyser_mono );
		self.streamSource.connect( self.splitter );

		self.splitter.connect( self.analyser_right, CHANNEL_RIGHT );
		self.splitter.connect( self.analyser_left,  CHANNEL_LEFT  );


		// Start oscilloscope

		self.running = true;
		self.saveCPU = false;   // While true, refresh rate is reduced
		self.updateScreen();    // Start continuous update

		if (DEBUG.AUDIO_ANALYSER) console.log( 'Analyser started' );

	}; // init


	// CONSTRUCTOR

	self.init( new_container_element, new_audio_source );

}; // Analyser


//EOF