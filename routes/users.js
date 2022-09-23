const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config')

const auth = require('../middlewares/auth')
const User = require('../models/user')
const { sendMail } = require('../services/mailer')

// REGISTER NEW USER
router.post('/', async (req, res) => {

	const {
		firstName,
		lastName,
		email,
    phoneNumber,
    birthdate,
    password
	} = req.body

	// SIMPLE VALIDATION
	if (
		!firstName ||
		!lastName ||
		!email ||
    !phoneNumber ||
    !birthdate ||
    !password
  ) return res.status(400).json({ msg: 'Il manque des informations pour créer ce compte' })

	// CHECK FOR EXISTING USER
	const user = await User.findOne({ email })
	if(user) return res.status(400).json({ msg: 'Cet utilisateur existe déjà: email déjà utilisé'})

	const newUser = new User({
		firstName,
		lastName,
		email,
    phoneNumber,
    birthdate,
    password
	})

  // CREATE SALT AND HASH
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash
      newUser.save()
        .then(user => {
          // CREATE AUTH TOKEN
          jwt.sign(
            { id: user.id },
            jwtSecret,
            { expiresIn: (3600*24*7) },
            (err, token) => {
              if(err) throw err;
              // SENDING EMAIL CONFIRMATION
            	sendMail(
            		user.email,
            		'BIENVENUE AU TENNIS RENÉ MAGNAC',
            		`<div>
            			Bienvenue au tennis René Magnac : <br />
                  Votre identifiant : ${email} <br />
                  Votre mot de passe : votre date de naissance, au format jj/mm/année (n'oubliez pas les "/") <br />
									Ceci est un message automatique, merci de ne pas y répondre.
            		</div>`
            	).catch(e => console.log(e))
              return res.status(201).json({
                token,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                birthdate: user.birthdate,
                isAdmin: user.isAdmin,
                _id: user._id,
								expiration: user.expiration,
								invites: user.invites,
								
              })
            })
        })
    })
  })
  // .catch(e => {
  //   console.log('Error : ', e)
  //   return res.json({ msg: e })
  // })
})

// LOGIN USER
router.post('/signin', (req, res) => {
	const { email, password } = req.body

	// SIMPLE VALIDATION
	if (!email || !password) {
		return res.status(400).json({ msg: "Merci d'entrer email et mot de passe" })
	}

	// CHECK FOR EXISTING USER
	User.findOne({ email })
		.then(user => {
			if(!user) return res.status(404).json({ msg: "L'utilisateur n'existe pas" })

			// VALIDATE PASSWORD
			bcrypt.compare(password, user.password)
				.then(isMatch => {
					if(!isMatch) return res.status(403).json({ msg: 'Email ou mot de passe invalide' });
					jwt.sign(
						{ id: user.id },
						jwtSecret,
						{ expiresIn: 3600 * 24 * 7 },
						(err, token) => {
							if (err) throw err;
							return res.json({
                token,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                birthdate: user.birthdate,
                isAdmin: user.isAdmin,
                _id: user._id
							})
						}
					)
				})

		})

})

// LOAD USER
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if(user) return res.send(user)
        if(!user) return res.status(401).json({ msg: "No user with this id" })
    } catch(e) {
        console.log('Error fetching user : ', e)
        return res.status(500).json({ msg: e })
    }
})

// DELETE USER
router.delete('/delete_user', (req, res) => {
	const { _id } = req.query
		User.deleteOne({ _id })
		.then(() => {
			return res.status(200).send({ msg: 'Utilisateur supprimé' })
		})
		.catch(e => {
			console.log(e)
			res.json({ msg: e })
		})
})

// FETCH ALL USERS
router.get('/all', auth, async (req, res) => {
  try {
      const users = await User.find().select('-password')
      if(users) return res.send(users)
  } catch(e) {
      console.log('Error fetching user : ', e)
      return res.status(500).json({ msg: e })
  }
})

// FETCH A SPECIFIC USER
router.get('/user', auth, async (req, res) => {
	const { _id } = req.query
  try {
      const user = await User.find({ _id }).select('-password')
      if(user) return res.send(user)
  } catch(e) {
      console.log('Error fetching user : ', e)
      return res.status(500).json({ msg: e })
  }
})

// UPDATE USER
router.put('/update_user', auth, async (req, res) => {

	const { _id } = req.body

	try {
		const user = await User.findOne({ _id })
		if (!user) return res.status(404).json({ msg: 'Cet utilisateur est introuvable' })
		if (user) {
			Object.keys(user.toJSON()).forEach((key, i) => {
				if (req.body[key] !== undefined) {
					user[key] = req.body[key]
				}
				if (i === (Object.keys(user.toJSON()).length) - 1) {
					user.save()
					.then(updatedUser => {
						return res.json(updatedUser)
					})
				}
			})
		}
	} catch (e) {
		res.status(500).json({ msg: "Quelque chose s'est mal passé" })
	}
})

// UPDATE USER CREDENTIALS
router.put('/update_user_credentials', auth, async (req, res) => {

	const { _id, password, newPassword } = req.body
	try {
		const user = await User.findOne({ _id })
		if (!user) return res.status(404).json({ msg: "Cet utilisateur n'existe pas" })

		bcrypt.compare(password, user.password)
		.then(isMatch => {
			if (!isMatch) return res.status(403).json({ msg: 'Mot de passe actuel incorrect' })

			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(newPassword, salt, (err, hash) => {
					if (err) throw err;
					user.password = hash
					user.save()
						.then(user => {
							jwt.sign(
								{ id: user.id },
								jwtSecret,
								{ expiresIn: (3600 * 24 * 7) },
								(err, token) => {
									if (err) throw err;
									return res.json({
										token
									})
								}
							)
						})
				})
			})

		})

	} catch (e) {
		res.json({ msg: 'Something went wrong finding the user in DB' })
	}
})


module.exports = router