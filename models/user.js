const mongoose = require('mongoose')
const Schema = mongoose.Schema

const { returnDateInOneYear } = require('../utils')

const UserSchema = new Schema(
	{
		firstName: {
			type: String,
      required: true
		},
		lastName: {
			type: String,
			required: true
		},
		email: {
			type: String,
			required: true,
			unique: true
		},
    phoneNumber: {
      type: String,
      required: true
    },
    birthdate: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    expiration: {
      type: Date,
      default: returnDateInOneYear()
    },
    invites: {
      type: Number,
      default: 3
    }
	}
)


const User = mongoose.model('user', UserSchema)
module.exports = User