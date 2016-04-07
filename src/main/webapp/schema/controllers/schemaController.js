'use strict';

// use global variables to link with wwwSqlDesinger

var dbId = 0;
var dbInstance = "";
var designer = null;

ords.controller('schemaController', function ($scope, $routeParams, Database, Staging, AuthService, growl, gettextCatalog ) {

	AuthService.check();	
	$scope.staging = function () {
		var params = {databaseId:dbId};
		Staging.clone(
			params,
			{},
			function(){
				if (designer == null ) {
					designer = new SQL.Designer();
				}
				else {
					designer = null;
					designer = new SQL.Designer();
				}
			},
			function(error){
				if (error.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };
				if (error.status === 400){ growl.error(  gettextCatalog.getString("Dat028") ) };
				if (error.status === 403){ growl.error(  gettextCatalog.getString("Dat029") ) };
			}
		);
	};

	
	if ( $routeParams.physicalDatabaseId == 0 ) {
		// we need to create a database
		var databaseRequest = {
            databaseName:'not used', 
            databaseServer:$routeParams.server, 
            groupId:$routeParams.projectDatabaseId,
            instance: $routeParams.instance
        };
		Database.create(
            {},
			databaseRequest,
			function(data){

				$scope.database = data;
				dbId = data.physicalDatabaseId;
				// create the staging version of the database
				$scope.staging();

			},
			function(error){
				if (error.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };
				if (error.status === 400){ growl.error(  gettextCatalog.getString("Dat026") ) };
				if (error.status === 403){ growl.error(  gettextCatalog.getString("Dat027") ) };
			}
		);
	}
	else {
		$scope.databaseId = $routeParams.physicalDatabaseId;
		dbId = $routeParams.physicalDatabaseId;
		// create the staging version of the database
		$scope.staging();
	}

});