'use strict';


ords.controller('tableViewController', function ($scope, $routeParams, $sce, $location, $timeout, $window, State, Project, ProjectDatabase, TableList, DoQuery, ReferenceColumnData, Dataset, DatasetData, AuthService, ExportTable, ExportQuery, growl, gettextCatalog, ngDialog, FileSaver){
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
	// This is just a holder to notify threads that we've updated the references
	//
	$scope.referencesUpdated = {count:0};
	//
	// We use this to keep track of changes to enable the "save changes" button
	//
	$scope.referencesChanged = {count:0};

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
		if ( $routeParams.queryType == "table" ) {
			$scope.tablelist($scope.dbId, $scope.instance, $scope.tableName, $scope.startRow+$scope.numberOfRows, $scope.numberOfRows );
		} else if ( $routeParams.queryType == "dataset" ) {
			$scope.getDatasetData($scope.dbId, $scope.viewId, $scope.startRow+$scope.numberOfRows, $scope.numberOfRows );
		} else {
			$scope.databasequery($scope.dbId, $scope.instance, $scope.theQuery, $scope.startRow+$scope.numberOfRows, $scope.numberOfRows);
		}
	};
	
	$scope.loadPrevious = function ( ) {
		var start = 0;
		if ( $scope.startRow - $scope.numberOfRows > 0 ) {
			start = $scope.startRow - $scope.numberOfRows;
		}

		if ( $routeParams.queryType == "table" ) {
			$scope.tablelist($scope.dbId, $scope.instance, $scope.tableName, start, $scope.numberOfRows );
		} else if ( $routeParams.queryType == "dataset" ) {
			$scope.getDatasetData($scope.dbId, $scope.viewId, start, $scope.numberOfRows );
		} else {
			$scope.databasequery($scope.dbId, $scope.instance, $scope.theQuery, start, $scope.numberOfRows);
		}
	};
	
	//
	// Handle "go to record"
	//
	$scope.startFrom = function( ) {

		if ($scope.newStart > $scope.maxRows){ $scope.newStart = $scope.maxRows };

		if ( $routeParams.queryType == "table" ) {
			$scope.tablelist($scope.dbId, $scope.instance, $scope.tableName, $scope.newStart, $scope.numberOfRows );
		} else if ( $routeParams.queryType == "dataset" ) {
			$scope.getDatasetData($scope.dbId, $scope.viewId, $scope.newStart, $scope.numberOfRows );
		} else {
			$scope.databasequery($scope.dbId, $scope.instance, $scope.theQuery, $scope.newStart, $scope.numberOfRows);
		}
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
		if (!$scope.selectedReferences) $scope.selectedReferences = [];
		$scope.columnSelection = [];
		// here we need to set up the referencedColumns for any relations
		for ( var i in results.columns ) {
			var column = results.columns[i];
			if ( column.referencedTable ) {
			
				// only do this if not already set
				if ( !$scope.referencedColumn[column.columnName] ) {
					var rc = null;
					if ( !column.referencedColumn ) {
						rc = column.alternateColumns[0];
					}
					else {
						rc = column.referencedColumn;
					}
					var reference = {referencedColumn:rc, localColumn:column.columnName, referencedTable:column.referencedTable};
					$scope.columnSelection[column.columnName] = rc;
					$scope.referencedColumn[column.columnName] = reference;
				} else {
					$scope.columnSelection[column.columnName] = $scope.referencedColumn[column.columnName].referencedColumn;
				}
			}
		}
	};
	
	
	
	$scope.tableLoaded = function() {
		//growl.success("table loaded");
		// grab any related data for referenced columns
		// loop through the reference column keys, the keys are the tablename
		for (var columnName in $scope.referencedColumn ) {
			var reference = $scope.referencedColumn[columnName];
			$scope.selectedReferences[reference.localColumn] = [];
			var tableName = reference.referencedTable;
			$scope.getReferencedDatasetForColumn(reference, columnName);
		}
	}
	
	
	$scope.getReferencedDatasetForColumn = function ( reference, columnName ) {
		var tableName = reference.referencedTable;
		var params = {databaseId:$scope.dbId, tableName:reference.referencedTable, columnName:reference.referencedColumn};
		ReferenceColumnData.get (
			params,
			function(results) {
				setTimeout(function() {
					$scope.$apply( function() {
						$scope.referencedColumnData[reference.localColumn] = [];
						$scope.referencedColumnData[reference.localColumn][reference.referencedTable]=results;
						var newReferences = {};
						for (var i in $scope.tableData.rows ) {
							var row = $scope.tableData.rows[i];
							var ref = findRefInDataWithColumnName ( results, reference.localColumn, row );
							var pkeyVal = row.cell[$scope.primaryKey].value;
							newReferences[pkeyVal] = ref;
						}
						$scope.selectedReferences[reference.localColumn] = newReferences;
						// This triggers the Select2 control to update
						$scope.referencesUpdated.count++;
					});
				});
			},
			function(error) {
				$scope.handleError(error);
			}
		);
	};	
	
	$scope.selectTableReference = function ( localColumnName, refTableName ) {
		var selected = $scope.columnSelection[localColumnName];
		console.log(selected);
		var reference = {referencedColumn:selected, localColumn:localColumnName, referencedTable: refTableName};
		$scope.referencedColumn[localColumnName] = reference;
		$scope.getReferencedDatasetForColumn ( reference, refTableName );
		$scope.saveState();
	};

	//
	// Load preferences
	//
	$scope.loadPreferences = function(){
		if (!$scope.referencedColumn) $scope.referencedColumn = [];
		if (State.data.dataviewer && State.data.dataviewer.references){
			for (var i = 0; i < State.data.dataviewer.references.length; i++){
				var pref = State.data.dataviewer.references[i];
				if (pref.project == $routeParams.projectId &&
					pref.database == $scope.dbId &&
					pref.table == $scope.tableName
				){
					$scope.referencedColumn[pref.localColumn] = {referencedColumn:pref.referencedColumn, localColumn:pref.localColumn, referencedTable:pref.referencedTable};
				} 
			}
		}
	}

	//
	// Saves the current view state so it can be restored later
	// 
	$scope.saveState = function(){
		if (!State.data.dataviewer) State.data.dataviewer = {};
		if (!State.data.dataviewer.references) State.data.dataviewer.references = [];

		//
		// Save reference prefs
		//
		for (var selection in $scope.referencedColumn){
			var referencePreference = {};
			referencePreference.project = $scope.project.projectId;
			referencePreference.database = $scope.dbId;
			referencePreference.table = $scope.tableName;
			referencePreference.localColumn = $scope.referencedColumn[selection].localColumn;
			referencePreference.referencedTable = $scope.referencedColumn[selection].referencedTable;
			referencePreference.referencedColumn = $scope.referencedColumn[selection].referencedColumn;

			// if this exists, replace it, otherwise create a new item
			var exists = false;
			for (var i = 0; i < State.data.dataviewer.references.length; i++){
				var pref = State.data.dataviewer.references[i];
				if (pref.project == referencePreference.project &&
					pref.database == referencePreference.database &&
					pref.table == referencePreference.table &&
					pref.localColumn == referencePreference.localColumn &&
					pref.referencedTable == referencePreference.referencedTable
				){
					pref.referencedColumn = referencePreference.referencedColumn;
					exists = true;
				} 
			}
			if (!exists) State.data.dataviewer.references.push(referencePreference);
		}
	};
/*
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
*/
	
	
	

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
				var ref = $scope.selectedReferences[column.columnName][$scope.newRowKey];
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
					var ref = $scope.selectedReferences[column.columnName][pKeyVal];
					if ( ref && ref.dirty ) {
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
	
	$scope.getDatasetData = function ( dbId, datasetId, startRow, numberOfRows ) {
		var params = {databaseId:dbId, datasetId: datasetId, start: startRow, length: numberOfRows };
		DatasetData.get(
			params,
			function(results) {
				$scope.setupFromResults(results);
			},
			function(error) {
				growl.error( gettextCatalog.getString("Tvs006"));
			}
		);
		
	}
	
	
	$scope.getDataset = function ( dbId, datasetId ) {
		var params = {databaseId:dbId, datasetId:datasetId};
		Dataset.get(
			params,
			function(results) {
				$scope.tableView = results;
			},
			function(error) {
				growl.error("Unable to get dataset metadata");
			}
		);
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
		$scope.loadPreferences();
		$scope.tablelist($routeParams.physicalDatabaseId, 
				$routeParams.instance, 
				$routeParams.query, 
				$scope.startRow, 
				$scope.numberOfRows);
	}
	else if ( $routeParams.queryType == "dataset") {
		$scope.viewId = $routeParams.query;
		$scope.getDatasetData($routeParams.physicalDatabaseId, 
				$routeParams.query, 
				$scope.startRow, 
				$scope.numberOfRows);
		
		$scope.getDataset($routeParams.physicalDatabaseId, $routeParams.query);
	}
	else {
		$scope.theQuery = $routeParams.query;
		$scope.databasequery($routeParams.physicalDatabaseId, 
				$routeParams.instance, 
				$routeParams.query, 
				$scope.startRow, 
				$scope.numberOfRows);
		
	}
	
	
	
	$scope.saveAsView = function ( ) {
		var tableView = new Object();
		tableView.viewName = "";
		tableView.viewTable = "";
		tableView.viewDescription = "";
		tableView.viewQuery = $scope.theQuery;
		tableView.viewAuthorization = "private";
		
		ngDialog.openConfirm({
			template: 'datasets/dataset-dialog/datasetDialog.html', 
			controller: 'datasetDialogController', 
			data: { newTableView: tableView }
				}
		).then(
				function(value){
					// create new dataset
					var params = {databaseId:$scope.dbId};
					Dataset.create(
						params,
						tableView,
						function(results) {
							growl.success(gettextCatalog.getString("Tvs010"));
							var explorerPath = "/database-explorer/"
							+$scope.project.projectId+
							"/"+$scope.projectDatabase.logicalDatabaseId+
							"/"+$scope.projectDatabase.dbName+
							"/"+$scope.dbId+
							"/MAIN/"+$scope.project.dbServerPublicAddress
							$location.path(explorerPath);
						},
						function(error) {
							if (error.status ==400) {
								growl.error(  gettextCatalog.getString("Tvs008") );
							}
							else if ( error.status == 406 ) {
								growl.error(gettextCatalog.getString("Tvs014"));
							}
							else {
								growl.error(gettextCatalog.getString("Tvs011"));
							}
							$window.scrollTo(0, 0);

						}
					);
				},
				function(value){}
			);

	}

	
	$scope.export= function() {
		var name = "";
		if ( $scope.queryType == "table" ) {
			name = $scope.projectDatabase.dbName + "_" + $scope.tableName;
		}
		else if ( $scope.queryType == "dataset" ) {
			name = $scope.projectDatabase.dbName + "_" + $scope.tableView.viewName;
		}
		else {
			name = $scope.projectDatabse.dbName + "_SqlQueryExport";
		}
		var exportInfo = {exportName:name+".csv" }; // default export type
		ngDialog.openConfirm({
			template: 'database/components/export-dialog/exportDialog.html',
			controller: 'exportDialogController',
			data: { exportInfo: exportInfo }
		}).then(
			function(value) {
				// okay
				if ( $scope.queryType == "table") {
					var params = {databaseId:$scope.dbId, tableName:$scope.tableName};
					ExportTable.get(
						params,
						function(result) {
							// pick up the response property setup in the service
							var fileData = new Blob([result.response], {type:"text/cdv"});
							FileSaver.saveAs(fileData, exportInfo.exportName);
						}
					)
				}
				else if ( $scope.queryType == "sql" || $scope.queryType == "dataset" ) {
					var theQuery = "";
					if ( $scope.queryType == "sql" ) {
						theQuery = $scope.theQuery;
					}
					else {
						theQuery = $scope.tableView.viewQuery;
					}
					var params = {databaseId:$scope.dbId, q:theQuery};
					ExportQuery.get(
						params,
						function(result) {
							// pick up the response property setup in the service
							var fileData = new Blob([result.response], {type:"text/cdv"});
							FileSaver.saveAs(fileData, exportInfo.exportName);
						}
					)
					
				}
			},
			function(value) {
				// error
				//growl.error(gettextCatalog.getString("Tvs002"));
			}
		)
	};

});

