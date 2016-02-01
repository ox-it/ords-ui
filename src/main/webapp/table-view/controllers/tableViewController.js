'use strict';


ords.controller('tableViewController', function ($scope, $routeParams, Project, ProjectDatabase, TableList, DoQuery,  TableRow, AuthService, growl, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	$scope.projectDatabase = ProjectDatabase.get({ id: $routeParams.projectId, databaseId: $routeParams.projectDatabaseId});
	
	$scope.dbId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;
	
	$scope.startRow = 0;
	$scope.numberOfRows = 50;
	$scope.lastRow = 49;
	
	
	
	
	
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
	//'/api/1.0/database/:databaseId/:instance/tabledata/:tableName/:primaryKey/:primaryKeyValue'
	$scope.deleteRow = function(row) {
		var pKey = $scope.tableData.primaryKeys[0];
		if (!pKey) {
			growl.error( "No primary key set on data so unable to delete row");
			return;
		}
		var pKeyValue = row.cell[pKey].value;
		var params = {databaseId:$scope.dbId, instance:$scope.instance, tableName:$scope.tableName, primaryKey:pKey, primaryKeyValue:pKeyValue};
		
		TableRow.delete ( 
			params,
			function(results) {
				$scope.tableList($scope.dbId, $scope.instance, $scope.tableName, $scope.newStart, $scope.numberOfRows);
			},
			function(error) {
				$scope.handleError(error);
			}
		);
	};
	
	
	
	$scope.loadNext = function ( ) {
		$scope.tablelist($scope.dbId, $scope.instance, $scope.tableName, $scope.startRow+$scope.numberOfRows, $scope.numberOfRows );
	};
	
	$scope.loadPrevious = function ( ) {
		var start = 0;
		if ( $scope.startRow - $scope.numberOfRows > 0 ) {
			start = $scope.startRow - $scope.numberOfRows;
		}
		$scope.tablelist($scope.dbId, $scope.instance, $scope.tableName, start, $scope.numberOfRows );
	};
	
	$scope.startFrom = function( ) {
		$scope.tablelist($scope.dbId, $scope.instance, $scope.tableName, $scope.newStart, $scope.numberOfRows);
	};
	
	$scope.orderKey = function( column ) {
		$scope.orderProp = column.columnName;
	}
	
	$scope.sortBy = function ( input ) {
		if ( isNumeric(input.cell[$scope.orderProp].value) ) {
			return parseInt(input.cell[$scope.orderProp].value);
		}
		else {
			return input.cell[$scope.orderProp].value;
		}
	};
	
	$scope.doFilter = function ( input ) {
		var theValue = input.cell[$scope.filterField].value;
		var theFilterValue = $scope.filterValue;
		if (!theFilterValue && $scope.filterType != "is NULL") return true;
		switch ($scope.filterType) {
		case "is":
			return theValue == theFilterValue;
			break;
			
		case "is not":
			return theValue != theFilterValue;
			break;
		
		case "like":
		case "contains":
			var index = theValue.indexOf(theFilterValue);
			if ( index != -1 ) {
				return true;
			}
			else {
				return false;
			}
			break;
			
		case "is NULL":
			return theValue == null;
			break;
		}
	};
	
	$scope.setupFromResults = function(results) {
		$scope.tableData = results;
		$scope.startRow = results.currentRow;
		if ( results.numberOfRowsInEntireTable < $scope.numberOfRows + $scope.startRow ) {
			$scope.lastRow = results.numberOfRowsInEntireTable;
		}
		else {
			$scope.lastRow = $scope.startRow + $scope.numberOfRows;
		}
		$scope.maxRows = results.numberOfRowsInEntireTable;
		$scope.pages =  Math.ceil($scope.maxRows / $scope.numberOfRows);
		$scope.pagePosition = Math.ceil($scope.startRow / $scope.numberOfRows);
		$scope.newStart = $scope.startRow;
		var op = results.columnsByIndex[0].columnName;
		$scope.orderProp = op;
		$scope.filterField = op;
		$scope.filterValue = "";
		$scope.filterType = "is";
		$scope.primaryKey = results.primaryKeys[0];		
	}


	$scope.tablelist = function (dbId, inst, name, startRow, numberOfRows ) {
		var params = {databaseId:dbId, instance:inst, tableName: name, startIndex:startRow,rowsPerPage:numberOfRows};
		TableList.get(
			params,
			function(results) {
				$scope.setupFromResults(results);
				
			},
			function(error) {
				$scope.handleError(error);
			}
		)
	};
	

	$scope.databasequery = function (dbId, inst, query, startRow, numberOfRows ) {
		var params = {databaseId:dbId, instance:inst,q:query,startIndex:startRow,rowsPerPage:numberOfRows };
		DoQuery.get(
			params,
			function(results) {
				$scope.setupFromResults(results);
			},
			function(error) {
				$scope.handleError(error);
			}
		)
	};

	$scope.queryType = $routeParams.queryType;
	if ( $routeParams.queryType == "table" ) {
		$scope.tableName = $routeParams.query;
		$scope.tablelist($routeParams.physicalDatabaseId, 
				$routeParams.instance, 
				$routeParams.query, 
				$scope.startRow, 
				$scope.numberOfRows);
	}
	else {
		$scope.theQuery = $routeParams.query;
		$scope.databasequery($routeParams.physicalDatabaseId, 
				$routeParams.instance, 
				$routeParams.query, 
				$scope.startRow, 
				$scope.numberOfRows);
		
	}
	
});

ords.directive("fixOnScroll", function () {
    return function(scope, element, attrs) {
        var fixedDiv = attrs.fixedDiv;
          element.bind("scroll", function() {
              if(element.scrollLeft())
              {
                  var leftPos = element.scrollLeft();
                  $(fixedDiv).scrollLeft(leftPos);
              }
          });
      };
  });
  
  
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}