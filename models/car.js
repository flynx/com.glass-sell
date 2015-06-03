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


// vim:set ts=4 sw=4 nowrap :
