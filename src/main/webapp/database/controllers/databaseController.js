'use strict';

ords.controller('databaseController', function ($rootScope, $scope, $q, $location, $routeParams, AuthService, Project, Group, ProjectDatabase, Databases, User, growl, gettextCatalog) {
	
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
	// Get the current "Database"
	//
	//$scope.group = Group.get({ id: $routeParams.databaseId})
	
	//
	// Get the project database
	//
	ProjectDatabase.get(
		{id:$routeParams.id, databaseId: $routeParams.databaseId },
		function(response){
			
			//
			// Logical Database (Group)
			//
			$scope.group = Group.get(
				{id: response.databaseId},
				function(response){
					
					//
					// Physical Databases
					//
					$scope.databases = Databases.query(
						{id: response.logicalDatabaseId},
						function(response){							
							for (var i = 0; i < $scope.databases.length; i++){
								
								//
								// MAIN
								//
								if ($scope.databases[i].databaseType === "MAIN"){
									$scope.main = $scope.databases[i];
								}
					
								//
								// MILESTONE
								//
								if ($scope.databases[i].databaseType === "MILESTONE"){
									$scope.milestone = $scope.databases[i];
								}
					
								//
								// TEST
								//
								if ($scope.databases[i].databaseType === "TEST"){
									$scope.test = $scope.databases[i];
								}
							}
						}
					);
					
					//
					// Indicate everything is now loaded
					//
					$q.all([
					    $scope.databases.$promise,
					    $scope.project.$promise,
						$scope.group.$promise
					]).then(function() { 
					    $scope.allLoaded = true;
					});
					
				}
			);
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