ords.controller(
	'editProjectController', 
	function ($rootScope, $scope, $http, $location, $routeParams, Project, growl) {
		$scope.submitNewProject=function(){
		
			if ($scope.projectForm.$valid){
				//
				// Update existing project
				//
				Project.update({id:$scope.project.projectId}, $scope.project,
					function(){
						$scope.refresh();
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
	}
);