angular.module( "ords" ).directive(
	'databaseform', 
	function() {
  	  	return {
    		controller: 'databaseController',
    		templateUrl: 'database/components/databaseform/databaseform.html'
  	  	}
	}
);