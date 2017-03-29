'use strict';


ords.controller('explorerController', function ($scope,
												$routeParams, 
												$location, 
												DatabaseStructure, 
												ListDatasets, 
												Dataset, 
												Project, 
												ProjectDatabase,
												User,
												DoQuery, 
												AuthService,
												FileUpload,
												growl, 
												gettextCatalog, 
												ngDialog){
	AuthService.check();
	
	//
	// Don't show VQD by default
	//
	$scope.showVQD = false;
	sessionStorage.restorestate == "true"

	$scope.project = Project.get({ id: $routeParams.projectId});
	
	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	$scope.physicalDatabaseId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;
	$scope.server = $routeParams.server;
	
	// 
	// Upload stuff
	User.get(
			function (response) {
				$scope.maxUpload = response.maximumUploadSize;
			},
			function (error) {
				growl.error(gettextCatalog.getString("Fpp001"));
			}
		);

	$scope.loaded = 0;
	$scope.total = 0;
	
	
	var pathParams = {databaseId:$routeParams.physicalDatabaseId};
	
	$scope.getTableList = function() {
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
	};
	
	$scope.updateDatasetList = function ( ) {
		ListDatasets.query(
			pathParams,
			function(inDatasetList) {
				$scope.datasetList = inDatasetList;
			},
			function(error) {
				growl.error( gettextCatalog.getString("Tvs006"));
			}
		);		
	};
	
	$scope.updateDatasetList();
	
	$scope.getAPILink = function(id){
		$scope.datasetId = id;

		ngDialog.openConfirm({
			template: 'database-explorer/components/apidialog/apidialog.html', 
			controller: 'apidialog', 
			scope: $scope
		});
	}

	//
	// Clear the query
	//
	$scope.clearQuery = function(){
		vqd.clear();
	}

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
	
	
	$scope.editDataset = function(datasetId) {
		//get the selected dataset info so we can pass it to the datasetDialog and subsequently update
		// any edits created.
		var params = {databaseId:$routeParams.physicalDatabaseId, datasetId: datasetId};
		Dataset.get(
			params,
			function(results) {
				var tableView = results;
				$scope.openDatasetDialogForEdit(tableView);
			},
			function(error) {
				growl.error(gettextCatalog.getString("Tvs006"));
			}
		);
	};
	
	$scope.openDatasetDialogForEdit = function(tableView) {
		ngDialog.openConfirm({
			template: 'datasets/dataset-dialog/datasetDialog.html', 
			controller: 'datasetDialogController', 
			data: { newTableView: tableView }
		}).then(
			function(value){
				// update dataset
				$scope.updateDataset(tableView);
			},
			function(value) {
				//do nothing
			}
		);
	};
	
	
	$scope.showImport = function() {
		// build usedNameList
		$scope.tableNames = "";
		for (var table in $scope.tableList.tables) {
			$scope.tableNames += table + ",";
		}
		if ($scope.tableNames.length > 0 ) {
			$scope.tableNames = $scope.tableNames.substring(0,$scope.tableNames.length-1);
		}
		$scope.importInfo = {importName:"",csvFile:null }
		$scope.importDialog = ngDialog.open({
			template: 'database/components/import-dialog/importDialog.html',
			scope: $scope,
			data: {importInfo:info}
		});
	};
	
	
	$scope.importCSVFile = function() {
	    var info = $scope.importInfo;
        if ( ($scope.maxUpload * 1000000) < info.csvFile.size ) {
        	growl.error(sprintf(gettextCatalog.getString("Dat031"),$scope.maxUpload+" MBs"));
        	return;
        }
		if ( !info.csvFile ) {
			growl.warning(gettextCatalg("Dat404"));
			return;
		}
		var url = '/api/1.0/database/'+$scope.physicalDatabaseId+'/import/'+info.importName+'/'+$scope.server;
		FileUpload.uploadFileToUrl(info.csvFile, url, $scope.importSuccess, $scope.importError, $scope.progress);
	};
	
	
	$scope.importSuccess = function(result) {
		$scope.importDialog.close();
		if ( result.status == 201 ) {
			growl.success(gettextCatalog.getString("Dat032"));
			$scope.getTableList();
		}
   	 	else if (response.status == 406) {
   	 		growl.error(gettextCatalog.getString("Dat031"));
   	 	}
   	 	else {
   	 		growl.error(gettextCatalog.getString("Dat033"));
   	 	}
	};
	
	$scope.importError = function(result) {
		$scope.importDialog.close();
		growl.error(gettextCatalog("Dat033"));
	};
	
    $scope.progress = function(loaded, total) {
   	 $scope.$apply(function() {
   		 if ( loaded > 0 ) $scope.loaded = loaded/1000.0;
       	 if ( total > 0 ) $scope.total = total/1000.0;
   	 })
    };
	
	$scope.updateDataset = function ( tableView ) {
		var params = {databaseId:$routeParams.physicalDatabaseId, datasetId: tableView.id};
		Dataset.update(
			params,
			tableView,
			function(results) {
				growl.success(gettextCatalog.getString("Tvs013"));
				$scope.updateDatasetList();
			},
			function(error) {
				if (error.status ==400) {
					growl.error(  gettextCatalog.getString("Tvs008") );
				}
				else if ( error.status == 406 ) {
					growl.error(gettextCatalog.getString("Tvs014"));
				}
				else {
					growl.error(gettextCatalog.getString("Tvs012"));
				}
				$window.scrollTo(0, 0);
			}
		);
	};
	
	$scope.deleteDataset = function ( datasetId ) {
		var params = {databaseId:$routeParams.physicalDatabaseId, datasetId:datasetId};
		Dataset.delete(
			params,
			function(results) {
				growl.success(gettextCatalog.getString("Tvs015"));
				$scope.updateDatasetList();
			},
			function(error) {
				growl.error(gettextCatalog.getString("Tvs017"));
			}
		);
	};
	
	//set off gets
	$scope.getTableList();
});