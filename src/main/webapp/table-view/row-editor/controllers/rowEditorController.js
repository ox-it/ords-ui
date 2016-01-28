'use strict'

ords.controller('rowEditorController', function($scope, $routeParams, Project, ProjectDatabase,  TableRow, AuthService, growl, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	$scope.projectDatabase = ProjectDatabase.get({ id: $routeParams.projectId, databaseId: $routeParams.projectDatabaseId});
	
	$scope.dbId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;

	
});