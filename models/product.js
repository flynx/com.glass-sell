var util = require('./util')
var mongoose = require('mongoose')
var ECode = require('./ecode')


var ProductSchema = mongoose.Schema({
	// manufacturer id...
	_id: String,
	ecode: String,

	size: String,
	manufacturer: String,
	manufacturerCode: String,
	scanCode: String,
	USACode: String,
	XYGCode: String,
})

ProductSchema.pre('save', function(next){
	var ecode = this.ecode

	ECode.checkECode(ecode)
		.done(
			function(){ next() },
			function(err){ next(err) })
})


var Product = 
module.exports = 
	mongoose.model('Product', ProductSchema)



Product.getFieldValues = util.makeUniqueFieldLister(
	Product, 
	[
		'manufacturer',
		'size',
	])


// vim:set ts=4 sw=4 nowrap :
