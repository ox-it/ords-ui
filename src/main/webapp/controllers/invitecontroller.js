ords.controller('inviteController', function($rootScope, $scope, $routeParams, $location, $http, growl, gettextCatalog, User, Project, Invitation, AuthService) {
		
	//
	// Conduct auth check - we need the user to log in before we can complete sign-up in an SSO setup.
    // Comment this out when allowing self-registration and password-based access control
	//
	AuthService.check();
    
    //
    // An invitation can be followed in a number of ways
    //
    // 1. A non-user follows the invite link. They have never registered. 
    // 2. A user follows the invite link. They are logged in.
    // 3. A user follows the invite link. They aren't logged in.
    //
    // If password generation is on, in the case of (1) we have to show a password field
    //
   
    if ($routeParams.code){
            User.lookup(
                {code:  $routeParams.code},
                function(){
                    $scope.needsPassword = false;
                },
                function(response){
                    $scope.needsPassword = true;
                }
            );
    } else {
            $scope.needsPassword = false;
    }
    
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
	
	$scope.editInvitation = function(){
		Invitation.update(
			{id:$scope.project.projectId, inviteId: $scope.invite.id},
			$scope.invite,
			function(){
				growl.success( gettextCatalog.getString("InvPut200") );
				$location.path("/project/"+$scope.project.projectId);
			},
			function(response){
				if (response.status === 400) { growl.error( gettextCatalog.getString("InvPut400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("InvPut404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("/project/"+$scope.project.projectId);
			}
	
		);
	}
	
	//
	// If there is a project id, get the project
	//
	if ($routeParams.id) {
		$scope.project = Project.get(
			{id: $routeParams.id}
		);
	};
		
	//
	// If there is an invite id, get the invite
	//
	if ($routeParams.inviteId) {
		$scope.invite = Invitation.get(
			{id: $routeParams.id, inviteId: $routeParams.code}
		)
        $scope.invite.$promise.then($scope.getUser);
	};
    
});