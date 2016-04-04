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
				$scope.getProjectDatabases();
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
				growl("error"); // TODO
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
				growl("error"); // TODO
			}
		);
		
	};
	
	
	$scope.mergeTestToMain = function() {
        var params = {databaseId:$scope.main.physicalDatabaseId};
		var databaseRequest = {instance:"TEST", cloneFrom:$scope.test.physicalDatabaseId, databaseServer:$scope.main.databaseServer, groupId:$scope.logicalDatabaseId};
		DatabaseStructure.put(
			params,
			databaseRequest,
			function(result) {
				$scope.getProjectDatabases();
			},
			function(error) {
				growl("error"); // TODO
			}	
		);
	};
	
	
	$scope.getProjectDatabases();
	
});