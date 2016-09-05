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

	//
	// This is an empty model for adding a new row to a table
	//
	$scope.newRow = {};
	$scope.newRow.cell = [];
	$scope.newRowKey = "ORDS.NEWROW.KEY";
	
	
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
		var params = {databaseId:$scope.dbId, tableName:$scope.tableName, primaryKey:pKey, primaryKeyValue:pKeyValue};
		
		TableList.delete ( 
			params,
			function() {
				growl.success( gettextCatalog.getString("RowDelete200") );
				$scope.tablelist($scope.dbId, $scope.instance, $scope.tableName, $scope.newStart, $scope.numberOfRows);
			},
			function(error) {
				if (error.status === 409){ 
					growl.error(  gettextCatalog.getString("RowDelete409") );
				} else {
					$scope.handleError(error);
				}
			}
		);
	};

	//
	// Checks whether the column has an autonumber sequence associated with it
	//
	$scope.isAutonumber = function ( column ) {
		for ( var sequence in $scope.sequences) {
			if ($scope.sequences[sequence] === column.columnName){
				return true;
			}
		}
		return false;
	}
	
	$scope.checkPrimaryColumn = function ( column ) {
		for ( var key in $scope.tableData.primaryKeys ) {
			var pKeyVal = $scope.tableData.primaryKeys[key];
			if (pKeyVal == column.columnName ) {
				return true;
			}
		}
		return false;
	}
	
	
	
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
		if ( $scope.orderProp != column ) {
			$scope.orderProp = column;
			$scope.sortReverse = false;
		}
		else {
			$scope.sortReverse = !$scope.sortReverse;
		}
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
		$scope.sortReverse = false;
		$scope.filterField = op;
		$scope.filterValue = "";
		$scope.filterType = "is";
		$scope.primaryKey = results.primaryKeys[0];	
		$scope.sequences = results.sequences;
		if ( !$scope.referencedColumn ) {
			$scope.referencedColumn = [];
		}
		if (!$scope.referencedColumnData ) $scope.referencedColumnData = [];
		if (!$scope.selectedReferenced) $scope.selectedReferences = [];
		$scope.columnSelection = [];
		// here we need to set up the referencedColumns for any relations
		for ( var i in results.columns ) {
			var column = results.columns[i];
			if ( column.referencedTable ) {
				// only do this if not already set
				if ( !$scope.referencedColumn[column.referencedTable] ) {
					var rc = null;
					if ( !column.referencedColumn ) {
						rc = column.alternateColumns[0];
					}
					else {
						rc = column.referencedColumn;
					}
					var reference = {referencedColumn:rc, localColumn:column.columnName};
					$scope.columnSelection[column.referencedTable] = rc;
					$scope.referencedColumn[column.referencedTable] = reference;
				}
			}
		}
	};
	
	
	
	$scope.tableLoaded = function() {
		//growl.success("table loaded");
		// grab any related data for referenced columns
		// loop through the reference column keys, the keys are the tablename
		for (var tableName in $scope.referencedColumn ) {
			var reference = $scope.referencedColumn[tableName];
			$scope.getReferencedDatasetForColumn(reference, tableName);
		}
	}
	
	
	$scope.getReferencedDatasetForColumn = function ( reference, tableName ) {
		var params = {databaseId:$scope.dbId, tableName:tableName, columnName:reference.referencedColumn};
		ReferenceColumnData.get (
			params,
			function(results) {
				setTimeout(function() {
					$scope.$apply( function() {
						$scope.referencedColumnData[tableName]=results;
						var newReferences = [];
						for (var i in $scope.tableData.rows ) {
							var row = $scope.tableData.rows[i];
							var ref = findRefInDataWithColumnName ( results, reference.localColumn, row );
							var pkeyVal = row.cell[$scope.primaryKey].value;
							newReferences[pkeyVal] = ref;
						}
						$scope.selectedReferences = newReferences;
					});
				});
			},
			function(error) {
				$scope.handleError(error);
			}
		);
	};
	
	
	
	$scope.selectTableReference = function ( localColumnName, refTableName ) {
		var selected = $scope.columnSelection[refTableName];
		var reference = {referencedColumn:selected, localColumn:localColumnName};
		$scope.referencedColumn[refTableName] = reference;
		$scope.getReferencedDatasetForColumn ( reference, refTableName );
	};
	
	
	$scope.checkReferenceAndRow = function ( column, row ) {
		if ( column.referenceTable ) {
			var refData = $scope.referencedColumnData[column.referencedTable];
			if ( refData ) {
				// get the direct reference
				var ref = findRefInData ( refData, column, row);
				// get the primary key value for the row
				var pkeyVal = row.cell[$scope.primaryKey].value
				// to set up the model for this select, but only if it's not been set
				if ( !$scope.selectedReferences[pkeyVal] ) {
					$scope.selectedReferences[pkeyVal] = ref;
				}
				return true;
			}
		}
		return false;	
	}
	
	$scope.getReferencedColumnData = function ( tableName ) {
		var refData = $scope.referencedColumnData;
		if (refData && refData.length > 0 ) {
			var thisReferenceData = refData[tableName];
			if ( thisReferenceData ) {
				return thisReferenceData.rows;
			}
		}
		return null;
	}

		
	
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
				chooser += "<select class=\"changeReferencedColumnData\" id=\""+column.columnName+"___referencedTableColumnSelect\" name=\""+column.columnName+"__referencedTableColumnSelect\" ng-model=\"referencedColumn[column.referencedTable]\" ng-change=\"selectTableReference('"+column.columnName+"','"+column.referencedTable+"')\">";
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
		var params = {databaseId:dbId, tableName: name, start:startRow,length:numberOfRows};
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

	//
	// Adds a new row to a table
	//
	$scope.addRow = function() {

		var params = {databaseId:$scope.dbId, instance:$scope.instance, tableName:$scope.tableName};
		var colNames = [];
		var colValues = [];

		//
		// Construct the object to POST
		//
		for ( var cId in $scope.tableData.columnsByIndex ) {
			var column = $scope.tableData.columnsByIndex[cId];

			//
			// Lookup values from referenced columns
			//
			if ( column.referencedTable ) {
				var ref = $scope.selectedReferences[$scope.newRowKey];
				if ( typeof ref !== "undefined" && ref.dirty ) {
					colNames.push(column.columnName);
					colValues.push(ref.value);
				}
			}
			//
			// Add regular columns
			//
			else {
				if ( typeof $scope.newRow.cell[column.columnName] !== "undefined"){
					colNames.push(column.columnName);
					colValues.push($scope.newRow.cell[column.columnName].value);
				}				
			}
		}

		//
		// Build the object, and POST to API
		//
		if ( colNames.length > 0 ) {
			var saveRow = { 
				columnNames:colNames,
				values:colValues
			};
			TableList.save ( 
				params,
				saveRow,
				function(result){
					//
					// Display success message and reload the table
					//
					growl.success("Saved");
					$scope.newRow = {};
					$scope.newRow.cell = [];
					$scope.tableName = $routeParams.query;
					$scope.tablelist($routeParams.physicalDatabaseId, 
						$routeParams.instance, 
						$routeParams.query, 
						$scope.startRow, 
						$scope.numberOfRows
					);
				},
				function(error) {
					growl.error("There was an error: "+error);
				}
			);
		}

	}
	
	
	$scope.saveChangedRows = function( ) {
		var td = $scope.tableData;
		var pkey = $scope.primaryKey;
		var saveRows = [];
		for ( var rId in td.rows ) {
			var row = td.rows[rId];
			var colNames = [];
			var colValues = [];
			var pKeyVal = row.cell[pkey].value;

			for ( var cId in td.columnsByIndex ) {
				var column = td.columnsByIndex[cId];
				if ( column.referencedTable ) {
					var ref = $scope.selectedReferences[pKeyVal];
					if ( ref.dirty ) {
						colNames.push(column.columnName);
						colValues.push(ref.value);
					}
					
				}
				else {
					if ( row.cell[column.columnName].dirty) {
						colNames.push(column.columnName);
						colValues.push(row.cell[column.columnName].value);
					}					
				}
			}
			if ( colNames.length > 0 ) {
				var saveRow = { 
						lookupColumn:pkey,
						lookupValue:pKeyVal,
						columnNames:colNames,
						values:colValues
						};
				saveRows.push(saveRow);
			}
		}
		if ( saveRows.length > 0 ) {
			var params = {databaseId:$scope.dbId, tableName:$scope.tableName};

			TableList.update (
					params,
					saveRows,
					function(result) {
						growl.success("Saved");
						$scope.dataForm.$setPristine();
					},
					function(error) {
						$scope.handleError(error);
					}
				);

		}
	}
	
	
	$scope.valueChanged = function(cell) {
		cell.dirty=true;
	}
	
	$scope.databasequery = function (dbId, inst, query, startRow, numberOfRows ) {
		var params = {databaseId:dbId,q:query,start:startRow,length:numberOfRows };
		DoQuery.get(
			params,
			function(results) {
				$scope.setupFromResults(results);
			},
			function(error) {
				if (error.status === 400){ 
					growl.error(  gettextCatalog.getString("QueryGet400") );
					$window.scrollTo(0, 0);
				} else {
					$scope.handleError(error);
				}
			}
		);
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


ords.directive('reference', function($compile){
	return {
		restrict:'A',
		replace:true,
		link: function(scope, ele, attrs ) {
			scope.$watch(attrs.reference, function(html){
				ele.html(html);
				$compile(ele.contents())(scope);
			});
		}
	};
});


ords.directive("repeatEnd", function(){
	return {
		restrict: "A",
		link: function (scope, element, attrs) {
			if (scope.$last) {
				scope.$eval(attrs.repeatEnd);
			}
		}
	};
});


ords.directive('bigSelect', function ($parse) {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		compile: function (element, attrs) {
			var getReferencedColumn = $parse(attrs.referencedColumn);
			var html = '<input type="text" id="'+attrs.id+'" ' +
				'reference-key="'+attrs.referenceKey+'" '+
				'class="'+attrs.class+'" '+
				'referenced-column="'+attrs.referencedColumn+'"' +
				'referenced-table="'+attrs.referencedTable+'"' +
				'referenced-label="'+attrs.referencedLabel+'"/>';
			var newElem = $(html);
			element.replaceWith(newElem);
			
			return function (scope, element, attrs, controller ) {
				var getColumn = function () {
					var column = getReferencedColumn(scope);
					return column.referencedColumn;
				};
				
				var getId = function(r) {
					var tid = r.value;
					return tid;
				};
				element.select2({
					placeholder: "Search",
					minimumInputLength: 1,
					id: function(result){return getId(result)},
					ajax: { 
						url: function() { return "/api/1.0/database/"+scope.dbId+"/table/"+attrs.referencedTable+"/column/"+getColumn()+"/related" },
						dataType: 'json',
						quietMillis: 250,
						data: function (term, page) {
							return {
								term: term, // search term
							};
						},
						results: function (data, page) { 
							var resultSet = [];
							$.each(data.rows, function(index, row) {
								resultSet.push({
									'label':row.cell.label.value,
									'value':row.cell.value.value
								});
							});
							return { results: resultSet };
						},
						cache: true
					},
					initSelection: function(element, callback) {
						var id = $(element).val();
						var label = $(element).attr("referenced-label");
						var result = {};
						result.label = label;
						result.value = id;
						callback(result);
					},
					formatResult: function(result){return result.label}, // format the result to display in the list
					formatSelection: function(result){return result.label},  // format the selected item
					dropdownCssClass: "bigdrop", // apply css that makes the dropdown taller				
				});
				
				element.on("change", function(e) {
					var changedRef = {value:e.added.value, label:e.added.label, dirty:true};
					scope.selectedReferences[attrs.referenceKey] = changedRef;
				});
				
				scope.$watch('selectedReferences', function() {
					var newVal = scope.selectedReferences[attrs.referenceKey];
					if ( newVal ) {
						var ds = {value:newVal.value, label:newVal.label};
						element.select2("data", ds);
					}
				});
			};
		}
	};
});



// some utility functions
  
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function findRefInData ( refData, column, row) {
	return findRefInDataWithColumnName ( refData, column.columnName, row );
}

function findRefInDataWithColumnName ( refData, columnName, row ) {
	var columnValue = row.cell[columnName].value;
	for ( var id in refData.rows ) {
		var refRow = refData.rows[id];
		if ( refRow.cell.value.value == columnValue ) {
			return {label:refRow.cell.label.value, value:refRow.cell.value.value};
		}
	}
	return columnValue;

}