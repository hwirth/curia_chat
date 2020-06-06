// dialog.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// DIALOG - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

import { SETTINGS } from "../constants.js";


/**
 * onLoad()
 */
addEventListener( "load", ()=>{
	const CSS = `
:root { --window-animation-time:0.15s; }
.dialog {
	font-size:var(--font-size);
	--dialog-width:24em; --dialog-height:22em; --select-height:calc(var(--dialog-height) - 8.1em);
	position:absolute; top:50%; left:50%; width:var(--dialog-width); Xheight:var(--dialog-height);
	margin:calc(var(--dialog-height) * -0.5) 0 0 calc(var(--dialog-width) * -0.5); padding:1em;
	border:solid 2px #080; border-color:#aaa #777 #666 #999; border-radius:0.5em;
	overflow:hidden; box-shadow:0 0 0.5em 0.0em rgba(0,0,0, 0.5);
	background:#888; color:#fff; line-height:1em; font-size:var(--font-size);
}
.dialog h1 {
	margin:-1em -1em 1em; padding:0.3em 0.5em 0.2em; border-bottom:solid 1px #555;
	background:#363; font-size:1em; font-style:normal; font-weight:bold;
}
.dialog select { width:100%; height:var(--select-height); margin:0; border:solid 1px #000; }
.dialog option { padding:0.2em 0.5em; }
.dialog label { display:block; width:100%; margin:0.5em 0; text-align:right; }
.dialog input { width:70%; border:solid 1px #000; padding:2px 3px; }
.dialog ul { list-style-type:none; text-align:right; margin-right:-3px; }
.dialog li { display:inline-block; width:auto; margin:0 0 0 0.25em; }
.dialog p { margin:1em 0; line-height:1.4em; }
.dialog .ok { padding-left:1em; padding-right:1em; }
.dialog button { min-width:4em; padding:0.2em 0.5em 0.25em; border:solid 1px #000; border-radius:0.25em; }
.dialog a { filter:brightness(0.5); }
.dialog .separator { width:1em; }
.dialog.prompt { --dialog-width:40em; }

.dialog.error  {
	overflow:auto; line-height:1.4em;
	--dialog-width:60em;
}
.dialog.error h1 { background:#800; font-weight:bold; cursor:default; user-select:none; -moz-user-select:none; }
.dialog.error p { text-align:center; }
.dialog.error pre {
	display:block; font-family:monospace,monospace; font-size:0.8em; font-weight:normal;
	line-height:1.4em; text-align:left;
}
.dialog.error pre.type { border-bottom:solid 1px #aaa; margin-bottom:0.5em; padding-bottom:0.5em; }
.dialog.error pre.message { border-top:solid 1px #aaa; margin-top:0.5em; padding-top:0.5em; }

.dialog { transition:transform var(--window-animation-time) ease-in-out; transform:scale(1); }
.dialog.scale_zero { transform:scale(0); }
.dialog.no_transition { transition:none; }
	`.trim();

	const style = document.createElement( "style" );
	style.innerHTML = CSS;
	document.querySelector( "head" ).appendChild( style );
});


/**
 * onMouseDown
 */
addEventListener( 'mousedown', (event)=>{
	const parent = event.target.parentNode;

	if (parent && parent.classList && parent.classList.contains( 'dialog' )) {
		const parent_x = parent.offsetX;
		const parent_y = parent.offsetY;
		const start_x = event.screenX;
		const start_y = event.screenY;

		parent.classList.add( 'no_transition' );

		function on_mouse_move (event) {
			const delta_x = event.screenX - start_x;
			const delta_y = event.screenY - start_y;

			parent.style.transform = 'translate(' + delta_x + 'px,' + delta_y + 'px)';
		}

		function on_mouse_up (event) {
			removeEventListener( 'mousemove', on_mouse_move );
			removeEventListener( 'mouseup',   on_mouse_up );
			parent.classList.remove( 'no_transition' );
		}

		addEventListener( 'mousemove', on_mouse_move );
		addEventListener( 'mouseup',   on_mouse_up );
	}
});



