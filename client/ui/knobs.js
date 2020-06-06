// knobs.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// JSynthLab - copy(l)eft 2019 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as CONST   from "../constants.js";
import * as Helpers from "../helpers.js";

const KNOB_PIXEL_SCALE_X = 5;
const KNOB_PIXEL_SCALE_Y = 25;

/**
 * KnobController()
 */
export const KnobController = function (app) {
	const self = this;

	this.currentKnob;
	this.currentInput;
	this.startValue;


	/**
	 * setValue()
	 */
	this.setValue = function (knob, new_value, dispatch_event = false) {
		const min        = parseFloat( knob.dataset.min );
		const max        = parseFloat( knob.dataset.max );

		new_value = Math.min( max, Math.max( min, new_value ) );

		const step       = parseFloat( knob.dataset.stepFine );
		const precision  = Math.log10( step );
		const range      = (max - min);
		const norm_value = ((new_value - min) - range/2) / range;
		const angle      = 2 * norm_value * 170;

		if ((String( new_value ).indexOf( "." ) >= 0) && (precision < 0)) {
			new_value = Math.round( new_value / step ) * step;
			new_value = new_value.toFixed( precision * (-1) );

			while( (new_value.charAt( new_value.length - 1 ) == "0")
			&&     (new_value.charAt( new_value.length - 2 ) != ".")
			) {
				new_value = new_value.substr( 0, new_value.length - 1 );
			}
		}

		knob.dataset.value   = new_value;
		knob.style.transform = "rotate(" + angle + "deg)";

		if (knob.inputElement !== null) knob.inputElement.value = new_value;
		if (dispatch_event) knob.dispatchEvent( new Event( "change", {bubbles: true} ) );

	}; // setValue


	/**
	 * onKeyDown()
	 */
	this.onKeyDown = function (event) {
		if (event.target.classList.contains( "knob" )) {
			self.currentKnob = event.target;

			const min        = parseFloat( self.currentKnob.dataset.min );
			const max        = parseFloat( self.currentKnob.dataset.max );
			const stepCoarse = parseFloat( self.currentKnob.dataset.stepCoarse );
			const stepFine   = parseFloat( self.currentKnob.dataset.stepFine   );

			let value = parseFloat( self.currentKnob.dataset.value );
			let step  = stepCoarse;

			if (event.shiftKey) {
				step = stepFine;
			}

			switch (event.key) {
			case "ArrowLeft"  :  value -= step;       break;
			case "ArrowRight" :  value += step;       break;
			case "ArrowUp"    :  value += step / 10;  break;
			case "ArrowDown"  :  value -= step / 10;  break;
			}

			value = Math.min( max, Math.max( min, value ) );

			self.setValue( self.currentKnob, value, /*dispatch_event*/true );
		}

	}; // onKeyDown


	/**
	 * onMouseMove()
	 */
	this.onMouseMove = function (event) {
		const delta_x    = Math.round( (event.screenX - self.startX) / KNOB_PIXEL_SCALE_X );
		const delta_y    = Math.round( (self.startY - event.screenY) / KNOB_PIXEL_SCALE_Y );

		const min        = parseFloat( self.currentKnob.dataset.min );
		const max        = parseFloat( self.currentKnob.dataset.max );
		const stepCoarse = parseFloat( self.currentKnob.dataset.stepCoarse );
		const stepFine   = parseFloat( self.currentKnob.dataset.stepFine   );

		const precision  = ((event.shiftKey) ? stepFine : stepCoarse);
		const distance   = delta_x * precision + delta_y * precision;
		const value      = Math.min( max, Math.max( min, self.startValue + distance ) );

		self.setValue( self.currentKnob, Helpers.round( value, precision ), /*dispatch_event*/true );

	}; // onMouseMove


	/**
	 * onMouseUp()
	 */
	this.onMouseUp = function (event) {
		removeEventListener( "mousemove", self.onMouseMove );
		removeEventListener( "mouseup",   self.onMouseUp   );

		self.currentKnob.dispatchEvent( new Event( "input", {bubbles: true} ) );

		document.body.classList.remove( 'noselect' );

	}; // onMouseUp


	/**
	 * onMouseDown()
	 */
	this.onMouseDown = function (event) {
		if (event.target.classList.contains( "knob" )) {
			self.currentKnob  = event.target;
			self.startValue   = parseFloat( event.target.dataset.value );
			self.startX       = event.screenX;
			self.startY       = event.screenY;

			document.body.classList.add( 'noselect' );

			if (event.ctrlKey) {
				const default_value = parseFloat( self.currentKnob.dataset.defaultValue ) || 0;
				self.currentKnob.setValue( default_value );
				self.currentKnob.dispatchEvent( new Event( "input", {bubbles: true} ) );
			} else {
				addEventListener( "mousemove", self.onMouseMove );
				addEventListener( "mouseup",   self.onMouseUp   );
			}
		}

	}; // onMouseDown


	/**
	 * updateDom()
	 */
	this.updateDom = function () {
		const knobs = document.querySelectorAll( ".knob" );

		for (let i = 0; i < knobs.length; ++i) {
			const knob = knobs[i];

			knob.setValue = (new_value)=>{ self.setValue( knob, new_value ); };
			knob.dataset.value = knob.dataset.defaultValue;
			knob.title    = "SHIFT+Drag: Fine tune, CTRL+Click: Reset";
			knob.tabIndex = "0";

			knob.inputElement = knob.parentNode.querySelector( '.knob_input' );
			knob.inputElement.value = knob.dataset.defaultValue;
		}

	}; // updateDom


	/**
	 * init()
	 */
	this.init = function () {
		self.updateDom();
		addEventListener( "mousedown", self.onMouseDown );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // KnobController


//EOF