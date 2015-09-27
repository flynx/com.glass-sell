var express = require('express')
var passport = require('passport')
var router = express.Router()


// /login
router.get('/login',
	function(req, res, next) {
		if(req.isAuthenticated()){
			res.redirect('/')

		} else {
			res.render('login', { 
				user: req.user,
				title: 'Express' 
			})
		}
	})
router.post('/login',
	function(req, res, next){
		passport.authenticate('local', function(err, user, info){
			if(err){
				return next(err)
			}

			// get the target url from session...
			var url = req.session.url || '/'
			delete req.session.url

			// auth failed...
			if(!user){
				return res.redirect(url)
			}

			// do the actual login...
			req.login(user, function(err){
				if(err){
					return next(err)
				}

				// success redirect...
				return res.redirect(url)
			})
		})(req, res, next)
	})


// /logout
router.get('/logout', function(req, res){
	req.logout()
	res.redirect('/')
})


module.exports = router

// vim:set ts=4 sw=4 :
