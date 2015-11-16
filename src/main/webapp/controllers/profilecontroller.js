ords.controller('profileController', function($rootScope, $scope, $routeParams, $location, $http, growl, gettextCatalog, User, AuthService) {
	
		
	//
	// Conduct auth check
	//
	AuthService.check();
	
	$scope.user = $rootScope.user;
	
	$scope.updateProfile = function(){
		
		User.update(
			{id:$scope.user.userId},
			$scope.user,
			function(){
				growl.success( gettextCatalog.getString("UserPut200") );
				$location.path("#/project/");
			},
			function(response){
				
				if (response.status === 400) { growl.error( gettextCatalog.getString("UserPut400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 404) { growl.error( gettextCatalog.getString("UserPut404") ) };
				if (response.status === 410) { growl.error( gettextCatalog.getString("Gen410") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
				
				$location.path("#/project/");
			}
	
		);
	}
	
});