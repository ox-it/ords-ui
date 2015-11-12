'use strict';

var ords = angular.module('ords',['ngRoute', 'ngResource', 'angular-growl', 'ngMessages', 'angularUtils.directives.dirPagination', 'gettext'])

	//
	// Setup the gettext() function
	//
	.run(function (gettextCatalog) {
	    gettextCatalog.setCurrentLanguage('en');
		//gettextCatalog.debug = true;
		//gettextCatalog.showTranslatedMarkers = true;
	})

	//
	// Project REST Resources
	//
	.factory('Project', function( $resource ) {		
		return $resource(
			'/project-api/project/:id/', 
			null,
			{'update': { method:'PUT' }}
		)
	})
	
	.factory('Statistics', function( $resource ) {		
		return $resource('/api/1.0/statistics')
	})
	
	.factory('Audit', function( $resource ) {		
		return $resource('/api/1.0/audit/project/:id')
	})

	.factory('User', function( $resource ) {
		return $resource(
			'/api/1.0/user/',
			null,
			{'lookup': { method: 'GET'}}
		);
	})
	
	.factory('Member', function( $resource, User ) {
		
		var Member =  $resource('/project-api/project/:id/role/:roleid', null, {'update': { method:'PUT' }});
		
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
	// A "really?" handler to confirm actions
	// Usage: Add attributes: ng-really-message="Are you sure"? ng-really-click="takeAction()" function
	// See: https://gist.github.com/asafge/7430497
	//
	.directive('ngReallyClick', [function() {
	    return {
	        restrict: 'A',
	        link: function(scope, element, attrs) {
	            element.bind('click', function() {
	                var message = attrs.ngReallyMessage;
	                if (message && confirm(message)) {
	                    scope.$apply(attrs.ngReallyClick);
	                }
	            });
	        }
	    }
	}])
	
	//
	// Service that checks if user is currently authenticated
	//
	.factory('AuthService', function ($rootScope, $location, User, Project){
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
							 $rootScope.loggedIn="no"
							 $location.path("/"); 
						 }

						 
						 //
						 // If we have a 404, we're logged in, but haven't registered yet
						 //
						 if (response.status === 404){
							 $rootScope.loggedIn="no"
							 $location.path("/register");  
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
	})
	
	//
	// Configure alerts
	//
	.config(['growlProvider', function(growlProvider) {
	  growlProvider.globalTimeToLive(10000);
	  growlProvider.globalDisableCountDown(true);
	}])

	//
	// configure  routes
	//
	.config(function($routeProvider) {
	        $routeProvider

	            // Home page
	            .when('/projects', {
	                templateUrl : 'project/views/home.html',
	                controller  : 'projectsController'
	            })
			
	            // Search results
	            .when('/search', {
	                templateUrl : 'views/searchresults.html',
	                controller  : 'searchController'
	            })
				
	            // Home page for login
	            .when('/', {
	                templateUrl : 'views/home.html',
	                controller  : 'mainController'
	            })

	            // Project Details
	            .when('/project/:id', {
	                templateUrl : 'project/views/project.html',
	                controller  : 'projectController'
	            })
			
				// New Project Form
				.when('/newproject', {
	                templateUrl : 'project/views/newproject.html',
	                controller  : 'newProjectController'				
				})
				
	            // Edit Project Details
	            .when('/project/:id/edit', {
	                templateUrl : 'project/views/editproject.html',
	                controller  : 'editProjectController'
	            })
				
	            // Project Audit
	            .when('/project/:id/audit', {
	                templateUrl : 'project/views/audit.html',
	                controller  : 'auditController'
	            })

				// Edit Member Form
				.when('/project/:projectId/member/:memberId', {
	                templateUrl : 'project/views/editmember.html',
	                controller  : 'editMemberController'				
				})
								
				// New Member Form
				.when('/project/:id/newmember', {
	                templateUrl : 'project/views/newmember.html',
	                controller  : 'newMemberController'				
				})
				
				// New User Registration Form
				.when('/register', {
	                templateUrl : 'views/register.html',
	                controller  : 'registerController'				
				})
				
				
				// Email verification
				.when('/verify/:code', {
	                templateUrl : 'views/verify.html',
	                controller  : 'verifyController'				
				})
		
				.otherwise({
					redirectTo: '/'
				})
		
				;
	    })
	
;


	
