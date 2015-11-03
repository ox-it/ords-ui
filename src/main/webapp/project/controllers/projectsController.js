'use strict';

ords.controller('projectsController', function ($rootScope, $scope, AuthService, Project, $interval, $location, growl, gettextCatalog) {
	
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
				growl.success( gettextCatalog.getString("ProDelete200") );
				growl.success("Project deleted");
				$scope.refresh();
			},
			function(response){
				if (response.status === 400){ growl.error(  gettextCatalog.getString("ProDelete400") ) };
				if (response.status === 403){ growl.error(  gettextCatalog.getString("Gen403") ) };
				if (response.status === 404){ growl.error(  gettextCatalog.getString("ProDelete400") ) };
				if (response.status === 410){ growl.error(  gettextCatalog.getString("ProDelete410") ) };
				if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };				
			});

	}
	
	$scope.refresh = function(){
		Project.query({}, function(data){
			$rootScope.projects = data;
		});
	};
});