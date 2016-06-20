var fs = require('fs');
var pvModule = angular.module('PVModule', ['chart.js','ui.bootstrap', 'ui.router', 'ngRoute', 'ngAnimate'], function ($httpProvider) {
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}
     */
    var param = function (obj) {
        var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

        for (name in obj) {
            value = obj[name];

            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name + '[' + i + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            }
            else if (value instanceof Object) {
                for (subName in value) {
                    subValue = value[subName];
                    fullSubName = name + '[' + subName + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            }
            else if (value !== undefined && value !== null)
                query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }

        return query.length ? query.substr(0, query.length - 1) : query;
    };

    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function (data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
});

//服务区
/*
 项目数据服务
 */
pvModule.service('projectData', function ($rootScope) {
    this.projectData = {};
    this.dataBasePath = 'data/';
    this.getData = function (propName) {
        if (this.projectData[propName]) {
            return this.projectData[propName];
        } else {
            return null;
        }
    };
    this.addOrUpdateData = function (data, propName) {
        this.projectData[propName] = data;
    };
    this.saveToLocal = function () {
        fs.writeFileSync(this.dataBasePath + 'projectdata', JSON.stringify(this.projectData, null, "    "), 'utf8');
    };
    this.noticeSaveData = function () {
        $rootScope.$broadcast('projectData.save');
    };
});

/*
 从数据接口获取数据服务
 */
pvModule.service('gainData', function ($http, $q) {
    this.getDataFromInterface = function (url, params) {
        var defered = $q.defer();
        var httpOpt = {
            method: 'GET',
            url: url
        };
        if (params) {
            httpOpt.params = params;
        }
        $http(httpOpt).then(function (response) {
            defered.resolve(response.data);
        });

        return defered.promise;
    }
});

/*
 路由管理服务
 */
pvModule.service('manageRoute', function () {
    this.routes = ['/', '/2', '/3', '/4', '/5', '/6', '/7'];
    this.curIndex = 0;
    this.getTotal = function () {
        return this.routes.length;
    };
    this.getCurrent = function () {
        return this.curIndex;
    };
    this.getNextRoute = function () {
        if (this.curIndex >= this.routes.length - 1)
            return;
        this.curIndex += 1;
        return this.routes[this.curIndex];
    };
    this.getPreRoute = function () {
        if (this.curIndex == 0)
            return;
        this.curIndex -= 1;
        return this.routes[this.curIndex]
    };
});

//控制器区

/*
 导航控制器
 */
pvModule.controller('cordionCtrl', function ($scope) {
    $scope.oneAtATime = true;
});

/*
 上一步下一步控制器
 */
pvModule.controller('prenextCtrl', function ($scope, $location, projectData, manageRoute) {
    $scope.max = manageRoute.getTotal();
    $scope.current = 1;
    $scope.nextStep = function () {
        projectData.noticeSaveData();
        $location.path(manageRoute.getNextRoute());
        $scope.current = manageRoute.getCurrent() + 1;
    };
    $scope.preStep = function () {
        $location.path(manageRoute.getPreRoute());
        $scope.current = manageRoute.getCurrent() + 1;
    };
});

/*
项目步骤控制器
 */
pvModule.controller('projectCtrl',function($scope, $location){
    $scope.switchToUrl = function(url){
        $location.path(url);
    };
});

/*
 项目信息控制器
 */
pvModule.controller('basicInfoCtrl', function ($scope, $location, projectData) {
    $scope.projectInfo = {
        projectName: '',
        projectAddress: '',
        userName: '',
        remark: '',
        lng: 121.494966,
        lat: 31.219456
    };

    $scope.save =  function () {
        projectData.addOrUpdateData($scope.projectInfo, 'basicInfo');
        $location.path('/');
    };

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('basicInfo');
        if (temp) {
            $scope.projectInfo = temp;
            $scope.projectInfo.projectDate = new Date($scope.projectInfo.projectDate);
        }
    });

    $scope.today = function () {
        $scope.projectInfo.projectDate = new Date();
    };
    $scope.today();

    $scope.clear = function () {
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

    $scope.toggleMin = function () {
        $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
        $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
    };

    $scope.toggleMin();

    $scope.open2 = function () {
        $scope.popup2.opened = true;
    };

    $scope.setDate = function (year, month, day) {
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
            var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

            for (var i = 0; i < $scope.events.length; i++) {
                var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

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
pvModule.controller('meteorologyCtrl', function ($scope, $location, projectData, gainData) {
    $scope.meteorologyInfo = {
        type: 'db',
        minTem: '',
        maxTem: '',
        monthinfos: [],
        monthavgs: {
            H: '',
            temperature: '',
            humidity: '',
            wind: ''
        },
        lng: '',
        lat: ''
    };


    $scope.selectDb = function (e) {
        if ($scope.flag == 0) {
            return;
        }
        if (!confirm("确定选择国际气象数据库？")) {
            e.preventDefault();
            $scope.meteorologyInfo.type = 'user';
        } else {
            $scope.flag = 0;
            getDbData();
        }
    };
    $scope.selectUser = function (e) {
        if ($scope.flag == 1) {
            return;
        }
        if (!confirm("确定自定义气象数据？")) {
            e.preventDefault();
            $scope.meteorologyInfo.type = 'db';
        } else {
            $scope.flag = 1;
        }
    };

    $scope.$watch('meteorologyInfo.monthinfos',function(){
        computeAvg();
    },true);

    function computeAvg() {
        var i = 0, t = 0, h = 0, w = 0;
        $scope.meteorologyInfo.monthinfos.forEach(function (monthinfo) {
            i += Number(monthinfo.H);
            t += Number(monthinfo.temperature);
            h += Number(monthinfo.humidity);
            w += Number(monthinfo.wind);
        });

        $scope.meteorologyInfo.monthavgs.H = (i / 12).toFixed(2);
        $scope.meteorologyInfo.monthavgs.temperature = (t / 12).toFixed(2);
        $scope.meteorologyInfo.monthavgs.wind = (w / 12).toFixed(2);
        $scope.meteorologyInfo.monthavgs.humidity = (h / 12).toFixed(2);
    }

    function getDbData() {                          //从气象数据库获取气象信息
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/weather', {
            lon: Number($scope.lng),
            lat: Number($scope.lat)
        }).then(function (data) {
            $scope.meteorologyInfo.monthinfos = data.data;
            computeAvg();
            $scope.meteorologyInfo.lng = $scope.lng;
            $scope.meteorologyInfo.lat = $scope.lat;
        });
    }

    $scope.lng = projectData.getData('basicInfo').lng;
    $scope.lat = projectData.getData('basicInfo').lat;

    $scope.save = function () {
        projectData.addOrUpdateData($scope.meteorologyInfo, 'meteorologyInfo');
        $location.path('/');
    };

    $scope.$watch('$viewContentLoaded', function () {
        var tempObj = projectData.getData('meteorologyInfo');
        if (tempObj !== null && $scope.lng == tempObj.lng && $scope.lat == tempObj.lat) {                             //如果数据存在则赋值
            $scope.meteorologyInfo = tempObj;
        } else {                                            //如果数据不存在，取默认值
            getDbData();
        }

        $scope.flag = $scope.meteorologyInfo.type == 'db' ? 0 : 1;
    });
});

/*
 选择组件控制器
 */
pvModule.controller('chooseComponentCtrl', function ($scope,$location, gainData, projectData) {
    $scope.components = [];
    $scope.selected = '{}';
    $scope.show = {};
    $scope.$watch('selected', function (newVal) {
        $scope.show = JSON.parse(newVal);
    });

    $scope.confirmChoose = function () {
        projectData.addOrUpdateData($scope.show, 'componentInfo');
        $location.path('/');
    };

    $scope.$watch('$viewContentLoaded', function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/pv-module')
            .then(function (data) {
                $scope.components = data.data;
                if (projectData.getData("componentInfo")) {
                    $scope.selected = JSON.stringify(projectData.getData("componentInfo"));
                }
            })
    });
});

