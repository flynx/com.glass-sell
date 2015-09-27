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
	/* XXX do we actually need this?
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
	*/

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


// Grammar format:
// 	{
// 		// Section...
// 		<section-name>: {
// 			skip: <bool>,
//
//
// 			// Metadata...
//
// 			// Section title...
//			//
// 			// NOTE: this is not used for parsing...
// 			title: <str>,
//
// 			// Part length (default: null)
// 			//
// 			// NOTE: if this is null then the section can be accessed 
// 			//		ONLY via a .next reference and is skipped by the 
// 			//		parser...
// 			length: <length>,
//
// 			// The section repetition (default: 1)
// 			// Sets the number of occurrences of the section.
// 			//
// 			// NOTE: if the section is not required this essentially 
// 			//		means 0 to n, while if it is required this is exact.
// 			repeat: <limit>,
//
// 			// Field is required (default: true)
// 			required: <bool>,
//
// 			// Section reference, indicates the section name to used for
// 			// parsing after this section is done...
// 			//
// 			// Setting this to 'root' will explicitly continue at the root
// 			// section.
// 			//
// 			// Setting this to 'stop' will stop parsing when the current
// 			// section is done.
// 			//
// 			// NOTE: this will search for the section name in the current
// 			//		context/section and if one is not defined then in grammar
// 			//		root.
// 			// NOTE: setting 'root' will start from root top.
// 			next: <section-name> | 'root' | 'stop',
//
// 			// A section to include in the current....
// 			//
// 			// NOTE: attributes in the current section will overload the
// 			//		included attrs.
// 			include: <section-name>,
//
//
// 			// Parsing data...
// 			// NOTE: if is section is required and a code is found that is
// 			//		not defined then the code will be returned as-is, while
// 			//		if the section is not required and an undefined code is
// 			//		encountered then the current section will be skipped and
// 			//		the next one tested...
//
// 			// Explicit value...
// 			<code>: <code-value>, 
// 			// Alternative values...
// 			<code>: [<code-value>, <code-value>, ...], 
//			// Section...
// 			<code>: { ... },
// 			...
// 		},
// 		...
// 	}
//
// ECode object format:
// 	{
// 		<section-name>: <code-value>,
// 		...
//
// 		// the unparsed tail of the ecode...
// 		tail: <str>,
// 	}
//
// Reserved field names:
// 	tail
// 	error
//
//
// ecode -> object:
// 	- strip the ecode section by section assigning the code <value> to
// 		<section-name>
//
// object -> ecode:
// 	- go through grammar, picking <section-name>s from object finding
// 		appropriate codes for object <values> (build a reverse index)
// 	- join the codes.
//
// XXX use this to generate db fields...
// 		...ignore manufacturer and model fields...
// XXX move into a static JSON file...
var ecodeFormat = {
	manufacturer: {
		title: 'Manufacturer',
		length: 2,
		required: true,

		20: 'Alfa Romeo',
		21: 'Aston Martin',
		22: ['Austin', 'MG', 'Morris', 'Triumph'],
		24: 'BMW',
		25: 'Bedford',
		27: 'Citroen',
		29: 'Daihatsu',
		30: ['Chevrolet', 'Daewoo', 'SangYong'],
		31: 'Ferrari',
		33: 'Fiat Cars Van',
		35: 'Ford',
		37: ['Fiat', 'Ford Trucks', 'Iveco'],
		39: 'Honda',
		40: 'Honda',
		41: 'Hyundai',
		43: ['Daimler', 'Jaguar'],
		44: 'Kia',
		47: 'Lancia',
		49: 'Man Trucks',
		51: 'Mazda',
		53: ['Mercedes', 'Smart'],
		54: 'MB Trucks',
		56: ['Fuso', 'Mitsubishi'],
		59: ['Infiniti', 'Nissan'],
		60: 'Nissan',
		62: ['Holden', 'Isuzu', 'Opel', 'Vauxhall'],
		63: ['Holden', 'Isuzu', 'Opel', 'Vauxhall'],
		65: ['Chrysler', 'Peugeot', 'Talbot'],
		67: 'Porsche',
		68: 'Proton',
		69: ['Bentley', 'Rolls Royce'],
		70: ['Austin', 'Land Rover', 'Range Rover', 'Rover'],
		72: ['Dacia', 'Renault'],
		74: 'Saab',
		75: 'Scania',
		76: 'Seat',
		78: 'Skoda',
		79: 'Subaru',
		80: ['Holden', 'Suzuki'],
		82: ['Lexus', 'Toyota'],
		83: ['Lexus', 'Toyota'],
		85: ['Audi', 'Volkswagen'],
		88: ['Volvo', 'Volvo Trucks'],
	},
	// XXX get models from reverse engineering catalog erocodes...
	model: {
		title: 'Model',
		length: 2,
		required: true,
	},
	// glass type...
	type: {
		title: 'Type',
		length: 1,
		required: true,

		// windshield...
		A: {
			title: 'Ветровое стекло',
			next: 'windshield',
		},
		C: {
			title: 'Альтернативное ветровое стекло',
			next: 'windshield',
		},
		D: {
			title: 'Ветровое стекло в сборе',
			next: 'windshield',
		},

		// XXX rear windows...
		B: {
			title: 'Задние стекло',
			next: 'rear',
		},

		// XXX side windows...
		F: {
			title: 'Боковое стекло',
			next: 'side',
		},
		L: {
			title: 'Боковое стекло',
			next: 'side',
		},
		R: {
			title: 'Боковое стекло',
			next: 'side',
		},

		// XXX accessories...
		D: {
			title: 'Аксесуар',
			next: 'accessory',
		},
		E: {
			title: 'Аксесуар',
			next: 'accessory',
		},
		H: {
			title: 'Аксесуар',
			next: 'accessory',
		},
		M: {
			title: 'Аксесуар',
			next: 'accessory',
		},
		T: {
			title: 'Аксесуар',
			next: 'accessory',
		},
		S: {
			title: 'Аксесуар',
			next: 'accessory',
		},
	},

	// the rest of the fields are type dependant...
	// XXX need a way to syntactically group these...


	// XXX do we have to indicate that this is a group??
	// XXX is the color set common and if so, can we split it out into a gneric section?
	windshield: {
		// types: A, B and C
		color: {
			required: true,
			include: 'glass_colors',
		},
		stripColor: {
			required: true,
			title: 'Strip color',
			length: 2,

			BL: 'blue',
			BZ: 'bronze',
			GN: 'green',
			GY: 'gray',
			LG: 'light green',
			YD: 'dark gray',
		},
		features: {
			title: 'Features',
			length: 1,
			repeats: 4,
			required: false,

			A: 'антенна',
			В: 'правый руль RHD',
			С: 'крепление для LDW, night vision. IHC,  LC, TL, sity safety, trafic, VICS',
			E: 'система обмена сообщениями об авариях',
			G: 'GPS навигация',
			H: 'с обогревом',
			I: 'другой тип оборудования на стекле, не использующийся в основном процессе',
			J: 'ТВ антенна',
			К: 'отопление работающее через покрытие на стекле',
			L: 'левая половина',
			М: 'датчики дождя/датчики света/датчики влажности',
			N: 'водоотталкивающее покрытие на стекле',
			О: 'датчик тумана',
			Р: 'изменение шелкографии для LDW, night vision. IHC,  LC, TL, sity safety, trafic, VICS',
			R: 'правая половина',
			U: 'HUD дисплей на стекле',
			V: 'VIN-окно',
			W: 'дополнительное оборудование',
			Z: 'инкапсуляция стекла',
		},
		// XXX is there a list???
		// XXX how can we identify this???
		// 		...does this allways start with a number?
		mod: {
			title: 'Modifications',
			length: 2,
			required: false,
		}
	},

	rear: {
		color: {
			required: true,
			include: 'glass_colors',
		},
		bodyType: {
			length: 1,
			required: true,

			// XXX
		},
		doors: {
			length: 1,
			required: false,

			// XXX number...
		},
		features: {
			title: 'Features',
			length: 1,
			repeats: 4,
			required: false,

			// XXX
		},
		mod: {
			title: 'Modifications',
			length: 2,
			required: false,

			// XXX
		},
	},

	side: {
		color: {
			required: true,
			include: 'glass_colors',
		},
	},

	accessory: {
	},


	// generic sets...
	glass_colors: {
		skip: true,

		title: 'Color',
		length: 2,

		AB: 'прозрачный цвет стекла, противоударное (5 слоев)',
		AC: 'противоударное стекло (2-х слойное + несколько слоев PVB)',
		AF: 'пулезащищенное стекло (2-х слойное + 1 слой поликарбоната)',
		AG: 'противоударное зеленое стекло (5 слоев)',
		AP: 'скрытое/security стекло (5 слоев)',
		AS: 'прозрачный цвет стекла, противоударное (3 слоя)',
		BA: 'синий цвет стекла c акустикой ',
		BB: 'синий цвет стекла c шумопоглощением IR, UV',
		BL: 'синий цвет стекла ',
		BS: 'синий цвет стекла с антибликовым напылением от солнца',
		BZ: 'бронзовый цвет стекла',
		CA: 'прозрачный цвет стекла c акустикой',
		CB: 'прозрачный цвет стекла c шумопоглощением IR, UV',
		CC: 'прозрачный цвет стекла с теплоотражающим покрытием',
		CD: 'прозрачный цвет стекла c теплоотражающим покрытием и с акустикой',
		CH: 'стекло с покрытием с высоким тепловым светоотражающим эффектом',
		CK: 'стекло с покрытием, тепло/светоотражающим эффектом и с акустикой',
		CL: 'прозрачный цвет стекла',
		GA: 'зеленый цвет стекла c акустикой',
		GB: 'зеленый цвет стекла c шумопоглощением IR, UV',
		GC: 'зеленый цвет стекла c шумопоглощением IR, UV и с акустикой',
		GN: 'зеленый цвет стекла ',
		GS: 'зеленый цвет стекла с антибликовым напылением от солнца',
		GY: 'серый цвет стекла ',
		LG: 'светло-зеленый цвет стекла (Japan) ',
		YA: 'серый цвет стекла c акустикой',
		YC: 'серый цвет стекла c покрытием',
	},
}

