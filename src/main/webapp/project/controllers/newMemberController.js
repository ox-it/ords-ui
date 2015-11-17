'use strict';

ords.controller('newMemberController', function ($rootScope, $scope, $location, $routeParams, AuthService, Project, User, Member, growl, gettextCatalog, Invitation) {
	
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	//
	// Get the current Project
	//
	$scope.project = Project.get({ id: $routeParams.id });
	
	//
	// Flag for switching the type of form
	//
	$scope.isInvite = false;
	
	//
	// Process the POST to create the Member
	//
	$scope.newMember = function(){
				
		//
		// Check the user specified exists - if not, we want to show the Invite page instead
		//
		User.lookup(
			{id:$scope.member.principalName},
			function(){
				$scope.createNewMember();
			},
			function(response){
				if (response.status === 404){
					$scope.isInvite = true;
					$scope.invitation = {};
					$scope.invitation.email = $scope.member.principalName;
					$scope.invitation.roleRequired = $scope.member.role;
				}
			}
		)
		

	}
	
	//
	// Actually add the member to the project
	//
	$scope.createNewMember = function(){
				
		Member.save(
			{
				id:$scope.project.projectId
			},
			$scope.member,
			function(){
				growl.success( gettextCatalog.getString("MemPost200") );
				$location.path("#/project/"+$scope.project.projectId);
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("MemPost400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("MemPost404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/"+$scope.project.projectId);
			}
	
		);
	}
	
	//
	// Create a new invitation request
	//
	$scope.newInvitation = function(){
		
		$scope.invitation.projectId = $scope.project.projectId;
		$scope.invitation.sender = $rootScope.user.name;
		
		Invitation.save(
			{
				id:$scope.project.projectId
			},
			$scope.invitation,
			function(){
				growl.success( gettextCatalog.getString("InvPost200") );
				$location.path("#/project/"+$scope.project.projectId);
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("InvPost400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("InvPost404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/"+$scope.project.projectId);
			}
	
		);
	}
});