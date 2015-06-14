var express = require('express')
var router = express.Router()

//var EuroCodes = require('../models/eurocodes')

var ECode = require('../models/ecode')
var Car = require('../models/car')
var Product = require('../models/product')


// This set of routs is responsible for:
// 	- the root dir
// 	- login/logout functionality (should this be here or in a middleware???)

// XXX will need the following actions:
//
// 		- GET /	-> main UI
// 			populate datalists (do a base query) and draw ui
//
// 		- GET /query -> JSON
//			 get data-set to update ui
// 				.fields		- fields used for datalist
// 				.cars		- list of found cars
// 				.ecodes		- list of ecodes that match ALL the found cars
// 								NOTE: this will be mostly empty until 
// 									we narrow down the search...
//
// 		- GET /ecode -> JSON (???)
// 			expanded list per ecode
// 				. products	- list of products and accessories for a given ecode
// 					.items
// 					.recommended
// 					.optional


// XXX might be a good idea to write a generic data getter to be used 
// 		both here and in /json...
// 			getData(query) -> data
// 				where data format is:
// 					{
// 						fields: { ... },
// 						cars: [ ... ],
// 						ecodes: [ ... ],
// 					}
// 		...this should be a promise...
// XXX can this be done in a single db-request on the mongo side???
// 		query 
// 			-> fields
// 			-> cars
// 				-> ecodes (intersect)
// 					-> ecode data
// 		...in the current state this is three requests:
// 			- fields(query)
// 			- cars(query)
// 			- ecode data(ecodes)


router.get('/', 
	function(req, res, next) {
		// get the base query data...
		// XXX do we need to quote the query???
		var query = req.query

		// remove empty values...
		// XXX is this needed???
		for(var k in query){
			if(query[k] == ''){
				delete query[k]
			}
		}
		
		Car.getFieldValues(query)
			.then(function(data){
					console.log('DATA:', data)

					// format fields for form...
					var fields = {}
					for(var k in data){
						fields['|'+k+'|'+k] = data[k]
					}

					res.render('select', { 
						title: 'Select',

						fields: fields,
						// XXX cars
						// XXX ecodes
					})
				},
				function(err){
					console.log('ERR:', err)
				})


	})


router.get('/json', 
	function(req, res, next) {
		// get the query...
		// XXX do we need to quote the query???
		var query = req.query

		Car.getFieldValues(query)
			.then(function(fields){
					console.log('DATA:', fields)

					res.json({
						fields: fields,
						// XXX cars
						// XXX ecodes
					})
				},
				function(err){
					console.log('ERR:', err)

					// XXX format error???
					res.json({})
				})
	})


router.get('/ecode', 
	function(req, res, next) {
		res.render('index', { title: 'Select' })
	})


module.exports = router

// vim:set ts=4 sw=4 :
