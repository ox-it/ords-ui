'use strict';


ords.controller('tableViewController', function ($scope, $routeParams, Project, ProjectDatabase, TableList, DoQuery,  AuthService, growl, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	$scope.projectDatabase = ProjectDatabase.get({ id: $routeParams.projectId, databaseId: $routeParams.projectDatabaseId});
		
	$scope.startRow = 0;
	$scope.numberOfRows = 100;

	$scope.findRowValueFromCellData(cell, columnName ) {
		return cell[columnName].value;
	}
	
	$scope.handleError = function ( error ) {
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

	};


	$scope.tablelist = function (dbId, inst, name, startRow, numberOfRows ) {
		var pathParams = {databaseId:dbId, instance:inst, tableName: name };
		var queryParams = {startIndex:startRow,rowsPerPage:numberOfRows};
		TableList.get(
			pathParams,
			function(results) {
				$scope.tableData = results;
			},
			function(error) {
				$scope.handleError(error);
			}
		)
	};
	

	$scope.databasequery = function (dbId, inst, query, startRow, numberOfRows ) {
		var pathParams = {databaseId:dbId, instance:inst};
		var queryParams = {q:query,startIndex:startRow,rowsPerPage:numberOfRows };
		DoQuery.get(
			pathParams,
			queryParams,
			function(results) {
				$scope.tableData = results;
			},
			function(error) {
				$scope.handleError(error);
			}
		)
	};


	if ( $routeParams.queryType == "table" ) {
		$scope.tablelist($routeParams.physicalDatabaseId, 
				$routeParams.instance, 
				$routeParams.query, 
				$scope.startRow, 
				$scope.numberOfRows);
	}
	else {
		$scope.databasequery($routeParams.physicalDatabaseId, 
				$routeParams.instance, 
				$routeParams.query, 
				$scope.startRow, 
				$scope.numberOfRows);
		
	}
	
})