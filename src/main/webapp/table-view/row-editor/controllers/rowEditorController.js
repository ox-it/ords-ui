'use strict'

ords.controller('rowEditorController', function($scope, $routeParams, $location, Project, ProjectDatabase, DoQuery, TableList, AuthService, growl, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	$scope.projectDatabase = ProjectDatabase.get({ id: $routeParams.projectId, databaseId: $routeParams.projectDatabaseId});
	
	$scope.dbId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;
	
	$scope.tableName = $routeParams.tableName;
	$scope.primaryKey = $routeParams.primaryKey;
	if ( $routeParams.primaryKeyValue ) {
		$scope.primaryKeyValue = $routeParams.primaryKeyValue;	
		$scope.haveRow = true;
	}
	else {
		$scope.haveRow = false;
	}
	$scope.fields = [];
	var sql = "";
	var start=1;
	var nRows;
	if ( $scope.haveRow ) {
		nRows = 1;
		sql = "SELECT * from \""+$scope.tableName+"\" WHERE \"" + $scope.primaryKey + "\"='"+$scope.primaryKeyValue+"'";
	}
	else {
		nRows = 0;
		sql = "SELECT * from \""+$scope.tableName+"\"";
	}

	var params = {databaseId:$scope.dbId, instance:$scope.instance, q:sql, startIndex:start, rowsPerPage:nRows};
	DoQuery.get(
		params,
		function(results) {
			$scope.tableData = results;
			if ( $scope.haveRow ) {
				for ( var i in results.columnsByIndex ) {
					var column = results.columnsByIndex[i];
					if ( column.columnName != $scope.primaryKey ) {
						var val = results.rows[0].cell[column.columnName].value;
						$scope.fields[column.columnName] = val;
					}
				}
			}
			else {
				for ( var i in results.columnsByIndex ) {
					var column = results.columnsByIndex[i];
					$scope.fields[column.columnName] = "";
				}
			}
		},
		function(error) {
			growl.error("There was an error: "+error);
		}
	);
	
	
	$scope.saveRow = function ( ) {
		var row = new Object();
		row.columnNames = [];
		row.values = [];
		for ( var key in $scope.fields ) {
			var val = $scope.fields[key];
			if ( val ) {
				row.columnNames.push(key);
				row.values.push(val);
			}
		}
		var params = {databaseId:$scope.dbId, instance:$scope.instance, tableName:$scope.tableName};
		if ( $scope.haveRow ) {
			// updating
			row.lookupColumn = $scope.primaryKey;
			row.lookupValue = $scope.primaryKeyValue;
			TableList.update (
				params,
				row,
				function(result) {
					//success
					var url = "/table/"+$scope.project.projectId+"/"+$scope.projectDatabase.logicalDatabaseId+"/"+$scope.dbId+"/"+$scope.instance+"/table/"+$scope.tableName;
					$location.path(url);
				},
				function(error) {
					growl.error("There was an error: "+error);
				}
			);
		}
		else {
			// posting
			row.lookupColumn = "NULL";
			row.lookupValue = 0;
			TableList.save ( 
				params,
				row,
				function(result){
					var url = "/table/"+$scope.project.projectId+"/"+$scope.projectDatabase.logicalDatabaseId+"/"+$scope.dbId+"/"+$scope.instance+"/table/"+$scope.tableName;
					$location.path(url);
				},
				function(error) {
					growl.error("There was an error: "+error);
				}
			);
			
		}
	}
				
});