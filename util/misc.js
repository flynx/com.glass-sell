

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
// Empty fields will be skipped unless fill is given, then they will be 
// set with fill value.
var csv2json =
exports.csv2json =
function(data, fill){
	var res = []

	// row 0 is col definition...
	var cols = data.splice(0, 1)[0]

	// build json...
	data.forEach(function(e){
		var elem = {}
		cols.forEach(function(col, i){
			var val = (e[i] == null || e[i] == '') ? fill : e[i]

			// skip empty fields...
			if(val == null){
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
			cur[path[0]] = val
		})
		res.push(elem)
	})

	return res
}

// vim:set ts=4 sw=4 nowrap :
