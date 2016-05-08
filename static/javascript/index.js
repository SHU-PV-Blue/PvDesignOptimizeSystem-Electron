var fs = require('fs');
var pvModule = angular.module('PVModule',['ui.bootstrap','ui.router','ngRoute','ngAnimate'],function($httpProvider){
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
  项目数据服务
*/
  pvModule.service('projectData',function($rootScope){
    this.projectData = {};
  	this.dataBasePath = 'data/';
  	this.getData = function(propName){
  		if(this.projectData[propName]){
        return this.projectData[propName];
      }else{
        return null;
      }
  	};
  	this.addOrUpdateData = function(data, propName){
  		this.projectData[propName] = data;
  	};
    this.saveToLocal = function(){
      fs.writeFileSync(this.dataBasePath + 'projectdata',JSON.stringify(this.projectData, null,"    "),'utf8');
    };
  	this.noticeSaveData = function(){
  		$rootScope.$broadcast('projectData.save');
  	};
  });

/*
从数据接口获取数据服务
*/
pvModule.service('gainData', function($http, $q){
  this.getDataFromInterface = function(url, params){
    var defered = $q.defer();
    var httpOpt = {
      method : 'GET',
      url : url
    };
    if(params){
      httpOpt.params = params;
    }
    $http(httpOpt).then(function(response){
         defered.resolve(response.data);
    });

    return defered.promise;
  }
})

/*
  路由管理服务
  */
  pvModule.service('manageRoute',function(){
  	this.routes = ['/','/2','/3','/4','/5','/6','/7'];
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
  pvModule.controller('prenextCtrl',function($scope, $location, projectData, manageRoute){
  	$scope.nextStep = function(){
  		projectData.noticeSaveData();
  		$location.path(manageRoute.getNextRoute());
  	};
  	$scope.preStep = function(){
  		$location.path(manageRoute.getPreRoute());
  	};
  });

/*
  项目信息控制器
  */
  pvModule.controller('basicInfoCtrl',function($scope, projectData){
  	$scope.projectInfo = {
  		projectName : '',
  		projectAddress : '',
  		userName : '',
  		remark : '',
  		lng : '121.494966',
  		lat : '31.219456'
  	};

  	$scope.$on('projectData.save',function(event){
  		projectData.addOrUpdateData($scope.projectInfo,'basicInfo');
  	});

  	$scope.$watch('$viewContentLoaded',function(){
      var temp = projectData.getData('basicInfo');
      if(temp){
        $scope.projectInfo = temp;
        $scope.projectInfo.projectDate = new Date($scope.projectInfo.projectDate);
      }
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
  pvModule.controller('meteorologyCtrl',function($scope, projectData, gainData){
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
      gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/weather',{
         lon : Number($scope.lng),
         lat : Number($scope.lat)
      }).then(function(data){
         $scope.meteorologyInfo.monthinfos = data.data;
         computeAvg();
         $scope.meteorologyInfo.lng = $scope.lng;
         $scope.meteorologyInfo.lat = $scope.lat;
      });
   }

   $scope.lng = projectData.getData('basicInfo').lng;
   $scope.lat = projectData.getData('basicInfo').lat;

   $scope.$on('projectData.save',function(event){
      projectData.addOrUpdateData($scope.meteorologyInfo,'meteorologyInfo');
   });

   $scope.$watch('$viewContentLoaded',function(){
    var tempObj = projectData.getData('meteorologyInfo');
		if(tempObj !== null && $scope.lng == tempObj.lng && $scope.lat == tempObj.lat){                             //如果数据存在则赋值
			$scope.meteorologyInfo = tempObj;
		}else{                                            //如果数据不存在，取默认值
          getDbData();
    }

    $scope.flag = $scope.meteorologyInfo.type == 'db' ? 0 : 1;
  });
});

/*
选择组件控制器
*/
pvModule.controller('chooseComponentCtrl',function($scope, gainData){
  $scope.components = [];
  $scope.selected = '{}';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })
  $scope.$watch('$viewContentLoaded',function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/pv-module')
    .then(function(data){
      $scope.components = data.data;
    })
  });
});

/*
选择逆变器控制器
*/
pvModule.controller('chooseInververCtrl',function($scope, $uibModal){
	$scope.show = true;
  $scope.obj = {
    type : "centralized"
  };

	$scope.showForm = function(name){
		var templateUrl, controller;
		switch(name){
		case 'centralized-inverter':                //集中式逆变器
     templateUrl = 'tpls/html/centralizedInverter.html';
     controller = 'centralizedInverter';
     break;
		case 'cocurrent-combiner':                  //直流汇流箱
     templateUrl = 'tpls/html/directCurrent.html';
     controller = 'directCurrent';
     break;
		case 'DC-power-distribution':               //直流配电柜
     templateUrl = 'tpls/html/directDistribution.html';
     controller = 'directDistribution';
     break;
		case 'cocurrent-cable':                     //集中式直流电缆
     templateUrl = 'tpls/html/directCurrentCable.html';
     controller = 'directCurrentCable';
     break;
		case 'groups-inverter':                     //组串式逆变器
     templateUrl = 'tpls/html/groupInverter.html';
     controller = 'groupInverter';
     break;
		case 'AC-combiner':                         //交流汇流箱
     templateUrl = 'tpls/html/alternatingCurrent.html';
     controller = 'alternatingCurrent';
     break;
		case 'group-cable':                         //组串式直流电缆
     templateUrl = 'tpls/html/alternatingCurrentCable.html';
     controller = 'alternatingCurrentCable';
     break;
     default:
     alert("faile");
     break;
  }
  var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      templateUrl: templateUrl,
      controller: controller + 'Ctrl',
      size: 'lg',
      backdrop: false
    });
  modalInstance.result.then(function (data) {
      $scope.obj[data.name] = data.selected;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
}

  $scope.$watch('obj.type',function(newVal){
    if(newVal == "centralized"){
       $scope.show = true;
   }else{
       $scope.show = false;
   }
  })
});

/*
集中式逆变器控制器
*/
pvModule.controller('centralizedInverterCtrl',function($scope, $uibModalInstance, gainData){
  $scope.items = [];
  $scope.selected = '{}';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-centralized')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'centralizedInverter',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})

/*
直流汇流箱控制器
*/
pvModule.controller('directCurrentCtrl',function($scope, $uibModalInstance, gainData){
  $scope.items = [];
  $scope.selected = '{}';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/dc-combiner')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'directCurrent',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})

/*
直流配电柜控制器
*/
pvModule.controller('directDistributionCtrl',function($scope, $uibModalInstance, gainData){
  $scope.items = [];
  $scope.selected = '{}';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/dc-distribution')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'directDistribution',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});

/*
集中式直流电缆控制器
*/
pvModule.controller('directCurrentCableCtrl',function($scope, $uibModalInstance, $window, gainData){
  $scope.items = [];
  $scope.selected = '{}';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/cable')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'directDistribution',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})

/*
组串式直流电缆控制器
*/
pvModule.controller('alternatingCurrentCableCtrl',function($scope, $uibModalInstance, $window, gainData){
  $scope.items = [];
  $scope.selected = '{}';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/cable')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'directDistribution',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})

/*
组串式逆变器控制器
*/
pvModule.controller('groupInverterCtrl',function($scope, $uibModalInstance, gainData){
  $scope.items = [];
  $scope.selected = '';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'groupInverter',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})

/*
选择电网等级控制器
*/
pvModule.controller('selectTransformerCtrl',function($scope, $uibModal){
  $scope['show_10'] = true;
  $scope['show_35'] = false;
  $scope['show_380'] = false;
  $scope.obj = {
    type : "10kv"
  };

  $scope.$watch('obj.type',function(newVal){
      if(newVal == "10kv"){
        $scope['show_10'] = true;
        $scope['show_35'] = false;
        $scope['show_380'] = false;
     }else if(newVal == "35kv"){
         $scope['show_10'] = false;
        $scope['show_35'] = true;
        $scope['show_380'] = false;
     }else{
        $scope['show_10'] = false;
        $scope['show_35'] = false;
        $scope['show_380'] = true;
     }
  })

  $scope.showForm = function(name){
    var templateUrl, controller;
    switch(name){
    case 'low_10_35':                //10,35kv低压开关柜
     templateUrl = 'tpls/html/lowVoltage.html';
     controller = 'low_10_35';
     break;
    case 'low_380':                  //380kv低压开关柜
     templateUrl = 'tpls/html/directCurrent.html';
     controller = 'low_380';
     break;
    case 'up_10':               //10kv升压变压器
     templateUrl = 'tpls/html/setupTransformer.html';
     controller = 'up_10';
     break;
    case 'up_35':                     //35kv升压变压器
     templateUrl = 'tpls/html/setupTimes.html';
     controller = 'up_35';
     break;
    case 'high_10_35':                     //10,35kv高压开关柜
     templateUrl = 'tpls/html/groupInverter.html';
     controller = 'high_10_35';
     break;
     default:
     alert("faile");
     break;
  }
  var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      templateUrl: templateUrl,
      controller: controller + 'Ctrl',
      size: 'lg',
      backdrop: false
    });
  modalInstance.result.then(function (data) {
      $scope.obj[data.name] = data.selected;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
}
});

/*
10,35kv低压开关柜控制器
*/
pvModule.controller('low_10_35Ctrl',function($scope, $uibModalInstance, gainData){
  $scope.items = [];
  $scope.selected = '';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'groupInverter',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})

/*
10kv升压变压器控制器
*/
pvModule.controller('up_10Ctrl',function($scope, $uibModalInstance, gainData){
  $scope.items = [];
  $scope.selected = '';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'groupInverter',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
})

/*
35kv升压变压器控制器
*/
pvModule.controller('up_35Ctrl',function($scope, $uibModalInstance, $window, gainData){
  $scope.items = [];
  $scope.selected = '';
  $scope.show = {};
  $scope.$watch('selected',function(newVal){
    $scope.show = JSON.parse(newVal);
  })

  $scope.getData = function(){
    gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
      .then(function(data){
        $scope.items = data.data;
      })
  }

  $scope.ok = function() {
    $uibModalInstance.close({
      name : 'groupInverter',
      selected : $scope.show
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
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
        templateUrl: 'tpls/html/chooseComponent.html'
    }).when('/4',{
        templateUrl: 'tpls/html/confirmAngle.html'
    }).when('/5',{
        templateUrl: 'tpls/html/userDesign.html'
    }).when('/6',{
        templateUrl: 'tpls/html/chooseInverter.html'
    }).when('/7',{
        templateUrl: 'tpls/html/selectTransformer.html'
    });

    $routeProvider.otherwise({ redirectTo: '/' });
});
