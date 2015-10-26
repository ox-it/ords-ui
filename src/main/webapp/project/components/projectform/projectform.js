angular.module( "ords" ).directive(
	'projectform', 
	function() {
  	  	return {
    		controller: 'projectFormController',
    		templateUrl: 'components/projectform/projectform.html'
  	  	}
	}
);

ords.controller('projectFormController', function ($rootScope, $scope, $http, $location, $routeParams, Project, growl) {
	
	if ($routeParams.id){
		$scope.project = Project.get({ id: $routeParams.id });
	} else {
		$scope.project = undefined;
	}
});