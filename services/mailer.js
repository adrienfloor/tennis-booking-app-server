const nodemailer = require('nodemailer')
const {
	gmailClientId,
	gmailClientSecret,
	gmailRefreshToken,
	gmailAccessToken
} = require('../config')

async function sendMail(to, subject, content) {

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		// name: 'www.thecitrusapp.com',
		host: "smtp.gmail.com",
		port: 587,
		ignoreTLS: false,
		secure: false,
		auth: {
			type: 'OAuth2',
			user: 'adrienfloor@gmail.com',
			clientId: gmailClientId,
			clientSecret: gmailClientSecret,
			refreshToken: gmailRefreshToken,
			accessToken: gmailAccessToken,
			expires: 3599
		}
	})

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: 'adrienfloor@gmail.com', // sender address
		to, // list of receivers
		subject, // Subject line
		text: content, // plain text body
		html: content, // html body
	})
}

module.exports.sendMail = sendMail