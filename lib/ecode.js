
//---------------------------------------------------------------------

// XXX this depends on ecodeGrammar being loaded...
var ECodeClassPrototype = {
	__grammar__: ecodeGrammar,

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

					var r = _match(e)
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
						rule: part,
						match: r,
						at: e,

						vals: vals,
						partial: res,
						tail: ecode.slice(pos),
					}
				}

				var val = part[r]

				// no explicit value defined...
				if(val == null){
					// a match was required...
					if(part.match_required){
						return {
							error: 'ECode part match required.',
							failed: k,
							rule: part,
							match: r,
							at: e,

							vals: vals,
							partial: res,
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
// XXX ecode fields generator...




//---------------------------------------------------------------------
// vim:set ts=4 sw=4 nowrap :
