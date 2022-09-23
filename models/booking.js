const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BookingSchema = new Schema(
	{
		date: {
			type: Date,
      required: true
		},
    time: {
      type: String,
      required: true
    },
		court: {
			type: Number,
			required: true
		},
    player1: {
      type: Object,
      default: {}
    },
    player2: {
      type: Object,
      default: {}
    },
    isAdminBooking: {
      type: Boolean,
      default: false
    }
	}
)


const Booking = mongoose.model('booking', BookingSchema)
module.exports = Booking