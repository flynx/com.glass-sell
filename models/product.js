var mongoose = require('mongoose')
var ECode = require('./ecode')


var ProductSchema = mongoose.Schema({
	// manufacturer id...
	_id: String,
	ecode: String,

	sizeGlass: String,
	glassManufacturer: String,
	codeGlassManufacturer: String,
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


var Product = mongoose.model('Product', ProductSchema)



// vim:set ts=4 sw=4 nowrap :
