//
// Project Resources
//
angular.module('ords').factory('Project', function( $resource ) {
	return $resource('/project-api/project/:id');
});

//
// Project controllers
// 
ords.controller('projectListController', function ($scope, Project) {
	$scope.projects = Project.query();
});

ords.controller('projectController', function ($scope, $routeParams, Project) {
	$scope.project = Project.get({ id: $routeParams.id });
});

ords.controller('newProjectController', function ($scope, $http, $location, Project) {
	
	//
	// Submit fields in new project form to create a new project
	//
    $scope.submitNewProject=function(){
		Project.save($scope.fields,
			function(){
				$scope.$emit("messageEvent","Project successfully created");
				$location.path("/");
			},
			function(){
				$scope.$emit("messageEvent","There was a problem creating the project");
				$location.path("/");
			}
		);    
     }
	
});