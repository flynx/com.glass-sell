var express = require('express')
var router = express.Router()

var EuroCodes = require('../models/eurocodes')

var ECode = require('../models/ecode')
var Car = require('../models/car')
var Product = require('../models/product')


// This set of routs is responsible for:
// 	- the root dir
// 	- login/logout functionality (should this be here or in a middleware???)

// /
router.get('/', 
	function(req, res, next) {
		res.render('index', { title: 'Select' })
	})


module.exports = router

// vim:set ts=4 sw=4 :
