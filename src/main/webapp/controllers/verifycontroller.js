ords.controller('verifyController', function($rootScope, $scope, $routeParams, $location, $http, growl, gettextCatalog) {
	
	//
	// Verify email
	//
	var responsePromise = $http.get("/api/1.0/user/verifyemail/" + $routeParams.code);
		
	responsePromise.success(function(data, status, headers, config){
		growl.success( gettextCatalog.getString("Verify200") );
		$location.path("/projects")
	});
	
	responsePromise.error(function(data, status, headers, config){				
		if (status === 400){ growl.error(  gettextCatalog.getString("Verify400") ) };
		if (status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };	
		$location.path("/")
	});
	
});