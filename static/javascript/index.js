var fs = require('fs');
var pvModule = angular.module('PVModule',['ui.bootstrap','ui.router','ngRoute']);

//服务区
/*
保存和获取数据服务
*/
pvModule.service('processData',function($rootScope){
	this.dataBasePath = 'data/';
	this.getData = function(filename){
		return JSON.parse(fs.readFileSync(this.dataBasePath + filename),'utf8');
	};
	this.saveData = function(data,filename){
		fs.writeFileSync(this.dataBasePath + filename,JSON.stringify(data,null,"    "),'utf8');
	};
	this.noticeSaveData = function(){
		$rootScope.$broadcast('processData.save');
	};
});

/*
路由管理服务
*/
pvModule.service('manageRoute',function(){
	this.routes = ['/','/2','/3','/4','/5'];
	this.curIndex = 0;
	this.getNextRoute = function(){
		if(this.curIndex >= this.routes.length - 1)
			return;
		this.curIndex += 1;
		return this.routes[this.curIndex];
	};
	this.getPreRoute = function(){
		if(this.curIndex == 0)
			return;
		this.curIndex -= 1;
		return this.routes[this.curIndex];
	}
});

//控制器区

/*
导航控制器
*/
pvModule.controller('cordionCtrl',function($scope){                  
	 $scope.oneAtATime = true;
});

/*
上一步下一步控制器
*/
pvModule.controller('prenextCtrl',function($scope, $location, processData, manageRoute){
	$scope.nextStep = function(){
		processData.noticeSaveData();
		$location.path(manageRoute.getNextRoute());
	};
	$scope.preStep = function(){
		$location.path(manageRoute.getPreRoute());
	};
});

/*
项目信息控制器
*/
pvModule.controller('basicInfoCtrl',function($scope, $timeout, processData){
	  $scope.projectInfo = {
	  	projectName : '',
	  	projectAddress : '',
	  	userName : '',
	  	remark : '',
	  	lng : 121.494966,
	  	lat : 31.219456,
	  }

	  $scope.$on('processData.save',function(event){
	  		processData.saveData($scope.projectInfo,'projectInfo.json');
	  })

	  $scope.$watch('$viewContentLoaded',function(){
	  	$scope.projectInfo = processData.getData('projectInfo.json');
	  	$scope.projectInfo.projectDate = new Date($scope.projectInfo.projectDate);
	  })

	  $scope.today = function() {
	    $scope.projectInfo.projectDate = new Date();
	  };
	  $scope.today();

	  $scope.clear = function() {
	    $scope.projectInfo.projectDate = null;
	  };

	  $scope.inlineOptions = {
	    customClass: getDayClass,
	    minDate: new Date(),
	    showWeeks: true
	  };

	  $scope.dateOptions = {
	    dateDisabled: disabled,
	    formatYear: 'yy',
	    maxDate: new Date(2030, 5, 22),
	    minDate: new Date(),
	    startingDay: 1
	  };

	  // Disable weekend selection
	  function disabled(data) {
	    var date = data.date,
	      mode = data.mode;
	    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
	  }

	  $scope.toggleMin = function() {
	    $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
	    $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
	  };

	  $scope.toggleMin();

	  $scope.open2 = function() {
	    $scope.popup2.opened = true;
	  };

	  $scope.setDate = function(year, month, day) {
	    $scope.projectInfo.projectDate = new Date(year, month, day);
	  };

	  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
	  $scope.format = $scope.formats[0];
	  $scope.altInputFormats = ['M!/d!/yyyy'];

	  $scope.popup2 = {
	    opened: false
	  };

	  var tomorrow = new Date();
	  tomorrow.setDate(tomorrow.getDate() + 1);
	  var afterTomorrow = new Date();
	  afterTomorrow.setDate(tomorrow.getDate() + 1);
	  $scope.events = [
	    {
	      date: tomorrow,
	      status: 'full'
	    },
	    {
	      date: afterTomorrow,
	      status: 'partially'
	    }
	  ];

	  function getDayClass(data) {
	    var date = data.date,
	      mode = data.mode;
	    if (mode === 'day') {
	      var dayToCheck = new Date(date).setHours(0,0,0,0);

	      for (var i = 0; i < $scope.events.length; i++) {
	        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

	        if (dayToCheck === currentDay) {
	          return $scope.events[i].status;
	        }
	      }
	    }
	    return '';
	  }
})

/*
气象信息控制器
*/

//指令区
pvModule.directive('script', function() {
    return {
      restrict: 'E',
      scope: false,
      link: function(scope, elem, attr) {
        if (attr.type === 'text/javascript-lazy') {
          var code = elem.text();
          var f = new Function(code);
          f();
        }
      }
    };
  });

//路由
pvModule.config(function($routeProvider){
	$routeProvider.when('/', {
        templateUrl: 'tpls/html/basicInfo.html'
    }).when('/2',{
    	templateUrl: 'tpls/html/displayMeteInfo.html'
    }).when('/3',{
    	templateUrl: 'tpls/html/userDesign.html'
    }).when('/4',{
    	templateUrl: 'tpls/html/confirmAngle.html'
    }).when('/5',{
    	templateUrl: 'tpls/test5.html'
    });
    $routeProvider.otherwise({ redirectTo: '/' });
})