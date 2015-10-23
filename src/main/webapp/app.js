'use strict';

var ords = angular.module('ords',['ngResource'])

//
// Main REST Resources
//
.factory('User', function( $resource ) {
	return $resource('/api/1.0/user/');
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
	
