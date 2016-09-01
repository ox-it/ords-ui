ords.controller('registerController', function($rootScope, $scope, $location, User, growl, gettextCatalog) {
	
	$scope.register=function(){
		if ($scope.registrationForm.$valid) {
			User.save(
			    $scope.user,
				function(){
					growl.success( gettextCatalog.getString("UserPost200") );
					$location.path("/");
				},
				function(response){
					
					if (response.status === 400) { growl.error( gettextCatalog.getString("UserPost400") ) };
					if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
					if (response.status === 409) { growl.error( gettextCatalog.getString("UserPost409 {{email}}", {email: $scope.email}) ) };
					if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
					
					$location.path("/");
				}
			);    
		} else {
			growl.error("Your registration details aren't correct; check you've provided a name and email address.");
		}
	}
	
});