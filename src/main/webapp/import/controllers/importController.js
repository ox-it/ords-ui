'use strict';


ords.controller('importController', ['$scope', '$routeParams','$location', 'Project','FileUpload', 'growl', function($scope, $routeParams, $location, Project, FileUpload, growl) {
	$scope.project = Project.get({ id: $routeParams.projectId});
	
	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	
    $scope.uploadFile = function(){
        var file = $scope.myFile;
        
        console.log('file is ' );
        console.dir(file);
        
		var path = "/api/1.0/database/"+$routeParams.projectDatabaseId+"/data/"+$routeParams.server;
        FileUpload.uploadFileToUrl(file, path, $scope.success, $scope.error );
     };
     
     $scope.success = function() {
    	 $location.path('/project/'+$routeParams.projectId+'/'+$routeParams.projectDatabaseId);
     };
     
     $scope.error = function(theError) {
    	 growl.error("There was an error upload in the database." +theError.statusText);
     }
}]);