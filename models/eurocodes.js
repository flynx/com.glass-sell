
var fs = require('fs') 
var mongoose = require('mongoose')
var csv = require('csv')

var csv2json = require('../util/misc').csv2json


// XXX usr .distinct(<field>) to build a completion index...
// XXX infer codes from redundant values...
// 		example:
// 			car.manufacturer <=> euroCode.manufacturer


function loadConfig(path){
	var res = {}
	// XXX this needs to block the app until it's done...
	var data = res.fields = JSON.parse(fs.readFileSync(path, {encoding: 'utf-8'}))
		
	// completion...
	res.complete = []
	for(var e in data){
		if(data[e].trim().toLowerCase() == 'c'){
			res.complete.push(e)
		}
	}

	// data model...
	var cols = [Object.keys(data), []]

	res.schema = csv2json(cols, String)

	return res
}


var config = loadConfig('config/db-col-format.json')


var EuroCodeSchema = mongoose.Schema(config.schema)


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
	// XXX can we reuse a query like this???
	config.complete.forEach(function(n){
		query.distinct(n, function(err, lst){
			// XXX check for errors...
			if(err){
				return callback(err)
			}
		
			res[n] = lst

			// res is full, we can return it...
			if(Object.keys(res).length == complete_fields.length){
				callback(err, res)
			}
		})
	})
}


// create the model for users and expose it to our app
var EuroCode =
module.exports = mongoose.model('EuroCode', EuroCodeSchema)

// XXX do we need to split the data to chunks here???
// XXX use id as primary key...
EuroCode.batchLoadCSV = function(data, callback){
	csv.parse(data, {
			delimiter: ';',
		}, 
		function(err, data){
			if(err){
				return callback(err)
			}

			var res = csv2json(data)

			// populate...
			EuroCode.collection.insert(res, function(err, data){
				callback(err, data)
			})
			/*
			EuroCode.create(res)
				// XXX do error handling...
				// XXX
				.then(function(data){
					// XXX for some reason this does not populate...
					callback(null, data)
				})
				*/
		})
}



/*
EuroCode.batchLoadCSV(fs.readFileSync('data/ecode-data.csv', {encoding: 'utf-8'}), 
		function(e, d){
			console.log('###', e, d)
		})
*/




// vim:set ts=4 sw=4 nowrap :
