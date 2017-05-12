ords.controller('mainController', function($rootScope, $location, AuthService) {

	$rootScope.targetLocation = $location.absUrl();
		
	//
	// Conduct auth check
	//
	AuthService.check();
	
});