angular.module("ords").directive(
	'apidialog',
	['$location', 'ngDialog',
		function ($location, ngDialog) {
			return {
				scope: {
					database: "@",
					dataset: "@"
				},
				controller: function ($scope) {

				},
				templateUrl: 'components/apidialog/apidialogbutton.html',
				link: function ($scope, element, attrs, ctrl) {

					$scope.apiUrl = $location.protocol() + "://" + $location.host() + "/api/1.0/database/" + $scope.database + "/datasetdata/" + $scope.dataset + "?length=50&start=0";
					$scope.csvUrl = $location.protocol() + "://" + $location.host() + "/api/1.0/database/" + $scope.database + "/dataset/" +  $scope.dataset + "/csv";


					$scope.openApiDialog = function () {
						ngDialog.openConfirm({
							template: 'database-explorer/components/apidialog/apidialog.html',
							controller: function(){},
							scope: $scope
						});
					}

					$scope.copyLinkToClipboard = function (url) {

						//
						// This hack works in most browsers
						//

						var input = document.createElement('textarea');
						document.body.appendChild(input);
						input.value = url;
						input.focus();
						input.select();
						document.execCommand('Copy');
						input.remove();

						//
						// This is the standards-compliant way, but doesn't work in most browsers :(
						//
						//var copyEvent = new ClipboardEvent('copy', { dataType: 'text/plain', data: url } );
					}
				}
			}
		}
	]

)