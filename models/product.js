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


var Product = mongoose.model('Product', ProductSchema)


Product.getFieldValues = function(query){
	return new Promise(function(resolve, reject){
		Car.aggregate()
			.match(query)
			.group({
				_id: null,
				manufacturer: { $addToSet: '$manufacturer' },
				size: { $addToSet: '$size' },
			})
			.exec()
				.then(function(data){
					resolve(data)	
				})
				.then(null, function(err){
					reject(err)
				})
	})
}




// vim:set ts=4 sw=4 nowrap :
