angular.module( "ords" ).directive(
	'header', 
	function() {
  	  	return {
    		controller: 'searchController',
    		templateUrl: 'components/header/header.html'
  	  	}
	}
);