'use strict';

ords.controller('datasetDialogController', function ($scope, $routeParams, AuthService, ngDialog) {
	
	//
	// This page doesn't make sense to view
	// without being logged in, so redirect
	// back to the home view
	//
	AuthService.check();
	
	if ( $scope.selectedTableView ) {
//		private String viewName;
//		private String viewTable;
//		private String viewDescription;
//		private String viewQuery;
//		private String viewAuthorization;

		$scope.datasetName = $scope.selectedTableView.viewName;
		$scope.datasetTable = $scope.selectedTableView.viewTable;
		$scope.datasetDescription = $scope.selectedTableView.viewDescription;
		$scope.datasetQuery = $scope.selectedTableView.viewQuery;
		$scope.datasetAuthorization = $scope.selectedTableView.viewAuthorization;
	}
	else {
		$scope.datasetName = ""
		$scope.datasetTable = "";
		$scope.datasetDescription = "";
		$scope.datasetQuery = $scope.theQuery;
		$scope.datasetAuthorization = "public";
	}
	
});