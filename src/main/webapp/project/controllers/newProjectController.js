ords.controller('newProjectController', function ($rootScope, $scope, $location, Project, AuthService, growl, gettextCatalog) {
	
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();

	//
	// Submit fields in new project form to create a new project
	//
	$scope.submitNewProject=function(){
		if ($scope.projectForm.$valid) {
			Project.save(
			    $scope.project,
				function(){
					Project.query({}, function(data){
						$rootScope.projects = data;
					});
					growl.success(  gettextCatalog.getString("ProPost201") );
					$location.path("/projects");
				},
				function(response){
					
					if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };
					if (response.status === 400){ growl.error(  gettextCatalog.getString("ProPost400") ) };
					if (response.status === 403){ growl.error(  gettextCatalog.getString("Gen403") ) };
					
					$location.path("/projects");
				}
			);    
		} else {
			growl.error(  gettextCatalog.getString("ProPost400") );
		}
	}

});