'use strict'

ords.controller('rowEditorController', function($scope, $routeParams, Project, ProjectDatabase, DoQuery, TableRow, AuthService, growl, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	$scope.projectDatabase = ProjectDatabase.get({ id: $routeParams.projectId, databaseId: $routeParams.projectDatabaseId});
	
	$scope.dbId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;
	
	$scope.tableName = $routeParams.tableName;
	$scope.primaryKey = $routeParams.primaryKey;
	$scope.primaryKeyValue = $routeParams.primaryKeyValue;
	var sql = "";
	var start=1;
	var nRows;
	if ( $scope.primaryKey ) {
		$scope.haveRow = true;
		nRows = 1;
		sql = "SELECT * from \""+$scope.tableName+"\" WHERE \"" + $scope.primaryKey + "\"='"+$scope.primaryKeyValue+"'";
	}
	else {
		$scope.haveRow = false;
		nRows = 0;
		sql = "SELECT * from \""+$scope.tableName+"\"";
	}

	var params = {databaseId:$scope.dbId, instance:$scope.instance, q:sql, startIndex:start, rowsPerPage:nRows};
	DoQuery.get(
		params,
		function(results) {
			$scope.tableData = results;
			if ( $scope.haveRow ) {
				for ( var row in results.columnsByIndex ) {
					$scope[row.columnName] = results.rows[0].cell[row.columnName].value;
				}
			}
		},
		function(error) {
			growl.error("There was an error: "+error);
		}
	);
				
});