/*
 方位角倾角控制器
 */
pvModule.controller('confirmAngleCtrl', function ($scope, $location, projectData) {
    $scope.angleInfo = {
        dip: 0,
        bestDipH: 0,
        bestDipG: 0,
        az: 0
    };

    $scope.sums_g = [];
    $scope.sums = [];

    $scope.options = {
        pointDotRadius : 2
    };
    $scope.show = [true,false,false,false];

    $scope.showChart = function(id){
        for(var i = 0; i < $scope.show.length; i++){
            $scope.show[i] = i == id;
        }
    };

    $scope.labelsAngle = ["0", "", "", "", "", "5", "", "", "", "", "10", "", "", "", "", "15", "", "", "", "", "20", "", "", "", "", "25", "", "", "", "", "30", "", "", "", "", "35", "", "", "", "", "40", "", "", "", "", "45", "", "", "", "", "50", "", "", "", "", "55", "", "", "", "", "60", "", "", "", "", "65", "", "", "", "", "70", "", "", "", "", "75", "", "", "", "", "80", "", "", "", "", "85", "", "", "", "", "90"];
    $scope.labelsMonth = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','12月','12月'];
    $scope.series = [
        ['年总辐照度'],
        ['效率'],
        ['月平均辐照度'],
        ['月效率']
    ];

    $scope.data = [
        [],
        [],
        [],
        []
    ];

    $scope.$watch('angleInfo.az',function(){
        var temp = getHData();
        $scope.data[0][0] = temp.sums;
        $scope.data[1][0] = temp.sums_g;
        $scope.angleInfo.dip = temp.best;
        $scope.angleInfo.bestDipG = temp.best;
        $scope.angleInfo.bestDipH = temp.bestH;
    });

    $scope.$watch('angleInfo.dip',function(){
        var temp = getDataByDip(H, meteorologyInfo.lat, $scope.angleInfo.az,componentInfo['转换效率'],T,componentInfo['最大功率温度系数']/100,$scope.angleInfo.dip);
        $scope.data[2][0] = temp.H_ts;
        $scope.data[3][0] = temp.gs;
    });

    var componentInfo = projectData.getData('componentInfo');
    var meteorologyInfo = projectData.getData('meteorologyInfo');
    var H = [];
    var T = [];

    meteorologyInfo.monthinfos.forEach(function (monthinfo) {
        H.push(monthinfo.H);
        T.push(monthinfo.temperature);
    });

    function getHData() {
        var res =  getChartData(H, meteorologyInfo.lat, $scope.angleInfo.az,componentInfo['转换效率'],componentInfo['长度'],componentInfo['宽度'],T,componentInfo['最大功率温度系数']/100);
        console.log(res);
        return res;
    }

    $scope.save =  function () {
        projectData.addOrUpdateData($scope.angleInfo, 'angleInfo');
        $location.path('/');
    };


    //for(var i = 0; i <= 90; i++){
    //    getDataByDip(H, meteorologyInfo.lat, $scope.angleInfo.az,componentInfo['转换效率'],T,componentInfo['最大功率温度系数']/100,i);
    //}

    //$scope.$watch('$viewContentLoaded', function () {
    //    var temp = getHData();
    //    $scope.sums_g = temp.sums_g;
    //    $scope.sums = temp.sums;
    //    $scope.angleInfo.dip = temp.best;
    //});
});

