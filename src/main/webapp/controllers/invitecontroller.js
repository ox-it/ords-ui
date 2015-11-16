ords.controller('inviteController', function($rootScope, $scope, $routeParams, $location, $http, growl, gettextCatalog, User, Project, AuthService) {
		
	//
	// Conduct auth check - we need the user to log in before we can complete sign-up
	//
	AuthService.check();
	
	//
	// Complete signup process
	//
	$scope.register=function(){
		if ($scope.registrationForm.$valid) {
			User.save(
				{i: $routeParams.code},
			    $scope.user,
				function(){
					$scope.acceptInvitation();
				},
				function(response){
					
					if (response.status === 400) { growl.error( gettextCatalog.getString("RInvitePost400") ) };
					if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
					if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
					
					$location.path("/");
				}
			);    
		} else {
			growl.error("Your registration details aren't correct; check you've provided a name and email address.");
		}
	}
	
	//
	// Complete invites?
	//
	$scope.acceptInvitation = function(){
		var responsePromise = $http.post("/api/1.0/project/invitation/" + $routeParams.code);
		
		responsePromise.success(function(data, status, headers, config){
			growl.success( gettextCatalog.getString("RInvitePost200") );
			$location.path("/projects")
		});
	
		responsePromise.error(function(data, status, headers, config){				
			if (status === 400){ growl.error(  gettextCatalog.getString("RInvitePost400") ) };
			if (status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
			if (status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };	
			$location.path("/")
		});
	}
	
});