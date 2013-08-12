var _ = require("underscore");

// Calculates the Euclidian distance between two objects.
// TODO If necessary, add optimization for single-dimension case.
var distance = function distance (obj1, obj2) {
	return Math.sqrt(_.reduce(
		obj1,
		function (dist,val,key) {
			return (dist + Math.pow(obj2[key] - val, 2));
		}, 
		0
	));
};

exports.distance = distance;