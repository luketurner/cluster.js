/*

	k-means clustering algorithm
	Written by Luke Turner

  Implementation of k-means algorithm, including k-means++ starting.
  This IS a stateful implementation that relies on module-level variables,
  which permits the user to execute the k-means iterations at their own pace
  (for instance, if they want to visualize each step).

  Exposes some functions:

  init(inputVars) - initializes module data and gets starting means.

  step() - Steps through the algorithm once, clustering the values
  	and updating the means.

  run(inputVars) - Runs the algorithm to its completion or until the iteration
  	limit (see inputVars information) is reached. This basically just calls 
  	init(inputVars) and step() for you.

  getData() - Lost the reference to the data passed into k-means, but want to look up
  	the indecies in a cluster? This returns A COPY OF the data stored internally.

  getClusters() - Returns the current clusters (list-of-lists).

  getMeans() - Returns the current means (list of objects). Has
  	index-correspondence with clusters.

  getRound() - Returns the current round of the algorithm.

  converged() - Predicate functino indicating if the algorithm has converged.

  inputVars takes the form of an object. This object can have the following properties:
  	"numMeans": The "k" in k-means. Default: 3
	"kmeans++": Boolean indicating whether to use k-means++ init. algorithm. Default: true
	"iterationLimit": Integer indicating a limit if the means take too long to converge. Default: 100
	"data": An array of data objects. Data objects should have a consistent schemawhere each property is a single dimension.
		Dimensions must be numeric. No default.

*/

var _ = require("underscore");

var inputData,means,data,clusters,meansChanged,round;

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

// Initialization using standard selection of random centers.
// This is faster for initialization, but can result in a significantly
// slower convergence than initMeanspp(), as well as very bad error
// on certain data sets.
var initMeans = function initMeans (data, numMeans) {
	return _.times(numMeans, function () {
		return data[_.random(0,data.length - 1)];
	});
};

// Initialization using k-means++ which is somewhat slower,
// but ensures a faster convergence. According to David Arthur
// and Sergei Vassilvitskii, it halves the time until 
// convergence for a typical dataset.
var initMeanspp = function initMeanspp (data, numMeans) {
	var means,i,weights,rand,selectedIndex;
	means = [];
	weights = [];
	// First mean is randomly selected.
	means[0] = data[_.random(0, data.length - 1)];
	for (i=1;i<numMeans;i++) {
		// For remaining means, get a weighted distribution of
		// which data points are furthest from any mean.
		_.each(data, function (datum,index) {
			// Find nearest already-chosen mean.
			// Replace each datum w/the distance to
			// that nearest mean.
			var dist = _.min(_.times(i,
				function (k) {
					return distance(datum,means[k]);
			}));
			// Convert to weighted distribution
			weights[index] = (weights[index - 1] || 0) + Math.pow(dist,2);
		});
		// Select something from the distribution,
		// thereby performing a weighted random selection.
		rand = _.random(0, _.last(weights));
		means[i] = _.find(
			_.zip(weights, data),
			function (elem) { return (rand <= elem[0]); }
		)[1];
	}
	return means;
}

// This is the step wherein each data point is clustered with
// the mean closest to it.
var assignClusters = function assignClusters (data, means) {
	// Instantiate a clusters object. Althoguh we could use the
	// old one, it would involve a lot of checking since the
	// arrays can change size.
	var clusters = [];
	_.times(means.length, function() { clusters.push([]); });
	// For each datum, stick it in a cluster.
	_.each(data, function (datum,index) {
		// Find the cluster to which the datum belongs,
		// that is, the cluster with a mean closest to the datum.
		// Once we find it, add the datum to the cluster.
		var meanid = _.min(_.zip(means, _.range(means.length)),
			function (mean) { return distance(datum,mean[0]); }
		)[1];
		clusters[meanid].push(index);
	});
	return clusters;
};

// After clusters are assigned, we update each mean to be
// the centroid of all objects clustered with it. The original
// mean is not used except to check for convergence.
var updateMeans = function updateMeans (data, oldmeans, clusters) {
	meansChanged = false;
	means = [];
	_.each(clusters, function (cluster, clindex) {
		var len = cluster.length;
		// Set each mean to the centroid of the cluster,
		// calculated by finding the average of every
		// dimension. Thus we "reduce" the cluster to
		// an object by summation, and then divide all
		// of its properties by length.
		means[clindex] = _.reduce(
			cluster,
			function (memo,index) {
				_.each(data[index], function (dval,dkey) {
					memo[dkey] = (memo[dkey] || 0) + (dval / len);
				});
				return memo;
			},
			{}
		);
		// Check if mean has changed in the course of the algorithm.
		// Short-circuiting works here to ensure that as soon as
		// a property in a mean changes, future checking halts.
		meansChanged = (meansChanged || 
			_.any(means[clindex], function (v,k) {
				return (v !== oldmeans[clindex][k]);
			})
		);
	});
	return means;
};


var step = function step () {
	clusters = assignClusters(data, means);
	means = updateMeans(data, means, clusters);
	round++;
};

var init = function init (input) {
	// set module variables.
	inputData = _.defaults(input, {
		"numMeans": 3,
		"kmeans++": true,
		"iterationLimit": 100
	});
	data = inputData.data;
	clusters = [];
	meansChanged = false;
	round = 0;

	// Run intial mean placement.
	if (input["kmeans++"]) {
		means = initMeanspp(data, input.numMeans);
	} else {
		means = initMeans(data, input.numMeans);
	}
};

var run = function run (input) {
	init(input);
	var limit = inputData["iterationLimit"];
	while (meansChanged && round < limit) {
		step();
	}
}

// returns a copy.
var getData = function getData () {
	return _.map(data, function (d) { return _.clone(d); });
}

var getClusters = function getClusters () {
	return _.map(clusters, function (cl) { return _.clone(cl); });
}

var getMeans = function getMeans () {
	return _.map(means, function (m) { return _.clone(m); });
}

var getRound = function getRound () {
	return round;
}

var converged = function converged () {
	return !meansChanged;
}

exports.step = step;
exports.init = init;
exports.run = run;
exports.getData = getData;
exports.getClusters = getClusters;
exports.getMeans = getMeans;
exports.getRound = getRound;
exports.converged = converged;