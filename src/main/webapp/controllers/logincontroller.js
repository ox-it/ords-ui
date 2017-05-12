ords.controller('loginController', function($rootScope, $scope, $http, $location, User, Project, growl, gettextCatalog) {
	
	$rootScope.targetLocation = $location.absUrl();

	$scope.login = function(){
		
		var obj = {};
		obj.username = $scope.user.name;
		obj.password = $scope.user.password;
		obj.rememberMe = true;
		
		$http(
			{
		    method: 'POST',
		    url: "/api/1.0/user/login",
			transformRequest: function(obj) {
			        var str = [];
			        for(var p in obj)
			        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
			        return str.join("&");
			    },
			data:obj,
		    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		}).then(
			function successCallback(response){
				
 	 			//
 	 			// Load initial projects
 	 			//
 	 			Project.query({}, function(data){
 	 				$rootScope.projects = data;
 	 			});
				
				growl.success( gettextCatalog.getString("Login200") );
				$location.path("/");
			},
			function errorCallback(response){
				if (response.status === 400) { growl.error( gettextCatalog.getString("Login400") ) };
				if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
				if (response.status === 401) { growl.error( gettextCatalog.getString("Login401") ) };
				if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };			
			}
		);
	}
	
	$scope.signup=function(){
		if ($scope.signUpForm.$valid) {
			User.save(
			    $scope.user,
				function(){
					growl.success( gettextCatalog.getString("UserPost200") );
					$location.path("/");
				},
				function(response){
					
					if (response.status === 400) { growl.error( gettextCatalog.getString("UserPost400") ) };
					if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
					if (response.status === 409) { growl.error( gettextCatalog.getString("UserPost409 {{email}}", {email: $scope.user.email} ) ) };
					if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
					
					$location.path("/");
				}
			);    
		} else {
			growl.error("Your registration details aren't correct; check you've provided a name and email address.");
		}
	}
	
});