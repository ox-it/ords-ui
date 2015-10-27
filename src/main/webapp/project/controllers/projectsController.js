'use strict';

ords.controller('projectsController', function ($rootScope, $scope, Project, $interval) {
		
		$scope.refresh = function(){
			Project.query({}, function(data){
				$rootScope.projects = data;
			});
		};
		
		var autoUpdate = $interval($scope.refresh, 10000);

		// Cancel interval on page changes
		$scope.$on('$destroy', function(){
		    if (angular.isDefined(autoUpdate)) {
		        $interval.cancel(autoUpdate);
		        autoUpdate = undefined;
		    }
		});
	}
);