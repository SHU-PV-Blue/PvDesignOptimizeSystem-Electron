var fs = require('fs');
var pvModule = angular.module('PVModule',['ui.bootstrap','ui.router','ngRoute'],function($httpProvider){
	// Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
 
  /**
   * The workhorse; converts an object to x-www-form-urlencoded serialization.
   * @param {Object} obj
   * @return {String}
   */ 
  var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
       
    for(name in obj) {
      value = obj[name];
         
      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
       
    return query.length ? query.substr(0, query.length - 1) : query;
  };
 
  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
});

//服务区
/*
  保存和获取数据服务
  */
  pvModule.service('processData',function($rootScope){
  	this.dataBasePath = 'data/';
  	this.getData = function(filename){
  		if(fs.existsSync(this.dataBasePath + filename)){
  			return JSON.parse(fs.readFileSync(this.dataBasePath + filename),'utf8');
  		}else{
  			return null;
  		}
  	};
  	this.saveData = function(data,filename){
  		fs.writeFileSync(this.dataBasePath + filename,JSON.stringify(data,null,"    "),'utf8');
  	};
  	this.noticeSaveData = function(){
  		$rootScope.$broadcast('processData.save');
  	};
  });

/*
  临时数据服务
  */
  pvModule.service('tempData',function(){
  	this.tempdata = {};
  	this.setTempData = function(key, value){
  		this.tempdata[key] = value;
  	};
  	this.getTempData = function(key){
  		var res = this.tempdata[key];
		//delete this.tempdata[key];
		return res;
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
  		return this.routes[this.curIndex]
  	};
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
  pvModule.controller('basicInfoCtrl',function($scope, processData, tempData){
  	$scope.projectInfo = {
  		projectName : '',
  		projectAddress : '',
  		userName : '',
  		remark : '',
  		lng : '121.494966',
  		lat : '31.219456'
  	};

  	$scope.$on('processData.save',function(event){
  		tempData.setTempData('lng',$scope.projectInfo.lng);
  		tempData.setTempData('lat',$scope.projectInfo.lat);
  		processData.saveData($scope.projectInfo,'projectInfo.json');
  	});

  	$scope.$watch('$viewContentLoaded',function(){
  		$scope.projectInfo = processData.getData('projectInfo.json');
  		$scope.projectInfo.projectDate = new Date($scope.projectInfo.projectDate);
  	});

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
});

/*
  气象信息控制器
  */
pvModule.controller('meteorologyCtrl',function($scope,$http, processData, tempData){
  	$scope.meteorologyInfo = {
  		type : 'db',
  		minTem : '',
  		maxTem : '',
  		monthinfos:[],
  		monthavgs : {
  			i : '',
  			t : '',
  			h : '',
  			w : ''
  		},
  		lng : '',
  		lat : ''
  	};


  	$scope.selectDb = function(e){
  		if($scope.flag == 0){
  			return;
  		}
  		if(!confirm("确定选择国际气象数据库？")){
  			e.preventDefault();
  			$scope.meteorologyInfo.type = 'user';
  		}else{
  			$scope.flag = 0;
  			getDbData();
  		}
  	};
  	$scope.selectUser = function(e){
  		if($scope.flag == 1){
  			return;
  		}
  		if(!confirm("确定自定义气象数据？")){
  			e.preventDefault();
  			$scope.meteorologyInfo.type = 'db';
  		}else{
  			$scope.flag = 1;
  		}
  	};

  	function computeAvg(){
  		var i = 0, t = 0, h = 0, w = 0;
  		$scope.meteorologyInfo.monthinfos.forEach(function(monthinfo){
  			i += monthinfo.i;
  			t += monthinfo.t;
  			h += monthinfo.h;
  			w += monthinfo.w;
  		});

  		$scope.meteorologyInfo.monthavgs.i = i / 12;
  		$scope.meteorologyInfo.monthavgs.t = t / 12;
  		$scope.meteorologyInfo.monthavgs.w = w / 12;
  		$scope.meteorologyInfo.monthavgs.h = h / 12;
  	}

  	function getDbData(){                          //从气象数据库获取气象信息
  		$http({
			method : 'GET',
			params : {
			    lon : Number($scope.lng),
			    lat : Number($scope.lat)
			},
			url : 'http://cake.wolfogre.com:8080/pv-data/weather'
		}).then(function(response){
			$scope.meteorologyInfo.monthinfos = response.data.data;
			computeAvg();
			$scope.meteorologyInfo.lng = $scope.lng;
			$scope.meteorologyInfo.lat = $scope.lat;
		});
  	}

  	$scope.lng = tempData.getTempData('lng');
  	$scope.lat = tempData.getTempData('lat');

  	$scope.$on('processData.save',function(event){
  		processData.saveData($scope.meteorologyInfo,'meteorologyInfo.json');
  	});

  	$scope.$watch('$viewContentLoaded',function(){
  		var tempObj = processData.getData('meteorologyInfo.json');
		if(tempObj !== null && $scope.lng == tempObj.lng && $scope.lat == tempObj.lat){                             //如果数据存在则赋值
			$scope.meteorologyInfo = tempObj;
		}else{                                            //如果数据不存在，取默认值
		    getDbData();
	    }

	    $scope.flag = $scope.meteorologyInfo.type == 'db' ? 0 : 1;
	});
});

pvModule.controller('chooseInververCtrl',function($scope){
	$scope.show = true;
	$scope.type = "centralized";

	$scope.showForm = function(name){
		const BrowserWindow = require('electron').remote.BrowserWindow;

		var win = new BrowserWindow({ 
			width: 1100,
			height: 700, 
			show: false,
			minWidth : 1100,
			minHeight : 700
		});
		win.on('closed', function() {
		  win = null;
		});
		win.setMenu(null);

		var filename;
		switch(name){
		case 'centralized-inverter':                //集中式逆变器
			filename = 'centralizedInverter.html';
			break;
		case 'cocurrent-combiner':                  //直流汇流箱
			filename = 'directCurrent.html';
			break;
		case 'DC-power-distribution':               //直流配电柜
			filename = 'directDistribution.html';
			break;
		case 'cocurrent-cable':                     //直流电缆
			filename = 'directCurrentCable.html';
			break;
		case 'groups-inverter':                     //组串式逆变器
			filename = 'groupInverter.html';
			break;
		case 'AC-combiner':                         //交流汇流箱
			filename = 'alternatingCurrent.html';
			break;
		case 'group-cable':                         //交流电缆
			filename = 'alternatingCurrentCable.html';
		break;
		default:
			alert("faile");
			break;
		}
		win.loadURL('file://' + __dirname + '/tpls/html/' + filename);
		win.show();
	}

	$scope.$watch('type',function(){
		if($scope.type == "centralized"){
			$scope.show = true;
		}else{
			$scope.show = false;
		}
	})
})

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

/*
  地图指令
  */
  pvModule.directive('pvmap',function(){
  	return {
  		restrict : 'EA',
  		replace : true,
  		templateUrl : 'tpls/diretpls/pvmap.html',
  		link : function(scope, elem, attrs){
	    var map = new BMap.Map("mapContainer");          // 创建地图实例  
	    map.enableScrollWheelZoom();
	    var point = new BMap.Point(121.494966, 31.219456);  // 创建点坐标  
	    map.centerAndZoom(point, 10);                 // 初始化地图，设置中心点坐标和地图级别  
	    map.addEventListener("click", function(e){
	    	var lngInput = document.getElementById('lng');
	    	var latInput = document.getElementById('lat');
	    	lngInput.value = e.point.lng;
	    	latInput.value = e.point.lat;
	    	var evt = document.createEvent('MouseEvents');
	    	evt.initEvent('change',true,true);
	    	lngInput.dispatchEvent(evt);
	    	latInput.dispatchEvent(evt);
	    });
	    document.getElementById('locatePoint').addEventListener('click',function(e){
	    	var lng = document.getElementById('lng').value;
	    	var lat = document.getElementById('lat').value;
	    	map.centerAndZoom(new BMap.Point(lng,lat), 13);
	    });
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
		templateUrl: 'tpls/html/confirmAngle.html'
	}).when('/4',{
		templateUrl: 'tpls/html/userDesign.html'
	}).when('/5',{
		templateUrl: 'tpls/html/chooseInverter.html'
	});

	$routeProvider.otherwise({ redirectTo: '/' });
});
