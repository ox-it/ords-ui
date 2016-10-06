'use strict';


ords.controller('explorerController', function ($scope, $routeParams, $location, DatabaseStructure, ListDatasets, Dataset, Project, ProjectDatabase, DoQuery, AuthService, growl, gettextCatalog, ngDialog){
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
	
	$scope.updateDatasetList = function ( ) {
		ListDatasets.query(
			pathParams,
			function(inDatasetList) {
				$scope.datasetList = inDatasetList;
			},
			function(error) {
				growl.error( "Unable to get dataset list for database");
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
				growl.error("Unable to delete dataset, please contact support");
			}
		);
	}
});