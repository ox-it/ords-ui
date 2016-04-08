'use strict';

ords.directive('fileModel', ['$parse', function ($parse) {
    return {
       restrict: 'A',
       link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
          
          element.bind('change', function(){
             scope.$apply(function(){
                modelSetter(scope, element[0].files[0]);
             });
          });
       }
    };
 }]);


ords.service('fileUpload', ['$http', '$location', function ($http, $location) {
    this.uploadFileToUrl = function(file, uploadUrl, projectId, projectDatabaseId){
       var fd = new FormData();
       fd.append('databaseFile', file);
    
       $http.post(uploadUrl, fd, {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
       })
    
       .success(function(){
           $location.path('/project/'+projectId+'/'+projectDatabaseId);
       })
    
       .error(function(){
    	   //$scope.errorMsg = "There was an error uploading the file";
       });
    }
 }]);

ords.controller('importController', ['$scope', '$routeParams', 'Project','fileUpload',function($scope, $routeParams, Project, fileUpload) {
	$scope.project = Project.get({ id: $routeParams.projectId});
	
	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	
    $scope.uploadFile = function(){
        var file = $scope.myFile;
        
        console.log('file is ' );
        console.dir(file);
        
		var path = "/api/1.0/database/"+$routeParams.projectDatabaseId+"/data/"+$routeParams.server;
        fileUpload.uploadFileToUrl(file, path, $routeParams.projectId, $routeParams.projectDatabaseId );
     };

	
}]);