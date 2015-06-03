var mongoose = require('mongoose')
var Promise = require('promise')


// XXX nedd a two directional translation from string ecode to ecode parts...

var ECodeSchema = mongoose.Schema({
	// the full eurocode...
	_id: String,

	part: {
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
		variant: String,
	},

	// Array of ecodes of accessories...
	//
	// NOTE: accessories may also have accessories, thus we need to 
	// 		collect them taking into account possible recursion...
	// NOTE: each ecode here must exist.
	accessories: {
		optional: Array,
		recommended: Array,
	}, 
})


// XXX do an 'update' version of this...
// XXX might be good to add missing ecodes instead of complaining...
ECodeSchema.pre('save', function(next){
	var ecodes = this.accessories.optional || []
	ecodes = ecodes.concat(this.accessories.recommended || [])

	ECode.checkECode(ecodes)
		.done(
			function(){ next() },
			function(err){ next(err) })
})


var ECode = 
module.exports = mongoose.model('Ecode', ECodeSchema)


// NOTE: this will return true iff all the ecodes exist only...
// NOTE: if not all given ecodes present, this will return the list of 
// 		missing ecodes.
ECode.checkECode = function(ecode, callback){
	// normalize ecode
	ecode = ecode.constructor != Array ? [ecode] : ecode

	return new Promise(function(resolve, reject){
		ECode
			.find({_id: { $in: ecode }})
			.select('_id')
			.exec()
				// got some or all the ecodes...
				.then(function(data){
					// some ecodes missing...
					if(data.length != ecode.length){
						data = data.map(function(e){ return e._id })
						// keep only the ecodes that are missing...
						ecode = ecode.filter(function(e){ return data.indexOf(e) < 0 })

						var err = new Error('Missing ecodes: ' + ecode)
						err.ecodes = ecodes

						callback && callback(err, ecode)
						reject(err)

					// everything's there...
					} else {
						callback && callback(null, ecode)
						resolve(ecode)
					}
				})
				// something broke...
				.then(null, function(err){
					callback && callback(err)
					reject(err)
				})
		})
} 


// vim:set ts=4 sw=4 nowrap :
