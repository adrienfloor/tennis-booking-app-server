const express = require('express')
const router = express.Router()

const auth = require('../middlewares/auth')
const Booking = require('../models/booking')
const { dateFormatter } = require('../utils')
const { sendMail } = require('../services/mailer')

// REGISTER NEW BOOKING
router.post('/', auth, async (req, res) => {

	const {
		date,
    time,
		court,
    player1,
    player2,
    isAdminBooking
	} = req.body

	// SIMPLE VALIDATION
	if (
		!date ||
    !time ||
		!court
  ) return res.status(400).json({ msg: 'Il manque des informations pour créer cette réservation' })

  if(!isAdminBooking) {

    // CHECK IF BOOKING IS MADE EARLIER THAN 2 DAYS BEFORE PLAY
    const today = new Date()
    const bookingDate = new Date(date)

    const days = (bookingDate, today) =>{
        let difference = bookingDate.getTime() - today.getTime()
        let TotalDays = Math.ceil(difference / (1000 * 3600 * 24))
        return TotalDays
    }

    if(days(bookingDate, today) > 2) {
      return res.status(400).json({ msg: 'Vous ne pouvez pas réserver plus de deux jours en avance' })
    }

    // CHECK IF PLAYERS ARE SUBMITTED
    if (!player1 || !player2) return res.status(400).json({ msg: 'Il manque un ou des partenaires pour créer cette réservation' })

    // CHECK FOR EXISTING BOOKINGS
    const bookingPlayer1 = await Booking.aggregate().match({'player1._id': player1._id })
    // CHECK FOR EXISTING BOOKINGS FOR CURRENT USER BUT THAT HAS BEEN MADE BY SOMEONE ELSE
    const bookingPlayer2 = await Booking.aggregate().match({'player2._id': player1._id })

    // ON THIS DAY
    if(
      bookingPlayer1.find(booking => dateFormatter(booking.date) === date) ||
      bookingPlayer2.find(booking => dateFormatter(booking.date) === date)
    ) {
      return res.status(400).json({ msg: 'Cet utilisateur a déjà réservé un court ce jour'})
    }

  }

  try {
    const newBooking = new Booking({
      date,
      time,
      court,
      player1,
      player2,
      isAdminBooking
    })
    const booking = await newBooking.save()
    if(booking) {
      // SENDING EMAIL CONFIRMATION
      const emailObject = 'TENNIS RENÉ MAGNAC'
      const emailBody =
      `<div>
        Réservation confirmée pour ${player1.firstName} ${player1.lastName} (${player1.email}) <br />
        Partenaire : ${player2.firstName} ${player2.lastName} <br />
        Date : ${date} <br />
        Créneau horaire : ${time} <br />
        Court : ${court} <br />
        <br />
        Bon tennis ! 🎾
      </div>`

      // TO PLAYER1
      sendMail(
        player1.email,
        emailObject,
        emailBody
      ).catch(e => console.log(e))

      // TO PLAYER2
      sendMail(
        player2.email,
        emailObject,
        emailBody
      ).catch(e => console.log(e))

      return res.send(booking)
    }
  } catch (error) {
    console.log('Error creating booking : ', error)
    return res.status(500).json({ msg: error })
  }
})

// REGISTER NEW BATCH BOOKING
router.post('/batch', auth, async (req, res) => {

	const {
    courts,
    hours,
    dates,
    player1,
    isAdminBooking
	} = req.body

  if(!isAdminBooking) return res.status(400).json({ msg: "Le batch booking n'est disponible qu'aux comptes admin" })

	// SIMPLE VALIDATION
	if (
    courts?.length === 0 ||
    hours?.length === 0 ||
    dates?.length === 0
  ) {
    return res.status(400).json({ msg: 'Il manque des informations pour créer cette réservation' })
  }

  let i = 0
  let j
  const results1 = []
  while(i < hours.length) {
    j = 0
    while(j < courts.length) {
      results1.push({
        court: courts[j],
        time: hours[i]
      })
      j++
    }
    i++
  }

  let k = 0
  let l
  const results2 = []
  while(k < results1.length) {
    l = 0
    while(l < dates.length) {
      const newObject = {
        court: results1[k].court,
        time: results1[k].time,
        date: dates[l],
        isAdminBooking,
        player1
      }
      results2.push(newObject)
      l++
    }
    k++
  }

  results2.forEach((result, i) => {
    Booking.find({
      court: result.court,
      time: result.time,
      date: new Date(result.date)
    })
    .then(booking => {
      if(booking?.length > 0 && i === results2.length - 1) {
        res.status(400).json({ msg: 'Des réservations existent déjà sur ces créneaux'})
      } else {
        if(i === results2.length - 1) {
          Booking.insertMany(results2)
          .then(bookings => {
          
            // SENDING EMAIL CONFIRMATION
            const reservations = results2.map(result => `• Date : ${result.date}, Heure : ${result.time}, Court : ${result.court} <br>`)
            const reservationStringForEmail = reservations.join('')
            const emailObject = 'TENNIS RENÉ MAGNAC'
            const emailBody =
            `<div>
              Réservations confirmées pour ${player1.firstName} ${player1.lastName} (${player1.email}) <br />
              Ceci est un booking admin <br /> <br />
              Les réservations sont les suivantes : <br>
              ${reservationStringForEmail} <br />
              <br />
              Bon tennis ! 🎾
            </div>`

            sendMail(
              player1.email,
              emailObject,
              emailBody
            ).catch(e => console.log(e))

            return res.send(bookings)
          }).catch(error => {
            console.log('error : ', error)
          })
        }
      }
    })
  })
})

