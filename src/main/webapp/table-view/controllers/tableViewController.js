'use strict';


ords.controller('tableViewController', function ($scope, $routeParams, $sce, Project, ProjectDatabase, TableList, DoQuery, ReferenceColumnData, AuthService, growl, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	$scope.projectDatabase = ProjectDatabase.get({ id: $routeParams.projectId, databaseId: $routeParams.projectDatabaseId});
	
	$scope.dbId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;
	
	$scope.startRow = 0;
	$scope.numberOfRows = 50;
	$scope.lastRow = 49;
	$scope.changeModel;
	
	
	
	
	
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
		
		TableList.delete ( 
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
		$scope.orderProp = column;
	};
	
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
		$scope.referencedColumn = [];
		$scope.referencedColumnData = [];
	};
	
	
	$scope.selectTableReference = function ( refColumnName, refTableName ) {
		var selected = $("#"+refColumnName+"___referencedTableColumnSelect option:selected").html();
		$scope.referencedColumn[refTableName] = selected;
		// get the column data
		//return $resource('/api/1.0/database/:databaseId/:instance/table/:tableName/column/:columnName/related')

		var params = {databaseId:$scope.dbId, instance:$scope.instance, tableName:refTableName, columnName:selected};
		ReferenceColumnData.get (
			params,
			function(results) {
				$scope.referencedColumnData[refTableName] = results;
			},
			function(error) {
				$scope.handleError(error);
			}
		);
		
	};
	
	$scope.getColumnDataForRow = function ( column, row ) {
		if ( column.referencedTable ) {
			// see if it's set
			var ref = $scope.referencedColumn[column.referencedTable];
			if ( ref ) {
				var refData = $scope.referencedColumnData[column.referencedTable];
				if ( refData ) {
					var ref = findRefInData ( refData, column, row);
					return ref;
				}
			}
		}	
		return row.cell[column.columnName].value;
	};
	

	
	
//	$scope.getColumnDataForRow = function ( column, row ) {
//		return row.cell[column.columnName].value;
//	}
	
	$scope.getColumns = function ( ) {
		if ( !$scope.tableData ) {
			return null;
		}
		var columns = $scope.tableData.columnsByIndex;
		var columnsHtml = [];
		for ( var i in columns ) {
			var column = columns[i];
			if ( column.referencedTable ) {
				// build the html for the chooser
				var selectedValue = $scope.referencedColumn[column.referencedTable];
				var chooser = "<p class=\"referenceSelect\">Links to table: "+column.referencedTable+"</br>";
				chooser += "<select class=\"changeReferencedColumnData\" id=\""+column.columnName+"___referencedTableColumnSelect\" name=\""+column.columnName+"__referencedTableColumnSelect\" ng-model=\"referencedColumn[column.referencedTable]\" ng-change=\"selectTableReference(\'"+column.columnName+"\',\'"+column.referencedTable+"\')\">";
				for (var si in column.alternateColumns) {
					var s = column.alternateColumns[si];
		           if (selectedValue && selectedValue == s) {
		        	   chooser += "<option name=\"tableDataColumnName\" selected=\"selected\" id=\"" + column.columnName + "\">" + s + "</option>";
		                // Even though it is "invalid" (i.e. does not validate, I need the name attribute in the option tag
		            }
		            else {
		            	chooser += "<option>" + s + "</option>";
		            }
				}
				chooser += "</select></p>";
				columnsHtml.push(chooser);
			}
			else {
				var span = "<div ng-click=\"orderKey(\'"+column.columnName+"\')\">"+column.columnName+"</div>";
				columnsHtml.push(span);
			}
		}
		return columnsHtml;
	};
	
	


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
  
ords.directive('dynamic', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.dynamic, function(html) {
        ele.html(html);
        $compile(ele.contents())(scope);
      });
    }
  };
});  
  
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function findRefInData ( refData, column, row) {
	var columnValue = row.cell[column.columnName].value;
	for ( var id in refData.rows ) {
		var refRow = refData.rows[id];
		if ( refRow.cell.value.value == columnValue ) {
			return refRow.cell.label.value;
		}
	}
	return columnValue;
}
