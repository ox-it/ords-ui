'use strict';

ords.controller('projectsController', function ($rootScope, $scope, AuthService, Project, $interval, $location) {
	
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
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
});