/*
ords.directive("fixOnScroll", function () {
    return function(scope, element, attrs) {
        var fixedDiv = attrs.fixedDiv;
          element.bind("scroll", function() {
              //if(element.scrollLeft())
              //{
                  var leftPos = element.scrollLeft();
                  $(fixedDiv).scrollLeft(leftPos);
				  // re-sync the header widths
				  syncTableWidthWithElement($("#data-table-header-table"));
              //}
          });
      };
  });
  */

//
// Enables dragging to resize column widths
//
ords.directive('columnResizable', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, elem) {
	  //
	  // Watch data loading
	  //
	  scope.$watch('tableData', function(){
		  $timeout(function() {
			elem.colResizable({disabled:true});
		    $(".JCLRgrips").remove();
			// Bind
        	elem.colResizable({
		 	resizeMode:"overflow",
			partialRefresh:true,
		  	postbackSafe:true,
          	liveDrag: true,
          	gripInnerHtml: "<div class='grip2'></div>",
          	draggingClass: "dragging",
		  	minWidth: 140,
          	onDrag: syncTableWidth
			});
			// Set initial sync
			syncTableWidthWithElement(elem)
      	},0);   
	  });

	  // Bind to window resizing
	  $( window ).resize(function(){syncTableWidthWithElement(elem)});

	  // Destroy when finished
	  scope.$on('$destroy', function() {
        elem.colResizable({disabled:true});
		$(".JCLRgrips").remove();
      });   
    }
  };
});
  
