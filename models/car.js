var mongoose = require('mongoose')
var ECode = require('./ecode')


var CarSchema = mongoose.Schema({
	// use the hash of all of these fields as _id... (???)
	manufacturer: String,
	series: String,
	model: String,
	modelIdentificator: String,
	bodyNumber: String,
	year: Array,
	type: String,
	typeCarBody: String,
	doors: String,
	region: String,

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
module.exports = mongoose.model('Car', CarSchema)


// XXX this is preferable to the mapReduce version below...
// XXX test...
Car.getCompatibleECodesA = function(cars){
	return new Promise(function(resolve, reject){
		Car
			.aggregate()
				// filter the cars...
				.match(cars)
				// collect all the ecode sets...
				.group({
					_id: null, 
					ecodes: { $push: '$ecodes' }})
				// intersect the ecode sets...
				.project({ecodes: { $setIntersection: '$ecodes' }})
				// get the result...
				.exec()
					.then(function(data){
						resolve(data.ecodes)	
					})
					.then(null, function(err){
						reject(err)
					})
	}
}


// XXX test...
Car.getCompatibleECodesMR = function(cars){
	var res = []

	return new Promise(function(resolve, reject){
		Car
			.mapReduce({
					query: cars,

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


// vim:set ts=4 sw=4 nowrap :