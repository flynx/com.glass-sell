
// Grammar format:
// 	{
// 		// Section...
// 		<section-name>: {
// 			// XXX
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
			repeats: 26,
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
			repeats: 26,
			required: false,

			// XXX
			A: '???',
			B: '???',
			C: '???',
			D: '???',
			E: '???',
			F: '???',
			G: '???',
			I: '???',
			J: '???',
			K: '???',
			L: '???',
			M: '???',
			N: '???',
			O: '???',
			P: '???',
			Q: '???',
			R: '???',
			S: '???',
			T: '???',
			U: '???',
			V: '???',
			W: '???',
			X: '???',
			Y: '???',
			Z: '???',
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



//---------------------------------------------------------------------
// XXX experimental...

var ECodeClassPrototype = {
	__grammar__: ecodeFormat,

	fromString: function(ecode, grammar, res, root){
		var pos = 0
		res = res || new ECode({ecode: ecode})
		grammar = grammar 
			|| res.__grammar__ 
			|| this.__grammar__ 
		var root = root || grammar
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
			var required = part.required == null ? true : part.required

			//console.log('>>>', k)

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
						//vals.push(e)
						vals.push([e])

					// break out on first non-match...
					} else {
						break
					}

				// simple string value...
				} else if(typeof(val) == typeof('str')){
					//vals.push(val)
					vals.push([e, val])

				// alternatives...
				} else if(val.constructor === Array){
					//vals.push(val)
					vals.push([e, val])

				// object...
				} else {
					//vals.push( val.title || e )
					vals.push( val.title ? [e, val.title] : [e] )

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

				res = ECode.fromString(ecode.slice(pos), next, res, root)

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
	},
}

var ECodePrototype = {
	//__grammar__: ecodeFormat,

	fields: function(handler){
		// report a parse error...
		if(this.error){
			// XXX

		// show the parsed result...
		} else {
			for(var k in this){
				if(k == 'ecode'){
					continue
				}
				var val = this[k]

				if(val == null || val.length == 0 || typeof(val) == typeof(function(){})){
					continue
				}
				val = val[0].constructor === Array ? val : [val]

				val.forEach(function(val){
					if(val.constructor === Array){
						handler(k, val[0], val[1])

					} else {
						handler(k, val)
					}
				})
			}
		}

		return this
	},
	toString: function(){
		var res = ''

		this.fields(function(_, val){
			res += val
		})

		return res
	},
}

var ECode = function(ecode){
	if(typeof(ecode) == typeof('str')){
		return ECode.fromString(ecode)

	// also need to check if new is used...
	} else if(ecode){
		for(var k in ecode){
			this[k] = ecode[k]
		}
		return this
	}
}
ECode.__proto__ = ECodeClassPrototype
ECode.prototype = ECodePrototype
ECode.constructor = ECode



//---------------------------------------------------------------------
// vim:set ts=4 sw=4 nowrap :
