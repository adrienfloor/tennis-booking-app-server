const express = require('express')
const app = express()
const server = require('http').createServer(app)
const cors = require('cors')
const db = require('./db')
// const User = require('./models/user')

app.use(cors())

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*") // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-auth-token")
	res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
	next()
})

app.use(express.json({ limit: '50mb' }))

app.use('/api/users', require('./routes/users'))
app.use('/api/bookings', require('./routes/bookings'))

db.on('error', console.error.bind(console, 'MongoDB connection error:'))

const { port } = require('./config')
server.listen(port, () => console.log(`The server started on port ${port}`))


