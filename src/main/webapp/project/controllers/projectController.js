'use strict';

ords.controller('projectController', function ($scope, $routeParams, AuthService, Project, ProjectDatabase, User, Member, Invitation, growl, gettextCatalog) {
	
	//
	// Process a request to remove a project member
	//
	$scope.removeMember = function(id){
		Member.delete(
			{ id: $routeParams.id, roleid: id},
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
	
	$scope.removePendingMember = function(id){
		Invitation.delete(
			{ id: $routeParams.id, inviteId: id},
			function(){
				growl.success( gettextCatalog.getString("InvDelete200") );
				$scope.pending = Invitation.query({ id: $routeParams.id });
			},
			function(response){
			
				if (response.status === 400){ growl.error(  gettextCatalog.getString("InvDelete400") ) };
				if (response.status === 403){ growl.error(  gettextCatalog.getString("InvDelete403") ) };
				if (response.status === 404){ growl.error(  gettextCatalog.getString("InvDelete404") ) };
				if (response.status === 410){ growl.error(  gettextCatalog.getString("Gen410") ) };
				if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };	
			}
		);
	}
	
	//
	// Get the current Project
	//
	$scope.project = Project.get({ id: $routeParams.id }, function(){
		
		//
		// When we have a project, we can check if this is a public project.
		//
		if ($scope.project && $scope.project.privateProject){					
			//
			// This page doesm't make sense to view
			// without being logged in, so redirect
			// back to the home view
			//
			AuthService.check();
			
		}
		
	});
	
	//
	// Get the Invitees (pending members) of the current Project
	//
	$scope.pending = Invitation.query({ id: $routeParams.id });	
	
	//
	// Get the Members of the current Project
	//
	$scope.members = Member.query({ id: $routeParams.id });
	
	//
	// Get the Databases of the current Project
	//
	$scope.databases = ProjectDatabase.query({ id: $routeParams.id });
});