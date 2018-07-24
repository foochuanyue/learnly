angular.module('learnly.filters', [])

.filter('distance', function () {
  //ES6
	//return function (input =-1) {

  return function (input) {
    if(typeof input=='undefined'){
      input = -1;
    }

		//console.log("Processing "+input);
      if(input == -1){
          return "No Location Given";
      } else if (input >= 1000) {
	        return (input/1000).toFixed(2) + 'km';
	    } else {
	        return input.toFixed(0) + 'm';
	    }
	}
})

//reverse field
//false is ascending, true is descending
.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
})