/*
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
*/

var INTEGER_REGEXP = /^\-?\d+$/;
ords.directive('validate', function() {
  return {
	restrict: 'A',
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$validators.ords = function(modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          // consider empty models to be valid
          return true;
        }
        if (attrs.validate === 'INTEGER' && INTEGER_REGEXP.test(viewValue)) {
          return true;
        }
		if (attrs.validate === 'VARCHAR'){
			return true;
		}
        return false;
      };
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
				'local-column="'+attrs.localColumn+'"' +
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
					readonly: attrs.readonly,
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
					scope.selectedReferences[attrs.localColumn][attrs.referenceKey] = changedRef;
					//
					// This is all to make the "save changes" button enabled...
					//
					scope.referencesChanged.count++;
					scope.$apply();
				});
				
				scope.$watch('referencesUpdated', function() {
					var newVal = scope.selectedReferences[attrs.localColumn][attrs.referenceKey];
					if ( newVal ) {
						var ds = {value:newVal.value, label:newVal.label};
						element.select2("data", ds);
					}
				}, true);
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

//
// Sync all tables with resizable columns in the first table (header)
//
var syncTableWidth = function(e){
	syncTableWidthWithElement(e.currentTarget);
}
var syncTableWidthWithElement = function(parent){
    $(".data-table").filter(function(){return $(this).attr("id") != $(parent).attr("id")}).each(function(){

		//Match overall table width
		$(this).parent().parent().css("min-width", $(parent).css("width"));
		$(this).css("min-width", $(parent).css("min-width"));

        //Match the width
        $("tr td,th", this).each(function(index){
        	$(this).css("width", $("tr th:nth-of-type("+(index+1)+")", parent).css("width"))
        });
        //Match the grip's position
        $(this).prev().find(".JCLRgrip").each(function(index){
           	$(this).css("left",$(parent).prev().find(".JCLRgrip:nth-of-type("+(index+1)+")").css("left"));
        });

    }); 
}



