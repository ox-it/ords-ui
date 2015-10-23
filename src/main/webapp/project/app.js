'use strict';

var ords = angular.module('ords', ['ngRoute','ngResource', 'angular-growl'])

	//
	// Project REST Resources
	//
	.factory('Project', function( $resource ) {
		return $resource('/project-api/project/:id');
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
			
				// Invite User
			
				// Add existing User to Project
			
				// Add a database
			
				.otherwise({
					redirectTo: '/'
				})
			
				;
	    })
	
	//
	// Project Controllers
	//
	.controller('mainController', function ($scope, $routeParams, Project) {
		$scope.refresh = function(){
			$scope.projects = Project.query(); 	
		}
	})
	
	.controller('projectController', function ($scope, $routeParams, Project) {
		$scope.project = Project.get({ id: $routeParams.id });
	})

	.controller('newProjectController', function ($rootScope, $scope, $http, $location, Project, growl) {
	
		//
		// Submit fields in new project form to create a new project
		//
	    $scope.submitNewProject=function(){
			Project.save($scope.fields,
				function(){
					$rootScope.projects = Project.query();
					growl.success("Project successfully created");
					$location.path("/");
				},
				function(){
					growl.error("There was a problem creating the project");
					$location.path("/");
				}
			);    
	     }
	
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
