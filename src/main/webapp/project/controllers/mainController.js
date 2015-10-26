'use strict';

ords.controller('mainController', function ($rootScope, $scope, $routeParams, Project, $interval) {
		
		$scope.refresh = function(){
			Project.query({}, function(data){
				$rootScope.projects = data;
			});
		}
		
		var autoUpdate = $interval($scope.refresh, 10000);

		// Cancel interval on page changes
		$scope.$on('$destroy', function(){
		    if (angular.isDefined(autoUpdate)) {
		        $interval.cancel(autoUpdate);
		        autoUpdate = undefined;
		    }
		});
	}
)
