'use strict';

var ords = angular.module('ords', ['ngRoute']);

    // configure our routes
    ords.config(function($routeProvider) {
        $routeProvider

            // Home page with projects list
            .when('/', {
                templateUrl : 'views/home/home.html',
                controller  : 'mainController'
            })
			
			// Login form
            .when('/login', {
                templateUrl : 'views/home/login.html',
                controller  : 'mainController'
            })

            // Project Details
            .when('/project/:param', {
                templateUrl : 'views/project/project.html',
                controller  : 'projectController'
            })
			
			// New Project Form
			.when('/newproject', {
                templateUrl : 'views/project/newproject.html',
                controller  : 'newProjectController'				
			})
			
			// User account preferences
			
			// Invite User
			
			// Add existing User to Project
			
			// Add a database
			
			.otherwise({
				redirectTo: '/'
			})
			
			;
    });
	
    ords.controller('mainController', function ($scope, $http, $location) {
		//
		// If we're logged in, then show project list
		// Otherwise show the login redirects
		//		
    	  $http.get('/api/1.0/user').then(
			 function successCallback(response) { 
				 $location.path("/"); 
				 $scope.user = response.data;
				 $scope.loggedIn="yes"
			 }, 
			 function errorCallback(response) { 
				 $location.path("/login"); 
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
	
