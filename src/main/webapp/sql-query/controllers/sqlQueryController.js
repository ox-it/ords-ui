'use strict';


ords.controller('sqlQueryController', function ($scope, $sce, $routeParams, $location, Project,  AuthService, gettextCatalog){
	AuthService.check();
	
	$scope.project = Project.get({ id: $routeParams.projectId});
	
	$scope.logicalDatabaseId = $routeParams.projectDatabaseId;
	$scope.physicalDatabaseId = $routeParams.physicalDatabaseId;
	$scope.logicalDatabaseName = $routeParams.projectDatabaseName;
	$scope.instance = $routeParams.instance;
	$scope.server = $routeParams.server;
	
	// setup our local scope variables for the fields
	$scope.selectPart = "";
	$scope.fromPart = "";
	$scope.wherePart = "";
	$scope.groupByPart = "";
	$scope.orderByPart = "";
	$scope.limitPart = "";
	$scope.offsetPart = "";
	
	
	// loads of display strings on this page!
	$scope.pageHeading = gettextCatalog.getString("Sqe001");
	$scope.queryAdvice = $sce.trustAsHtml(gettextCatalog.getString("Sqe002").replace(/\n/g, "<br />"));
	
	$scope.selectAdvice = gettextCatalog.getString("Sqe003");
	$scope.fromAdvice = gettextCatalog.getString("Sqe004");
	$scope.whereAdvice = gettextCatalog.getString("Sqe005");
	$scope.groupByAdvice = gettextCatalog.getString("Sqe006");
	$scope.orderByAdvice = gettextCatalog.getString("Sqe007");
	$scope.limitAdvice = gettextCatalog.getString("Sqe008");
	$scope.offestAdvice = gettextCatalog.getString("Sqe009");
	
	
	
	
	$scope.runQuery = function() {
		//:projectId/:projectDatabaseId/:physicalDatabaseId/:instance/:queryType/:query'
		var tablePath = "/table/"+$scope.project.projectId+"/"+$scope.logicalDatabaseId+"/"+$scope.physicalDatabaseId+"/"+$scope.instance+"/SQL/"+$scope.sql
		$location.path(tablePath);
	};
});
