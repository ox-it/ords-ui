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
	// Configure alerts
	//
	.config(['growlProvider', function(growlProvider) {
	  growlProvider.globalTimeToLive(5000);
	  growlProvider.globalDisableCountDown(true);
	}])

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
;


	
