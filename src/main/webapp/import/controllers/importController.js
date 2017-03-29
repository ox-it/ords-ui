'use strict';


ords.controller('importController', function($scope, $routeParams, $location, Project, User, AuthService, FileUpload, growl, gettextCatalog, sprintf) {
	AuthService.check();

	$scope.project = Project.get({ id: $routeParams.projectId});
	
	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	$scope.loaded = 0;
	$scope.total = 0;
	$scope.max = 100;
	User.get(
		function (response) {
			$scope.maxUpload = response.maximumUploadSize;
		},
		function (error) {
			growl.error(gettextCatalog.getString("Fpp001"));
		}
	);
	
    $scope.uploadFile = function(){
        var file = $scope.myFile;
        
        if ( ($scope.maxUpload * 1000000) < file.size ) {
        	growl.error(sprintf(gettextCatalog.getString("Dat031"),$scope.maxUpload+" MBs"));
        	return;
        }
		var path = "/api/1.0/database/"+$routeParams.projectDatabaseId+"/data/"+$routeParams.server;
        FileUpload.uploadFileToUrl(file, path, $scope.success, $scope.error, $scope.progress );
     };
     
     $scope.success = function(response) {
    	 if ( response.status == 201 ) {
    		 growl.success("Database successfully created");
    		 $location.path('/project/'+$routeParams.projectId+'/'+$routeParams.projectDatabaseId);
    	 }
    	 else if ( response.status == 202 ) {
    		 growl.info(gettextCatalog.getString("Dat015"))
    		 $location.path('/project/'+$routeParams.projectId+'/'+$routeParams.projectDatabaseId);
    	 }
    	 else if (response.status == 403) {
    		 growl.error(gettextCatalog.getString("Gen403"));
    		 $location.path('/project/'+$routeParams.projectId+'/'+$routeParams.projectDatabaseId);
    	 }
    	 else if (response.status == 406) {
    		 growl.error(gettextCatalog.getString("Dat031"));
    		 $location.path('/project/'+$routeParams.projectId+'/'+$routeParams.projectDatabaseId);
    	 }
    	 else {
    		 growl.error(gettextCatalog.getString("Dat023") +" "+theError.statusText);
    	 }
     };
     
     $scope.error = function(theError) {
    	 growl.error(gettextCatalog.getString("Dat023") +" "+theError.statusText);
     };
     
     
     $scope.progress = function(loaded, total) {
    	 $scope.$apply(function() {
    		 if ( loaded > 0 ) $scope.loaded = loaded/1000.0;
        	 if ( total > 0 ) $scope.total = total/1000.0;		 
    	 })
     }
});