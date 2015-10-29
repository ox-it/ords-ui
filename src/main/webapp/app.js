'use strict';

var ords = angular.module('ords',['ngRoute', 'ngResource', 'angular-growl', 'ngMessages', 'angularUtils.directives.dirPagination'])

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
	.factory('AuthService', function ($rootScope, $location, User){
		var svc = {};
		svc.check = function(){
			if ($rootScope.loggedIn !== "yes"){
				$rootScope.user = User.get(
					 function successCallback() { 
						$rootScope.loggedIn="yes"
					 }, 
					 function errorCallback() { 
						 $rootScope.loggedIn="no"
						 $location.path("/"); 
					 }				
				);
			}
		};
		return svc;
	})
	
	//
	// Configure alerts
	//
	.config(['growlProvider', function(growlProvider) {
	  growlProvider.globalTimeToLive(5000);
	  growlProvider.globalDisableCountDown(true);
	}])

	//
	// configure  routes
	//
	.config(function($routeProvider) {
	        $routeProvider

	            // Home page for login
	            .when('/projects', {
	                templateUrl : 'project/views/home.html',
	                controller  : 'projectsController'
	            })
			
	            // Search results
	            .when('/search', {
	                templateUrl : 'views/searchresults.html',
	                controller  : 'searchController'
	            })
				
	            // Home page with projects list
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
	            .when('/editproject/:id', {
	                templateUrl : 'project/views/editproject.html',
	                controller  : 'editProjectController'
	            })

				// Edit Member Form
				.when('/project/:projectId/member/:memberId', {
	                templateUrl : 'project/views/editmember.html',
	                controller  : 'editMemberController'				
				})
								
				// New Member Form
				.when('/newmember/:id', {
	                templateUrl : 'project/views/newmember.html',
	                controller  : 'newMemberController'				
				})
		
				.otherwise({
					redirectTo: '/'
				})
		
				;
	    })
;


	
