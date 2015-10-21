ords.controller(
	'databaseListController', 
	function ($scope, $routeParams, $http, $q) {
		var databases = [];
  	  	$scope.param = $routeParams.param;
  	  	var p = $http.get('/project-api/project/'+$scope.param+"/database/").then
  	  		(function(result) {
				
	  		  for (projectDatabase in result.data){
		  		$http.get('/project-api/project/'+$scope.param+"/database/"+result.data[projectDatabase].projectDatabaseId).then
		  			(function(result){
						
						//
						// We're returning a mock
						// TODO actually call and return a database from the database API
						//
						var database = {};
						database.name = "Mock";
			  		    databases.push(database);
		  			});
	  		  }
  			});
		$q.all([p]).then(function(){
			$scope.databases = databases
		})
    }
);

angular.module( "ords" ).directive(
	'databases', 
	function() {
  	  	return {
    		controller: 'databaseListController',
    		templateUrl: 'components/dblist/dblist.html'
  	  	}
	}
);