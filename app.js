var express = require('express')
var forceSSL = require('express-force-ssl')
var mongodb = require('mongodb')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var sessionRoutes = require('./routes/session')
var index = require('./routes/index')
var users = require('./routes/users')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')


// passport setup...
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

// auth middleware...
function authenticated(req, res, next){
	// everything is on, continue on...
	if(req.isAuthenticated()){
		return next()

	// need to login...
	} else {
		// store the path to redirect after login....
		req.session.url = req.url

		// NOTE: we are rendering in place rather that redirecting to 
		// 		make the path retntion trivial...
		res.render('login', { title: 'Express' })
	}
}



app
	// uncomment after placing your favicon in /public
	//.use(favicon(__dirname + '/public/favicon.ico'))
	.use(logger('dev'))
	.use(forceSSL)
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }))
	.use(cookieParser())
	.use(express.static(path.join(__dirname, 'public')))
	// NOTE: this must be after the static stuff...
	.use(session({
			secret: 'keyboard cat',
			resave: false,
			saveUninitialized: false,
			//		m	 s	  ms
			maxAge: 20 * 60 * 1000,
			// XXX uses MemoryStore, swithc to Mongo ASAP...
			// 		see: https://www.npmjs.com/package/connect-mongo
			store: new MongoStore({
				url: 'mongodb://localhost/GlassSell',
			}), 
		}))
	.use(passport.initialize())
	.use(passport.session())



// routing...
app
	.use('/', sessionRoutes)
	.use('/', authenticated, index)

	// XXX add roles...
	.use('/users', authenticated, users)



// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found')
	err.status = 404
	next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500)
		res.render('error', {
			message: err.message,
			error: err
		})
	})
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500)
	res.render('error', {
		message: err.message,
		error: {}
	})
})


module.exports = app

// vim:set ts=4 sw=4 :
