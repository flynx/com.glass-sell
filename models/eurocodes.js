// load the things we need
var mongoose = require('mongoose')
var csv = require('csv')
var csv2json = require('../util/misc')


// XXX usr .distinct(<field>) to build a completion index...
// XXX infer codes from redundant values...
// 		example:
// 			car.manufacturer <=> euroCode.manufacturer


var complete_fields = [
	'car.manufacturer',
	'car.series',
	'car.model',
	'car.modelIdentificator',
	'car.bodyNumber',
	'car.type',
	'car.typeCarBody',
	'car.doors',
	'car.region',

	'product.product',
	'product.sizeGlass',
	'product.glassManufacturer',
	'product.codeGlassManufacturer',
	'product.euroCode',
	'product.scanCode',
	'product.USACode',
	'product.XYGCode',

	'euroCode.manufacturer',
	'euroCode.model',
	'euroCode.glassType',
	'euroCode.glassAccessory',
	'euroCode.glassTint',
	'euroCode.accessoryType',
	'euroCode.topTints',
	'euroCode.bodyType',
	'euroCode.bodyDoors',
	'euroCode.positionGlass',
	'euroCode.variant,
]

// get this straight from ../data/db.csv
var ECode_cols = {
	idECode: String,
	statusECode: String,

	car: {
		manufacturer: String,
		series: String,
		model: String,
		modelIdentificator: String,
		bodyNumber: String,
		fromYear: String,
		toYear: String,
		type: String,
		typeCarBody: String,
		doors: String,
		region: String,
	},

	product: {
		product: String,
		sizeGlass: String,
		glassManufacturer: String,
		codeGlassManufacturer: String,
		euroCode: String,
		scanCode: String,
		USACode: String,
		XYGCode: String,
	},

	euroCode: {
		manufacturer: String,
		model: String,
		glassType: String,
		glassAccessory: String,
		glassTint: String,
		accessoryType: String,
		topTints: String,
		bodyType: String,
		bodyDoors: String,
		positionGlass: String,

		// characteristics...
		A: String,
		B: String,
		C: String,
		D: String,
		E: String,
		F: String,
		G: String,
		H: String,
		I: String,
		J: String,
		K: String,
		L: String,
		M: String,
		N: String,
		O: String,
		P: String,
		Q: String,
		R: String,
		S: String,
		T: String,
		U: String,
		V: String,
		W: String,
		X: String,
		Y: String,
		Z: String,

		//modification: String,
		variant: String,
	},
}

// define the schema for our user model
var EuroCodeSchema = mongoose.Schema(ECode_cols)

// XXX do a partial version...
EuroCodeSchema.methods.getFieldValues = function(query, callback){
	if(query){
		query = EuroCode.find(query)
	} else {
		query = EuroCode
	}

	var res = {}

	// XXX this is wrong...
	// 		...this should exec on the db side in one operation and not
	// 		translate to N queries...
	// 		...one way to do it is to group _id: null and $addToSet each
	// 		field...
	// XXX error checking...
	// XXX can we reuse a query like this???
	complete_fields.forEach(function(n){
		query.distinct(n, function(err, lst){
			// XXX check for errors...
		
			res[n] = lst

			// res is full, we can return it...
			if(Object.keys(res).length == complete_fields.length){
				callback(res)
			}
		})
	})
}


EuroCodeSchema.methods.batchLoadCSV = function(data, callback){
	csv.parse(data, {
			delimiter: ';',
		}, 
		function(err, data){
			if(err){
				// XXX report errors...
				return callback(err)
			}

			var res = csv2json(data)

			// populate...
			EuroCode.create(res)
				.then(function(err){
					// XXX
					callback(err, res)
				})
		})
}

// create the model for users and expose it to our app
var EuroCode =
module.exports = mongoose.model('EuroCode', EuroCodeSchema)


// vim:set ts=4 sw=4 nowrap :
