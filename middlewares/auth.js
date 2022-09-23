const { jwtSecret } = require('../config')
const jwt = require('jsonwebtoken')

function auth(req, res, next) {
	const token = req.header('x-auth-token')

	// CHECK FOR TOKEN
	if(!token) return res.status(401).json({ msg: 'No token, authorizaton denied' })

	try {
		// VERIFY TOKEN
		const decoded = jwt.verify(token, jwtSecret)
		// ADD USER FROM TOKEN PAYLOAD
		req.user = decoded
		next()
	} catch(e) {
		console.log(e)
		res.status(400).json({ msg: 'Token is not valid' })
	}
}

module.exports = auth