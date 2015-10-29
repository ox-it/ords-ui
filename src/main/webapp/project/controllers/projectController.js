'use strict';

ords.controller('projectController', function ($scope, $routeParams, AuthService, Project, User, Member, growl) {
	
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	$scope.editMember = function(id){
		growl.warning("Edit Member clicked");
	}
	
	$scope.removeMember = function(id){
		Member.delete({ id: $routeParams.id, roleid: id},
			function(){
				growl.success("Project member removed");
				$scope.members = Member.query({ id: $routeParams.id });
			},
			function(){
				growl.error("There was a problem removing this project member");				
			}
		);

	}
	
	$scope.project = Project.get({ id: $routeParams.id });
	
	$scope.members = Member.query({ id: $routeParams.id });
});