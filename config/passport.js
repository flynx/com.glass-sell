
var LocalStrategy = require('passport-local').Strategy

//var User = require('./models/user')

module.exports = function(passport){

	// XXX see:
	// 		https://scotch.io/tutorials/easy-node-authentication-setup-and-local#handling-signup/registration
	passport.use('local-signup', new LocalStrategy(
		function(username, password, done) {
			// XXX
		}))


	// XXX check password...
	passport.use(new LocalStrategy(
		function(username, password, done) {
			// XXX STUB: check passwords for real...
			if(username == password){
				return done(null, username)
			} else {
				return done(null, false)
			}
			/* XXX what is used here for the user store...
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
				return done(null, user)
			})
			*/
		}
	))

	// XXX return session id/data to session...
	passport.serializeUser(function(user, done) {
			console.log('serializeUser: ' + user)
			done(null, user)
	})

	// XXX check if session is still valid...
	passport.deserializeUser(function(user, done) {
			console.log('deSerializeUser: ' + user)
			done(null, user)
			/*
			db.users.findById(id, function(err, user){
					console.log(user)
					if(!err) done(null, user)
					else done(err, null)	
			})
			*/
	})

	return passport
}


// vim:set ts=4 sw=4 nowrap :