/*
 用户自定义面积或安装容量控制器
*/
pvModule.controller('userDesignCtrl', function ($scope, $location,projectData) {
    $scope.userDesignInfo = {
        componentDirection: 'horizontal',
        designType: 'area',                     //capacity
        rowsPerFixture: 1,
        colsPerFixture: 1,
        fbspace: 0,
        lrspace: 0,
        area: {
            length: 0,
            width: 0,
            numPerRow: 0,
            rowsNum: 0,
            fbRestSpace: 0,
            lrRestSpace: 0,
            componentsNum: 0,
            totalArea: 0,
            totalCapacity: 0
        },
        capacity: {
            totalCapacity: 0
        }
    };

    function isNumber(obj) {
        return typeof obj === 'number' && !isNaN(obj)
    }

    $scope.$watch('userDesignInfo.rowsPerFixture', function () {
        $scope.userDesignInfo.fbspace = Number(compute_fbspace());
    });

    $scope.$watch('userDesignInfo.colsPerFixture',function(){
        $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
    });

    $scope.$watch('userDesignInfo.componentDirection', function () {
        $scope.userDesignInfo.fbspace = Number(compute_fbspace());
        $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
    });

    $scope.$watch('userDesignInfo.area.length', function (newVal) {
        $scope.userDesignInfo.area.totalArea = newVal * $scope.userDesignInfo.area.width;
        $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
    });

    $scope.$watch('userDesignInfo.area.width', function (newVal) {
        $scope.userDesignInfo.area.totalArea = newVal * $scope.userDesignInfo.area.length;
        $scope.userDesignInfo.area.rowsNum = compute_rowsNum();
    });

    $scope.$watch('userDesignInfo.lrspace', function (newval) {
        if(Number(newval)){
            $scope.userDesignInfo.lrspace = Number(newval);
            $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
        }
    });

    $scope.$watch('userDesignInfo.fbspace', function (newval) {
        if(Number(newval)){
            $scope.userDesignInfo.fbspace = Number(newval);
            $scope.userDesignInfo.area.rowsNum = compute_rowsNum();
        }
    });

    $scope.$watch('userDesignInfo.area.numPerRow', function (newVal) {
        $scope.userDesignInfo.area.componentsNum = newVal * $scope.userDesignInfo.area.rowsNum * $scope.userDesignInfo.rowsPerFixture * $scope.userDesignInfo.colsPerFixture;
    });

    $scope.$watch('userDesignInfo.area.rowsNum', function (newVal) {
        $scope.userDesignInfo.area.componentsNum = newVal * $scope.userDesignInfo.area.numPerRow * $scope.userDesignInfo.rowsPerFixture * $scope.userDesignInfo.colsPerFixture;
    });

    $scope.$watch('userDesignInfo.area.componentsNum', function (newVal) {
        var componentInfo = projectData.getData('componentInfo');
        $scope.userDesignInfo.area.totalCapacity = (newVal * componentInfo['峰值功率']) / 1000;            //总安装容量
    });

    function toRadian(degree) {                           //角度转弧度
        return degree * 0.017453293;
    }

    var sin = function (degree) {
        return Math.sin(toRadian(degree));
    };

    var cos = function (degree) {
        return Math.cos(toRadian(degree));
    };
    var tan = function (degree) {
        return Math.tan(toRadian(degree));
    };

    function compute_fbspace() {                           //计算阵列前后间距
        var componentInfo = projectData.getData('componentInfo');
        var dip = projectData.getData('angleInfo').dip;
        var lat = projectData.getData('basicInfo').lat;
        var w;
        if ($scope.userDesignInfo.componentDirection === 'horizontal') {
            w = componentInfo['宽度'] / 1000;
        } else {
            w = componentInfo['长度'] / 1000;
        }

        var W1 = w * $scope.userDesignInfo.rowsPerFixture;
        console.log(''+w+','+dip+','+lat+','+$scope.userDesignInfo.rowsPerFixture);
        return W1 * cos(dip) + W1 * sin(dip) * (0.707 * tan(lat) + 0.4338) / (0.707 - 0.4338 * tan(lat));
    }

    function compute_numPerRow() {                               //计算每行支架数
        var componentInfo = projectData.getData('componentInfo');
        var L;
        if ($scope.userDesignInfo.componentDirection === 'horizontal') {
            L = componentInfo['长度'] / 1000;
        } else {
            L = componentInfo['宽度'] / 1000;
        }

        var _L = L * $scope.userDesignInfo.colsPerFixture;

        var res = Math.floor(($scope.userDesignInfo.area.length - _L) / (_L + $scope.userDesignInfo.lrspace)) + 1;
        $scope.userDesignInfo.area.lrRestSpace = ($scope.userDesignInfo.area.length - res * _L - (res-1)*$scope.userDesignInfo.lrspace).toFixed(2);            //左右剩余间距
        return res;
    }

    function compute_rowsNum() {                                 //计算阵列行数
        var res = Math.floor($scope.userDesignInfo.area.width / $scope.userDesignInfo.fbspace);
        $scope.userDesignInfo.area.fbRestSpace = ($scope.userDesignInfo.area.width - res * $scope.userDesignInfo.fbspace).toFixed(2);
        return res;
    }

    $scope.save = function () {
        projectData.addOrUpdateData($scope.userDesignInfo, 'userDesignInfo');
        $location.path('/');
    };

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('userDesignInfo');
        if (temp) {
            $scope.userDesignInfo = temp;
            $scope.userDesignInfo.fbspace = compute_fbspace().toFixed(2);
        }
    });
});

/*
 选择逆变器控制器
 */
