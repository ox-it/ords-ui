ords.controller('newProjectController', function ($rootScope, $scope, $http, $location, Project, growl) {

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
					growl.success("Project successfully created");
					$location.path("/");
				},
				function(){
					growl.error("There was a problem creating the project");
					$location.path("/");
				}
			);    
		} else {
			growl.error("The project details aren't correct; check you've provided a project name and description.");
		}
	}

});