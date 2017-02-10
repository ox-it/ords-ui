'use strict';


ords.directive("nameValidator",[function(){
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, ngModel) {
			var tableNameList = attrs.nameValidator;
			
			ngModel.$validators.nameValidator = function(value) {
				if (!value || value.length == 0 ) {
					return;
				}
				var existingNames = tableNameList.split(",");
				for ( var k in existingNames) {
					var tableName = existingNames[k];
					if ( value === tableName ) {
						return false
					}
				}
				return true;
			}
		}
	}
}])