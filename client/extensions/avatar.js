// avatar.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from '../helpers.js';
import { DEBUG, SETTINGS, REQUEST, ICON_DATA } from '../constants.js';


/**
 * Avatar()
 */
export const Avatar = function (app, chat) {
	const self = this;

	this.dataUrl;
	var sending_snapshots;


	/**
	 * saveToLocalStorage()
	 */
	this.saveToLocalStorage = function () {
		localStorage.setItem( 'curia_avatar', JSON.stringify( self.dataUrl ) );

	}; // saveToLocalStorage


	/**
	 * loadFromLocalStorage()
	 */
	this.loadFromLocalStorage = function () {
		let loaded_avatar = null;

		//... get rid of the try block
		try {
			loaded_avatar = JSON.parse( localStorage.getItem( 'curia_avatar' ) );
		}
		catch (error) {
			console.log( '%cWARNING%c: Avatar could not be JSON-parsed', error );
		}

		return loaded_avatar;

	} // loadFromLocalStorage


	/**
	 * sendToServer()
	 */
	this.sendToServer = function (data_url = null) {
		if (! chat.serverInfo.avatars.enabled) return;

		if (data_url === null) {
			data_url = self.dataUrl;
		}

		chat.sendMessage( REQUEST.UPDATE_AVATAR, data_url );

	}; // sendToServer


	/**
	 * sendSnapshot()
	 */
	this.sendSnapshot = function (data_url) {
		if (! chat.serverInfo.avatars.enabled) return;

		if (data_url === null) {
			if (sending_snapshots) {
				self.dataUrl = self.loadFromLocalStorage();
				self.sendToServer( self.dataUrl );
				sending_snapshots = false;
			}
			// else: Don't cause network traffix
		} else {
			self.sendToServer( data_url );
			sending_snapshots = true;
		}

	}; // sendSnapshot


	/**
	 * zoomImageToDataUrl()
	 */
	this.zoomImageToDataUrl = function (
		source_image,
		background_color,
		zoom,
		offset_x,
		offset_y,
		zoom_to_fit = false
	) {
		const source_width  = source_image.naturalWidth;
		const source_height = source_image.naturalHeight;


		/**
		 * find_background_color()
		 */
		function find_background_color () {
			const canvas  = document.createElement( 'canvas' );
			const context = canvas.getContext( '2d' );
			canvas.width  = source_width;
			canvas.height = source_height;
			context.drawImage( source_image, 0, 0 );

			const corner_pixels = [
				context.getImageData( 0, 0, 1, 1 ),
				context.getImageData( source_width-1, 0, 1, 1 ),
				context.getImageData( 0, source_height-1, 1, 1 ),
				context.getImageData( source_width-1, source_height-1, 1, 1 ),
			];

			let color = '#ffffff';

			const color0 = corner_pixels[0].data;
			const color1 = corner_pixels[1].data;
			const color2 = corner_pixels[2].data;
			const color3 = corner_pixels[3].data;

			if (SETTINGS.AVATARS.BG_MODE == 'topleft') {
				color = color0;
			}
			else if (SETTINGS.AVATARS.BG_MODE == 'average') {
				color = [
					(color0[0] + color1[0] + color2[0] + color3[0]) / 4,
					(color0[1] + color1[1] + color2[1] + color3[1]) / 4,
					(color0[2] + color1[2] + color2[2] + color3[2]) / 4,
				];
			}
			else if (SETTINGS.AVATARS.BG_MODE == 'identical') {
				if( (color0[0] == color1[0]) && (color0[1] == color1[1]) && (color0[2] == color1[2])
				&&  (color0[0] == color2[0]) && (color0[1] == color2[1]) && (color0[2] == color2[2])
				&&  (color0[0] == color3[0]) && (color0[1] == color3[1]) && (color0[2] == color3[2])
				) {
					color = color0;
				}
			}

			return Helpers.rgb_to_html_color( color[0], color[1], color[2] );

		} // find_background_color


		if (background_color === null) {
			background_color = find_background_color();
		}

		const reference
		= (zoom_to_fit)
		? Math.min( source_width, source_height )
		: Math.max( source_width, source_height )
		;

		const z = SETTINGS.AVATARS.WIDTH / reference * zoom;
		const w = z * source_width;
		const h = z * source_height;

		const x = (SETTINGS.AVATARS.WIDTH  - w) / 2 + SETTINGS.AVATARS.WIDTH  * offset_x;
		const y = (SETTINGS.AVATARS.HEIGHT - h) / 2 - SETTINGS.AVATARS.HEIGHT * offset_y;

		const canvas  = document.createElement( 'canvas' );
		canvas.width  = SETTINGS.AVATARS.WIDTH;
		canvas.height = SETTINGS.AVATARS.HEIGHT;

		const context = canvas.getContext( '2d' );
		context.fillStyle = background_color;
		context.fillRect( 0, 0, canvas.width, canvas.height );
		context.drawImage( source_image, x, y, w, h );

		const quality = 0.75;
		const png = canvas.toDataURL( 'image/jpeg', quality );
		const jpg = canvas.toDataURL( 'image/jpeg', quality );

		const data_url = (png.length < jpg.length) ? png : jpg;

		return data_url;

	}; // zoomImageToDataUrl


	/**
	 * applySettings()
	 */
	this.applySettings = function (new_settings = null) {
		if (new_settings !== null) {
			SETTINGS.AVATARS.ENABLED = new_settings.enabled;
			SETTINGS.AVATARS.WIDTH   = new_settings.width;
			SETTINGS.AVATARS.HEIGHT  = new_settings.height;
		}

		Helpers.setDynamicStyle( '--avatar-width',  SETTINGS.AVATARS.WIDTH + 'px' );
		Helpers.setDynamicStyle( '--avatar-height', SETTINGS.AVATARS.HEIGHT + 'px' );

	}; // applySettings


	/**
	 * init()
	 */
	this.init = function () {
		sending_snapshots = false;
		self.dataUrl = self.loadFromLocalStorage();

		self.applySettings();

	}; // init


	// CONSTRUCTOR

	self.init();

}; // Avatar


//EOF