'use strict';

var ordsServices = angular.module('ords.services',['ngResource'])

	//
	// Project REST Resources
	//
	.factory('Project', function( $resource ) {		
		return $resource(
			'/api/1.0/project/:id/', 
			null,
			{'update': { method:'PUT' }}
		)
	})
	
	.factory('Statistics', function( $resource ) {		
		return $resource('/api/1.0/statistics')
	})
	
	.factory('Group', function( $resource ) {		
		return $resource('/api/1.0/group/group/:id/')
	})
	
	.factory('ProjectDatabase', function( $resource ) {		
		return $resource(
			'/api/1.0/project/:id/database/:databaseId',
			null,
			{'update' : 
				{ method:'PUT' }
			}
		)
	})
	
	.factory('Audit', function( $resource ) {		
		return $resource('/api/1.0/audit/project/:id')
	})

	.factory('Invitation', function( $resource ) {		
		return $resource('/api/1.0/project/:id/invitation/:inviteId')
	})
	
	.factory('Contact', function( $resource ) {		
		return $resource('/api/1.0/user/contact')
	})

	.factory('User', function( $resource ) {
		return $resource(
			'/api/1.0/user/:id',
			null,
			{
				'lookup': { method: 'GET' },
			 	'update': { method: 'PUT' }
		 	}
		);
	})
	
	.factory('DatabaseStructure', function( $resource ) {
		return $resource('/api/1.0/structure/:databaseId/',
			null,
			{
				'create': { method: 'POST' },
                'clone': { method: 'POST' },
                'merge': { method: 'PUT'}
			}
		);
	})
    
    .factory('ODBC', function( $resource ) {		
		return $resource('/api/1.0/structure/:databaseId/odbc')
	})

	.factory('TableStructure', function( $resource ) {		
		return $resource('/api/1.0/structure/:databaseId/table/:tableName/false')
	})
		
	.factory('DatabaseStructureStaging', function( $resource ) {
		return $resource('/api/1.0/structure/:databaseId/staging',
			null,
			{
				'clone': { method: 'POST' },
				'merge': { method: 'PUT' }
			}
		);
	})
	
	.factory('TableList', function( $resource ) {
		return $resource('/api/1.0/database/:databaseId/tabledata/:tableName',
			null,
			{
				'update':{ method: 'PUT' }
			}
		)
	})
	
	.factory('DoQuery', function( $resource ) {
		return $resource('/api/1.0/database/:databaseId/query')
	})
	
	.factory('ListPublicDatasets', function( $resource ) {
		return $resource('/api/1.0/database/dataset')
	})
	
	.factory('ListDatasets', function( $resource ) {
		return $resource('/api/1.0/database/:databaseId/datasets')
	})
	
	.factory('Dataset', function( $resource ) {
		return $resource('/api/1.0/database/:databaseId/dataset/:datasetId',
				null,
				{
					'create': { method: 'POST'},
					'update': { method: 'PUT'}
				})
	})
	
	.factory('DatasetData', function($resource) {
		return $resource('/api/1.0/database/:databaseId/datasetdata/:datasetId')
	})
	
	.factory('ReferenceColumnData', function( $resource ) {
		return $resource('/api/1.0/database/:databaseId/table/:tableName/column/:columnName/related-values')
	})
		
	.factory('ExportDatabase', function( $resource) {
		return $resource('/api/1.0/database/:databaseId/export/:exportType',
			null,
			{
				get: {
					method: 'GET', 
					transformResponse: function ( data, headers ) {
						// Stop angular doing it's transformation
						return {response: data};
					}
				}
			}
		)
	})
	
	.factory('ExportTable', function($resource) {
		return $resource('/api/1.0/database/:databaseId/export/table/:tableName',
			null,
			{
				get: {
					transformResponse: function ( data, headers ) {
						// Stop angular doing it's transformation
						return {response: data};
					}
					
				}
			}
		)
	})
	

		.factory('ExportQuery', function($resource) {
		return $resource('/api/1.0/database/:databaseId/export',
			null,
			{
				get: {
					transformResponse: function ( data, headers ) {
						// Stop angular doing it's transformation
						return {response: data};
					}
					
				}
			}
		)
	})

	.factory('Member', function( $resource, User ) {
		
		var Member =  $resource('/api/1.0/project/:id/role/:roleid', null, {'update': { method:'PUT' }});
		
		Member.prototype.name = "";
		
		//
		// The "name" property of a Member is held by the User resource
		// so we have to load that asynchronously from the REST API
		//
		Member.prototype.getName = function () {
			
			if (this.name !== "") return this.name;
			var that = this;
			User.lookup( {name: this.principalName}, function(user){
				that.name = user.name;
			} 
			);
			this.name = "loading ...";
		};
		
		return Member;
	})

	//
	// State management service
	//
	.factory('State', ['$rootScope', function($rootScope){
		var service = {
			data: null,
			SaveState: function () {
            	localStorage.TrunkDbState = angular.toJson(service.data);
        	},

        	RestoreState: function () {
            	service.data = angular.fromJson(localStorage.TrunkDbState);
        	}
		}

		//
		// Initialise state
		//
		if (localStorage.TrunkDbState){ 
			service.RestoreState()
		} else {
			service.data = {};
		};

		$rootScope.$on("savestate", service.SaveState);
    	$rootScope.$on("restorestate", service.RestoreState);

  	 	return service;
	}])


	//
	// Service for file upload
	//
	
	.factory('FileUpload',['$http', function($http) {
		var svc = {};
		svc.uploadFileToUrl = function(file, uploadUrl, successAction, errorAction, progressAction){
			var fd = new FormData();
			fd.append('dataFile', file);
			var xhr = new XMLHttpRequest();
			
			xhr.upload.onprogress = function(e) {
				progressAction(e.loaded, e.total);
			}
			
			xhr.onload = function(e) {
				successAction(xhr);
			}
			
			xhr.upload.onerror = function(e) {
				errorAction(xhr);
			}
			
			xhr.open("POST", uploadUrl);
			xhr.send(fd);

//			$http.post(uploadUrl, fd, {
//				transformRequest: angular.identity,
//				headers: {'Content-Type': undefined}
//			}).then (
//					function successCallback(response) {
//						successAction(response);
//					},
//					function errorCallback(response) {
//						errorAction(response);
//					},
//					function progress(data) {
//						progressAction(data);
//					}
//			);
		}
		return svc;
	}])


	//
	// Service that checks if user is currently authenticated
	//
	.factory('AuthService', function ($rootScope, $location, $routeParams, User, Project, growl, gettextCatalog){
		var svc = {};
		svc.check = function(){

			if ($rootScope.loggedIn !== "yes"){
				$rootScope.user = User.get(
					 function successCallback() { 
						$rootScope.loggedIn="yes"
						 if ($location.path() === "/"){
							 
			 	 			//
			 	 			// Load initial projects
			 	 			//
			 	 			Project.query({}, function(data){
			 	 				$rootScope.projects = data;
			 	 			});
							
							$location.path("/projects"); 
						 }
					 }, 
					 function errorCallback(response) {
						 
						 //
						 // If we have a 401, we aren't logged in...
						 //
						 if (response.status === 401){
							 $rootScope.loggedIn="no";
							 $location.path("/"); 
						 }

						 
						 //
						 // If we have a 404, we're logged in, but haven't registered yet
						 //
						 if (response.status === 404){
							 $rootScope.loggedIn="no";
							 //
							 // If we have an invite code, use that
							 //
							 if ($routeParams.code) {
								$location.path("/invite/"+$routeParams.code);  							 	
							 }
							 else {
 							 	$location.path("/register");  							 	
							 }
						 }
					 }				
				);
			} else {	
				//
				// If we are already logged in, bypass the front page and
				// view the projects page
				//
				if ($location.path() === "/"){
					$location.path("/projects"); 
				}
			}
		};
		return svc;
	});



//
//ords.service('fileUpload', ['$http', function ($http, $location) {
//    this.uploadFileToUrl = function(file, uploadUrl, successAction, errorAction){
//       var fd = new FormData();
//       fd.append('databaseFile', file);
//    
//       $http.post(uploadUrl, fd, {
//          transformRequest: angular.identity,
//          headers: {'Content-Type': undefined}
//       }).then (function successCallback(response) {
//    	   successAction();
//       }, function errorCallback(response) {
//    	   errorAction(response);
//       });
//    
////       .success(function(){
////           successAction();
////       })
////    
////       .error(function(){
////    	   //$scope.errorMsg = "There was an error uploading the file";
////    	   // TODO: Find way to get the result of the error and pass it to the user
////    	   errorAction("There was an error uploading the file");
////       });
//    }
// }]);