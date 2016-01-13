'use strict';


ords.controller('explorerController', function ($scope, $routeParams, DatabaseStructure, Project, ProjectDatabase,  AuthService, growl, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	
	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	
	var pathParams = {databaseId:$routeParams.physicalDatabaseId, instance:$routeParams.instance};
	
	DatabaseStructure.get(
		pathParams,
		function(tableList) {
			$scope.tableList = tableList;
		},
		function(error) {
			if (error.status === 500){ 
				growl.error(  gettextCatalog.getString("Gen500") );
			}
			else if (error.status === 404){
				growl.error(  gettextCatalog.getString("Dat030") );
			}
			else if (error.status === 403){
				growl.error( gettextCatalog.getString("Dat403"));
			}
			else{
				growl.error("General error: " + error.message );
			}
		}
	);
	
	
});