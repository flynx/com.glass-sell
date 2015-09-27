
var Promise = require('promise')


var makeUniqueFieldLister =
exports.makeUniqueFieldLister = function(obj, fields, group){
	group = group || {}
	if(!('_id' in group)){
		group._id = null
	}

	// populate the fields...
	fields.forEach(function(e){
		group[e] = { $addToSet: '$'+e }
	})

	return function(query){
		return new Promise(function(resolve, reject){
			obj.aggregate()
				.match(query || {})
				.group(group)
					.exec()
						.then(function(data){
							delete data[0]._id
							// XXX should this be transformed to something????
							resolve(data[0])	
						})
						.then(null, function(err){
							reject(err)
						})
		})
	}
}


// vim:set ts=4 sw=4 nowrap :
