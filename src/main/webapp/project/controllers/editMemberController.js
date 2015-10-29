'use strict';

ords.controller('editMemberController', function ($scope, $location, $routeParams, AuthService, Project, User, Member, growl) {
	
	//
	// This page doesm't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId });
	$scope.member = Member.get({ id: $routeParams.projectId, roleid: $routeParams.memberId });
	
	$scope.editMember = function(){
		Member.update(
			{id:$scope.project.projectId, roleid: $scope.member.id}, 
			$scope.member,
			function(){
				growl.success("The project member's authorisation has been updated");
				$location.path("#/project/"+$scope.project.projectId);
			},
			function(){
				growl.error("There was a problem saving your changes");
				$location.path("#/project/"+$scope.project.projectId);
			}
	
		);
	}
});