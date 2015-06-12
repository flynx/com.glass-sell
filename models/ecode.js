var mongoose = require('mongoose')
var Promise = require('promise')


// XXX nedd a two directional translation from string ecode to ecode parts...



// XXX move this to a more logical spot...
var Manufacturer = mongoose.Schema({
	mid: String,
	// manufacturer part of ecode...
	ecode: String,
	titme: String, 
})


var ECodeSchema = mongoose.Schema({
	// the full eurocode...
	_id: String,

	// XXX would be good to generate this automatically...
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

		A: Boolean,
		B: Boolean,
		C: Boolean,
		D: Boolean,
		E: Boolean,
		F: Boolean,
		G: Boolean,
		H: Boolean,
		I: Boolean,
		J: Boolean,
		K: Boolean,
		L: Boolean,
		M: Boolean,
		N: Boolean,
		O: Boolean,
		P: Boolean,
		Q: Boolean,
		R: Boolean,
		S: Boolean,
		T: Boolean,
		U: Boolean,
		V: Boolean,
		W: Boolean,
		X: Boolean,
		Y: Boolean,
		Z: Boolean,

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

	scanCode: String,
	USACode: String,
	XYGCode: String,

	// dict of manufacturer specific codes...
	// Format:
	// 	<manufacturer-name>: <code>
	//
	// NOTE: it could be the case that several makes (Audi, VW) name the
	// 		same item differently in their catalogues...
	carMakerCode: {
	},
})


// XXX do an 'update' version of this...
// XXX might be good to add missing ecodes instead of complaining...
// 		...will need ecode parser for this...
ECodeSchema.pre('save', function(next){
	var ecodes = this.accessories.optional || []
	ecodes = ecodes.concat(this.accessories.recommended || [])

	ECode.checkECode(ecodes)
		.done(
			function(){ next() },
			function(err){ next(err) })
})



// Returns:
// 	{
// 		<ecode>: {
// 			origin: [<ecode>, ...]
// 		},
// 		...
// 	}
//
//
// NOTE: this will skip ecodes that do not have their own doc...
// NOTE: _id of current object is not included in the result unless it 
// 		is referenced in the dependency tree...
// XXX might be good to add origin ecode to each result...
// 		...also if an item is added more than once, it might be logical 
// 		to add count...
// XXX is this a source for race conditions???
// XXX test...
function listAccessories(type){
	return function(){
		var res = {}
		var to_see = {}

		// populate the to_see object...
		(this.accessories[type] ? this.accessories[type].slice() : [])
			.forEach(function(e){ 
				to_see[e] = [this._id]
			})

		return new Promise(function(resolve, reject){
			function _get(){
				// nothing else to see...
				if(Object.keys(to_see).length == 0){
					resolve(res)
				}

				ECode
					.find({_id: { $in: Object.keys(to_see)}})
					.select('_id accessories.' + type)
					.exec()
						// got some or all the ecodes...
						.then(function(data){
							data.forEach(function(e){
								var id = e._id

								// new result...
								if(!(id in res)){
									res[id] = {origin: to_see[id]}

								// add origin(s) to existing result...
								} else {
									res[id].origin = res[id].origin.concat(to_see[id])
								}

								delete to_see[id]

								// add stuff to to_see...
								if(e.accessories[type]){
									e.accessories[type].forEach(function(e){
										// add origin...
										if(e in res){
											res[e].origin.push(id)
										}

										// add source...
										if(e in to_see){
											to_see[e].push(id)
										}

										if(!(e in res) && !(e in to_see)){
											to_see[e] = [id]
										}
									})
								}
							})

							// get next batch...
							_get()
						})
						// something broke...
						.then(null, function(err){
							reject(err)
						})
			}

			_get()
		})
	}
}

ECodeSchema.methods.getOprionalEcodes = listAccessories('optional')
ECodeSchema.methods.getRequiredEcodes = listAccessories('recommended')



var ECode = 
module.exports = 
	mongoose.model('Ecode', ECodeSchema)


//
// NOTE: If some ecodes are missing the error will contain a .ecodes 
// 		field with a list of missing ecodes.
// NOTE: this will return true iff all the ecodes exist only...
// NOTE: if not all given ecodes present, this will return the list of 
// 		missing ecodes.
ECode.checkECode = function(ecode){
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

						reject(err)

					// everything's there...
					} else {
						resolve()
					}
				})
				// something broke...
				.then(null, function(err){
					reject(err)
				})
		})
} 


// XXX
ECode.partsFromString = function(ecode){
}


/* XXX do we need this???
ECode.getFieldValues = function(query){
	return new Promise(function(resolve, reject){
		Car.aggregate()
			.match(query)
			.group({
				_id: null,
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
*/


// vim:set ts=4 sw=4 nowrap :
