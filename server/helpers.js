// helpers.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// CURIA CHAT - SERVER - copy(l)eft 2020 - http://harald.ist.org/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

"use strict";

const { DEBUG } = require( './debug.js' );

const {
	SETTINGS,
	NOTIFY_OWNER_DOMAIN,
	NOTIFY_OWNER_PATH,

} = require( './constants.js' );

const mailer    = require( 'nodemailer' );


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// INTERFACE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

module.exports = {
	now            : now,
	unix_timestamp : unix_timestamp,
	sanitize       : sanitize,
	send_mail      : send_mail,
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/
// IMPLEMENTATIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////119:/

/**
 * now()
 */
function now() {
	const now = new Date();
	return now.getTime();

} // now


/**
 * unix_timestamp()
 */
function unix_timestamp (date = null) {
	if (date == null) date = new Date();
	return Math.round( date.getTime() / 1000 );

} // unix_timestamp


/**
 * sanitize()
 */
function sanitize (string) {
	if (string == undefined) string = '<undefined>';
	string = string
	.replace( /&/g, '&amp;')
	.replace( /</g, '&lt;' )
	.replace( />/g, '&gt;' )
	;

	return string;

} // sanitize


/**
 * send_mail()
 */
function send_mail (recipient, subject, message, message_html = null) {
	const account = SETTINGS.EMAIL.ACCOUNTS[SETTINGS.EMAIL.USE_ACCOUNT];

	const sender_address = account.sender || account.SMTP.auth.user;

	// Use Smtp Protocol to send Email
	const transporter = mailer.createTransport( account.SMTP );

	return new Promise( (resolve, reject)=>{
		if (DEBUG.EMAIL) {
			account.debug = true;

			color_log( COLORS.EMAIL, 'EMAIL', 'Verifying' );
			transporter.verify( (error, success)=>{
				if (error) {
					reject( error );

				} else {
					resolve( success );
				}
			});

		} else {
			const mail = {
			    from    : sender_address,
			    to      : recipient,
			    subject : subject,
			    text    : message,
			    html    : message_html,
			};

			transporter.sendMail( mail, (error, response)=>{
				if(error){
					reject( error );
				} else {
					resolve( response );
				}

				smtpTransport.close();
			});
		}
	});

} // send_mail




//EOF