// FETCH BOOKINGS OF THE DAY
router.get('/', auth, async (req, res) => {
  const { date } = req.query
  try {
    // const bookings = await Booking.find({ date }).sort('time')
    const bookings = await Booking.find({ date })
    console.log('')
    console.log('')
    console.log('')
    console.log(bookings)
    console.log('')
    console.log('')
    console.log('')
    if(bookings) return res.send(bookings)
  } catch(e) {
    console.log('Error fetching booking : ', e)
    return res.status(500).json({ msg: e })
  }
})

// DELETE A BOOKING
router.delete('/', auth, async (req, res) => {
  const { _id, user_id } = req.query
  try {
    const booking = await Booking.findOne({ _id })
    if(
      booking &&
      booking.player1._id !== user_id &&
      booking.player2._id !== user_id &&
      !isAdminBooking
    ) {
      return res.status(400).json({ msg: 'Vous ne pouvez pas supprimer ce coaching'})
    }
    const deletion = await Booking.deleteOne({ _id })
    if(deletion?.acknowledged) {
      const {
        player1,
        player2,
        date,
        time,
        court
      } = booking

      // SENDING EMAIL CONFIRMATION
      const emailObject = 'TENNIS RENÉ MAGNAC'
      const emailBody =
      `<div>
        Réservation supprimée pour ${player1.firstName} ${player1.lastName} (${player1.email}) <br />
        Partenaire : ${player2.firstName} ${player2.lastName} <br />
        Date : ${dateFormatter(date)} <br />
        Créneau horaire : ${time} <br />
        Court : ${court} <br />
        <br />
        A bientôt ! 🎾
      </div>`

      // TO PLAYER 1
      sendMail(
        player1.email,
        emailObject,
        emailBody
      ).catch(e => console.log(e))

      // TO PLAYER 2
      sendMail(
        player2.email,
        emailObject,
        emailBody
      ).catch(e => console.log(e))
      return res.status(200).send()
    }
  } catch(e) {
    console.log('Error deleting booking : ', e)
    return res.status(500).json({ msg: e })
  }
})

// DELETE NEW BATCH BOOKING
router.put('/batch', auth, async (req, res) => {

	const {
    courts,
    hours,
    dates,
    isAdminBooking,
    player1
	} = req.body

  if(!isAdminBooking) return res.status(400).json({ msg: "Le batch booking n'est disponible qu'aux comptes admin" })

	// SIMPLE VALIDATION
	if (
    courts?.length === 0 ||
    hours?.length === 0 ||
    dates?.length === 0
  ) return res.status(400).json({ msg: 'Il manque des informations pour supprimer cette réservation' })

  let i = 0
  let j
  const results1 = []
  while(i < hours.length) {
    j = 0
    while(j < courts.length) {
      results1.push({
        court: courts[j],
        time: hours[i]
      })
      j++
    }
    i++
  }

  let k = 0
  let l
  const results2 = []
  while(k < results1.length) {
    l = 0
    while(l < dates.length) {
      const newObject = {
        court: results1[k].court,
        time: results1[k].time,
        date: dates[l],
        isAdminBooking
      }
      results2.push(newObject)
      l++
    }
    k++
  }

  for(let m=0;m<results2.length;m++) {
    Booking.deleteOne({
      court: results2[m].court,
      time: results2[m].time,
      date: results2[m].date
    })
    .then(response => {
      console.log(response)
      if(m === results2.length-1) {

        // SENDING EMAIL CONFIRMATION
        const reservations = results2.map(result => `• Date : ${result.date}, Heure : ${result.time}, Court : ${result.court} <br>`)
        const reservationStringForEmail = reservations.join('')
        const emailObject = 'TENNIS RENÉ MAGNAC'
        const emailBody =
        `<div>
          Réservations suprimées pour ${player1.firstName} ${player1.lastName} (${player1.email}) <br /> <br />
          Ceci est un booking admin <br /> <br />
          Les réservations supprimées sont les suivantes : <br>
          ${reservationStringForEmail} <br />
          <br />
          A bientôt ! 🎾
        </div>`

        sendMail(
          player1.email,
          emailObject,
          emailBody
        ).catch(e => console.log(e))        

        return res.status(200).send()
      } else {
        m++
      }
    })
    .catch(error => {
      console.log('error : ', error)
    })
  }
})

module.exports = router