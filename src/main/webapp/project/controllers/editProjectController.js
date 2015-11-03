ords.controller('editProjectController', function ($rootScope, $scope, $location, $routeParams, AuthService, Project, growl, gettextCatalog) {
		
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	$scope.submitNewProject=function(){
	
		if ($scope.projectForm.$valid){
			//
			// Update existing project
			//
			Project.update(
				{id:$scope.project.projectId}, 
				$scope.project,
				function(){
					Project.query({}, function(data){
						$rootScope.projects = data;
					});
					growl.success( gettextCatalog.getString("ProPut200") );
					$location.path("/");
				},
				function(response){
					
					if (response.status === 400){ growl.error(  gettextCatalog.getString("ProPut400") ) };
					if (response.status === 403){ growl.error(  gettextCatalog.getString("Gen403") ) };
					if (response.status === 404){ growl.error(  gettextCatalog.getString("ProPut404") ) };
					if (response.status === 410){ growl.error(  gettextCatalog.getString("Gen410") ) };
					if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };
					
					$location.path("/");
				}
		
			);
		} else {
			growl.error( gettextCatalog.getString("ProPut400"))
		}
	}
});