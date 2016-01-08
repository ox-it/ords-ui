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
		return $resource('/api/1.0/project/:id/database/:databaseId')
	})
	
	.factory('Audit', function( $resource ) {		
		return $resource('/api/1.0/audit/project/:id')
	})

	.factory('Invitation', function( $resource ) {		
		return $resource('/api/1.0/project/:id/invitation/:inviteId')
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
	
	.factory('Database', function( $resource ) {
		return $resource('/api/1.0/structure/:databaseId/:instance',
			null,
			{
				'create': { method: 'POST' }
			}
		);
	})
	
	.factory('Staging', function( $resource ) {
		return $resource('/api/1.0/structure/:databaseId/:instance/staging',
			null,
			{
				'clone': { method: 'POST' },
				'merge': { method: 'PUT' }
			}
		);
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
	// Service that checks if user is currently authenticated
	//
	.factory('AuthService', function ($rootScope, $location, $routeParams, User, Project){
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
							 if (!$routeParams.code){
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