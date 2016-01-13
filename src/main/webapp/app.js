'use strict';

var ords = angular.module('ords',['ngRoute', 'ords.services', 'angular-growl', 'ngMessages', 'angularUtils.directives.dirPagination', 'gettext'])

	//
	// Setup the gettext() function
	//
	.run(function (gettextCatalog) {
	    gettextCatalog.setCurrentLanguage('en');
		//gettextCatalog.debug = true;
		//gettextCatalog.showTranslatedMarkers = true;
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
				
	            // User page 
	            .when('/profile', {
	                templateUrl : 'views/profile.html',
	                controller  : 'profileController'
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
				
				// New Database
				.when('/project/:id/newdatabase', {
	                templateUrl : 'project/views/newdatabase.html',
	                controller  : 'newDatabaseController'				
				})
				
				//  Database Page
				.when('/project/:id/:databaseId', {
	                templateUrl : 'database/views/database.html',
	                controller  : 'databaseController'				
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
				
				// Invite code verification
				.when('/invite/:code', {
	                templateUrl : 'views/invite.html',
	                controller  : 'inviteController'				
				})
				
				// Database Schema Designer
				.when('/schema/:projectId/:projectDatabaseId/:physicalDatabaseId/:instance/:server', {
					templateUrl : 'schema-designer/views/designer.html',
					controller	: 'schemaController'
				})
				
				// Database Explorer
				.when('/database-explorer/:projectId/:projectDatabaseId/:projectDatabaseName/:physicalDatabaseId/:instance/:server', {
					templateUrl : 'database-explorer/views/explorer.html',
					controller	: 'explorerController'
				})
				
				// Query Builder
				.when('/query-builder/:physicalDatabaseId/:projectDatabaseId/:instance/:server', {
	        		templateUrl	: 'query-builder/views/builder.html',
	        		controller : 'queryBuilderController'
				})
				
				// SQL Query
				.when('/sql-query/:physicalDatabaseId/:projectDatabaseId/:instance/:server', {
						templateUrl : 'sql-query/views/query.html',
						controller : 'sqlQueryController'
				})
				
				// table view
				.when('/table-view', {
					templateUrl : 'table-view/views/tableView.html',
					controller : 'tableViewController'
				})
				
				.otherwise({
					redirectTo: '/'
				})
		
				;
	    })
	
;


	
