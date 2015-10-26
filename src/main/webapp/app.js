'use strict';

var ords = angular.module('ords',['ngRoute', 'ngResource', 'angular-growl', 'ngMessages', 'angularUtils.directives.dirPagination'])

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
		return $resource(
			'/api/1.0/user/',
			null,
			{'lookup': { method: 'GET'}}
		);
	})

	//
	// configure  routes
	//
	.config(function($routeProvider) {
	        $routeProvider

	            // Home page for login
	            .when('/projects', {
	                templateUrl : 'project/views/home.html',
	                controller  : 'projectsController'
	            })
			
	            // Search results
	            .when('/search', {
	                templateUrl : 'views/searchresults.html',
	                controller  : 'searchController'
	            })
				
	            // Home page with projects list
	            .when('/', {
	                templateUrl : 'views/home.html',
	                controller  : 'mainController'
	            })

	            // Project Details
	            .when('/project/:id', {
	                templateUrl : 'project/views/project.html',
	                controller  : 'projectController'
	            })
			
				// New Project Form
				.when('/newproject', {
	                templateUrl : 'project/views/newproject.html',
	                controller  : 'newProjectController'				
				})
				
	            // Edit Project Details
	            .when('/editproject/:id', {
	                templateUrl : 'project/views/editproject.html',
	                controller  : 'editProjectController'
	            })
		
				.otherwise({
					redirectTo: '/'
				})
		
				;
	    })

	
		//
		// Init
		//
		.controller('mainController', function($rootScope,$location, User, Project) {
			
				//
				// If we're not logged in, redirect to login
				//		
				$rootScope.user = User.get(
					 function successCallback() { 
						$rootScope.loggedIn="yes"
			 			//
			 			// Load initial projects
			 			//
			 			$rootScope.projects = Project.query(); 
						$location.path("/projects"); 
					 }, 
					 function errorCallback() { 
						 $rootScope.loggedIn="no"
						 $location.path("/"); 
					 }				
				);
			
		})

;


	
