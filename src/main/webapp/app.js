'use strict';

var ords = angular.module('ords',['ngRoute', 'ords.services', 'angular-growl', 'ngMessages', 'angularUtils.directives.dirPagination', 'gettext', 'ngDialog','ngTextTruncate', 'ngFileSaver', 'sprintf'])

	//
	// Setup the gettext() function
	//
	.run(function (gettextCatalog, $rootScope) {
	    gettextCatalog.setCurrentLanguage('en');
		//gettextCatalog.debug = true;
		//gettextCatalog.showTranslatedMarkers = true;

		//
		// Stateful service handling - this is used for the VQD persistence
		//
		$rootScope.$on("$routeChangeStart", function (event, next, current) {
    		if (localStorage.restorestate == "true") {
        		$rootScope.$broadcast('restorestate'); //let everything know we need to restore state
        		localStorage.restorestate = false;
    		}
		});

		//let everthing know that we need to save state now.
		window.onbeforeunload = function (event) {
    		$rootScope.$broadcast('savestate');
		};


	})

	//
    // A filter for showing nicely formatted file sizes
    //
    .filter('bytes', function() {
	return function(bytes, precision) {
		if (bytes==0 || isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
		if (typeof precision === 'undefined') precision = 1;
		var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			number = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
	}
    })
 
	//
    // "CompareTo" directive
    //  See http://stackoverflow.com/questions/31671221/angular-ng-messages-how-to-check-password-confirmation
    .directive("compareTo", [function() {
        return {
            require: "ngModel",
            scope: {
                otherModelValue: "=compareTo"
            },
            link: function(scope, element, attributes, ngModel) {

                ngModel.$validators.compareTo = function(modelValue) {
                    return modelValue == scope.otherModelValue;
                };

                scope.$watch("otherModelValue", function() {
                    ngModel.$validate();
                });
            }
        }
    }])
	
	//
	// Configure alerts
	//
	.config(['growlProvider', function(growlProvider) {
	  //growlProvider.globalTimeToLive(10000);
	  growlProvider.globalPosition('top-right');
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
                
                // Admin page
	            .when('/admin', {
	                templateUrl : 'views/admin.html',
	                controller  : 'adminController'
	            })

				 // Upgrade account page
	            .when('/upgrade', {
	                templateUrl : 'views/upgrade.html',
	                controller  : 'profileController'
	            })
			
	            // Search results
	            .when('/search', {
	                templateUrl : 'views/searchresults.html',
	                controller  : 'searchController'
	            })
				
	            // Contact a project owner
	            .when('/contact/:id', {
	                templateUrl : 'views/contact.html',
	                controller  : 'searchController'
	            })
				
	            // Home page for login
	            .when('/', {
	                templateUrl : 'views/home.html',
	                controller  : 'mainController'
	            })
				
	            // login
	            .when('/login', {
	                templateUrl : 'views/login.html',
	                controller  : 'loginController'
	            })
				
	            // Sign up
	            .when('/signup', {
	                templateUrl : 'views/signup.html',
	                controller  : 'loginController'
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
                
                // Edit Pending Member Form
				.when('/project/:projectId/invite/:inviteId/edit', {
	                templateUrl : 'project/views/editinvitation.html',
	                controller  : 'inviteController'				
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

				//  Database Edit Page
				.when('/project/:id/:databaseId/edit', {
	                templateUrl : 'database/views/editdatabase.html',
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
	                templateUrl : 'views/register.html',
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
				
				// SQL Query
				.when('/sql-query/:projectId/:projectDatabaseId/:projectDatabaseName/:physicalDatabaseId/:instance/:server',{
					templateUrl : 'sql-query/views/query.html',
					controller  : 'sqlQueryController'
				})
				
				// Database upload (Import)
				.when('/import/:projectId/:projectDatabaseId/:server', {
					templateUrl : 'import/views/import.html'
				})
				
				// Table view result
				
				.when('/table/:projectId/:projectDatabaseId/:physicalDatabaseId/:instance/:queryType/:query', {
					templateUrl : 'table-view/views/tableView.html',
					controller  : 'tableViewController'
				})
				
				// Table row editor
				
				.when('/row/:projectId/:projectDatabaseId/:physicalDatabaseId/:instance/:tableName/:primaryKey/:primaryKeyValue?',{
					templateUrl : 'table-view/row-editor/views/rowEditor.html',
					controller  : 'rowEditorController'
				})
				// Table row editor for new row
				.when('/row/:projectId/:projectDatabaseId/:physicalDatabaseId/:instance/:tableName/',{
					templateUrl : 'table-view/row-editor/views/rowEditor.html',
					controller  : 'rowEditorController'
				})
				
				
				
								
				.otherwise({
					redirectTo: '/'
				});
	    });


// general directives

ords.directive('fileModel', ['$parse', function ($parse) {
    return {
       restrict: 'A',
       link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
          
          element.bind('change', function(){
             scope.$apply(function(){
                modelSetter(scope, element[0].files[0]);
             });
          });
       }
    };
 }]);


ords.directive('progressBar', function() {
	return {
		restrict: 'E',
		scope: {
			progressCurrent: "@",
			progressTotal: "@",
			progressSuffix: "@"
		},
		template: '<div class="pgouter"><div class="pglegend"></div><div class="pgback"><div class="pgbar"></div></div></div>',
		link: function (scope, element, attrs ) {
			// inital set of  values
			var legend_suffix = "";
			if ( scope.progressSuffix ) {
				legend_suffix = scope.progressSuffix;
			}
			// preload elements on link
			var legend_element = angular.element(element[0].querySelector(".pglegend"));
			var progress_element = angular.element(element[0].querySelector(".pgbar"));
			// initial set progress
			setProgress();
			
			// watch for changes to the  current attribute
			scope.$watch('progressCurrent', setProgress);
			scope.$watch('progressTotal', setProgress);
			function setProgress ()  {
				var current = scope.progressCurrent;
				var total = scope.progressTotal;
				legend_element.html("Progress: "+Math.round(current)+" of "+Math.round(total)+" "+legend_suffix);
				if ( total > 0 ) {
					// calculate percentage
					var percent = (current / total) * 100;
					progress_element.css("width", percent+"%");
				}
				
			}
		}
	}
})