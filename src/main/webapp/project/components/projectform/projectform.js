angular.module( "ords" ).directive(
	'projectform', 
	function() {
  	  	return {
    		controller: 'projectFormController',
    		templateUrl: 'project/components/projectform/projectform.html'
  	  	}
	}
);

ords.controller('projectFormController', function ($rootScope, $scope, $http, $location, $routeParams, Project, growl, gettextCatalog) {
	
	if ($routeParams.id){
		$scope.project = Project.get({ id: $routeParams.id },
			
			function(){
                //
                // Convert the date strings in the Project model into actual Date objects
                //
                $scope.project.startDate = new Date( Date.parse($scope.project.startDate) );
                $scope.project.endDate = new Date ( Date.parse($scope.project.endDate) );
			},
			
			function(response){
				
				if (response.status === 400){ growl.error(  gettextCatalog.getString("ProGet400") ) };
				if (response.status === 403){ growl.error(  gettextCatalog.getString("Gen403") ) };
				if (response.status === 404){ growl.error(  gettextCatalog.getString("ProGet404") ) };
				if (response.status === 410){ growl.error(  gettextCatalog.getString("Gen410") ) };
				if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };	
			}
		
		);
	} else {
		$scope.project = undefined;
	}
});