'use strict';

ords.controller('projectsController', function ($rootScope, $scope, AuthService, Project, $interval, $location, growl) {
	
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	$scope.delete = function(id){
		Project.delete(
			{id: id},
			function(){
				growl.success("Project deleted");
				$scope.refresh();
			},
			function(){
				growl.error("There was a problem deleting the project");				
			});

	}
	
	$scope.refresh = function(){
		Project.query({}, function(data){
			$rootScope.projects = data;
		});
	};
});