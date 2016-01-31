angular.module( "ords" ).directive(
	'profile', 
	function() {
  	  	return {
    		controller:  function($rootScope, $scope, $http, $location, growl, gettextCatalog){
    			
				//
				// Perform a logout
				//
				$scope.logout = function(){
					$http(
						{
					    method: 'DELETE',
					    url: "/api/1.0/user/logout",
					}).then(
						function successCallback(response){
							growl.success( gettextCatalog.getString("Logout200") )
							$rootScope.projects = null;
							$rootScope.loggedIn="no";
							$location.path("/");
						},
						function errorCallback(response){
							if (response.status === 400) { growl.error( gettextCatalog.getString("Logout400") ) };
							if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };			
						}
					);
				}
				
    		},
    		templateUrl: 'components/profile/profile.html'
  	  	}
	}
);