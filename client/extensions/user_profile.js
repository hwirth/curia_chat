// user_profile.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import * as Helpers from '../helpers.js';

import {
	DEBUG, SETTINGS, REQUEST, ICON_DATA,

} from '../constants.js';

import { TEXT, localized } from '../localize.js';


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// EDIT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * EditProfile
 */
const EditProfile = function (app, chat) {
	const self = this;

	this.containerElement;


	/**
	 * on_submit()
	 */
	function on_submit (event) {
		event.preventDefault();

		//...chat.preferences.save();

		return false;

	} // on_submit


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement = app.dom.formProfileEdit;

		app.dom.formProfileEdit.addEventListener( 'submit',  on_submit );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // EditProfile


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// AVATAR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * EditAvatar()
 */
const EditAvatar = function (app, chat) {
	const self = this;

	this.containerElement;
	this.avatarBackgroundColor;
	this.previousDataUrl;


	/**
	 * set_inputs_enabled()
	 */
	function set_inputs_enabled (enable) {
		app.dom.formProfileAvatar.querySelectorAll( '.new_image_only' ).forEach( (element)=>{
			element.classList.toggle( 'disabled', !enable );
		});

		app.dom.btnAvatarClear  .classList.toggle( 'disabled', chat.avatar.dataUrl === null );
		app.dom.btnAvatarRestore.classList.toggle( 'disabled', self.previousDataUrl === null );

	} // set_inputs_enabled


	/**
	 * new_avatar()
	 */
	function new_avatar (zoom_to_fit = false) {
		if (app.dom.fileAvatar.files.length == 0) return;

		const new_image = document.createElement( 'img' );
		new_image.src = URL.createObjectURL( app.dom.fileAvatar.files[0] );

		new_image.addEventListener( 'load', ()=>{
			const offset_x  = app.dom.rngAvatarOffsetX.value;
			const offset_y  = app.dom.rngAvatarOffsetY.value;
			const zoom_base = app.dom.rngAvatarZoom   .value;

			const zoom = (4**zoom_base) / 4;

			chat.avatar.dataUrl = chat.avatar.zoomImageToDataUrl(
				new_image,
				self.avatarBackgroundColor,
				zoom,
				offset_x,
				offset_y,
				zoom_to_fit,
			);

			app.dom.imgAvatar.src = chat.avatar.dataUrl;
			set_inputs_enabled( true );
		});

	} // new_avatar


	/**
	 * on_clear_avatar()
	 */
	function on_clear_avatar () {
		self.previousDataUrl = chat.avatar.dataUrl;
		chat.avatar.dataUrl = null;

		app.dom.imgAvatar.src = ICON_DATA.ANON;
		app.dom.fileAvatar.value = '';

		self.avatarBackgroundColor = null;
		app.dom.colorAvatarBg.value = '#ffffff';

		set_inputs_enabled( false );

	} // clear_avatar


	/**
	 * on_restore_avatar()
	 */
	function on_restore_avatar () {
		app.dom.imgAvatar.src = self.previousDataUrl || ICON_DATA.ANON;
		chat.avatar.dataUrl   = self.previousDataUrl;
		self.previousDataUrl  = null;

		set_inputs_enabled( false );

	} // on_restore_avatar


	/**
	 * on_avatar_change()
	 */
	function on_avatar_change () {
		new_avatar( self.zoomMode );

	} // on_avatar_change


	/**
	 * on_zoom_to_fit()
	 */
	function on_zoom_to_fit () {
		app.dom.rngAvatarZoom.value = 1;
		self.zoomMode = true;
		on_avatar_change();

	} // on_zoom_to_fit


	/**
	 * on_zoom_to_fill()
	 */
	function on_zoom_to_fill () {
		app.dom.rngAvatarZoom.value = 1;
		self.zoomMode = false;
		on_avatar_change();

	} // on_zoom_to_fill


	/**
	 * on_color_input()
	 */
	function on_color_input (event) {
		self.avatarBackgroundColor = event.target.value;
		new_avatar();

	} // on_color_input


	/**
	 * on_range_mouse_up()
	 */
	function on_range_mouse_up (event) {
		if (event.button == 1) {
			event.target.value = event.target.dataset.default;
			on_avatar_change();
		}

	} // on_range_mouse_up


	/**
	 * on_submit()
	 */
	function on_submit (event) {
		event.preventDefault();

		if (chat.avatar.dataUrl !== null) {
			const canvas  = document.createElement( 'canvas' );
			canvas.width  = SETTINGS.AVATARS.WIDTH;
			canvas.height = SETTINGS.AVATARS.HEIGHT;

			const context = canvas.getContext( '2d' );
			context.drawImage( app.dom.imgAvatar, 0, 0 );

			const png = canvas.toDataURL( 'image/jpeg', 0.75 );
			const jpg = canvas.toDataURL( 'image/jpeg', 0.75 );
			chat.avatar.dataUrl = (png.length < jpg.length) ? png : jpg;
		}

		chat.avatar.saveToLocalStorage();
		chat.avatar.sendToServer();

		return false;

	} // on_submit


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement = app.dom.formProfileAvatar;

		self.previousDataUrl       = null;
		self.avatarBackgroundColor = null;
		self.zoomMode              = false;

		app.dom.imgAvatar.src = chat.avatar.dataUrl || ICON_DATA.ANON;
		app.dom.colorAvatarBg.value = '#ffffff';

		app.dom.fileAvatar       .addEventListener( 'change',  on_avatar_change  );
		app.dom.btnAvatarClear   .addEventListener( 'mouseup', on_clear_avatar   );
		app.dom.btnAvatarRestore .addEventListener( 'mouseup', on_restore_avatar );
		app.dom.rngAvatarZoom    .addEventListener( 'change',  on_avatar_change  );
		app.dom.rngAvatarZoom    .addEventListener( 'input',   on_avatar_change  );
		app.dom.rngAvatarOffsetX .addEventListener( 'change',  on_avatar_change  );
		app.dom.rngAvatarOffsetX .addEventListener( 'input',   on_avatar_change  );
		app.dom.rngAvatarOffsetY .addEventListener( 'change',  on_avatar_change  );
		app.dom.rngAvatarOffsetY .addEventListener( 'input',   on_avatar_change  );
		app.dom.btnAvatarZoomFill.addEventListener( 'mouseup', on_zoom_to_fit    );
		app.dom.btnAvatarZoomFull.addEventListener( 'mouseup', on_zoom_to_fill   );
		app.dom.colorAvatarBg    .addEventListener( 'change',  on_color_input, false );
		app.dom.colorAvatarBg    .addEventListener( 'input',   on_color_input, false );
		app.dom.formProfileAvatar.addEventListener( 'submit',  on_submit );

		app.dom.rngAvatarZoom    .addEventListener( 'mouseup', on_range_mouse_up );
		app.dom.rngAvatarOffsetX .addEventListener( 'mouseup', on_range_mouse_up );
		app.dom.rngAvatarOffsetY .addEventListener( 'mouseup', on_range_mouse_up );

		set_inputs_enabled( false );

	}; // init


	// CONSTRUCTOR

	self.init();

}; // EditAvatar


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// REGISTER
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * RegisterProfile
 */
