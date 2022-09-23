const mongoose = require('mongoose')
const databaseUrl = require('../config').mongoUri

mongoose.connect(databaseUrl,{})
	.then(() => console.log('Connected to the DB'))
	.catch(err => { console.error('Error connecting to the DB', err.message) })

const db = mongoose.connection

module.exports = db