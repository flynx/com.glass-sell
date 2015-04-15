var express = require('express');
var forceSSL = require('express-force-ssl')
var session = require('express-session')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var sessionRoutes = require('./routes/session');
var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// passport...
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

// XXX check password...
passport.use(new LocalStrategy(
	function(username, password, done) {
		if(username == password){
			return done(null, username)
		} else {
			return done(null, false)
		}
		/*
		User.findOne({ username: username }, function(err, user) {
			if (err) { 
	return done(err); 
			}
			if (!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			if (!user.validPassword(password)) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		});
		*/
	}
));


// XXX return session id/data to session...
passport.serializeUser(function(user, done) {
		console.log('serializeUser: ' + user)
		done(null, user);
});

// XXX check if session is still valid...
passport.deserializeUser(function(user, done) {
		console.log('deSerializeUser: ' + user)
		done(null, user)
/*
		db.users.findById(id, function(err, user){
				console.log(user)
				if(!err) done(null, user);
				else done(err, null)	
		})
		*/
});


// auth middleware...
function authenticated(req, res, next){
	if(req.isAuthenticated()){
		return next()
	} else {
		// XXX should render the login form, but keep the path...
		//	...and open the path on login
		//	XXX store the path in session to get back to it when we are done...
		req.session.url = req.url
		res.render('login', { title: 'Express' });
		//res.redirect('/login');
	}
}


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(forceSSL);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());


app.use('/', sessionRoutes);
app.use('/', authenticated, index);

// XXX add roles...
app.use('/users', authenticated, users);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;

// vim:set ts=4 sw=4 :
