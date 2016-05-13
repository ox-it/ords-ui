'use strict';

ords.controller('searchController', function ($scope, $location, Project, Dataset, User, Contact, $routeParams, growl, gettextCatalog) {
	
	//
	// Search for projects
	//
	$scope.search = function(){
		$scope.results = Project.query({ q: $scope.searchForm.query.$modelValue },
			function(){
				for (var i = 0; i < $scope.results.length; i++){
					var user = User.lookup({name: $scope.results[i].owner});
					$scope.results[i].user = user;
				}
			}
		);
		
		//
		// Also search for datasets
		//
		$scope.datasetResults = Dataset.query({ q: $scope.searchForm.query.$modelValue });
		
		if ($location.path() != "/search")
			$location.path("/search");
	}
	
	//
	// If there is a project id, get the project
	//
	if ($routeParams.id) {
		$scope.project = Project.get(
			{id: $routeParams.id},
			function(){
				$scope.owner = User.lookup({name: $scope.project.owner});
			}
		);
	};
	
	//
	// Send a contact request
	//
	$scope.contact = function(){
		if ($scope.contactForm.$valid) {
			$scope.contactRequest.project = $scope.project.name;
			$scope.contactRequest.userId = $scope.owner.userId;
			Contact.save(
				$scope.contactRequest,
				function(){
					growl.success( gettextCatalog.getString("ContactPost200") );
					$location.path("/");
				},
				function(response){
					if (response.status === 400) { growl.error( gettextCatalog.getString("ContactPost400") ) };
					if (response.status === 403) { growl.error( gettextCatalog.getString("Gen403") ) };
					if (response.status === 500) { growl.error( gettextCatalog.getString("Gen500") ) };
					$location.path("/");
				}
			)
		}
	}
}
);