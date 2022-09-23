const dotenv = require('dotenv')
dotenv.config()

module.exports = {
	nodeEnv: process.env.NODE_ENV,
	mongoUri: process.env.MONGO_URI,
	port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
	gmailClientId: process.env.GMAIL_CLIENT_ID,
	gmailClientSecret: process.env.GMAIL_CLIENT_SECRET,
	gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN,
	gmailAccessToken: process.env.GMAIL_ACCESS_TOKEN
}