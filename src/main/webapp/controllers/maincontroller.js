ords.controller('mainController', function($rootScope,$location, User, Project) {
	
		//
		// If we're not logged in, redirect to login
		//		
		$rootScope.user = User.get(
			 function successCallback() { 
				$rootScope.loggedIn="yes"
	 			//
	 			// Load initial projects
	 			//
	 			Project.query({}, function(data){
	 				$rootScope.projects = data;
	 			});
				$location.path("/projects"); 
			 }, 
			 function errorCallback() { 
				 $rootScope.loggedIn="no"
				 $location.path("/"); 
			 }				
		);
	
});