/*
new Prompt({
	useClass: "",
	title:    "TITLE",
	message:  "MESSAGE",
	buttons: [
		{ text: "OK", useClass: "confirm" },
	],
});
*/

/*
new Prompt({
	useClass: "ADDITIONAL_CLASS",
	title:    "TITLE",
	message:  "HTML BODY",
	buttons: [
		{ text: "Cancel", useClass: "abort"   },
		{ text: "OK",     useClass: "confirm" },
	],
	autoResolve: !true,   // Closes the dialog immediately. Useful, if useTimeout is not set or false.
	useTimeout:  !true,
}).then( (button)=>{
	// do_heavy_calculation()   // If you want the prompt to disappear before this, set useTimeout:true
	switch (button) {
	case "Cancel": ... reject();   break;
	case "OK":     ... resolve();  break;
	}
}).catch( (reason)=>{} );   // Dialog was cancelled, ignore.
*/



/**
 * Prompt()
 */
export const Prompt = function (parameters) {
	var FORM, UL, element;
	var onkeydown_resolve;

	function show_prompt() {

		function onKeyDown (event) {
			if (event.key == "Escape") {
				onkeydown_resolve();
			}
		}

		return new Promise( (resolve)=>{
			onkeydown_resolve = resolve;
			window.addEventListener( "keydown", onKeyDown );

			document.body.appendChild( FORM = document.createElement("form") );
			FORM.className = "dialog prompt";

			FORM.classList.add( "scale_zero" );
			setTimeout( ()=>FORM.classList.remove( "scale_zero", SETTINGS.WINDOW_ANIMATION_TIME ) );

			//FORM.action = "javascript:return false";
			FORM.addEventListener( "submit", (event)=>event.preventDefault() );

			if (parameters.useClass) FORM.classList.add( parameters.useClass );
			FORM.tabIndex = "0";
			FORM.focus();

			FORM.appendChild( element = document.createElement( "h1" ) );
			element.innerText = parameters.title;

			FORM.appendChild( element = document.createElement( "p" ) );
			element.innerHTML = parameters.message;

			FORM.appendChild( UL = document.createElement( "ul" ) );

			if (parameters.buttons) parameters.buttons.forEach( (button)=>{
				UL.appendChild( element = document.createElement( "li" ) );
				element.appendChild( element = document.createElement( "button" ) );
				element.type      = "button";   // Prevent FORM submit
				if (button.useClass) element.classList.add( button.useClass );
				element.innerText = button.text;

				if (button.callback) {
					element.addEventListener( "click", button.callback );
				} else {
					element.addEventListener( "click", ()=>resolve( button.text ) );
				}

				if (button.useClass == "confirm") element.focus();
			});

			FORM.style.marginTop = -(FORM.offsetHeight/2) + "px";


			if (parameters.autoResolve) window.setTimeout( resolve );

		}).then( (clicked_button)=>{
			window.removeEventListener( "keydown", onKeyDown );

			FORM.classList.add( "scale_zero" );
			setTimeout( ()=>{
				document.body.removeChild( FORM );

			}, SETTINGS.WINDOW_ANIMATION_TIME );

			return clicked_button;
		});
	}

	if (parameters.useTimeout) {
		return new Promise( (resolve)=>{
			window.setTimeout( ()=>{
				show_prompt().then( resolve );
			}, 100);
		});
	} else {
		return show_prompt();
	}

}; // Prompt


/**
 * FileDialog()
 */
