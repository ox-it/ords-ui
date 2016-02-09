ords.controller('adminController', function($rootScope, $scope, $routeParams, $location, AuthService, Project, Statistics, growl, gettextCatalog) {
    		
	//
	// Conduct auth check. Note that even if a user views the admin controls, they can only perform
    // the functions permitted by the API; i.e. a "normal" user is the admin for their own projects
	//
	AuthService.check();
    
    //
    // Obtain all projects - including deleted and trial - that the user can view
    //
    $scope.projects = Project.query({all: true});
	
    if (!$scope.statistics) $scope.statistics = Statistics.get();
    
    $scope.upgrade = function(project){
        project.trialProject = false;
        $scope.performUpdate(project);        
    }
    
    $scope.performUpdate = function(project){
        Project.update(
            {id: project.projectId},
            project,
            function(){
                growl.success( gettextCatalog.getString("ProPut200") );
            },
            function(response){
                if (response.status === 400){ growl.error(  gettextCatalog.getString("ProPut400") ) };
				if (response.status === 403){ growl.error(  gettextCatalog.getString("Gen403") ) };
				if (response.status === 404){ growl.error(  gettextCatalog.getString("ProPut404") ) };
				if (response.status === 410){ growl.error(  gettextCatalog.getString("Gen410") ) };
				if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };
                $scope.projects = Project.query({all: true});
            }
        )  
    }
    
    $scope.downgrade = function(project){
        project.trialProject = true;
        $scope.performUpdate(project);        
    }
    
    $scope.delete = function(project){
        project.deleted = true;
        Project.delete(
            {id: project.projectId},
            function(){
                 growl.success( gettextCatalog.getString("ProDelete200") );
            },
            function(response){
                if (response.status === 400){ growl.error(  gettextCatalog.getString("ProDelete400") ) };
				if (response.status === 403){ growl.error(  gettextCatalog.getString("Gen403") ) };
				if (response.status === 404){ growl.error(  gettextCatalog.getString("ProDelete400") ) };
				if (response.status === 410){ growl.error(  gettextCatalog.getString("ProDelete410") ) };
				if (response.status === 500){ growl.error(  gettextCatalog.getString("Gen500") ) };	
                $scope.projects = Project.query({all: true});	
            }
        )       
    }
    
    $scope.restore = function(project){
        project.deleted = false;
        $scope.performUpdate(project);  
    }
});