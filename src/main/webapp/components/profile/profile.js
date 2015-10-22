angular.module( "ords" ).directive(
	'profile', 
	function() {
  	  	return {
    		controller:  'mainController',
    		templateUrl: 'components/profile/profile.html'
  	  	}
	}
);