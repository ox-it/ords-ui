'use strict';

ords.controller('databaseController', function ($rootScope, $scope, $q, $location, $routeParams, AuthService, Project, ProjectDatabase, User, growl, gettextCatalog) {
	
	//
	// This page doesn't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();

	//
	// Get the current Project
	//
	$scope.project = Project.get({ id: $routeParams.id });
	
	//
	// Get the Project Database
	//	
	$scope.getDatabase = function(){
		ProjectDatabase.get(
			{id:$routeParams.id, databaseId: $routeParams.databaseId },
			function(response){	
				$scope.database = response;
				//
				// Physical Databases
				//					
				for (var i = 0; i < $scope.database.databaseVersions.length; i++){
				
					//
					// MAIN
					//
					if ($scope.database.databaseVersions[i].databaseType === "MAIN"){
						$scope.main = $scope.database.databaseVersions[i];
					}
	
					//
					// MILESTONE
					//
					if ($scope.database.databaseVersions[i].databaseType === "MILESTONE"){
						$scope.milestone = $scope.database.databaseVersions[i];
					}
	
					//
					// TEST
					//
					if ($scope.database.databaseVersions[i].databaseType === "TEST"){
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
	}
	
	$scope.submitDatabaseForm = function(){
		$scope.database.databaseProjectId = $scope.project.projectId;
		$scope.database.databaseType = "relational";
		$scope.database.numberOfPhysicalDatabases = 0;
		
		//
		// Create or Update?
		//
		if ($routeParams.databaseId){
			$scope.updateDatabase();
		} else {
			$scope.createDatabase();
			
		}
	}
	
	$scope.updateDatabase = function(){
		ProjectDatabase.update(
			{
				id:$scope.project.projectId, 
				databaseId: $routeParams.databaseId
			},
			$scope.database, 
			function(response){
				growl.success( gettextCatalog.getString("ProDbPut200") );
				$location.path("#/project/"+$scope.project.projectId);
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("ProDbPut400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("ProDbPut404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/"+$scope.project.projectId);
			}
		);
	}
	
	$scope.createDatabase = function(){
		ProjectDatabase.save(
			{
				id:$scope.project.projectId
			},
			$scope.database, 
			function(response){
				growl.success( gettextCatalog.getString("ProDbPost201") );
				$location.path("#/project/"+$scope.project.projectId);
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("ProDbPost400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("ProDbPost404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/"+$scope.project.projectId);
			}
		);
	}
	
	
	//
	// Delete logical DB
	//
	$scope.deleteDatabase = function(){
		
		//
		// Delete the ProjectDatabase
		//
		ProjectDatabase.delete(
			{id:$routeParams.id, databaseId: $routeParams.databaseId },
			function(){
				growl.success( gettextCatalog.getString("ProDbDelete200") );
				
				//
				// Delete database versions
				// 
				$scope.deleteMainDatabase();
				$scope.deleteMilestoneDatabase ();
				$scope.deleteTestDatabase();
				
				//
				// Show project view
				//
				$location.path("/project/"+$scope.project.projectId);
				
			},
			function(response){
				
				if (response.status === 400){ growl.error(  gettextCatalog.getString("ProDbDelete400") ) };
				if (response.status === 403){ growl.error(  gettextCatalog.getString("ProDbDelete403") ) };
				if (response.status === 404){ growl.error(  gettextCatalog.getString("ProDbDelete404") ) };
				if (response.status === 410){ growl.error(  gettextCatalog.getString("Gen410") ) };
				if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };	
			}
		);

		
	}
	
	//
	// Delete phystical DBs
	//
	$scope.deleteMainDatabase = function(){
		
	}
	
	//
	// Delete milestone DB
	//
	$scope.deleteMilestoneDatabase = function(){
		
	}
	
	//
	// Delete milestone DB
	//
	$scope.deleteTestDatabase = function(){
		
	}
	
	//
	// Export
	//
	$scope.exportDatabase = function(){
		
	}
	
	//
	// Set current MAIN as MILESTONE
	//
	$scope.setAsMilestoneVersion = function(){
		
	}
	
	//
	// If we're on a page with a database Id, get the Database
	//
	if ($routeParams.databaseId){
		$scope.label = "Save Changes";
		$scope.getDatabase();
	} else {
		$scope.label = "Add";
	}
	
	
	
});