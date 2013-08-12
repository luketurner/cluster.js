/*

	DBSCAN clustering algorithm
	Written by Luke Turner

  DBSCAN is a viable clustering algorithm for relatively
  low-dimensional data sets. It works basically by clustering
  points based on density, that is, points which are "densely connected,"
  i.e. within a specified distance from each other, are considered part
  of a cluster. 

*/

var _ = require("underscore");
var util = require("../util.js");

// TODO log(n) indexed version
var neighborhood = function (metadata,pt,i,eps) {
	var neigh = [];
	_.each(metadata, function (tpt,ti) {
		// If the comparison has already been made the "other way",
		// use that. Otherwise, we'll do it ourselves.
		(tpt.neighbors[i] === false) && return;
		if (tpt.neighbors[i] === true || ti === i) { 
			neigh.push(ti);
			return;
		}
		// Do it ourselves.
		var dist = util.distance(pt.obj,tpt.obj);
		if (dist < eps) {
			pt.neighbors[ti] = true;
			neigh.push(ti);
		} else {
			pt.neighbors[ti] = false;
		}
	});
	return neigh;
};

var expandCluster = function expandCluster (metadata, cluster, pt, i, neigh, minPts, eps) {
	_.each(neigh, function (ni) {
		var npt = metadata[ni];
		if (!npt.cluster) { npt.cluster = cluster; }
		if (!npt.visited) {
			npt.visited = true;
			console.log(npt);
			var nptNeigh = neighborhood(metadata, npt, ni, eps);
			if (nptNeigh.length > minPts) {
				// expand the cluster!
				expandCluster(metadata, cluster, pt, i, _.union(neigh, nptNeigh), minPts, eps);
			}
		}
	});
};

var run = function run (data, eps, minPoints) {
	var cluster = 0;
	var metadata = _.map(data, function (obj,index) {
		return {"visited": false, "neighbors": [], 'cluster': false, "obj": obj};
	});
	_.each(
		_.where(metadata, { "visited": false }),
		function (pt,i) {
			pt.visited = true;
			var neigh = neighborhood(metadata, pt, i, eps);
			if (neigh.length < minPoints) {
				pt.cluster = 'N'; // set as noise. This may be overwritten later.
			} else {
				cluster++;
				expandCluster(metadata, cluster, pt, i, neigh, minPoints, eps);
			}
		}
	);
	return metadata;
};

exports.run = run;