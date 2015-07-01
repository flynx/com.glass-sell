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


var FIELDS = [
	'manufacturer',
	'series',
	'model',
	'modelID',
	'bodyNumber',
	'type',
	'bodyType',
	'doors',
	'region',
]

Car.getFieldValues = util.makeUniqueFieldLister(Car, 
	FIELDS,
	{
		// XXX
		//year: {}

		//cars: { $addToSet: '$$ROOT'  },
	})



// XXX this is preferable to the mapReduce version below...
// XXX test...
// XXX does not yet work...
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
			// XXX can't find a way for this to work across multiple docs...
			.project({ecodes: { $setIntersection: '$ecodes' }})

			// get the result...
			.exec()
				.then(function(data){
					//console.log('>>>>', data[0].ecodes)
					resolve(data[0].ecodes)	
				})
				.then(null, function(err){
					reject(err)
				})
	})
}


Car.getCompatibleECodesMR = function(query, sort){
	var res = []

	return new Promise(function(resolve, reject){
		Car
			.mapReduce({
					query: query,

					map: function(){ 
						emit('commonEcodes', {ecodes: this.ecodes}) 
					},
					reduce: function(k, vals){ 
						var res = vals.shift().ecodes

						for(var i=0; i < vals.length; i++){
							// at least one empty set drops all elems...
							if(res.length == 0){
								return { ecodes: [] }
							}
							var cur = vals[i].ecodes
							res = res.filter(function(e){
								return cur.indexOf(e) >= 0
							})
						}

						return { ecodes: res }
					},
				},
				function(err, data){
					if(err){
						reject(err)

					} else if(data.length == 0){
						resolve([])

					} else {
						var res = data[0].value.ecodes

						// sort the ecode list...
						// NOTE: this also support ecode objects...
						if(sort != null){
							var attrs = sort.split(/\s+/)
							res.sort(function(a, b){
								for(var i=0; i < attrs.length; i++){
									var attr = attrs[i]
									var ascending = attr[0] != '-'
									attr = ascending ? attr : attr.slice(1)

									a = typeof(a) == typeof('str') ? a : (a[attr] || -Infinity)
									b = typeof(b) == typeof('str') ? b : (b[attr] || -Infinity)

									if(a == b){
										continue

									} else {
										ascending = ascending ? 1 : -1
										return (a < b ? -1 : 1) * ascending
									}
								}
								return 0
							})
						}

						resolve(res)
					}
				})
	})
}


Car.makeID = function(car){
	var o = {}
	FIELDS.forEach(function(n){ 
		if(n == 'ecodes'){
			return
		}
		if(n in car){
			o[n] = car[n]
		}
	})
	return JSON.stringify(o)
}


// XXX HACK
// XXX handle '*' fields...
Car.loadCSV = function(data, callback){
	csv.parse(data, {
			delimiter: ';',
		}, 
		function(err, data){
			if(err){
				return callback(err)
			}

			var res = {}
			csv2json(data)
				.forEach(function(data){
					var car = data.car

					var id = car._id = Car.makeID(car)

					var ecode = data.idECode
					//console.log('>>>>', ecode)

					if(!(id in res)){
						res[id] = car
						res[id].ecodes = [ecode]

					} else if(res[id].ecodes.indexOf(ecode) < 0){
						res[id].ecodes.push(ecode)
					}
				})

			res = Object.keys(res).map(function(k){ return res[k] })

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
