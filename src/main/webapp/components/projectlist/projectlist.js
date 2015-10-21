angular.module( "ords" ).directive(
	'projects', 
	function() {
  	  	return {
    		controller: 'projectListController',
    		templateUrl: 'components/projectlist/projectlist.html'
  	  	}
	}
);