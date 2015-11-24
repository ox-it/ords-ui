'use strict';

ords.controller('newDatabaseController', function ($rootScope, $scope, $location, $routeParams, AuthService, Project, Group, ProjectDatabase, User, growl, gettextCatalog) {
	
	//
	// This page doesn't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	//
	// New blank group
	//
	$scope.group = {};
	
	//
	// Get the current Project
	//
	$scope.project = Project.get({ id: $routeParams.id });
	
	$scope.newDatabase = function(){
		
		$scope.group.databaseProjectId = $scope.project.projectId;
		$scope.group.databaseType = "relational";
		$scope.group.numberOfPhysicalDatabases = 0;
		
		Group.save(
			$scope.group, 
			function(response){
				$scope.newProjectDatabase(response);
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("GroupPost400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("GroupPost404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/"+$scope.project.projectId);
			}
		);
		
	}
	
	$scope.newProjectDatabase = function(response){
		$scope.projectDatabase = {};
		$scope.projectDatabase.projectId = $scope.project.projectId;
		$scope.projectDatabase.databaseId = response.logicalDatabaseId;
		
		ProjectDatabase.save(
			{id: $scope.projectDatabase.projectId},
			$scope.projectDatabase, 
			function(){
				growl.success( gettextCatalog.getString("ProDbPost201") );
				$location.path("#/project/"+$scope.project.projectId);
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("ProDbPost400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("ProDbPost404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/"+$scope.project.projectId);
			}
		);
	}

});