const RegisterProfile = function (app, chat) {
	const self = this;

	this.containerElement;

	this.nameValid;
	this.lastNameChange;
	this.nameChangeTimeout;
	this.pendingTimeout;


	/**
	 * password_valid()
	 */
	function password_valid () {
		const password = app.dom.pwdRegisterPassword1.value;
		const identical = (password == app.dom.pwdRegisterPassword2.value);

		const length_ok = (password.length >= SETTINGS.ACCOUNTS.PASSWORD_MIN_LENGTH);

		return (identical && length_ok);

	} // password_valid


	/**
	 * password_strength()
	 */
	function password_strength (password = null) {
		if (password === null) {
			password = app.dom.pwdRegisterPassword1.value;
		}

		const glyphs_lower = 'abcdefghijklmnopqrstuvwxyz';
		const glyphs_upper = glyphs_lower.toUpperCase();
		const glyphs_num   = '1234567890';

		let nr_lower = 0;
		let nr_upper = 0;
		let nr_num   = 0;
		let nr_other = 0;
		let glyphs   = {};

		for (let i = 0; i < password.length; ++i) {
			const char = password[i];

			if (glyphs_lower.indexOf( char ) >= 0) {
				++nr_lower;
			}
			else if (glyphs_upper.indexOf( char ) >= 0) {
				++nr_upper;
			}
			else if (glyphs_num  .indexOf( char ) >= 0) {
				++nr_num;
			}
			else {
				++nr_other;
			}

			if (isNaN( glyphs[char] )) {
				glyphs[char] = 0;
			} else {
				++glyphs[char];
			}
		}

		let max_repeats = 0;
		for (let char in glyphs) {
			if (glyphs[char] > max_repeats) {
				max_repeats = glyphs[char];
			}
		}

		const prevalent_lower = (nr_lower > nr_upper + nr_num + nr_other);
		const prevalent_upper = (nr_upper > nr_lower + nr_num + nr_other);
		const prevalent_num   = (nr_num   > nr_lower + nr_upper + nr_other);
		const prevalent_other = (nr_other > nr_lower + nr_upper + nr_num);

		let strength
		= (password.length - SETTINGS.ACCOUNTS.PASSWORD_MIN_LENGTH)
		+ (nr_lower > 1) - (nr_lower == 0) - prevalent_lower
		+ (nr_upper > 1) - (nr_upper == 0) - prevalent_upper
		+ (nr_num   > 1) - (nr_num   == 0) - prevalent_num
		+ (nr_other > 1) - (nr_other == 0) - prevalent_other
		- Math.max( 0, (max_repeats - 1) )
		;

		strength = Math.floor( Math.max( 0, Math.min( 6, strength ) ) / 2 );

		return strength;

	} // password_strength


	/**
	 * email_valid()
	 */
	function email_valid () {
		const email = app.dom.txtRegisterEmail.value;

		const valid = (
			(email.length > 5)
			&& (email.indexOf( '@' ) >= 0)
			&& (email.indexOf( '.' ) >= 0)
		);

		return valid;

	} // email_valid


	/**
	 * everything_valid()
	 */
	function everything_valid () {
		const all_valid
		=  (self.nameValid)
		&& (password_valid())
		&& (email_valid())
		;

		app.dom.txtRegisterEmail  .classList.toggle( 'error', !email_valid() );
		app.dom.submitRegisterAccount.classList.toggle( 'disabled', !all_valid );

		return all_valid;

	} // everything_valid


	/**
	 * on_password_change()
	 */
	function on_password_change (event) {
		const valid = password_valid();

		const password1 = app.dom.pwdRegisterPassword1.value;
		const password2 = app.dom.pwdRegisterPassword2.value;

		app.dom.pwdRegisterPassword1.classList.toggle( 'error', !valid );
		app.dom.pwdRegisterPassword2.classList.toggle( 'error', !valid );

		const strength = password_strength( (event == undefined) ? null : event.target.value );

		const template = [
			'PASSWORD_STRENGTH_0',
			'PASSWORD_STRENGTH_1',
			'PASSWORD_STRENGTH_2',
			'PASSWORD_STRENGTH_3',
		][strength];

		let html = localized( template );

		if (password1 == password2) {
			if (!valid) {
				html = localized( 'PASSWORD_TOO_SHORT', SETTINGS.ACCOUNTS.PASSWORD_MIN_LENGTH );
			}
		} else {
			html += '<br>' + localized( 'PASSWORDS_MISMATCH' );
		}

		app.dom.spanRegisterStrength.innerHTML = html;

		everything_valid();

	} // on_password_change


	/**
	 * on_name_change()
	 */
	function on_name_change () {
		const now = Helpers.now();
		const elapsed_time
		= (self.lastNameChange === null)
		? Number.POSITIVE_INFINITY
		: now - self.lastNameChange
		;

		if (self.nameChangeTimeout !== null) {
			clearTimeout( self.nameChangeTimeout );
		}
		self.nameChangeTimeout = null;

		if (elapsed_time > 333) {
			chat.sendMessage(
				REQUEST.IS_NAME_REGISTERED,
				app.dom.txtRegisterName.value,
			);
			self.lastNameChange = now;
		} else {
			self.nameChangeTimeout = setTimeout( on_name_change, 333 );
		}

		everything_valid();

	} // on_name_change


	/**
	 * on_verify_change()
	 */
	function on_verify_change () {
		const code = app.dom.txtRegisterVerify.value.replace( /\n/g, '' ).trim();

		txtRegisterVerify.classList.toggle( 'error', (code.length != 128) );
		btnRegisterVerify.classList.toggle( 'disabled', (code.length != 128) );

	} // on_verify_change


	/**
	 * on_email_change()
	 */
	function on_email_change () {
		everything_valid();

	} // on_email_change


	/**
	 * onNameAvailability()
	 */
	this.onNameAvailability = function (availability) {
		const name_available = (availability == 'available');
		const name_registered = (availability == 'registred');
		const verification_pending = (availability == 'pending');

		var template;

		switch (availability) {
		case 'available'  :  template = 'NAME_IS_AVAILABLE';        break;
		case 'pending'    :  template = 'REGISTRATION_PENDING';     break;
		case 'registered' :  template = 'REGISTRATION_REGISTERED';  break;
		}

		app.dom.spanRegisterAvailable.innerHTML = localized( template );
		//...app.dom.txtRegisterName.classList.toggle( 'error', !(name_available || verification_pending) );

		const elements = app.dom.formRegisterProfile.querySelectorAll( 'p.register, hr.register' );

		elements.forEach( (element)=>{
			const cl = element.classList;

			switch (availability) {
			case 'available':
				cl.toggle( 'disabled', !cl.contains( 'available' ) );
				cl.toggle( 'hidden',   cl.contains( 'pending' ) );
				break;

			case 'pending':
				cl.toggle( 'disabled', !cl.contains( 'pending' ) );
				cl.toggle( 'hidden',   !cl.contains( 'pending' ) );
				break;

			case 'registered':
				cl.toggle( 'disabled', cl.contains( 'pending' ) );
				cl.toggle( 'hidden',   cl.contains( 'pending' ) || cl.contains( 'available' ) );
				break;
			}


		});

		self.nameValid = name_available;
		everything_valid();

	}; // onNameAvailability


	/**
	 * onRegisterAccept()
	 */
	this.onRegisterAccept = function () {
		chat.sendMessage(
			REQUEST.IS_NAME_REGISTERED,
			app.dom.txtRegisterName.value,
		);

		self.pendingTimeout = setTimeout( ()=>{
			chat.sendMessage(
				REQUEST.IS_NAME_REGISTERED,
				app.dom.txtRegisterName.value,
			);
		}, chat.serverInfo.accounts.pendingDays * 24*60*60*1000 + 1000);

	}; // onRegisterAccept


	/**
	 * onRegisterComplete()
	 */
	this.onRegisterComplete = function () {
		chat.sendMessage(
			REQUEST.IS_NAME_REGISTERED,
			app.dom.txtRegisterName.value,
		);

		clearTimeout( self.pendingTimeout );
		self.pendingTimeout = null;

		//...chat.userProfile.show( 'edit', /*activate*/true, /*force_visible*/true );

		chat.preferences.save();

	}; // onRegisterComplete


	/**
	 * on_submit()
	 */
	function on_submit (event) {
		event.preventDefault();

		const verify = !app.dom.btnRegisterVerify.parentNode.classList.contains( 'hidden' );

		if (verify) {
			const code = app.dom.txtRegisterVerify.value.replace( /\n/g, '' ).trim();

			txtRegisterVerify.classList.toggle( 'error', (code.length != 128) );

			if (code.length == SETTINGS.ACCOUNTS.CODE_LENGTH) {
				chat.sendMessage(
					REQUEST.VERIFY_ACCOUNT,
					{
						name: app.dom.txtRegisterName.value,
						code: code,
					},
				);
			}

		} else {
			if (everything_valid()) {
				const pos = window.location.href.lastIndexOf( '/' );
				const base_dir = window.location.href.substr( 0, pos );

				chat.sendMessage(
					REQUEST.REGISTER_ACCOUNT,
					{
						name     : app.dom.txtRegisterName.value,
						password : app.dom.pwdRegisterPassword1.value,
						email    : app.dom.txtRegisterEmail.value,
						baseDir  : base_dir,
					},
				);
			}
		}

		return false;

	} // on_submit


	/**
	 * onShow()
	 */
	this.onShow = function () {
		app.dom.txtRegisterName.value = chat.name;
		on_name_change();

	}; // onShow


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement  = app.dom.formProfileEdit;
		self.nameValid         = false;
		self.lastNameChange    = null;
		self.nameChangeTimeout = null;
		self.pendingTimeout    = null;

		app.dom.txtRegisterName     .addEventListener( 'keyup', on_name_change );
		app.dom.txtRegisterVerify   .addEventListener( 'keyup', on_verify_change );
		app.dom.pwdRegisterPassword1.addEventListener( 'keyup', on_password_change );
		app.dom.pwdRegisterPassword2.addEventListener( 'keyup', on_password_change );
		app.dom.txtRegisterEmail    .addEventListener( 'keyup', on_email_change );
		app.dom.txtRegisterEmail    .addEventListener( 'input', on_email_change );

		app.dom.txtRegisterVerify   .addEventListener( 'change', on_verify_change );
		app.dom.txtRegisterVerify   .addEventListener( 'input',  on_verify_change );

		app.dom.formRegisterProfile .addEventListener( 'submit', on_submit );

		on_password_change();
		everything_valid();

	}; // init


	// CONSTRUCTOR

	self.init();

}; // RegisterProfile


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// MAIN
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * UserProfile()
 */
