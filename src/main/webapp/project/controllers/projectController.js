'use strict';

ords.controller('projectController', function ($scope, $routeParams, AuthService, Project, ProjectDatabase, Group, User, Member, growl, gettextCatalog) {
	
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	//
	// Process a request to remove a project member
	//
	$scope.removeMember = function(id){
		Member.delete({ id: $routeParams.id, roleid: id},
			function(){
				growl.success( gettextCatalog.getString("MemDelete200") );
				$scope.members = Member.query({ id: $routeParams.id });
			},
			function(response){
				
				if (response.status === 400){ growl.error(  gettextCatalog.getString("MemDelete400") ) };
				if (response.status === 403){ growl.error(  gettextCatalog.getString("MemDelete403") ) };
				if (response.status === 404){ growl.error(  gettextCatalog.getString("MemDelete404") ) };
				if (response.status === 410){ growl.error(  gettextCatalog.getString("Gen410") ) };
				if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };	
			}
		);

	}
	
	//
	// Get the current Project
	//
	$scope.project = Project.get({ id: $routeParams.id });
	
	//
	// Get the Members of the current Project
	//
	$scope.members = Member.query({ id: $routeParams.id });
	
	//
	// Get the Databases of the current Project
	//
	$scope.databases = [];
	ProjectDatabase.query(
		{ id: $routeParams.id },
		function(response){

			for (var i = 0; i < response.length; i++){
				//
				// Add the ProjectDatabase to scope
				//
				var database = response[i];			
				database.db = Group.get({id: database.databaseId});
				$scope.databases.push(database);
			}
		}
	);
});