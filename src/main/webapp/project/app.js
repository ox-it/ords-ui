'use strict';

var ords = angular.module('ords', ['ngRoute','ngResource', 'angular-growl', 'ngMessages'])

	//
	// Project REST Resources
	//
	.factory('Project', function( $resource ) {		
		return $resource(
			'/project-api/project/:id/', 
			null,
			{'update': { method:'PUT' }}
		)
	})

	.factory('User', function( $resource ) {
		return $resource('/api/1.0/user/');
	})

	.config(['growlProvider', function(growlProvider) {
	  growlProvider.globalTimeToLive(5000);
	  growlProvider.globalDisableCountDown(true);
	}])

	//
	// configure  routes
	//
	.config(function($routeProvider) {
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
				
	            // Edit Project Details
	            .when('/editproject/:id', {
	                templateUrl : 'views/editproject.html',
	                controller  : 'editProjectController'
	            })
			
				// Invite User
			
				// Add existing User to Project
			
				// Add a database
			
				.otherwise({
					redirectTo: '/'
				})
			
				;
	    })
	//
	// Init
	//
	.run(function($rootScope, $window, User, Project) {
		//
		// If we're not logged in, redirect to login
		//		
		$rootScope.user = User.get(
			 function successCallback() { 
				 $rootScope.loggedIn="yes"
			 }, 
			 function errorCallback() { 
				 $window.location.href = "/"; 
			 }				
		);

		//
		// Load initial projects
		//
		$rootScope.projects = Project.query(); 
	});