export const FileDialog = function( operation, new_storage, request_confirmation = false) {
	const self = this;

	self.storage = new_storage;

	var FORM, SELECT, INPUT, UL, SPAN, element, button_delete, button_commence;

	return new Promise( (resolve, reject)=>{
		var input_filename;

		function confirm_operation () {
			if (request_confirmation) {
				const file_name = INPUT.value;
				if (self.storage.fileExists(file_name)) {
					new Prompt({
						useClass: "",
						title:    "Overwrite file?",
						message:  "Are you sure you want to overwrite '" + file_name + "'?",
						buttons: [
							{ text: "Cancel", useClass: "abort"   },
							{ text: "OK",     useClass: "confirm" },
						],
					}).then( (button)=>{
						if (button == "OK") resolve( operation );
					});
				} else {
					resolve( operation );
				}
			} else {
				resolve( operation );
			}
		}

		function onKeyDown (event) {
			if (event.key == "Escape") {
				//event.preventDefault();
				//event.stopPropagation();
				resolve();
			}
		}
		window.addEventListener("keydown", onKeyDown);

		function onClick() {
			if (SELECT.selectedIndex >= 0) {
				INPUT.value = SELECT.options[SELECT.selectedIndex].value;
				update_buttons();
			}
		}

		function onDblClick() {
			confirm_operation();
		}

		function delete_file() {
			const file_name = INPUT.value;

			if (self.storage.fileExists(file_name)) {
				new Prompt({
					title   : "Delete File",
					message : "Delete file <q>" + file_name + "</q>?",
					buttons : [
						{ text: "Cancel" },
						{ text: "Delete" },
					],
				}).then( (clicked_button)=>{
					if (clicked_button == "Delete") {
						self.storage.remove(file_name);
						list_files();
					}
				});
			}
		}

		function list_files() {
			SELECT.innerHTML = "";
			self.storage.listFiles().forEach( (file_name)=>{
				SELECT.appendChild(element = document.createElement("option"));
				element.innerText = file_name;
			});
		}

		function update_buttons() {
			const exists = self.storage.fileExists(INPUT.value);

			button_delete.disabled = !exists;

			switch (button_commence.innerText) {
			case "Load":  button_commence.disabled = !exists;              break;
			case "Save":  button_commence.disabled = (INPUT.value == "");  break;
			}

		}

		document.body.appendChild(FORM = document.createElement("form"));
		FORM.className = "file dialog";
		FORM.autocomplete = "on";
		//FORM.action = "javascript:return false";
		FORM.addEventListener( "submit", (event)=>event.preventDefault() );

		FORM.classList.add( "scale_zero" );
		setTimeout( ()=>FORM.classList.remove( "scale_zero", SETTINGS.WINDOW_ANIMATION_TIME ) );

		FORM.appendChild(element = document.createElement("h1"));
		element.innerText = operation + " File";

		FORM.appendChild(SELECT = document.createElement("select"));
		SELECT.size = 2;
		SELECT.addEventListener("click", onClick);
		SELECT.addEventListener("dblclick", onDblClick);

		list_files();

		FORM.appendChild(element = document.createElement("label"));
		element.innerText = "Filename: ";
		element.for = "file_name";

		element.appendChild(INPUT = document.createElement("input"));
		INPUT.id = "file_name";
		INPUT.addEventListener("input", update_buttons);

		FORM.appendChild(UL = document.createElement("ul"));

		UL.appendChild(element = document.createElement("li"));
		element.appendChild(element = document.createElement("button"));
		element.type      = "button";
		element.innerText = "Delete";
		element.addEventListener("click", delete_file);
		button_delete     = element;

		UL.appendChild(element = document.createElement("li"));
		element.className = "separator";

		UL.appendChild(element = document.createElement("li"));
		element.appendChild(element = document.createElement("button"));
		element.className = "abort";
		element.type      = "button";
		element.innerText = "Cancel";
		element.addEventListener( "click", resolve );

		UL.appendChild(element = document.createElement("li"));
		element.appendChild(element = document.createElement("button"));
		element.className = "ok";
		element.innerText = operation;
		element.addEventListener("click", confirm_operation );

		button_commence   = element;

		FORM.style.marginTop = -(FORM.offsetHeight/2) + "px";

		update_buttons();
		INPUT.focus();

	}).then( (result)=>{

		FORM.classList.add( "scale_zero" );
		setTimeout( ()=>{
				document.body.removeChild( FORM );
		}, SETTINGS.WINDOW_ANIMATION_TIME );


		if (result == operation) {
			return INPUT.value;
		}
	});

}; // FileDialog


//EOF