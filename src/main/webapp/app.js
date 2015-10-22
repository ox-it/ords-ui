'use strict';

var ords = angular.module('ords',[]);
	
    ords.controller('mainController', function ($scope, $http, $window) {
		//
		// If we're logged in, then redirect to the project app
		//		
    	  $http.get('/api/1.0/user').then(
			 function successCallback(response) { 
				 $window.location.href = "/project";
				 $scope.user = response.data;
				 $scope.loggedIn="yes"
			 }
		  );  
		  
		  //
		  // Displays any user messages, like success or warnings
		  //
		  $scope.$on('messageEvent', function(event, message) {
			  $scope.showMessage = true;
		      $scope.message = message;
		  });  
	});
	
