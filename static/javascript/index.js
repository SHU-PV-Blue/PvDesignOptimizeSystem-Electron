var pvModule = angular.module('PVModule',['ui.bootstrap','ui.router','ngRoute']);
pvModule.config(function($routeProvider){
	$routeProvider.when('/', {
        templateUrl: 'tpls/test1.html'
    }).when('/test2',{
    	templateUrl: 'tpls/test2.html'
    }).when('/test3',{
    	templateUrl: 'tpls/test3.html'
    }).when('/test4',{
    	templateUrl: 'tpls/test4.html'
    }).when('/test5',{
    	templateUrl: 'tpls/test5.html'
    });
    $routeProvider.otherwise({ redirectTo: '/' });
})

pvModule.controller('cordionCtrl',function($scope){
	 $scope.oneAtATime = true;
});

pvModule.controller('prenextCtrl',function($scope, $location){
	$scope.routes = ['/','/test2','/test3','/test4','/test5']
	$scope.curIndex = 0;
	$scope.nextStep = function(){
		if($scope.curIndex >= $scope.routes.length - 1)
			return;
		$scope.curIndex +=1;
		$location.path($scope.routes[$scope.curIndex]);
	};
	$scope.preStep = function(target){
		if($scope.curIndex == 0)
			return;
		$scope.curIndex -=1;
		$location.path($scope.routes[$scope.curIndex]);
	}
});