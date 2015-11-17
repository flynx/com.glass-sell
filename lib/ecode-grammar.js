
// Grammar format:
// 	{
// 		// Section...
// 		<section-name>: {
// 			// Skip this section processing...
// 			//
// 			// This is used for library sections that are only used for
// 			// include: directives.
// 			//
// 			// NOTE: sections that do not have the length field are also
// 			//		ignored (see: length: bdirective)
// 			//		The main motivation for this in addition to length: 
// 			//		is to enable the user to include sections with non-null
// 			//		length values but at the same time prevent them from
// 			//		being precessed directly.
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
// 			// Part length (default: null/undefined)
// 			// 
// 			// This can either be a number or a list of numbers.
// 			//
// 			// NOTE: if this is null then the section can be accessed 
// 			//		ONLY via a .next reference and is skipped by the 
// 			//		parser...
// 			// NTOE: if list of lenghts is given then they are matched 
// 			//		longest to shortest, this is similar to skip:.
// 			length: null | <length> | [ <length>, ... ],
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
// 			//
// 			// <code> can be:
// 			//	- literal string (example: 'A', 'ABC')
// 			//	- a stringified regular expression (example: '/[A-Z]X/')
// 			//
// 			// NOTE: if is section is required and a code is found that is
// 			//		not defined then the code will be returned as-is, while
// 			//		if the section is not required and an undefined code is
// 			//		encountered then the current section will be skipped and
// 			//		the next one tested...
// 			// NOTE: for regular expressions the flags are ignored and 'i' is
// 			//		forced.
// 			// NOTE: regular expressions match the whole part, thus it is
// 			//		not needed to write all the patterns including '^' and '$'
// 			//		they are assumed.
//
// 			// Explicit value...
// 			<code>: <code-value>, 
// 			// Alternative values...
// 			<code>: [<code-value>, <code-value>, ...], 
//			// Section...
//			//
//			// This is recursive and has the same structure as this.
// 			<code>: { ... },
// 			...
// 		},
// 		...
// 	}
//
//
// ECode object format:
// 	{
// 		// ecode string representation...
// 		ecode: <str>,
//
// 		<section-name>: [ <code> ] | [ <code>, <code-value> ],
// 		...
//
// 		// the unparsed tail of the ecode...
// 		tail: <str>,
// 	}
//
//
// Reserved field names:
// 	tail
// 	error
// 	ecode
//
//
// ECode class methods:
// 		.fromString(<str>) 
// 			-> <ecode>
//
//
// ECode methods:
// 		Generate a string ecode...
// 		.toString()
// 			-> <str>
//
// 		Iterate trough ecode sections...
// 		.fields(function(<key>, <code>[, <text>]){ .. })
// 			-> <ecode>
// 			NOTE: this will do nothing for ecodes with errors.
// 			NOTE: <text> is passed to the handler only if it is present 
// 				in the grammar.
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
//
//
// Error handling
// 	The parser is designed to work with incomplete/partial grammars and
// 	input ecodes that may not be up to spec. Thus it will do it's best to
// 	parse the input within what is defined by the grammar without errors.
//
// Types of errors:
// 	1) given ecode is too short.
// 		This happens when there a re still required fields not satisfied
// 		but we reached the end of the given ecode.
//
// 		When this error occures the parser stops and returns a result with
// 		a set .error field
//
// 	2) field not defined or defined incorrectly.
// 		This is a non critical error, such fileds are simple returned as-is
// 		in one of two froms:
// 			- in the required or compatible field
// 			- in the .tail
//
//
//
//
// XXX use this to generate db fields...
// 		...ignore manufacturer and model fields...
// XXX explicitly ignore service fields...
// XXX move into a static JSON file...
var ecodeGrammar = {
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

		'/../': 'Other',
	},
	model: {
		title: 'Model',
		length: 2,
		required: true,
	},
	type: {
		title: 'Type',
		length: [1, 2],
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
		'/[FLR]/': {
			title: 'Боковое стекло',
			next: 'side',
		},

		// XXX accessories...
		'/[EHMTS]/': {
			title: 'Аксесуар',
			next: 'accessory',
		},
		'/.[KS]/': {
			title: 'Аксесуар',
			next: 'accessory',
		},
	},

	// the rest of the fields are type dependant...

	windshield: {
		// types: A, B and C
		color: {
			include: 'glass_colors',

			required: true,
		},
		stripColor: {
			required: true,
			title: 'Strip color',
			length: 2,

			BL: 'blue strip',
			BZ: 'bronze strip',
			GN: 'green strip',
			GY: 'gray strip',
			LG: 'light green strip',
			YD: 'dark gray strip',
		},
		feature: {
			include: 'glass_feature',

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
			M: 'датчики дождя/датчики света/датчики влажности',
			N: 'водоотталкивающее покрытие на стекле',
			О: 'датчик тумана',
			Р: 'изменение шелкографии для LDW, night vision. IHC,  LC, TL, sity safety, trafic, VICS',
			R: 'правая половина',
			U: 'HUD дисплей на стекле',
			V: 'VIN-окно',
			W: 'дополнительное оборудование',
			Z: 'инкапсуляция стекла',
		},
		mod: {
			include: 'glass_mod',

			// XXX
		}
	},

	rear: {
		color: {
			include: 'glass_colors',

			required: true,
		},
		bodyType: {
			include: 'body_type',
		},
		doors: {
			required: false,
			length: 1,

			'/[1-9]/': '',
		},
		feature: {
			include: 'glass_feature',

			// XXX
		},
		mod: {
			include: 'glass_mod',

			// XXX
		},
	},

	// XXX
	side: {
		color: {
			include: 'glass_colors',

			required: true,
		},
	},

	// XXX
	accessory: {
	},


	// generic sets...
	body_type: {
		skip: true,

		length: 1,
		required: true,

		// XXX
	},
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
	glass_feature: {
		skip: true,

		title: 'Features',
		length: 1,
		repeats: 26,
		required: false,

		'/[A-Z]/': '',
	},
	glass_mod: {
		skip: true,

		title: 'Modifications',
		length: 2,
		required: false,

		'/[0-9][0-9A-Z]/': '',
	},
}



//---------------------------------------------------------------------
// vim:set ts=4 sw=4 nowrap :
