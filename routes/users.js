var express = require('express')
var passport = require('passport')
var router = express.Router()

var User = require('../models/user')


function restrictRole(role){
	return function(req, res, next){
		if(req.user.role == role){
			return next()
		
		// Show an error...
		} else {
			// XXX should this use the error view or access-violation view??
			res.render('error', { 
				message: 'Restricted',
				error: {
					status: 'Asses check failed',
					stack: ''
				}
			})
		}
	}
}


// Get user object...
//
// If role is root:
// 	- if req.query.username is given use it
// 	- else use req.user
//
// Other roles:
// 	- ignore req.query.username and return req.user
//
// XXX do real errors....
// XXX promises???
function getUser(req, callback){
	var username = req.body.username || req.query.username

	if(username && username != req.user.username && req.user.role == 'root'){
		User.findOne({ username: username }, function(err, user) {

			if(err){
				return callback('Error getting user')
			}

			return callback(null, user)
		})
	} else {
		return callback(null, req.user)
	}
}



// list user data...
router.get('/', function(req, res, next) {
	getUser(req, function(err, user){
		if(err || user == null){
			res.render('error', { 
				message: err || 'User does not exist.',
				error: {
					status: '',
					stack: ''
				}
			})

		} else {
			res.render('user-view', { 
				title: 'User details',
				user: user,
				role: req.user.role,
			})
		}
	})
})
// update/create user...
router.post('/', function(req, res, next) {

	var username = req.body.username || req.query.username
	var password = req.body.password
	var role = req.body.role

	getUser(req, function(err, user){
		if(err){
			return res.render('error', { 
				message: err || 'Can\'t get user.',
				error: {
					status: '',
					stack: ''
				}
			})
		}

		if(req.user.role != 'root' && user == null){
			return res.render('error', { 
				message: 'Can\'t update',
				error: {
					status: '',
					stack: ''
				}
			})
		}

		// new user...
		if(!user) {
			console.log('### creating new user...')
			user = new User()
		}

		// update data...
		user.username = username

		if(password && password != ''){
			user.password = user.generateHash(password)

		} else if(!user.password){
			return res.render('error', { 
				message: 'Need a password',
				error: {
					status: '',
					stack: ''
				}
			})
		}

		if(req.user.role == 'root'){
			user.role = role
		}


		user.save(function(err){
			if(err){
				res.render('error', { 
					message: err || 'Can\'t save.',
					error: {
						status: '',
						stack: ''
					}
				})
			} else {
				console.log('XXX updated user...')
			}
		})

		res.render('user-view', { 
			title: 'User details',
			user: user,
			role: req.user.role,
		})
	})
})

// explicit edit form...
router.get('/edit', function(req, res, next) {
	if(req.query.mode == 'new'){
		return res.render('user-edit', { 
			title: 'New user',
			role: req.user.role,
			mode: 'new',
		})
	}

	getUser(req, function(err, user){
		if(err || user == null){
			res.render('error', { 
				message: err || 'User does not exist.',
				error: {
					status: '',
					stack: ''
				}
			})

		} else {
			res.render('user-edit', { 
				title: 'User details',
				user: user,
				role: req.user.role,
			})
		}
	})
})


// XXX needs revision...
router.get('/delete', function(req, res, next) {
	var username = req.body.username || req.query.username

	getUser(req, function(err, user){
		if(err || user == null || user.username == req.user.username){
			res.render('error', { 
				message: err || 'Can\'t delete.',
				error: {
					status: '',
					stack: ''
				}
			})

		} else {
			user.remove(function(err){
				if(err){
					res.render('error', { 
						message: err || 'Can\'t delete.',
						error: {
							status: '',
							stack: ''
						}
					})
				} else {
					return res.redirect(req.get('Referrer') || '/')
				}
			})
		}
	})
})

router.get('/toggleSuspend', restrictRole('root'), function(req, res, next) {
	var username = req.body.username || req.query.username

	getUser(req, function(err, user){
		if(err || user == null || user.username == req.user.username){
			res.render('error', { 
				message: err || 'Can\'t suspend.',
				error: {
					status: '',
					stack: ''
				}
			})

		// toggle suspend...
		} else {
			user.suspended = !user.suspended

			user.save(function(err){
				if(err){
					res.render('error', { 
						message: err || 'Can\'t save.',
						error: {
							status: '',
							stack: ''
						}
					})

				// do the suspend...
				} else {
					return res.redirect(req.get('Referrer') || '/')
				}
			})
		}
	})
})

// list users...
router.get('/list', restrictRole('root'), function(req, res, next) {
	User.find({}, function(err, users){
		if(err){
			res.render('error', { 
				message: err || 'Can\'t list.',
				error: {
					status: '',
					stack: ''
				}
			})

		} else {
			res.render('user-list', { 
				title: 'User list',
				users: users,
			})
		}
	})
})






module.exports = router

// vim:set ts=4 sw=4 :