export const UserProfile = function (app, chat) {
	const self = this;

	this.containerElement;
	this.pages;

	this.avatar;
	this.edit;
	this.register;


	/**
	 * show()
	 */
	this.show = function (page_name, activate, force_visible = false) {
		const visible = chat.ui.toggleTabVisibility( ':profile', activate, force_visible );

		let form_id    = null;
		let button_id  = null;

		switch (page_name) {
		case 'edit'      :  form_id = 'profile_edit';      button_id="btnProfileEdit";      break;
		case 'avatar'    :  form_id = 'profile_avatar';    button_id="btnProfileAvatar";    break;
		case 'register'  :  form_id = 'profile_register';  button_id="btnProfileRegister";  break;
		default:
			throw new Error( 'UserProfile: show: Unknwon page "' + page_name + '"' );
		}

		app.dom.ulProfileMenu.querySelectorAll( 'button' ).forEach( (button)=>{
			button.classList.toggle( 'highlight', (button.id == button_id) );
		});

		self.containerElement.querySelectorAll( 'form' ).forEach( (form)=>{
			form.classList.toggle( 'hidden', form.id != form_id );

			const page = self.pages[page_name];

			if ((form.id == form_id) && (page.onShow)) {
				page.onShow();
			}
		});

	}; // show


	/**
	 * on_menu_button_click
	 */
	function on_menu_button_click (event) {
		self.show( event.target.dataset.show, /*activate*/true, /*force_visible*/true );

	}; //on_menu_button_click


	/**
	 * localize()
	 */
	function localize () {
		/*
		 * Menu
		 */
		app.dom.btnProfileEdit    .innerHTML = localized( 'BTN_PROFILE_EDIT_CAPTION'     );
		app.dom.btnProfileAvatar  .innerHTML = localized( 'BTN_PROFILE_AVATAR_CAPTION'   );
		app.dom.btnProfileRegister.innerHTML = localized( 'BTN_PROFILE_REGISTER_CAPTION' );
		app.dom.btnProfileEdit    .title     = localized( 'BTN_PROFILE_EDIT_TITLE'     );
		app.dom.btnProfileAvatar  .title     = localized( 'BTN_PROFILE_AVATAR_TITLE'   );
		app.dom.btnProfileRegister.title     = localized( 'BTN_PROFILE_REGISTER_TITLE' );

		/*
		 * Edit
		 */
		app.dom.submitProfileEdit.innerHTML = localized( 'BTN_PROFILE_EDIT_SUBMIT' );

		/*
		 * Avatar
		 */
		app.dom.btnAvatarClear     .innerHTML = localized( 'BTN_PROFILE_AVATAR_CLEAR'     );
		app.dom.btnAvatarRestore   .innerHTML = localized( 'BTN_PROFILE_AVATAR_RESTORE'   );
		app.dom.btnAvatarZoomFill  .innerHTML = localized( 'BTN_PROFILE_AVATAR_ZOOM_FILL' );
		app.dom.btnAvatarZoomFull  .innerHTML = localized( 'BTN_PROFILE_AVATAR_ZOOM_FULL' );
		app.dom.labelAvatarZoom    .innerHTML = localized( 'LABEL_PROFILE_AVATAR_ZOOM'     );
		app.dom.labelAvatarOffsetX .innerHTML = localized( 'LABEL_PROFILE_AVATAR_OFFSET_X' );
		app.dom.labelAvatarOffsetY .innerHTML = localized( 'LABEL_PROFILE_AVATAR_OFFSET_Y' );
		app.dom.labelAvatarColorBg .innerHTML = localized( 'LABEL_PROFILE_AVATAR_BG_COLOR' );
		app.dom.submitProfileAvatar.innerHTML = localized( 'BTN_PROFILE_AVATAR_SUBMIT'    );

		/*
		 * Register
		 */
		app.dom.labelRegisterName     .innerHTML = localized( 'LABEL_PROFILE_REGISTER_NAME'       );
		app.dom.labelRegisterAvailable.innerHTML = localized( 'LABEL_PROFILE_REGISTER_AVAILABLE'  );
		app.dom.labelProfileVerify    .innerHTML = localized( 'LABEL_PROFILE_REGISTER_VERIFY'     );
		app.dom.btnRegisterVerify     .innerHTML = localized( 'BTN_PROFILE_REGISTER_VERIFY'       );
		app.dom.labelRegisterPassword1.innerHTML = localized( 'LABEL_PROFILE_REGISTER_PASSWORD_1' );
		app.dom.labelRegisterPassword2.innerHTML = localized( 'LABEL_PROFILE_REGISTER_PASSWORD_2' );
		app.dom.labelRegisterStrength .innerHTML = localized( 'LABEL_PROFILE_REGISTER_STRENGTH'   );
		app.dom.labelRegisterEmail    .innerHTML = localized( 'LABEL_PROFILE_REGISTER_EMAIL'      );
		app.dom.spanRegisterEmailHint .innerHTML = localized( 'SPAN_PROFILE_REGISTER_EMAIL_HINT'  );
		app.dom.submitRegisterAccount .innerHTML = localized( 'BTN_PROFILE_REGISTER_ACCOUNT'      );

	} // localize


	/**
	 * init()
	 */
	this.init = function () {
		self.containerElement = app.dom.divProfile;
		localize();

		self.avatarBackgroundColor = null;

		self.containerElement.querySelectorAll( '.custom_file_upload' ).forEach( (custom_upload)=>{
			const input = custom_upload.querySelector( 'input[type=file]' );
			const span  = custom_upload.querySelector( 'span' );

			span.innerHTML = localized( 'NO_FILE_SELECTED' );

			input.addEventListener( 'change', (event)=>{
				span.innerHTML = event.target.value.replace( /C:\\fakepath\\/, '' );
			});
		});

		self.pages = {
			edit      : new EditProfile    ( app, chat ),
			avatar    : new EditAvatar     ( app, chat ),
			register  : new RegisterProfile( app, chat ),
		};

		app.dom.divProfile.querySelectorAll( '.menu button' ).forEach( (button)=>{
			button.addEventListener( 'mouseup', on_menu_button_click );
		});

	}; // init


	// CONSTRUCTOR

	self.init();

}; // UserProfile


//EOF