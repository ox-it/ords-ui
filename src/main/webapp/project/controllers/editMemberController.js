'use strict';

ords.controller('editMemberController', function ($scope, $location, $routeParams, AuthService, Project, User, Member, growl, gettextCatalog) {
	
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
				growl.success( gettextCatalog.getString("MemPut200") );
				$location.path("#/project/"+$scope.project.projectId);
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("MemPut400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("MemPut404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/"+$scope.project.projectId);
			}
	
		);
	}
});