

// This will transform a flat CSV into a nested JSON
//
// 	- this expects the first row to define the topology
// 		- dots separate "paths" within the json structure
//
// Example input row 0
// 	[
// 		a, 
// 		b.c, 
// 		b.d, 
// 		c
// 	]
//
// This will output objects of the following format:
// 	{
// 		a: <data>,
// 		b {
// 			c: <data>,
// 			d: <data>,
// 		},
// 		c: <data>,
// 	}
//
//
// NOTE: empty fields in CSV will not be populated.
var csv2json =
exports.csv2json =
function(data){
	var res = []

	// row 0 is col definition...
	var cols = data.splice(0, 1)[0]

	// build json...
	data.forEach(function(e){
		var elem = {}
		cols.forEach(function(col, i){

			// skip empty fields...
			if(e[i] == ''){
				return
			}

			var path = col.split('.')
			var cur = elem

			// get/create the path...
			while(path.length > 1){
				var p = path.splice(0, 1)[0]
				if(cur[p] == null){
					cur[p] = {}
				}
				cur = cur[p]
			}
		
			// write our data...
			cur[path[0]] = e[i]
		})
		res.push(elem)
	})

	return res
}

// vim:set ts=4 sw=4 nowrap :