pvModule.controller('chooseInverterCtrl', function ($scope, $location, $uibModal, projectData) {
    $scope.obj = {
        type: "centralized"
    };

    $scope.setType = function(type){
        $scope.obj.type = type;
    };

    $scope.finish = function(){
        projectData.addOrUpdateData($scope.obj, 'inverter');
        $location.path('/');
    };

    $scope.showForm = function (name) {
        var templateUrl, controller;
        switch (name) {
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
            backdrop: false,
            resolve : {
                parentObj : function(){
                    return $scope.obj;
                }
            }
        });
        modalInstance.result.then(function (data) {
            $scope.obj[data.name] = data.obj;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.$watch('obj.type', function (newVal) {
        //noinspection JSValidateTypes
        $scope.show = newVal == "centralized";
    })
});

/*
 集中式逆变器控制器
*/
pvModule.controller('centralizedInverterCtrl', function ($scope, $uibModalInstance, gainData, projectData) {
    $scope.centralizedInverterInfo = {
        centralizedInverter: {},
        serialNumPerBranch: 0,
        branchNumPerInverter: 0,
        volumeRatio: 1.05,
        inverterNumNeeded: 0,
        totalOpacity: 0
    };

    $scope.items = [];
    $scope.selected = '{}';

    $scope.$watch('selected', function (newVal) {
        $scope.centralizedInverterInfo.centralizedInverter = JSON.parse(newVal);
        $scope.centralizedInverterInfo.serialNumPerBranch = compute_serialNumPerBranch()[1];
    });

    $scope.$watch('centralizedInverterInfo.serialNumPerBranch',function(){
        $scope.centralizedInverterInfo.branchNumPerInverter = compute_branchNumPerInverter();
    });

    $scope.$watch('centralizedInverterInfo.branchNumPerInverter',function(){
        $scope.centralizedInverterInfo.inverterNumNeeded = compute_inverterNumNeeded();
    });

    $scope.$watch('centralizedInverterInfo.volumeRatio',function(){
        $scope.centralizedInverterInfo.inverterNumNeeded = compute_inverterNumNeeded();
    });

    $scope.$watch('centralizedInverterInfo.inverterNumNeeded',function(){
        $scope.centralizedInverterInfo.totalOpacity = compute_totalOpacity();
    });

    var componentInfo = projectData.getData('componentInfo');

    function compute_serialNumPerBranch() {
        var n1 = Math.floor($scope.centralizedInverterInfo.centralizedInverter['最大输入电压'] / (componentInfo['开路电压'] * (1 + (componentInfo['工作温度下限'] - 25) * componentInfo['开路电压温度系数']/100)));
        var n2min = Math.ceil($scope.centralizedInverterInfo.centralizedInverter['MPP电压下限'] / (componentInfo['最大功率点电压'] * (1 + (componentInfo['工作温度上限'] - 25) * componentInfo['最大功率温度系数']/100)));
        var n2max = Math.floor($scope.centralizedInverterInfo.centralizedInverter['MPP电压下限'] / (componentInfo['最大功率点电压'] * (1 + (componentInfo['工作温度上限'] - 25) * componentInfo['最大功率温度系数']/100)));

        if(n1 > n2max){                               //返回每支路串联数范围
            return [n2min, n2max];
        }else if(n1 < n2min){
            return [1, n1];
        }else{
            return [n2min, n1];
        }
    }

    function compute_branchNumPerInverter(){
        return Math.ceil($scope.centralizedInverterInfo.centralizedInverter['最大直流输入功率']/(componentInfo['峰值功率']*$scope.centralizedInverterInfo.serialNumPerBranch));
    }

    function compute_inverterNumNeeded(){
        var userDesignInfo = projectData.getData('userDesignInfo');
        var capacity = userDesignInfo.componentDirection === 'horizontal'? userDesignInfo.area.totalCapacity : userDesignInfo.capacity.totalCapacity;
        return Math.ceil(capacity * $scope.centralizedInverterInfo.volumeRatio / ($scope.centralizedInverterInfo.serialNumPerBranch
            * $scope.centralizedInverterInfo.branchNumPerInverter * componentInfo['峰值功率']));
    }

    function compute_totalOpacity(){
        return $scope.centralizedInverterInfo.branchNumPerInverter * $scope.centralizedInverterInfo.serialNumPerBranch
            * $scope.centralizedInverterInfo.inverterNumNeeded * componentInfo['峰值功率'];
    }

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-centralized')
            .then(function (data) {
                $scope.items = data.data;
            });
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'centralizedInverterInfo',
            obj: $scope.centralizedInverterInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 直流汇流箱控制器
 */
pvModule.controller('directCurrentCtrl', function ($scope, $uibModalInstance, parentObj, gainData) {
    $scope.directCurrentInfo = {
        directCurrent : {},
        num : 0
    };

    $scope.items = [];
    $scope.selected = '{}';

    $scope.$watch('selected', function (newVal) {
        $scope.directCurrentInfo.directCurrent = JSON.parse(newVal);
        $scope.directCurrentInfo.num = compute_num();
    });

    function compute_num(){
        return Math.ceil(parentObj.centralizedInverterInfo.branchNumPerInverter / $scope.directCurrentInfo.directCurrent['输入路数']);
    }

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/dc-combiner')
            .then(function (data) {
                $scope.items = data.data;
            })
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'directCurrentInfo',
            obj: $scope.directCurrentInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 直流配电柜控制器
 */
pvModule.controller('directDistributionCtrl', function ($scope, $uibModalInstance,parentObj ,gainData) {
    $scope.directDistributionInfo = {
        directDistribution : {},
        num : 0
    };

    $scope.items = [];
    $scope.selected = '{}';

    $scope.$watch('selected', function (newVal) {
        $scope.directDistributionInfo.directDistribution = JSON.parse(newVal);
        $scope.directDistributionInfo.num = compute_num();
    });

    function compute_num(){
        return Math.ceil(parentObj.directCurrentInfo.num / $scope.directDistributionInfo.directDistribution['接入直流路数']);
    }

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/dc-distribution')
            .then(function (data) {
                $scope.items = data.data;
            })
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'directDistributionInfo',
            obj: $scope.directDistributionInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 集中式直流电缆控制器
*/
pvModule.controller('directCurrentCableCtrl', function ($scope, $uibModalInstance, $window, projectData, parentObj, gainData) {
    $scope.directCurrentCableInfo = {
        directCurrentCable : {},
        cables : [{                           //光伏组件，组件->汇流箱，汇流箱->配电柜，配电柜->逆变器
            length : 0,
            lineDrop : 0,
            loss : 0
        },{
            length : 0,
            lineDrop : 0,
            loss : 0
        },{
            length : 0,
            lineDrop : 0,
            loss : 0
        },{
            length : 0,
            lineDrop : 0,
            loss : 0
        }],
        totalLoss : 0
    };

    $scope.active = 0;
    $scope.setActive = function(index){
        $scope.active = index;
    };

    var componentInfo = projectData.getData('componentInfo');
    var maxPowerCurrent = componentInfo['最大功率点电流'];
    var maxPowerVoltage = componentInfo['最大功率点电压'];
    var serialNumPerBranch = parentObj.centralizedInverterInfo.serialNumPerBranch;

    function update(){
        $scope.directCurrentCableInfo.totalLoss = 0;
        $scope.directCurrentCableInfo.cables.forEach(function(cable,idx){
            var maxCurrentPerBranch = maxPowerCurrent;
            if(idx == 2){
                maxCurrentPerBranch *= Number(parentObj.directCurrentInfo.directCurrent['输入路数']);
            }
            cable.lineDrop = Number((maxCurrentPerBranch*1.25*17.241*cable.length*2 / Number($scope.directCurrentCableInfo.directCurrentCable['导体截面'])).toFixed(3));
            cable.loss = Number((compute_loss(cable.lineDrop)).toFixed(3));
            $scope.directCurrentCableInfo.totalLoss += cable.loss;
        });
    }

    function compute_loss(lineDrop){
        return lineDrop / (serialNumPerBranch * maxPowerVoltage);
    }

    $scope.$watch('directCurrentCableInfo.cables',function(newVal, oldVal){
        if(newVal === oldVal)
            return;
        update();
    },true);

    $scope.$watch('directCurrentCableInfo.directCurrentCable',function(newVal, oldVal){
        if(newVal === oldVal)
            return;
        update();
    },true);

    $scope.items = [];
    $scope.selected = '{}';

    $scope.$watch('selected', function (newVal) {
        $scope.directCurrentCableInfo.directCurrentCable = JSON.parse(newVal);
    });

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/cable')
            .then(function (data) {
                $scope.items = data.data;
            });
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'directDistribution',
            selected: $scope.show
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 组串式直流电缆控制器
 */
pvModule.controller('alternatingCurrentCableCtrl', function ($scope, $uibModalInstance, $window, gainData) {
    $scope.items = [];
    $scope.selected = '{}';
    $scope.show = {};
    $scope.$watch('selected', function (newVal) {
        $scope.show = JSON.parse(newVal);
    });

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/cable')
            .then(function (data) {
                $scope.items = data.data;
            })
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'directDistribution',
            selected: $scope.show
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 组串式逆变器控制器
 */
pvModule.controller('groupInverterCtrl', function ($scope, $uibModalInstance, gainData) {
    $scope.items = [];
    $scope.selected = '';
    $scope.show = {};
    $scope.$watch('selected', function (newVal) {
        $scope.show = JSON.parse(newVal);
    });

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
            .then(function (data) {
                $scope.items = data.data;
            })
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'groupInverter',
            selected: $scope.show
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 选择电网等级控制器
 */
pvModule.controller('selectTransformerCtrl', function ($scope,$location, $uibModal) {
    $scope['show_10'] = true;
    $scope['show_35'] = false;
    $scope['show_380'] = false;
    $scope.obj = {
        type: "10kv"
    };

    $scope.$watch('obj.type', function (newVal) {
        //noinspection JSValidateTypes
        if (newVal == "10kv") {
            $scope['show_10'] = true;
            $scope['show_35'] = false;
            $scope['show_380'] = false;
        } else { //noinspection JSValidateTypes
            if (newVal == "35kv") {
                        $scope['show_10'] = false;
                        $scope['show_35'] = true;
                        $scope['show_380'] = false;
                    } else {
                        $scope['show_10'] = false;
                        $scope['show_35'] = false;
                        $scope['show_380'] = true;
                    }
        }
    });

    $scope.finish = function(){
        $location.path('/');
    };

    $scope.showForm = function (name) {
        var templateUrl, controller;
        switch (name) {
            case 'low_10_35':                //10,35kv低压开关柜
                templateUrl = 'tpls/html/lowVoltage.html';
                controller = 'low_10_35';
                break;
            case 'low_380':                  //380v低压开关柜
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
pvModule.controller('low_10_35Ctrl', function ($scope, $uibModalInstance, gainData) {
    $scope.items = [];
    $scope.selected = '';
    $scope.show = {};
    $scope.$watch('selected', function (newVal) {
        $scope.show = JSON.parse(newVal);
    });

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
            .then(function (data) {
                $scope.items = data.data;
            })
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'groupInverter',
            selected: $scope.show
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 10kv升压变压器控制器
 */
pvModule.controller('up_10Ctrl', function ($scope, $uibModalInstance, gainData) {
    $scope.items = [];
    $scope.selected = '';
    $scope.show = {};
    $scope.$watch('selected', function (newVal) {
        $scope.show = JSON.parse(newVal);
    });

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
            .then(function (data) {
                $scope.items = data.data;
            })
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'groupInverter',
            selected: $scope.show
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 35kv升压变压器控制器
 */
pvModule.controller('up_35Ctrl', function ($scope, $uibModalInstance, $window, gainData) {
    $scope.items = [];
    $scope.selected = '';
    $scope.show = {};
    $scope.$watch('selected', function (newVal) {
        $scope.show = JSON.parse(newVal);
    });

    $scope.getData = function () {
        gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/inverter-tandem')
            .then(function (data) {
                $scope.items = data.data;
            })
    };

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'groupInverter',
            selected: $scope.show
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
效率分析控制器
 loss [0]: 阴影损耗
 loss [1] : 灰尘等遮挡损耗
 loss [2] : 组件性能衰减
 loss [3] : 组件温升损耗
 loss [4] : 直流电缆损耗
 loss [5] : 组串内失配损耗
 loss [6] : 逆变器损耗
 loss [7] : 变压器损耗
 loss [8] : 交流电缆损耗
 loss [9] : 故障检修、电网等其它损耗
 */
pvModule.controller('efficiencyAnalysisCtrl',function($scope, $location, projectData){

    $scope.data = {
        loss : [2.8, 10, 3, 3, 2.2, 2, 4, 1, 0.5, 5],
        lossTotal : 0
    };

    $scope.$watch('data.loss',function(){
        var total = 0;
        for(var i = 0; i < $scope.data.loss.length; i++){
            total += $scope.data.loss[i];
        }
        $scope.data.lossTotal = total;
    },true);


    var componentInfo = projectData.getData('componentInfo');
    var meteorologyInfo = projectData.getData('meteorologyInfo');
    var angleInfo = projectData.getData('angleInfo');

    var H = [];

    meteorologyInfo.monthinfos.forEach(function (monthinfo) {
        H.push(monthinfo.H);
    });

    $scope.chartData = [
        []
    ];

    for(var i = 1; i <= 12; i++ ){
        $scope.chartData[0].push(getH_t(i,H[i-1]*1000,meteorologyInfo.lat,angleInfo.dip,angleInfo.az));
    }

    $scope.labelsMonth = [1,2,3,4,5,6,7,8,9,10,11,12];

    $scope.back = function(){
        $location.path('/');
    }
});


/*
效益分析控制器
 */
pvModule.controller('benefitCtrl',function($scope, $location){
    $scope.switchToUrl = function(url){
        $location.path(url);
    };

    $scope.back = function(){
        $location.path('/');
    }
});

/*
 参数列表控制器
 */
pvModule.controller('parametersCtrl',function($scope, $location, projectData){

    $scope.defaultParameters = {
        AA : 0.9575,
        AB : 0.45927,
        AC : 0.42,
        AD : 0.25,
        AE : 0.9,
        AF : 1,
        AG : 20,
        AH : 5,
        AI : 0.17,
        AJ : 0.86175,
        AY : 0,
        BB : 25,
        BC : 3,
        BD : 4,
        BE : 0,
        DA : 5.6,
        DB : 0.3,
        DC : 1.6,
        DD : 0.1,
        DE : 0.18,
        LC : 0.0793,
        FA : 0.085,
        HA : 0.005,
        JA : 0.02,
        GA : 0.005,
        GB : 0.0655,
        GC : 0.5,
        GD : 10,
        GF : 0,
        GG : 20000,
        GI : 0,
        GR : 0,
        GP : 100000,
        GQ : 0,
        GO : 0,
        GS : 0,
        MM : 0,
        MY : 0.0655
    };

    $scope.defaultParameters.BE = $scope.defaultParameters.BB * (12 / $scope.defaultParameters.BC);

    $scope.save = function(){
        projectData.addOrUpdateData($scope.defaultParameters,'parameters');
        $location.path('/8');
    };
});

/*
投资成本情况控制器
data1 : 项目总收入预算
data2 : 分包预算
data3 : 合同
data4 : 运维分包
data5 : 项目直接费用预算
data6 : 部门费用分摊
data7 : 项目预计毛利
data8 : 期间费用分摊
data9 : 项目预计净利润
 */
pvModule.controller('investmentCostsCtrl',function($scope, $location, projectData){

    $scope.hide = true;

    $scope.show = [true,false,false,false,false,false,false,false,false];

    $scope.showMe = function(id){
        for(var i = 0; i < $scope.show.length; i++){
            if(i === id){
                $scope.show[i] = true;
            }else{
                $scope.show[i] = false;
            }
        }
    };

    var p = projectData.getData('parameters');
    var BA = 1.915815;

///////////////////////////////////////////////////////////////////////   项目总收入预算
    $scope.data1 = {
        CA : [],
        CD : [],
        CE : [],
        CF : [],
        CG : [],
        CH : [],
        CI : [],
        CB : 0,
        CC : 0,
        CJ : 0,
        CK : 0,
        CL : 0,
        CM : 0,
        CN : 0,
        CO : 0,
        CP : 0,
        CQ : 0,
        CR : 0,
        CS : 0,
        CT : 0,
        CU : 0,
        CV : 0
    };

    var ca,cd,ce,cf,cg,ch,ci;
    for(var i = 0; i < p.BB; i++){
        if(i == 0){
            ca = BA * 0.9228 * 1000000;
        }else if(i < 10){
            ca = $scope.data1.CA[i-1] * 0.99;
        }else{
            ca = $scope.data1.CA[i-1] * 0.9934;
        }

        cd = ca * p.AF * p.AJ + ca * (1 - p.AF) * p.AB;
        ce = cd / (1 + p.AI);

        if(i < p.AH){
            cf = ca * (p.AC + p.AD);
        }else if(i< p.AG){
            cf = ca * p.AC;
        }else{
            cf = 0;
        }

        cg = cf / (1 + p.AI);
        ch = cd + cf;
        ci = ce + cg;

        $scope.data1.CB += ca;
        $scope.data1.CJ += cd;
        $scope.data1.CL += ce;
        $scope.data1.CN += cf;
        $scope.data1.CP += cg;
        $scope.data1.CR += ch;
        $scope.data1.CT += ci;

        $scope.data1.CA.push(ca);
        $scope.data1.CD.push(cd);
        $scope.data1.CE.push(ce);
        $scope.data1.CF.push(cf);
        $scope.data1.CG.push(cg);
        $scope.data1.CH.push(ch);
        $scope.data1.CI.push(ci);
    }

    $scope.data1.CC = $scope.data1.CB / p.BB;
    $scope.data1.CK = $scope.data1.CJ / p.BB;
    $scope.data1.CM = $scope.data1.CL / p.BB;
    $scope.data1.CO = $scope.data1.CN / p.BB;
    $scope.data1.CQ = $scope.data1.CP / p.BB;
    $scope.data1.CS = $scope.data1.CR / p.BB;
    $scope.data1.CU = $scope.data1.CT / p.BB;

    $scope.data1.CV = $scope.data1.CT + p.AY;


//////////////////////////////////////////////////////////////////////////   分包预算
    $scope.data2 = {
        DA : p.DA,
        DB : p.DB,
        DC : p.DC,
        DD : p.DD,
        DE : p.DE,
        DF : p.DA * BA * 1000000,
        DG : p.DB * BA * 1000000,
        DH : p.DC * BA * 1000000,
        DI : p.DD * BA * 1000000,
        DJ : p.DE * BA * 1000000,
        DK : 0,
        DL : 0,
        DM : 0,
        DN : 0,
        DO : 0,
        DP : 0,
        DQ : 0,
        DR : 0,
        DS : 0
    };
    $scope.data2.DK = $scope.data2.DF / (1+ p.AI);
    $scope.data2.DL = $scope.data2.DG / (1+ p.AI);
    $scope.data2.DM = $scope.data2.DH / (1+ p.AI);
    $scope.data2.DN = $scope.data2.DI / (1+ p.AI);
    $scope.data2.DO = $scope.data2.DJ / (1+ p.AI);

    $scope.data2.DP = p.DA+ p.DB+ p.DC+ p.DD+ p.DE;
    $scope.data2.DQ = $scope.data2.DF + $scope.data2.DG + $scope.data2.DH + $scope.data2.DI + $scope.data2.DJ;
    $scope.data2.DR = $scope.data2.DK + $scope.data2.DL + $scope.data2.DM + $scope.data2.DN + $scope.data2.DO;

    $scope.data2.DS = $scope.data2.DK + $scope.data2.DG + $scope.data2.DH + $scope.data2.DI + $scope.data2.DJ;

//////////////////////////////////////////////////////////////////////////   融资成本和贷款余额
    $scope.otherdata = {
        MI : 0,
        MX : [],
        MF : $scope.data2.DQ * p.GC,
        MG : []
    };

    var mx,mg;
    for(var i = 0; i < p.BB; i++){
        mg = $scope.otherdata.MF / p.GD * (p.GD - (i + 1));
        if(mg < 0){
            mg = 0;
        }

        if(i == 0){
            mx = $scope.otherdata.MF * p.MY;
        }else{
            mx = $scope.otherdata.MG[i - 1] * p.MY;
        }

        $scope.otherdata.MI += mx;
        $scope.otherdata.MX.push(mx);
        $scope.otherdata.MG.push(mg);
    }

//////////////////////////////////////////////////////////////////////////   合同
    $scope.data3 = {
        EA : 0,
        EB : 0
    };

    $scope.data3.EA = $scope.data1.CV - $scope.data2.DS;
    $scope.data3.EB = $scope.data3.EA / $scope.data1.CV;

//////////////////////////////////////////////////////////////////////////   运维分包
    $scope.data4 = {
        FA : 0,
        FB : 0
    };

    $scope.data4.FA = p.FA;
    $scope.data4.FB = p.FA * BA * 25 * 1000000;

//////////////////////////////////////////////////////////////////////////   项目直接费用预算
    $scope.data5 = {
        GE : $scope.data1.CV * p.GA * p.BD / 12,
        GF : p.GF,
        GG : p.GG,
        GH : ($scope.data2.DS + $scope.data2.DK * p.AI) * p.BD / 12 * p.GB / 2 * p.GC,
        GI : p.GI,
        GR : p.GR,
        GK : ($scope.data1.CV - $scope.data2.DS) * p.BB * p.GA / 2,
        GO : p.GO,
        GP : p.GP,
        GL : 0,                                                /////////////////////////////// GL=MI
        GQ : p.GQ,
        GS : p.GS,
        S1 : 0,
        S2 : 0,
        S3 : 0,
        S4 : 0,
        S5 : 0,
        S6 : 0,
        GJ : 0,
        GM : 0,
        GN : 0
    };
    $scope.data5.GL = $scope.otherdata.MI;

    $scope.data5.S1 = $scope.data5.GE + $scope.data5.GK;
    $scope.data5.S2 = $scope.data5.GF + $scope.data5.GO;
    $scope.data5.S3 = $scope.data5.GG + $scope.data5.GP;
    $scope.data5.S4 = $scope.data5.GH + $scope.data5.GL;
    $scope.data5.S5 = $scope.data5.GI + $scope.data5.GQ;
    $scope.data5.S6 = $scope.data5.GR + $scope.data5.GS;

    $scope.data5.GJ = $scope.data5.GE + $scope.data5.GF + $scope.data5.GG + $scope.data5.GH + $scope.data5.GI + $scope.data5.GR;
    $scope.data5.GM = $scope.data5.GK + $scope.data5.GO + $scope.data5.GP + $scope.data5.GL + $scope.data5.GQ + $scope.data5.GS;
    $scope.data5.GN = $scope.data5.S1 + $scope.data5.S2 + $scope.data5.S3 + $scope.data5.S4 + $scope.data5.S5 + $scope.data5.S6;


//////////////////////////////////////////////////////////////////////////   部门费用分摊
    $scope.data6 = {
        HB : $scope.data1.CV * p.HA * p.BD / 12,
        HC : ($scope.data1.CV - $scope.data2.DS) * p.HA * p.BB / 2,
        HD : 0
    };
    $scope.data6.HD = $scope.data6.HB + $scope.data6.HC;

//////////////////////////////////////////////////////////////////////////   项目预计毛利
    $scope.data7 = {
        IA : $scope.data1.CV - $scope.data2.DS - $scope.data4.FB - $scope.data5.GN - $scope.data6.HD,
        IB : 0
    };

    $scope.data7.IB = $scope.data7.IA / $scope.data1.CV;

//////////////////////////////////////////////////////////////////////////   期间费用分摊
    $scope.data8 = {
        JA : p.JA,
        JB : $scope.data1.CV * p.JA * p.BD / 12 + ($scope.data1.CV - $scope.data2.DS) * p.JA * p.BB / 2
    };

//////////////////////////////////////////////////////////////////////////   项目预计净利润
    $scope.data9 = {
        KA : $scope.data7.IA - $scope.data8.JB,
        KB : 0
    };

    $scope.data9.KB = $scope.data9.KA / $scope.data1.CV;

//////////////////////////////////////////////////////////////////////////   其它函数
    $scope.back = function(){
        var investmentCosts = {
            data1 : $scope.data1,
            data2 : $scope.data2,
            data3 : $scope.data3,
            data4 : $scope.data4,
            data5 : $scope.data5,
            data6 : $scope.data6,
            data7 : $scope.data7,
            data8 : $scope.data8,
            data9 : $scope.data9,
            otherdata : $scope.otherdata
        };

        projectData.addOrUpdateData(investmentCosts,'investmentCosts');

        $location.path('/8');
   };
});

/*
 符合条件EMC表控制器
 */
pvModule.controller('emcCtrl',function($scope, $location, projectData){
    $scope.hide = true;

    var finance = new Finance();

    var p = projectData.getData('parameters');

    var itc  = projectData.getData('investmentCosts');

    $scope.data = {
        LA : 0,
        LB : 0,
        LC : 0,
        LD : 0,
        LE : 0,
        LF : 0,
        LG : 0,
        LH : 0,
        LI : 0,
        LJ : 0,
        LK : 0,
        LM : 0,
        LN : 0,
        LO : [],
        LP : [],
        LQ : [],
        LR : [],
        sumLO : 0,
        LS : 0,
        sumLQ : 0,
        LT : 0,
        LU : 0
    };

    $scope.data.LA = (itc.data2.DS + itc.data5.GJ) - itc.data5.GH + itc.data6.HB;
    $scope.data.LB = (itc.data1.CV - ((itc.data4.FB + itc.data5.GM) - itc.data5.GL + itc.data6.HC) * 1.1) / p.BB;
    $scope.data.LC = p.LC;
    $scope.data.LD = $scope.data.LC / (12 / p.BC);
    $scope.data.LE = $scope.data.LB / (12 / p.BC);

    var les = [];
    for(var i = 0; i < p.BE; i++){
        les.push($scope.data.LE);
    }

    $scope.data.LF = finance.NPV($scope.data.LD * 100 ,les);
    $scope.data.LG = $scope.data.LA * 1.1;
    $scope.data.LH = Math.min($scope.data.LF, $scope.data.LG);
    $scope.data.LI = $scope.data.LH - $scope.data.LA;
    $scope.data.LJ = $scope.data.LI / $scope.data.LH;
    $scope.data.LK = itc.data1.CV - $scope.data.LH;
    $scope.data.LM = itc.data7.IA - $scope.data.LI + itc.data5.GH + itc.data5.GL;
    $scope.data.LN = $scope.data.LM / $scope.data.LK;

    for(var i = 0; i < p.BE; i++){
        if(i == 0){
            $scope.data.LO.push($scope.data.LE);
            $scope.data.LP.push($scope.data.LH * $scope.data.LD);
            $scope.data.LQ.push($scope.data.LO[i] - $scope.data.LP[i]);
            $scope.data.LR.push($scope.data.LH - $scope.data.LQ[i]);
        }else{
            $scope.data.LO.push($scope.data.LE);
            $scope.data.LP.push($scope.data.LR[i-1] * $scope.data.LD);
            $scope.data.LQ.push($scope.data.LO[i] - $scope.data.LP[i]);
            $scope.data.LR.push($scope.data.LR[i-1] - $scope.data.LQ[i]);
        }

        $scope.data.sumLO += $scope.data.LO[i];
        $scope.data.LS += $scope.data.LP[i];
        $scope.data.sumLQ += $scope.data.LQ[i];
    }

    var t = ((itc.data4.FB + itc.data5.GM) - itc.data5.GL + itc.data6.HC);
    $scope.data.LT = t * 1.1;
    $scope.data.LU = t * 0.1;

    $scope.back = function(){
        var emc = {
            data : $scope.data
        };

        projectData.addOrUpdateData(emc,'emc');

        $location.path('/8');
    }
});

/*
 收益期状况表控制器
 */
pvModule.controller('profitPeriodCtrl',function($scope, $location, projectData){

    var p = projectData.getData('parameters');
    var itc = projectData.getData('investmentCosts');
    var emc = projectData.getData('emc');

    $scope.show = [true,false,false];
    $scope.showMe = function(id){
        for(var i = 0; i < $scope.show.length; i++){
            if(id == i){
                $scope.show[i] = true;
            }else{
                $scope.show[i] = false;
            }
        }
    };

    $scope.data = {
        MA : 0,
        DS : itc.data2.DS,
        MB : 0,
        MC : 0,
        CL : itc.data1.CL,
        CE : itc.data1.CE,
        CQ : itc.data1.CQ,
        CG : itc.data1.CG,
        CT : itc.data1.CT,
        CZ : itc.data1.CI,
        ME : 0,
        MD : (itc.data4.FB + itc.data5.GK + itc.data5.GO + itc.data5.GP + itc.data6.HC) / p.BB,
        MM : p.MM,
        sumMM : p.MM * p.BB,
        MI : itc.otherdata.MI,
        MX : itc.otherdata.MX,
        MF : itc.otherdata.MF,
        MG : itc.otherdata.MG,
        ML : 0,
        MJ : 0,
        MK : [],
        MR : 0,
        MO : [],
        MT : 0,
        MS : [],
        MW : 0,
        MV : [],
        MP : 0,
        MQ : []
    };

    $scope.data.MA = itc.data2.DF / (1 + p.AI) * p.AI;
    $scope.data.MB = itc.data5.GF + itc.data5.GG + itc.data5.GR + itc.data6.HB;
    $scope.data.MC = $scope.data.DS + itc.data5.GH + $scope.data.MB + itc.data5.GE;
    $scope.data.MJ = -$scope.data.MC;
    $scope.data.MP = $scope.data.MF + $scope.data.MJ;

    $scope.data.ME = $scope.data.MD * p.BB;
    $scope.data.MR = $scope.data.MC / p.BB;

    var mk,mo,ms,mv,mq;
    for(var i = 0; i < p.BB; i++){
        mk = $scope.data.CZ[i] - $scope.data.MD - $scope.data.MX[i] - p.MM;

        if(i == 0){
            mo = $scope.data.MF - $scope.data.MG[i];
            mq = mk - mo + $scope.data.MP;
        }else{
            mo = $scope.data.MG[i-1] - $scope.data.MG[i];
            mq = mk - mo + $scope.data.MQ[i-1];
        }

        ms = $scope.data.CE[i] + $scope.data.CG[i] - $scope.data.MD - $scope.data.MM - $scope.data.MX[i] - $scope.data.MR;
        mv = ms / $scope.data.CE[i];

        $scope.data.ML += mk;
        $scope.data.MT += ms;
        $scope.data.MK.push(mk);
        $scope.data.MO.push(mo);
        $scope.data.MS.push(ms);
        $scope.data.MV.push(mv);
        $scope.data.MQ.push(mq);
    }

    $scope.data.MW =  $scope.data.MT / $scope.data.CT;

    $scope.labelsYear = [];
    for(var i = 0; i < p.BB; i++){
        $scope.labelsYear.push(i+1+'');
    }

    $scope.series =['债务偿还图','投资回收期图'];

    $scope.chartData1 = [
        $scope.data.MG
    ];

    $scope.chartData2 = [
        $scope.data.MQ
    ];

    $scope.back = function(){
        projectData.addOrUpdateData($scope.data, 'profitPeriod');
        $location.path('/8');
    }
});

/*
 综合指标表
 */
pvModule.controller('overallIndexCtrl',function($scope, $location, projectData){

    var p = projectData.getData('parameters');
    var itc = projectData.getData('investmentCosts');
    var emc = projectData.getData('emc');
    var pp = projectData.getData('profitPeriod');

    $scope.data = {
        MT : pp.MT,
        NA : pp.ML - pp.MC,
        NB : 0,
        MW : pp.MW,
        IB : itc.data7.IB,
        NC : pp.MT / ( pp.MC + pp.ME + pp.MM + pp.MI),
        ND : pp.MT / p.BB / (pp.MC + pp.ME + pp.MM + pp.MI),
        NE : 0,
        NF : 0,
        NG : 0,
        NH : p.BD / 12 + 32 / 111 + 9,
        NI : 0
    };

    $scope.data.NI =$scope.data.NH / ( p.BD / 12 + p.BB);


    $scope.back = function(){
        $location.path('/8');
    }
});

/*
报告控制器
 */
pvModule.controller('reportCtrl',function($scope, $location, projectData){

    var angleInfo = projectData.getData('angleInfo');
    var meteorologyInfo = projectData.getData('meteorologyInfo');

    $scope.getMapPath = function(){
        return "http://api.map.baidu.com/staticimage/v2?ak=GFrzxzyQTLiDx6sxx8B4ScTLKuwPNzGi&mcode=666666&center=" + meteorologyInfo.lng + "," + meteorologyInfo.lat + "&width=300&height=200&zoom=11&markers=" + meteorologyInfo.lng + "," + meteorologyInfo.lat + "&markerStyles=I,A";
    } ;

    $scope.data = {
        capacity : 0,
        dip : angleInfo.dip,
        az : angleInfo.az,
        lat : meteorologyInfo.lat,
        lng : meteorologyInfo.lng
    };

    $scope.back = function(){
        $location.path('/');
    }
});

//指令区
pvModule.directive('script', function () {
    return {
        restrict: 'E',
        scope: false,
        link: function (scope, elem, attr) {
            if (attr.type === 'text/javascript-lazy') {
                var code = elem.text();
                var f = new Function(code);
                f();
            }
        }
    };
});

pvModule.directive('fixedheadertable',function(){
    return {
        restrict : 'C',
        link : function(scope,elem,attrs){
            elem.css({
                "position" : "relative",
                "overflow-y" : "auto"
            });
            elem.scroll(function(){
                elem.children('.fixedtop').css('top',elem.scrollTop());
            });
        }
    }
});

pvModule.directive("fixedtop", function(){
    return {
        restrict: "C",
        link: function(scope,elem){
            elem.css({
                "position" : "absolute",
                "background-color" : "#fff"
            });
        }
    };
});

pvModule.directive('pvmap', function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'tpls/diretpls/pvmap.html',
        link: function (scope, elem, attrs) {
            var map = new BMap.Map("mapContainer");          // 创建地图实例
            map.enableScrollWheelZoom();
            map.enableInertialDragging();
            map.enableContinuousZoom();

            var point = new BMap.Point(121.494966, 31.219456);  // 创建点坐标
            map.centerAndZoom(point, 10);                 // 初始化地图，设置中心点坐标和地图级别

            var size = new BMap.Size(10, 20);
            map.addControl(new BMap.CityListControl({
                anchor: BMAP_ANCHOR_TOP_LEFT,
                offset: size
            }));

            var marker = new BMap.Marker(point);

            map.addEventListener("click", function (e) {

                map.removeOverlay(marker);
                marker = new BMap.Marker(e.point);        // 创建标注
                map.addOverlay(marker);

                var lngInput = document.getElementById('lng');
                var latInput = document.getElementById('lat');
                lngInput.value = e.point.lng;
                latInput.value = e.point.lat;
                var evt = document.createEvent('MouseEvents');
                evt.initEvent('change', true, true);
                lngInput.dispatchEvent(evt);
                latInput.dispatchEvent(evt);
            });
            document.getElementById('locatePoint').addEventListener('click', function (e) {
                var lng = document.getElementById('lng').value;
                var lat = document.getElementById('lat').value;
                map.centerAndZoom(new BMap.Point(lng, lat), 10);
            });
        }
    };
});

//路由
pvModule.config(function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'tpls/html/project.html'
    }).when('/1',{
        templateUrl: 'tpls/html/basicInfo.html'
    }).when('/2', {
        templateUrl: 'tpls/html/displayMeteInfo.html'
    }).when('/3', {
        templateUrl: 'tpls/html/chooseComponent.html'
    }).when('/4', {
        templateUrl: 'tpls/html/confirmAngle.html'
    }).when('/5', {
        templateUrl: 'tpls/html/userDesign.html'
    }).when('/6', {
        templateUrl: 'tpls/html/chooseInverter.html'
    }).when('/7', {
        templateUrl: 'tpls/html/selectTransformer.html'
    }).when('/8', {
        templateUrl: 'tpls/html/benefitAnalysis.html'
    }).when('/9', {
        templateUrl: 'tpls/html/benefit/parameters.html'
    }).when('/10', {
        templateUrl: 'tpls/html/benefit/investmentCosts.html'
    }).when('/11', {
        templateUrl: 'tpls/html/benefit/emc.html'
    }).when('/12', {
        templateUrl: 'tpls/html/benefit/profitPeriod.html'
    }).when('/13', {
        templateUrl: 'tpls/html/benefit/overallIndex.html'
    }).when('/14',{
        templateUrl: 'tpls/html/efficiencyAnalysis.html'
    }).when('/15',{
        templateUrl: 'tpls/html/report.html'
    });

    $routeProvider.otherwise({redirectTo: '/'});
});
