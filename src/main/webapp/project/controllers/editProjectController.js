ords.controller('editProjectController', function ($rootScope, $scope, $location, $routeParams, AuthService, Project, growl) {
		
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
			Project.update({id:$scope.project.projectId}, $scope.project,
				function(){
					Project.query({}, function(data){
						$rootScope.projects = data;
					});
					growl.success("Project successfully updated");
					$location.path("/");
				},
				function(){
					growl.error("There was a problem saving your changes to the project");
					$location.path("/");
				}
		
			);
		} else {
			growl.error("The project details aren't correct; check you've provided a project name and description.")
		}
	}
});