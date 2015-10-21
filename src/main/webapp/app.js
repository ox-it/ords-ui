'use strict';

var ords = angular.module('ords', ['ngRoute']);

    // configure our routes
    ords.config(function($routeProvider) {
        $routeProvider

            // route for the home page with projects list
            .when('/', {
                templateUrl : 'views/home/home.html',
                controller  : 'mainController'
            })
			
            .when('/login', {
                templateUrl : 'views/home/login.html',
                controller  : 'mainController'
            })

            // route for the project detail page
            .when('/project/:param', {
                templateUrl : 'views/project/project.html',
                controller  : 'projectController'
            })
			
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
		// TODO call the User service. Right now I just try to view a private project as a hack for testing with
		
    	  $http.get('/project-api/project/25').then(
			 function successCallback(response) { $location.path("/"); }, 
			 function errorCallback(response) { $location.path("/login"); }
		  );    
	});
	

    ords.controller('projectListController', function ($scope, $http) {
  	  $http.get('/project-api/project?open=true').success(function(data) {
  	    $scope.projects = data;
  	  });
    });
	
    ords.controller('projectController', function ($scope, $routeParams, $http) {
	  $scope.param = $routeParams.param;
  	  $http.get('/project-api/project/'+$scope.param).success(function(data) {
  	    $scope.project = data;
  	  });
    });