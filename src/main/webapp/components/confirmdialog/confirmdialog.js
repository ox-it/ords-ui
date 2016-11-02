/*
 * Generic directive for confirmation dialogs
 */ 
angular.module("ords").directive('ngReallyClick', ['$timeout','ngDialog', function ($timeout, ngDialog) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			element.bind('click', function () {
				scope.message = attrs.ngReallyMessage;
				if (scope.message) {
					ngDialog.openConfirm({
						template: 'components/confirmdialog/confirmdialog.html',
						data: [{ message: scope.message }],
						scope: scope
					}).then(function (confirm) {
						$timeout(function(){scope.$apply(attrs.ngReallyClick)},0);						
					}, function (reject) {
						// Do nothing
					});
				}
			});
		}

	}
}])