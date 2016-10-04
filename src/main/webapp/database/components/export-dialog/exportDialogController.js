'use strict';

ords.controller("exportDialogController", function($scope, AuthService) {
	AuthService.check();
	
	$scope.changeExportFormat=function() {
		var newType = $scope.ngDialogData.exportInfo.exportType;
		
		var fullName = $scope.ngDialogData.exportInfo.exportName;
		var dotIndex = fullName.lastIndexOf('.');
		if ( dotIndex == -1 ) {
			$scope.ngDialogData.exportInfo.exportName = fullName + "." + newType;
		}
		else {
			var name = fullName.substring(0, dotIndex);
			$scope.ngDialogData.exportInfo.exportName = name + "." + newType;
		}
	}
	
});