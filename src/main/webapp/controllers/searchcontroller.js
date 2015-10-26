'use strict';

ords.controller('searchController', function ($scope, $location, Project, User) {
	
	$scope.search = function(){
		$scope.results = Project.query({ q: $scope.searchForm.query.$modelValue },
			function(){
				for (var i = 0; i < $scope.results.length; i++){
					var user = User.lookup({name: $scope.results[i].owner});
					$scope.results[i].user = user;
				}
			}
		);
		if ($location.path() != "/search")
			$location.path("/search");
	}
}
);