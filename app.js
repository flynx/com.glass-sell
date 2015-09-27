var express = require('express')
var forceSSL = require('express-force-ssl')
var mongodb = require('mongodb')
var mongoose = require('mongoose')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var passport = require('./config/passport')(require('passport'))

var sessionRoutes = require('./routes/session')
var index = require('./routes/index')
var users = require('./routes/users')
var select = require('./routes/select')



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

function notSuspended(req, res, next){
	if(req.user && req.user.suspended){
		req.logout()
	}
	return next()
}


mongoose.connect('mongodb://localhost/GlassSell')



var app = express()



// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')



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
			cookie: {
				//		m	 s	  ms
				maxAge: 20 * 60 * 1000,
			},
			// NOTE: this will automatically create the session store...
			// NOTE: for more details see: 
			// 		https://www.npmjs.com/package/connect-mongo
			// XXX need to get list of sessions out of this...
			store: new MongoStore({
				url: 'mongodb://localhost/GlassSell',
				ttl: 20 * 60 * 1000,
				stringify: false,
			}), 
		}))
	.use(passport.initialize())
	.use(passport.session())
	.use(notSuspended)



// routing...
app
	.use('/', sessionRoutes)
	.use('/', authenticated, index)
	.use('/user', authenticated, users)
	.use('/select', authenticated, select)



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
