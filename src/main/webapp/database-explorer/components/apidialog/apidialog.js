'use strict';

ords.controller('apidialog', function ($scope, $location, ngDialog) {
	$scope.apiUrl = $location.protocol() + "://" + $location.host() + "/api/1.0/database/"+$scope.physicalDatabaseId+"/datasetdata/"+$scope.datasetId+"?length=50&start=0";
	$scope.csvUrl = $location.protocol() + "://" + $location.host() + "/api/1.0/database/"+$scope.physicalDatabaseId+"/dataset/"+$scope.datasetId+"/csv";

	$scope.copyLinkToClipboard = function(url){
		
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
});