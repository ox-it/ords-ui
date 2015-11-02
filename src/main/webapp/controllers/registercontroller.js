ords.controller('registerController', function($rootScope, $scope, $location, User, growl) {
	
	//
	// Submit fields in new project form to create a new project
	//
	$scope.register=function(){
		if ($scope.registrationForm.$valid) {
			User.save(
			    $scope.user,
				function(){
					growl.success("Registration submitted - check your email for your verification link");
					$location.path("/");
				},
				function(){
					growl.error("There was a problem with your registration");
					$location.path("/");
				}
			);    
		} else {
			growl.error("Your registration details aren't correct; check you've provided a name and email address.");
		}
	}
	
});