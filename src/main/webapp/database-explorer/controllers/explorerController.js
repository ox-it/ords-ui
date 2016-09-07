'use strict';


ords.controller('explorerController', function ($scope, $routeParams, $location, DatabaseStructure, Project, ProjectDatabase, DoQuery, AuthService, growl, gettextCatalog){
	AuthService.check();
	
	//
	// Don't show VQD by default
	//
	$scope.showVQD = false;

	$scope.project = Project.get({ id: $routeParams.projectId});
	
	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	$scope.physicalDatabaseId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;
	$scope.server = $routeParams.server;
	
	var pathParams = {databaseId:$routeParams.physicalDatabaseId};
	
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

	    //
	// Run the query using the form fields
	//	
	$scope.runQuery = function() {
		var sql = $(".vqd_sql").val();
		//
		// Before we go to the results, lets first check the query actually works
		//
		var params = {databaseId:$routeParams.physicalDatabaseId, q:sql, start:"0", length:"0" };
		DoQuery.get(
			params,
			function(results) {
		
				//
				// Construct the path to the resource that will show the query
				//
				var tablePath = "/table/"+$routeParams.projectId+"/"+$routeParams.projectDatabaseId+"/"+$routeParams.physicalDatabaseId+"/"+$routeParams.instance+"/SQL/"+sql

        		//
				// Load the view
				//
				$location.path(tablePath);

			},
			function(error) {
				if (error.status === 400){ 
					growl.error(  gettextCatalog.getString("QueryGet400") );
				}
			}
		);
	};
	
	
});