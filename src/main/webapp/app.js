'use strict';

var ords = angular.module('ords',['ngRoute', 'ngResource'])

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
            .when('/', {
                templateUrl : 'views/home.html',
                controller  : 'mainController'
            })
			
            // Search results
            .when('/search', {
                templateUrl : 'views/searchresults.html',
                controller  : 'searchController'
            })
		
			.otherwise({
				redirectTo: '/'
			})
		
			;
    })

	
.controller('mainController', function ($scope, $window, User) {
	//
	// If we're logged in, redirect to project app
	//		
	$scope.user = User.get(
		 function successCallback() { 
			 $window.location.href = "/project"; 
			 $scope.loggedIn="yes"
		 }, 
		 function errorCallback() { 
			 $scope.loggedIn="no"
		 }				
	);
})

;
	
