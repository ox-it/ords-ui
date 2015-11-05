angular.module( "ords" ).directive(
	'stats', 
	function() {
  	  	return {
    		controller: function($scope, Statistics) {
    			
				if (!$scope.statistics) $scope.statistics = Statistics.get();
				
    		},
    		templateUrl: 'components/stats/stats.html'
  	  	}
	}
);