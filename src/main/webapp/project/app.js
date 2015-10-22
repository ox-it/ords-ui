'use strict';

var ords = angular.module('ords', ['ngRoute','ngResource']);

    // configure our routes
    ords.config(function($routeProvider) {
        $routeProvider

            // Home page with projects list
            .when('/', {
                templateUrl : 'views/home.html',
                controller  : 'mainController'
            })

            // Project Details
            .when('/project/:id', {
                templateUrl : 'views/project.html',
                controller  : 'projectController'
            })
			
			// New Project Form
			.when('/newproject', {
                templateUrl : 'views/newproject.html',
                controller  : 'newProjectController'				
			})
			
			// Invite User
			
			// Add existing User to Project
			
			// Add a database
			
			.otherwise({
				redirectTo: '/'
			})
			
			;
    });
	
    ords.controller('mainController', function ($scope, $http, $window) {
		//
		// If we're not logged in, redirect to login
		//		
    	  $http.get('/api/1.0/user').then(
			 function successCallback(response) { 
				 $scope.user = response.data;
				 $scope.loggedIn="yes"
			 }, 
			 function errorCallback(response) { 
				 $window.location.href = "/"; 
				 $scope.user = null;
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
	