// XXX test...
var ecode2obj = function(ecode, grammar, res){
	var pos = 0
	res = res || {ecode: ecode}
	grammar = grammar || ecodeFormat
	var root = grammar
	var next = null

	for(var k in grammar){
		var part = grammar[k]

		if(part.include){
			// XXX is this too optimistic???
			part.__proto__ = grammar[part.include] 
				|| root[part.include] 
				|| part.__proto__
		}

		var len = part.length

		// skip sections...
		if(len == null || (part.hasOwnProperty('skip') && part.skip == true)){
			continue
		}

		var repeat = part.repeats || 1
		var required = part.required || true

		var vals = []
		while(repeat > 0){
			repeat -= 1

			var e = ecode.slice(pos, pos+len)

			// ecode is too short at a required field...
			if(required && e.length < len){
				return {
					error:'ECode too short: required field missing or incomplete.',
					failed: k,
					rule: part,
					at: e,

					vals: vals,
					partial: res,
					tail: ecode.slice(pos),
				}
			}

			var val = part[e]

			// not defined...
			if(val == null){
				// if required push...
				if(required 
						// if not required but matches a given pattern then push...
						|| (part.pattern && RegExp(part.pattern).test(e))){
					vals.push(e)

				// break out on first non-match...
				} else {
					break
				}

			// simple string value...
			} else if(typeof(val) == typeof('str')){
				vals.push(val)

			// alternatives...
			} else if(val.constructor === Array){
				vals.push(val)

			// object...
			} else {
				vals.push( val.title || e)

				if(val.next){
					next = val.next
				}
			}

			// shift to next position...
			pos += len
		}
		vals = vals.filter(function(e){ return e != null })

		if(vals.length == 0 && !required){
			continue
		}

		res[k] = part.repeats == null ? vals[0] : vals

		// recur into next section...
		if(next != null){
			if(next == 'stop'){
				break
			}

			if(next == 'root'){
				next = root

			} else {
				next = grammar[next] || root[next]
			}

			res = ecode2obj(ecode.slice(pos), next, res)

			if(res.error != null){
				return res
			}

			// prepare to continue...
			ecode = res.tail
			pos = 0
			next = null
		}
	}

	res.tail = ecode.slice(pos) 
	return res
}

var obj2ecode = function(ecode){
	var res = ''

	// XXX
	
	return res
}

// get all the top level fields and go down the .next sections only for 
// existing and matching elements...
//
// XXX ignore all fields up-to type...
var ecodeFields = function(query){
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
