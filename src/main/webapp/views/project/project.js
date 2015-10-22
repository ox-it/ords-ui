//
// Project controllers
// 
    ords.controller('projectListController', function ($scope, $http) {
  	  $http.get('/project-api/project').success(function(data) {
  	    $scope.projects = data;
  	  });
    });
	
    ords.controller('projectController', function ($scope, $routeParams, $http) {
	  $scope.param = $routeParams.param;
  	  $http.get('/project-api/project/'+$scope.param).success(function(data) {
  	    $scope.project = data;
  	  });
    });
	
    ords.controller('newProjectController', function ($scope, $http, $location) {
		
		//
		// Submit fields in new project form to create a new project
		//
	    $scope.submitNewProject=function(){
			var data=$scope.fields;  
			$http.post("/project-api/project", data).success(
				 function(){
					 $scope.$emit("messageEvent","Project successfully created");
				 	 $location.path("/");
				 }
			);        
	     }
		
    });