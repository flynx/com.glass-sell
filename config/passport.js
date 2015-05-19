
// XXX this expects the sessions to be stored in the same DB as the data...
var mongoose = require('mongoose')

var LocalStrategy = require('passport-local').Strategy

var User = require('../models/user')


module.exports = function(passport){

	// XXX see:
	// 		https://scotch.io/tutorials/easy-node-authentication-setup-and-local#handling-signup/registration
	passport.use('local-signup', new LocalStrategy(
		function(username, password, done) {
			// XXX
		}))


	// check password...
	// NOTE: this will silently remove all other sessions by this user...
	// XXX this is a potential DoS attack: fight between two instances 
	// 		kicking each other off...
	// XXX add roles to req.session.roles
	passport.use(new LocalStrategy(
		function(username, password, done) {
			User.findOne({ username: username }, function(err, user) {
				if (err) { 
					return done(err) 
				}
				if (!user) {
					return done(null, false, { message: 'Incorrect username.' })
				}
				if (!user.validPassword(password)) {
					return done(null, false, { message: 'Incorrect password.' })
				}
				// XXX check if user is suspended, if yes show error...
				if(user.suspended){
					return done(null, false, { message: 'User suspended.' })
				}

				// remove prior sessions...
				// XXX avoid being mongo-specific...
				mongoose.connection.collection('sessions')
					.remove({ 'session.passport.user': user.id }, 
						function(err, res){
							if(err){
								// XXX report error...
								
							// report sessions closed...
							} else if(res.result.n > 0){
								// XXX do propper logging...
								//console.log('removed '+ res.result.n +' sessions.')
							}
						})

				return done(null, user)
			})
		}
	))

	passport.serializeUser(function(user, done) {
			//done(null, user)
			done(null, user.id)
	})

	passport.deserializeUser(function(id, done) {
			//done(null, id)
			User.findById(id, function(err, user) {
				done(err, user)
			})
	})

	return passport
}


// vim:set ts=4 sw=4 nowrap :
