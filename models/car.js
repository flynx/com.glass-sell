var Promise = require('promise')

var util = require('./util')
var mongoose = require('mongoose')
var ECode = require('./ecode')

// XXX HACK...
var fs = require('fs') 
var csv = require('csv')
var csv2json = require('../util/misc').csv2json



var CarSchema = mongoose.Schema({
	// use the hash of all of these fields as _id... (???)
	manufacturer: String,
	series: String,
	model: String,
	modelID: String,
	bodyNumber: String,
	type: String,
	bodyType: String,
	doors: String,
	region: String,

	year: Array,

	ecodes: Array,
})


CarSchema.pre('save', function(next){
	var ecodes = this.ecodes || []

	ECode.checkECode(ecodes)
		.done(
			function(){ next() },
			function(err){ next(err) })
})


var Car =
module.exports = 
	mongoose.model('Car', CarSchema)



Car.getFieldValues = util.makeUniqueFieldLister(Car, 
	[
		'manufacturer',
		'series',
		'model',
		'modelID',
		'bodyNumber',
		'type',
		'bodyType',
		'doors',
		'region',
	],
	{
		// XXX
		//year: {}

		//cars: { $addToSet: '$$ROOT'  },
	})



// XXX this is preferable to the mapReduce version below...
// XXX test...
Car.getCompatibleECodesA = function(query){
	return new Promise(function(resolve, reject){
		Car.aggregate()
			// filter the query...
			.match(query)

			// collect all the ecode sets...
			.group({
				_id: null, 
				ecodes: { $push: '$ecodes' }})

			// intersect the ecode sets...
			.project({ecodes: { $setIntersection: '$ecodes' }})

			// get the result...
			.exec()
				.then(function(data){
					resolve(data[0].ecodes)	
				})
				.then(null, function(err){
					reject(err)
				})
	})
}


// XXX test...
Car.getCompatibleECodesMR = function(query){
	var res = []

	return new Promise(function(resolve, reject){
		Car
			.mapReduce({
					query: query,

					map: function(){ 
						emit(this.ecodes, 1) 
					},
					reduce: function(k, vals){ 
						var res = vals.splice(0, 1)

						for(var i=0; i < vals.length; i++){
							if(res.length == 0){
								return res
							}
							var cur = vals[i]
							res = res.filter(function(e){
								return cur.indexOf(e) >= 0
							})
						}

						return res
					},
				},
				function(err, data){
					resolve(data)
				})
	})
}


// XXX HACK
Car.loadCSV = function(data, callback){
	csv.parse(data, {
			delimiter: ';',
		}, 
		function(err, data){
			if(err){
				return callback(err)
			}

			var res = csv2json(data)
				.map(function(data){
					return data.car
				})

			// populate...
			Car.collection.insert(res, function(err, data){
				callback(err, data)
			})
		})
}


/*
// XXX HACK
Car.loadCSV(fs.readFileSync('data/ecode-data.csv', {encoding: 'utf-8'}), 
		function(e, d){
			console.log('###', e, d)
		})
*/


// vim:set ts=4 sw=4 nowrap :
