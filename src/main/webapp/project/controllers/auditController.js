'use strict';

ords.controller('auditController', function ($rootScope, $scope, $routeParams, AuthService, Project, Audit, $location, growl, gettextCatalog) {

	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	//
	// Get the current Project
	//
	$scope.project = Project.get({ id: $routeParams.id });
	
	//
	// Get audit data for this project
	//
	$scope.audits = Audit.query({ id: $routeParams.id });
	
});