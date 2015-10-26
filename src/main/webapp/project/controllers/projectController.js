'use strict';

ords.controller('projectController', function ($scope, $routeParams, Project) {
		$scope.project = Project.get({ id: $routeParams.id });
	}
);