'use strict';

ords.controller('databaseController', function ($rootScope, $scope, $q, $location, $routeParams, AuthService, Project, ProjectDatabase, DatabaseStructure, ODBC, User, growl, gettextCatalog) {
	
	//
	// This page doesn't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	

	//
	// Get the current Project
	//
	$scope.id = $routeParams.id;
	$scope.project = Project.get({ id: $routeParams.id });
	
	$scope.logicalDatabaseId = $routeParams.databaseId;
	//
	// Get the Project Databases function
	//	
	$scope.getProjectDatabases = function () {
		ProjectDatabase.get(
			{id:$scope.id, databaseId: $scope.logicalDatabaseId },
			function(response){	
				$scope.database = response;

				//
                // Convert the date strings in the model into actual Date objects
                //
                //$scope.database.creationDate = new Date( Date.parse($scope.database.creationDate) );
                
                $scope.main = null;
                $scope.milestone = null;
                $scope.test = null;
                
				//
				// Physical Databases
				//					
				for (var i = 0; i < $scope.database.databaseVersions.length; i++){
					
					//
					// MAIN
					//
					if ($scope.database.databaseVersions[i].entityType === "MAIN"){
						$scope.main = $scope.database.databaseVersions[i];
					}
					//
					// MILESTONE
					//
					if ($scope.database.databaseVersions[i].entityType === "MILESTONE"){
						$scope.milestone = $scope.database.databaseVersions[i];
					}
					//
					// TEST
					//
					if ($scope.database.databaseVersions[i].entityType === "TEST"){
						$scope.test = $scope.database.databaseVersions[i];
					}
				}
				//
				// Indicate everything is now loaded
				//
				$q.all([
				    $scope.database.$promise,
				    $scope.project.$promise,
				]).then(function() { 
				    $scope.allLoaded = true;
				});
			}
		);
	};
	
	
	//
	// Update logical DB
	//
	$scope.updateDatabase = function(){

		var params = {id:$scope.project.projectId, databaseId:$scope.database.logicalDatabaseId};
		ProjectDatabase.update(
			params,
			$scope.database,
			function(){
                growl.success( gettextCatalog.getString("ProDbPut200") );
				$location.path("/project/"+$scope.project.projectId+"/"+$scope.database.logicalDatabaseId);
			},
			function(response) {
					if (response.status === 400){ growl.error(  gettextCatalog.getString("ProDbPut400") ) };
					if (response.status === 403){ growl.error(  gettextCatalog.getString("Gen403") ) };
					if (response.status === 404){ growl.error(  gettextCatalog.getString("ProDbPut404") ) };
					if (response.status === 410){ growl.error(  gettextCatalog.getString("Gen410") ) };
					if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };
			}
		);
	}

	//
	// Delete logical DB
	//
	$scope.deleteDatabase = function(){
		
		for ( var dbVersion in $scope.database.databaseVersions ) {
			var params = {databaseId:dbVersion.physicalDatabaseId};
			DatabaseStructure.delete(params);
		}
		var params = {id:$scope.project.projectId, databaseId:$scope.database.logicalDatabaseId};
		ProjectDatabase.delete(
			params,
			function(result) {
                growl.success( gettextCatalog.getString("ProDbDelete200") );
				$location.path("/project/"+$scope.project.projectId);
			}
		);
		
	}
    
    //
    // Request ODBC access
    //
    $scope.requestODBCAccess = function(){
        var params = {databaseId:$scope.main.physicalDatabaseId};
        var request = {};
        
        ODBC.save(
            params,
            request,
            function(result){
              $scope.odbc = result;
            }  
        );
        
    }
    $scope.clearOdbc = function(){
        $scope.odbc = null;
    }
	
	//
	// Delete phystical DBs
	//
	$scope.deleteMainDatabase = function(){
		var params = {databaseId:$scope.main.physicalDatabaseId};
		DatabaseStructure.delete(
			params,
			function(result) {
				$scope.getProjectDatabases();
			}
		);
		
	}
	
	//
	// Delete milestone DB
	//
	$scope.deleteMilestoneDatabase = function(){
		var params = {databaseId:$scope.milestone.physicalDatabaseId};
		DatabaseStructure.delete(
			params,
			function(result) {
				$scope.getProjectDatabases();
			}
		);		
	}
	
	//
	// Export
	//
	$scope.exportDatabase = function(){
		
	}
	
	
	$scope.deleteTestDatabase = function() {
		var params = {databaseId:$scope.test.physicalDatabaseId};
		DatabaseStructure.delete(
			params,
			function(result) {
                $scope.test = null;
				$scope.getProjectDatabases();
			}
		);
		
	}
	
	//
	// Set current MAIN as MILESTONE
	//
	$scope.setAsMilestoneVersion = function(){
		var params = {databaseId:$scope.main.physicalDatabaseId};
		var databaseRequest = {instance:"MILESTONE", databaseName:'not used', databaseServer:$scope.main.databaseServer, groupId:$scope.logicalDatabaseId};
		DatabaseStructure.clone(
			params,
			databaseRequest,
			function(result) {
				$scope.getProjectDatabases();
			},
			function(error) {
				growl.error("error"); // TODO
			}
		);
	};
	
	
	$scope.setMainAsTestVersion = function() {
		var params = {databaseId:$scope.main.physicalDatabaseId};
		var databaseRequest = {instance:"TEST",databaseName:'not used', databaseServer:$scope.main.databaseServer, groupId:$scope.logicalDatabaseId};
		DatabaseStructure.clone(
			params,
			databaseRequest,
			function(result) {
				$scope.getProjectDatabases();
			},
			function(error) {
				growl.error("error"); // TODO
			}
		);
		
	};
	
	
	$scope.mergeTestToMain = function() {
        var params = {databaseId:$scope.main.physicalDatabaseId};
		var databaseRequest = {instance:"TEST", cloneFrom:$scope.test.physicalDatabaseId, databaseServer:$scope.main.databaseServer, groupId:$scope.logicalDatabaseId};
		DatabaseStructure.merge(
			params,
			databaseRequest,
			function(result) {
				$scope.getProjectDatabases();
			},
			function(error) {
				growl.error("error"); // TODO
			}	
		);
	};
	
	
	$scope.getProjectDatabases();
	
});