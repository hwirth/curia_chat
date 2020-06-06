// json_editor.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// WEB CHAT - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/


export const JsonEditor = function (new_data, object_name = '#REMOVE_ME#') {
	const self = this;

	//this.containerElement;
	//this.data;


	/**
	 * walk_tree()
	 */
	function walk_tree (parent, data, path = '', prefix_server_set) {
		var new_div;

		if (data instanceof Array) {
			parent.appendChild( new_div = document.createElement( 'div' ) );
			//new_div.innerHTML = '<b>' + path + '</b> = <i>array</i> [';

			for (let i = 0; i < data.length; ++i) {
				walk_tree( new_div, data[i], path + '[' + i + ']', prefix_server_set );
			}

			//new_div.innerHTML += ']';
		}
		else if (data instanceof Object) {
			parent.appendChild( new_div = document.createElement( 'div' ) );
			//new_div.innerHTML = '<b>' + path + '</b> = <i>object</i> {';

			const keys = Object.keys( data );

			for (let i = 0; i < keys.length; ++i) {
				const key = keys[i];
				walk_tree( new_div, data[key], path + '.' + key, prefix_server_set );
			}

			//new_div.innerHTML += '}';
		}
		else {
			let type = '???';

			if (data === null) {
				type = '';
			}
			else if (typeof data == 'undefined') {
				type = '';
				//data = '<i>undefined</i>';
			}
			else if (typeof data == 'boolean') {
				type = 'boolean';
			}
			else if (typeof data == 'number') {
				type = 'number';
			}
			else if (typeof data == 'string') {
				type = 'string';
			}

			const key = path.split( '.' ).pop();

			parent.appendChild( new_div = document.createElement( 'div' ) );
			new_div.innerHTML
			= '<a class="copy_command">'
			+ ((prefix_server_set) ? '/server set ' : '')
			+ path
			+ ' </a>= <i>'
			+ type
			+ '</i> '
			+ data
			;
		}

	} // walk_tree


	/**
	 * init()
	 */
	//this.init = function ( new_data, object_name ) {
		const json_editor = document.createElement( 'div' );
		json_editor.className = 'json_editor';

		const prefix_server_set = (new_data.SETTINGS != undefined);
		walk_tree( json_editor, new_data, object_name, prefix_server_set );

		return json_editor.outerHTML.replace( /#REMOVE_ME#\./g, '' );

	//}; // init


	// CONSTRUCTOR

	//return self.init( new_data, object_name );

}; // JsonEditor


//EOF