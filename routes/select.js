var Promise = require('promise')

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


function getData(query, sort, limit, offset){
	return new Promise(function(resolve, reject){
		var limit = query.limit || 20
		delete query.limit

		var offset = query.offset*limit || 0
		delete query.offset

		// sort...
		var car_sort = query.car_sort || ['manufacturer']
		car_sort = typeof(car_sort) == typeof('str') 
			? car_sort
			: car_sort.join(' ')
		delete query.car_sort

		var ecode_sort = query.ecode_sort || ['_id']
		ecode_sort = typeof(ecode_sort) == typeof('str') 
			? ecode_sort
			: ecode_sort.join(' ')
		delete query.ecode_sort

		Promise.all([
				Car.getFieldValues(query),
				// XXX this is partially redundant...
				// 		...would be good to find a way to do this within 
				// 		the previous query...
				Car
					.find(query)
					.sort(car_sort)
					.skip(offset)
					.limit(limit)
					.exec(),
				// ecodes...
				Car.getCompatibleECodesMR(query, ecode_sort),
				// count...
				// XXX is there a way to avoid a separate query???
				Car
					.find(query)
					.count()
					.exec(),
			])
			.then(function(data){
					resolve({
						query: query,

						limit: limit,
						// offset is in pages...
						offset: offset/limit,
						count: data[3],
						car_sort: car_sort,
						ecode_sort: ecode_sort,

						fields: data[0],
						cars: data[1],
						// XXX need to populate ecodes...
						ecodes: data[2].map(function(e){ return {_id: e} }),
					})

				})
			.catch(function(err){
					reject(err)
				})
	})
}


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

		getData(query)
			.then(function(data){
				console.log('DATA:', data)

				// format fields for form...
				var fields = {}
				for(var k in data.fields){
					fields['|'+k+'|'+k] = data.fields[k]
				}

				res.render('select', { 
					user: req.user,
					title: 'Select',

					query: query,

					limit: data.limit,
					offset: data.offset,
					count: data.count,
					car_sort: data.car_sort,
					ecode_sort: data.ecode_sort,

					fields: fields,
					cars: data.cars,
					ecodes: data.ecodes,
				})
			})
			.catch(function(err){
				console.log('ERR:', err)
				// XXX render error...
			})



	})


router.get('/json', 
	function(req, res, next) {
		// get the query...
		// XXX do we need to quote the query???
		var query = req.query

		getData(query)
			.then(function(data){
					console.log('DATA:', data)

					res.json(data)
				})
			.catch(function(err){
					console.log('ERR:', err)

					// XXX format error???
					res.json({})
				})
	})


router.get('/ecode', 
	function(req, res, next) {
		res.render('index', { 
			user: req.user,
			title: 'Select',
		})
	})


module.exports = router

// vim:set ts=4 sw=4 :
