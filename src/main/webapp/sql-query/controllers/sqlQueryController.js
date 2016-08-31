'use strict';


ords.controller('sqlQueryController', function ($scope, $sce, $routeParams, $location, Project, DoQuery, AuthService, growl, gettextCatalog){
	
	AuthService.check();

	$scope.project = Project.get({ id: $routeParams.projectId});

	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	$scope.physicalDatabaseId = $routeParams.physicalDatabaseId;
	$scope.instance = $routeParams.instance;
	$scope.server = $routeParams.server;

	//
	// setup our local scope model for the fields
	//
	$scope.query = {};
	
	
	// loads of display strings on this page! Replace these with text in the actual view
	$scope.pageHeading = gettextCatalog.getString("Sqe001");
	$scope.queryAdvice = $sce.trustAsHtml(gettextCatalog.getString("Sqe002").replace(/\n/g, "<br />"));
	
	$scope.selectAdvice = gettextCatalog.getString("Sqe003");
	$scope.fromAdvice = gettextCatalog.getString("Sqe004");
	$scope.whereAdvice = gettextCatalog.getString("Sqe005");
	$scope.groupByAdvice = gettextCatalog.getString("Sqe006");
	$scope.orderByAdvice = gettextCatalog.getString("Sqe007");
	$scope.limitAdvice = gettextCatalog.getString("Sqe008");
	$scope.offestAdvice = gettextCatalog.getString("Sqe009");

	//
	// Clear the query
	//
	$scope.clearQuery = function(){
		$scope.query = {};
	}
	
    //
	// Run the query using the form fields
	//	
	$scope.runQuery = function() {

		//
		// Create the SQL by joining the fields
		//
		var sql = "SELECT " + $scope.query.selectPart + " FROM " + $scope.query.fromPart;
		if ($scope.query.wherePart) sql += " WHERE "+$scope.query.wherePart;
		if ($scope.query.groupByPart) sql += " GROUP BY "+$scope.query.groupByPart;
		if ($scope.query.orderByPart) sql += " ORDER BY "+$scope.query.orderByPart;

		//
		// Before we go to the results, lets first check the query actually works
		//
		var params = {databaseId:$routeParams.physicalDatabaseId, q:sql, start:$scope.query.offsetPart, length:$scope.query.limitPart };
		DoQuery.get(
			params,
			function(results) {
		
				//
				// Construct the path to the resource that will show the query
				//
				var tablePath = "/table/"+$routeParams.projectId+"/"+$routeParams.projectDatabaseId+"/"+$routeParams.physicalDatabaseId+"/"+$routeParams.instance+"/SQL/"+sql

        		//
				// Load the view
				//
				$location.path(tablePath);

			},
			function(error) {
				if (error.status === 400){ 
					growl.error(  gettextCatalog.getString("QueryGet400") );
				}
			}
		);
	};
});
