var express = require('express')
var router = express.Router()

// This set of routs is responsible for:
// 	- the root dir
// 	- login/logout functionality (should this be here or in a middleware???)

// /
router.get('/', 
	function(req, res, next) {
		res.render('index', { 
			user: req.user,
			title: 'Express' 
		})
	})


module.exports = router

// vim:set ts=4 sw=4 :
