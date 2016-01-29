angular.module( "ords" ).directive(
	'welcome', 
	function() {
  	  	return {
    		controller: function($rootScope, $scope, gettextCatalog) {
				
				//
				// Check if the user needs email verification
				//
    			$scope.showPendingMessage = function(){
    				if ($rootScope.user){
    					if ($rootScope.user.status === "PENDING_EMAIL_VERIFICATION"){
							$scope.pendingMessage = gettextCatalog.getString("PENDING_EMAIL_VERIFICATION");
    						return true;
    					}
    				}
					return false;
    			}
    		},
    		templateUrl: 'components/welcome/welcome.html'
  	  	}
	}
);