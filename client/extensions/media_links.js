// add_markup.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import { localized } from '../localize.js';


export const MediaLinks = function (app, chat) {
	const self = this;


	/**
	 * find_medium_type()
	 */
	function find_medium_type (href) {
		const postfixes = {
			image : ['.png', '.gif', '.jpg', '.jpeg'],
			video : ['.webm', '.mp4'],
			audio : ['.wav', '.mp3', '.ogg'],
		};

		let found_type = null;
		let video_id   = null;

		if (href.substr( 0, 19 ) == 'https://www.youtube') {
			if (href.indexOf( '/embed/' ) >= 0) {
				// https://www.youtube.com/embed/5lsjD1cuq5Y
				video_id = href.split( '/embed/' )[1];
				found_type = 'youtube';

			} else {
				// https://www.youtube.com/watch?v=5lsjD1cuq5Y

				video_id = href.split( '?v=' )[1];

				if (video_id != undefined) {
					video_id = video_id.substr( 0, (video_id + '&').indexOf( '&' ) );
					found_type = 'youtube';
				}
			}
		} else {
			for (let media_type in postfixes) {
				postfixes[media_type].forEach( (postfix)=>{
					if (href.slice( -postfix.length ) == postfix) {
						found_type = media_type;
					}
				});
			}
		}

		return {
			foundType : found_type,
			videoId   : video_id,
		}

	} // find_medium_type


	/**
	 * markup_embed_medium()
	 */
	function markup_embed_medium (href, found_type, video_id) {
		const on_focus = 'onfocus="APP.chat.ui.scrollDown()"';

		switch (found_type) {
		case 'image'   :  return '<img ' + on_focus + ' src="' + href + '" tabindex="0">';
		case 'video'   :  return '<video ' + on_focus + ' controls><source src="' + href + '"></video>';
		case 'audio'   :  return '<audio controls src="' + href + '"></audio>';
		case 'youtube' :
			const html
			= '<iframe Xwidth="560" Xheight="315" src="https://www.youtube.com/embed/'
			+ video_id
			+ '" frameborder="0" allow="picture-in-picture" allowfullscreen></iframe>'
			;

			console.log( '>>>>>', html );
			return html;
		}

		return '<a class="underline" href="' + href + '" target="_blank">' + href + '</a>';

	} // markup_embed_medium


	/**
	 * markup_remove_button()
	 */
	function markup_remove_button () {
		const html
		= '<button onmousedown="APP.chat.mediaLinks.remove( this )">'
		+ localized( 'BTN_REMOVE_EMBED' )
		+ '</button>'
		;

		return html;

	} // markup_remove_button


	/**
	 * markup_embed_button()
	 */
	function markup_embed_button (href, type) {
		const html
		= '<button onclick="APP.chat.mediaLinks.embed( this )">'
		+ localized( 'BTN_EMBED_MEDIA_FILE' )
		+ '</button>'
		;

		return html;

	} // markup_embed_button


	/**
	 * embed_link()
	 */
	function embed_link (href, embed_markup_only = false) {

		/**
		 * wrap()
		 */
		function wrap (button, href, type, video_id = '', embed = '') {
			const anchor
			= '<a class="underline" href="' + href
			+ '" target="_blank">'          + href
			+ '</a>';

			const class_name
			= 'embed '
			+ type
			+ ((embed == '') ? ' hidden' : '')
			;

			const wrapped
			= '<span class="embed_wrapper'
			+ '" data-href="'     + href
			+ '" data-type="'     + type
			+ '" data-video-id="' + video_id
			+ '">'                + anchor
			+ ' '                 + button
			+ '<div class="'      + class_name
			+ '">'                + embed
			+ '</div></span>'
			;

			return wrapped;

		} // wrap


		const type_info = find_medium_type( href );
		const type      = type_info.foundType;
		const video_id  = type_info.videoId;

		const embed = markup_embed_medium( href, type, video_id );

		if (embed_markup_only || (type == null)) return embed;

		if (chat.preferences.autoEmbedMedia) {
			const button  = markup_remove_button();
			return wrap( button, href, type, video_id, embed );

		} else {
			const button  = markup_embed_button( href, type );
			return wrap( button, href, type, video_id );
		}

	} // embed_link


	/**
	 * analyse_tags()
	 */
	function analyse_tags (html) {
		const parts = [];
		let pos_open = -1;
		let pos_close = -1;

		let running = true;
		while ( running && ((pos_open = html.indexOf( '<' )) >= 0) ) {
			pos_close = html.indexOf( '>', pos_open );

			if (pos_close >= 0) {
				parts.push( html.substr( 0, pos_open ) );
				parts.push( html.substr( pos_open, pos_close - pos_open + 1 ) );
				html = html.substr( pos_close + 1 );
			} else {
				running = false;
			}
		}
		parts.push( html );

		return parts;

	} // analyse_tags


	/**
	 * addMarkup()
	 */
	this.addMarkup = function (text) {
		const prefixes   = ['https://', 'http://', 'ftp://', 'www.'];

		const parts = analyse_tags( text );
		const result = [];

		parts.forEach( (part)=>{
			if (part.charAt( 0 ) == '<') {
				result.push( part );
			} else {
				let hrefs = [];
				part.split( ' ' ).forEach( (href)=>{
					let processed_href = href;
					prefixes.forEach( (prefix)=>{
						if (href.toLowerCase().slice( 0, prefix.length ) == prefix) {
							processed_href = embed_link(
								((href.slice(0,4) == 'www.') ? 'https://' : '')
								+ href
							);
						}
					});

					hrefs.push( processed_href );
				});

				result.push( hrefs.join( ' ' ) );
			}
		});

		return result.join( '' );

	}; // addMarkup


	/**
	 * embed()
	 */
	this.embed = function (button) {
		const wrapper = button.closest( '.embed_wrapper' );
		const embed   = wrapper.querySelector( '.embed' );

		const href     = wrapper.dataset.href;
		const type     = wrapper.dataset.type;
		const video_id = wrapper.dataset.videoId;

		button.outerHTML = markup_remove_button();
		embed.innerHTML  = markup_embed_medium( href, type, video_id );
		embed.classList.remove( 'hidden' );

		chat.ui.scrollDown();

	}; // embed


	/**
	 * remove()
	 */
	this.remove = function (button) {
		const wrapper = button.closest( '.embed_wrapper' );
		const embed   = wrapper.querySelector( '.embed' );

		const href = wrapper.dataset.href;
		const type = wrapper.dataset.type;

		button.outerHTML = markup_embed_button( href, type );
		embed.innerHTML  = '';
		embed.classList.add( 'hidden' );

	}; // remove


	/**
	 * on_mutation()
	 */
	function on_mutation (mutations) {
		mutations.forEach( (mutation)=>{
			mutation.addedNodes.forEach( (node)=>{
				if (node.querySelectorAll != undefined) {
					const elements = node.querySelectorAll( 'video, img' );

					elements.forEach( (element)=>{
						element.addEventListener( 'focus', ()=>{
							setTimeout( ()=>{
								chat.onResize();
								chat.ui.scrollDown();
							});
						});
					});
				}
			});
		});

	} // on_mutation


	/**
	 * init()
	 */
	this.init = function () {
		self.observer = new MutationObserver( on_mutation );
		self.observer.observe( app.dom.divTabPages, { childList: true, subtree: true } );

		app.dom.divTabPages.addEventListener( 'mouseup', ()=>{
			//chat.ui.scrollDown();
			//console.log( '!!!' );
		});

	}; // init


	// CONSTRUCTOR

	self.init();

}; // MediaLinks


//EOF