//---------------------------------------------------------------------

// XXX this depends on ecodeGrammar being loaded...
// XXX need to explicitly skip matching service fields...
// XXX add a service field to indicate an include file, something like:
// 			include_file: <path-to-file>.<format>
// 		This will require:
// 			- format adapters (conversion, filtering and error handling)
// 			- path handling...
// 		Might also be good to move the config to system config...
var ECodeClassPrototype = {
	__grammar__: ecodeGrammar,
	__service_fields__: [
		'title',

		'skip',
		'length',
		'repeats',
		'required',
		'match_required',
		'next',
		'include',
	],

	// NOTE: this handles .include in a very optimistic fashion this may
	// 		fail on complex includes...
	// XXX find a better name...
	iterECode: function(ecode, callback, grammar, res, root){
		var pos = 0
		res = res || {}
		grammar = grammar 
			|| res.__grammar__ 
			|| this.__grammar__ 
		var root = root || grammar
		var next = null
		var that = this

		for(var k in grammar){
			var part = grammar[k]

			// handle .include...
			// XXX is this too optimistic???
			if(part.include){
				part.__proto__ = grammar[part.include] 
					|| root[part.include] 
					|| part.__proto__
			}

			var len = part.length

			// skip sections...
			if(ECode.__service_fields__.indexOf(k) >= 0 
					|| len == null 
					|| (part.hasOwnProperty('skip') && part.skip == true)){
				continue
			}

			len = len.constructor !== Array ? [len] : len.sort().reverse()

			var repeat = part.repeats || 1
			var required = part.required == null ? true : part.required
			// if .match_required is true then the field is implicitly
			// required...
			required = part.match_required == true ? true : required

			// cache the patterns for use in _match...
			var patterns = {}
			for(var p in part){
				// test if pattern is a regexp...
				if(/^(\/).*\1$/.test(p)){
					patterns[p] = RegExp('^'+p.split(/\//g)[1]+'$', 'i')
				}
			}
			// XXX need to skip service fields...
			var _match = function(str){
				// normal field...
				for(var p in patterns){
					// test if pattern is a regexp...
					if(patterns[p].test(str)){
						return p
					}
				}
				return null
			}

			var vals = []
			while(repeat > 0){
				repeat -= 1

				// the matched key...
				var r
				// the ecode part...
				var e 

				var l, val

				// match one of the lengths...
				// XXX need to skip service fields...
				for(var i = 0; i<len.length; i++){
					l = len[i]
					r = e = ecode.slice(pos, pos+l)

					// direct match...
					if(part[e] != null){
						break
					}

					r = _match(e)
					// we got a pattern match...
					if(r != null){
						break
					}
				}

				// ecode is too short at a required field...
				if(required && e.length < l){
					return {
						error:'ECode too short: required '
							+(part.match_required ? 'and match_required ' : '')
							+'field missing or incomplete.',
						failed: k,
						at: pos,

						vals: vals,
						tail: ecode.slice(pos),
					}
				}

				var val = part[r]

				// no explicit value defined...
				if(val == null){
					// a match was required...
					if(part.match_required){
						return {
							error: 'ECode '+k+' match required.',
							failed: k,
							at: pos,
							code: e,

							vals: vals,
							tail: ecode.slice(pos),
						}

					// if a required field...
					} else if(required){
						vals.push([e])

					// break out on first non-match...
					} else {
						break
					}

				// simple string value...
				} else if(typeof(val) == typeof('str')){
					vals.push([e, val])

				// alternatives...
				} else if(val.constructor === Array){
					vals.push([e, val])

				// object...
				} else {
					vals.push( val.title ? [e, val.title] : [e] )

					if(val.next){
						next = val.next
					}
				}

				// shift to next position...
				pos += l
			}
			vals = vals.filter(function(e){ return e != null })

			if(vals.length == 0 && !required){
				continue
			}

			if(callback){
				part.repeats == null ?
					// NOTE: we do not need to resolve part.include here 
					// 		as it already set as part.__proto__
					// single result...
					callback(vals[0][0], k, vals[0][1], part)
					// repeat...
					: vals.forEach(function(e){
						callback(e[0], k, e[1], part)
					})
			}

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

				res = ECode.iterECode(ecode.slice(pos), callback, next, res, root)

				if(res.error != null){
					return res
				}

				// prepare to continue...
				ecode = res.tail
				pos = 0
				next = null
			}
		}

		if(ecode && ecode.slice(pos).length != 0){
			res.tail = ecode.slice(pos) 
		}

		return res
	},
	fromString: function(ecode, grammar){
		var e = new ECode({ecode: ecode})

		var res = this.iterECode(ecode, function(value, key, text){
			if(key in e){
				// repack for repeating values...
				if(typeof(e[key][0]) == typeof('str')){
					e[key] = [e[key]]
				}

				e[key].push([value, text])
			} else {
				e[key] = [value, text]
			}
		}, grammar)

		if(res.tail){
			e.tail = res.tail
		}

		if(res.error){
			res.partial = e
			return res
		}

		return e
	},
	// XXX need to group by actual object and not it's title...
	// XXX this uses the same logic as the code in .iterECode(..) need 
	// 		to reuse the code...
	getEcodeFields: function(ecode, grammar, root, res){
		ecode = ecode || {}
		res = res || {}
		grammar = grammar || this.__grammar__
		root = root || grammar

		for(var k in grammar){
			var part = grammar[k] 
			var val = ecode[k]

			// handle include...
			if(part.include){
				part.__proto__ = grammar[part.include] 
					|| root[part.include] 
					|| part.__proto__
			}

			// skip fields...
			if(ECode.__service_fields__.indexOf(k) >= 0 
					|| part.length == null
					|| (part.hasOwnProperty('skip') && part.skip == true)){
				continue
			}

			// build value list...
			// XXX need to group by actual object and not it's title...
			var keys = {}
			for(var n in part){
				if(ECode.__service_fields__.indexOf(n) < 0){
					var t = part[n].title || part[n]
					if(!(t in keys)){
						keys[t] = []
					}
					keys[t].push(n)
				} 
			}

			res[k] = keys

			// get the next value...
			// XXX this is the same as the code in .iterECode(..) need to reuse...
			if(val != null){
				var next
				if(val in part){
					next = part[val].next

				} else {
					for(var p in part){
						// test if pattern is a regexp...
						if(/^(\/).*\1$/.test(p) 
								// match the pattern...
								&& RegExp('^'+p.split(/\//g)[1]+'$', 'i').test(val)){
							next = part[p].next
							break
						}
					}
				}

				next && this.getEcodeFields(ecode, grammar[next] || root[next], root, res)
			}
		}

		return res
	}
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
