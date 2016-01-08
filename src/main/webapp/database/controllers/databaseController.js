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
	
	
	//
	// Delete logical DB
	//
	$scope.deleteDatabase = function(){
		
		//
		// Delete the ProjectDatabase
		//
		
		//
		// Delete the Group
		//
		
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
	// Export
	//
	$scope.exportDatabase = function(){
		
	}
	
	//
	// Set current MAIN as MILESTONE
	//
	$scope.setAsMilestoneVersion = function(){
		
	}
	
	
});