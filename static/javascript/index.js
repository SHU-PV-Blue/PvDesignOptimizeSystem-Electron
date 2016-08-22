var fs = require('fs');
var dbHelper = require('./common/sqlite/db');
var algorithm = require('./common/algorithm');
var Finance = require('./common/algorithm/finance');
var customer = require('./common/customer/customerDevice');
var util = require('./common/util');
var _ = require('lodash');

var remote = require('electron').remote;
var dialog = remote.dialog;

Chart.defaults.global.defaultFontFamily = "'Helvetica Neue',Helvetica,Arial,'Hiragino Sans GB','Hiragino Sans GB W3','Microsoft YaHei UI','Microsoft YaHei','WenQuanYi Micro Hei',sans-serif";

var pvModule = angular.module('PVModule', ['chart.js', 'ui.bootstrap', 'uiSlider', 'ngRoute'], function ($httpProvider) {
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
pvModule.service('projectData', function ($rootScope, $location, $route) {
    this.projectBasePath = "projects/";
    this.projectInfo = {};
    this.projectName = "";
    this.loadProject = function (name) {
        this.projectInfo = JSON.parse(fs.readFileSync(this.projectBasePath + name + ".json", "utf8"));
        this.projectName = name;
        $location.path('/0');
        $route.reload();
    };

    this.getSetting = function () {
        return this.projectInfo.projectSetting;
    };

    this.setFinished = function (stepName) {
        this.projectInfo.projectSetting.isFinished[stepName] = true;
    };

    this.getData = function (propName) {
        if (this.projectInfo.projectData[propName]) {
            return this.projectInfo.projectData[propName];
        } else {
            return null;
        }
    };
    this.addOrUpdateData = function (data, propName) {
        this.projectInfo.projectData[propName] = data;
    };

    this.saveToLocal = function () {
        fs.writeFileSync(this.projectBasePath + this.projectName + ".json", JSON.stringify(this.projectInfo, null, "    "), 'utf8');
    };
});

//控制器区
/*
项目管理控制器
 */
pvModule.controller('manageCtrl', function ($scope, $location, $uibModal, projectData) {
    var defaultProjectInfo = {
        projectData: {},
        projectSetting: {
            isFinished: {
                basicInfo: false,
                meteorology: false,
                chooseComponent: false,
                confirmAngle: false,
                userDesign: false,
                chooseInverter: false,
                selectTransformer: false,
                efficiencyAnalysis: false,
                benefit: false,
                report: false
            }
        }
    };

    $scope.projects = [];
    $scope.currentProject = "";

    $scope.addNewProject = function () {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: "tpls/html/addProject.html",
            controller: "addProjectCtrl",
            size: 'md',
            backdrop: false
        });
        modalInstance.result.then(function (data) {
            createNewProject(data.projectName);
        });
    };

    function refresh() {
        fs.readdir("projects/", function (err, files) {
            if (err) {
                return;
            }
            $scope.$apply(function () {
                if (files.length === 0) {
                    $location.path('/');
                    $scope.currentProject = '';
                }
                $scope.projects = files.map(function (name) {
                    return name.replace(".json", "");
                })
            });
        });
    };

    $scope.deleteProject = function (name) {
        dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'warning',
            message: '确认删除项目 ' + name + '？',
            title: 'pv',
            buttons: ['确认', '取消'],
            cancelId: 1
        }, function (response) {
            if (response === 0) {
                $scope.$apply(function () {
                    fs.unlinkSync("projects/" + name + '.json');
                    refresh();
                    if ($scope.currentProject === name) {
                        $location.path('/');
                        $scope.currentProject = '';
                    }
                });
            }
        });
    }

    function createNewProject(name) {
        if (!fs.existsSync('projects')) {
            fs.mkdirSync('projects');
        }
        if (fs.existsSync('projects/' + name + '.json')) {
            alert('项目已存在');
            return;
        }
        fs.writeFileSync("projects/" + name + ".json", JSON.stringify(defaultProjectInfo, null, "    "), 'utf8');
        $scope.currentProject = name;
        projectData.loadProject(name);
        refresh();
    }

    $scope.openProject = function (name) {
        $scope.currentProject = name;
        projectData.loadProject(name);
    };

    $scope.$watch('$viewContentLoaded', function () {
        refresh();
    })
});

/*
添加项目弹出框控制器
 */
pvModule.controller('addProjectCtrl', function ($scope, $uibModalInstance) {
    $scope.projectName = "";

    $scope.ok = function () {
        $uibModalInstance.close({
            projectName: $scope.projectName
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
项目步骤控制器
 */
pvModule.controller('projectCtrl', function ($scope, $location, projectData) {
    $scope.isFinished = projectData.getSetting().isFinished;
    $scope.switchToUrl = function (url) {
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
        lng: 121.49,
        lat: 31.22
    };

    $scope.save = function () {
        projectData.addOrUpdateData($scope.projectInfo, 'basicInfo');
        projectData.setFinished("basicInfo");
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    }

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('basicInfo');
        if (temp) {
            _.extend($scope.projectInfo, temp);
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
pvModule.controller('meteorologyCtrl', function ($scope, $location, projectData) {
    $scope.meteorologyInfo = {
        type: 'db',
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

    $scope.lng = projectData.getData('basicInfo').lng;
    $scope.lat = projectData.getData('basicInfo').lat;

    $scope.selectDb = function (e) {
        if ($scope.flag == 0) {
            return;
        }
        if (!confirm("确定选择国际气象数据库？")) {
            e.preventDefault();
            $scope.meteorologyInfo.type = 'user';
        } else {
            $scope.flag = 0;
            getDbData('nasaweather');
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
            getDbData('userdata');
        }
    };

    $scope.$watch('meteorologyInfo.monthinfos', function () {
        computeAvg();
    }, true);

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

    function getDbData(tableName) {                          //从气象数据库获取气象信息
        dbHelper.getWeatherData(tableName, Number($scope.lat), Number($scope.lng), function (data, isEmpty) {
            if (!isEmpty) {
                _.extend($scope.meteorologyInfo.monthinfos, data);
                computeAvg();
                $scope.meteorologyInfo.lng = $scope.lng;
                $scope.meteorologyInfo.lat = $scope.lat;
                $scope.$digest();
            }
        });
    }

    $scope.save = function () {
        projectData.addOrUpdateData($scope.meteorologyInfo, 'meteorologyInfo');
        if ($scope.meteorologyInfo.type === 'user') {
            dbHelper.addOrUpdateWeatherData(Number($scope.lat), Number($scope.lng), $scope.meteorologyInfo.monthinfos);
        }
        projectData.setFinished("meteorology");
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    };

    $scope.$watch('$viewContentLoaded', function () {
        var tempObj = projectData.getData('meteorologyInfo');
        if (tempObj && $scope.lng === tempObj.lng && $scope.lat === tempObj.lat) {      //如果数据存在则赋值
            $scope.meteorologyInfo = _.cloneDeep(tempObj);
        } else {                                            //如果数据不存在，取默认值
            getDbData('nasaweather');
        }

        $scope.flag = $scope.meteorologyInfo.type === 'db' ? 0 : 1;
    });
});

/*
 选择组件控制器
 */
pvModule.controller('chooseComponentCtrl', function ($scope, $location, projectData) {
    $scope.components = [];
    $scope.selected = '{}';
    $scope.show = {};

    $scope.showI = true;

    $scope.$watch('selected', function (newVal) {
        $scope.show = JSON.parse(newVal);
    });

    $scope.data1 = [
        []
    ];
    $scope.options1 = {
        title: {
            display: true,
            text: 'i-v 图',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '电压/V'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '电流/A'
                }
            }]
        }
    }

    $scope.data2 = [
        []
    ];
    $scope.options2 = {
        title: {
            display: true,
            text: 'p-v 图',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '电压 / V'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '功率 / W'
                }
            }]
        }
    }

    $scope.T = 25;
    $scope.S = 1000;

    $scope.labels = [];
    for (var i = 0; i < 35; i++) {
        $scope.labels.push(i + 1);
    }

    $scope.$watch("T", function () {
        getChartData();
    });

    $scope.$watch("S", function () {
        getChartData();
    });

    $scope.$watch("show", function () {
        getChartData();
    }, true);

    function getChartData() {
        var tempI = [];
        var tempP = [];
        for (var i = 0; i < 35; i++) {
            var I = computeI($scope.show['开路电压'], $scope.show['短路电流'], $scope.show['最大功率点电压'],
                $scope.show['最大功率点电流'], $scope.show['开路电压温度系数'], $scope.show['短路电流温度系数'], i + 1, Number($scope.T) - 25, Number($scope.S) / 1000 - 1);
            if (I >= 0) {
                tempI.push(I.toFixed(2));
                tempP.push((I * (i + 1)).toFixed(2));
            }
        }

        if (tempI.length == 0) {
            tempI.push(0);
        }
        $scope.data1[0] = tempI;
        $scope.data2[0] = tempP;
    }

    /*
    voc : 开路电压
    isc : 短路电流
    vmp : 最大功率点电压
    imp : 最大功率点电流
    r : 开路电压温度系数(负)
    a : 短路电流温度系数
    v : 电压
     */
    function computeI(voc, isc, vmp, imp, r, a, v, t, s) {
        r = r / 100;
        a = a / 100;
        var voc2 = voc * (1 + r * t) * Math.log(Math.E + 0.5 * s);
        var vmp2 = vmp * (1 + r * t) * Math.log(Math.E + 0.5 * s);
        var isc2 = isc * (s + 1) * (1 + a * t);
        var imp2 = imp * (s + 1) * (1 + a * t);
        var c2 = (vmp2 / voc2 - 1) / (Math.log(1 - imp2 / isc2));//imp2/isc2 right
        var c1 = (1 - imp2 / isc2) * Math.exp(-vmp2 / (voc2 * c2));//imp2/isc2 right
        if (Number($scope.T) == 25 && Number($scope.S) == 500) {
            console.log(voc2, vmp2, isc2, imp2, c2, c1);
        }
        return isc2 * (1 - c1 * (Math.exp(v / (c2 * voc2)) - 1));  // isc2
    }

    $scope.save = function () {
        projectData.addOrUpdateData($scope.show, 'componentInfo');
        projectData.setFinished("chooseComponent");
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    };

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from pvmodule', function (data) {
            customer.getItems('pvmodule').map(function (item) {
                data.push(item.item);
            });
            data.sort(function (a, b) {
                return -(a['转换效率'] - b['转换效率']);
            });

            $scope.components = data;
            if (projectData.getData("componentInfo")) {
                $scope.selected = JSON.stringify(projectData.getData("componentInfo"));
            }
            $scope.$digest();
        });
        // gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/pv-module')
        //     .then(function (data) {
        //         $scope.components = data.data;
        //         if (projectData.getData("componentInfo")) {
        //             $scope.selected = JSON.stringify(projectData.getData("componentInfo"));
        //         }
        //     })
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
        az: 0,
        max: 0,
        max_H: 0
    };

    $scope.sums_g = [];
    $scope.sums = [];

    $scope.options = {
        pointDotRadius: 2,
    };
    $scope.show = [true, false, false, false];

    $scope.showChart = function (id) {
        for (var i = 0; i < $scope.show.length; i++) {
            $scope.show[i] = i == id;
        }
    };

    $scope.labelsAngle = util.getDipLabel();
    $scope.labelsMonth = util.getLabel(12);

    $scope.data = [
        [],
        [],
        [],
        []
    ];

    $scope.options0 = {
        title: {
            display: true,
            text: '年总辐照度',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                gridLines: {
                    display: false
                },
                scaleLabel: {
                    display: true,
                    labelString: '倾角/度'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '辐照度 kWh/m^2'
                }
            }]
        }
    };
    $scope.options1 = {
        title: {
            display: true,
            text: '组件年输出电量',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                gridLines: {
                    display: false
                },
                scaleLabel: {
                    display: true,
                    labelString: '倾角/度'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '电量/kWh'
                }
            }]
        }
    },
        $scope.options2 = {
            title: {
                display: true,
                text: '月总辐照度',
                fontSize: 14,
                fontStyle: 'normal'
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '月份'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '辐照度 kWh/m^2'
                    }
                }]
            }
        };
    $scope.options3 = {
        title: {
            display: true,
            text: '月总组件输出电量',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '月份'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '电量/kWh'
                }
            }]
        }
    }

    $scope.$watch('angleInfo.az', function () {
        var temp = getHData();
        $scope.data[0][0] = temp.sums;
        $scope.data[1][0] = temp.sums_g;
        // $scope.angleInfo.dip = temp.best;
        $scope.angleInfo.bestDipG = temp.best;
        $scope.angleInfo.bestDipH = temp.bestH;
        $scope.angleInfo.max = temp.max;
        $scope.angleInfo.max_H = temp.max_H;
    });

    var componentInfo = projectData.getData('componentInfo');
    var meteorologyInfo = projectData.getData('meteorologyInfo');
    var H = [];
    var T = [];

    $scope.$watch('angleInfo.dip', function () {
        var temp = algorithm.getDataByDip(H, meteorologyInfo.lat, $scope.angleInfo.az, componentInfo['转换效率'], componentInfo['长度'], componentInfo['宽度'], T, componentInfo['最大功率温度系数'] / 100, $scope.angleInfo.dip);
        $scope.data[2][0] = temp.H_ts;
        $scope.data[3][0] = temp.gs;
    });

    meteorologyInfo.monthinfos.forEach(function (monthinfo) {
        H.push(monthinfo.H);
        T.push(monthinfo.temperature);
    });

    function getHData() {
        var res = algorithm.getChartData(H, meteorologyInfo.lat, $scope.angleInfo.az, componentInfo['转换效率'], componentInfo['长度'], componentInfo['宽度'], T, componentInfo['最大功率温度系数'] / 100);
        return res;
    }

    $scope.save = function () {
        projectData.addOrUpdateData($scope.angleInfo, 'angleInfo');
        projectData.setFinished("confirmAngle");
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    }

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('angleInfo');
        if (temp) {
            $scope.angleInfo = _.cloneDeep(temp);
        }
    });
});

/*
 用户自定义面积或安装容量控制器
*/
pvModule.controller('userDesignCtrl', function ($scope, $location, projectData) {
    $scope.userDesignInfo = {
        componentDirection: 'horizontal',
        designType: 'area',                     //capacity
        rowsPerFixture: 1,
        colsPerFixture: 1,
        fbspace: 1,
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
            totalCapacity: 0,
            componentsNum: 0
        }
    };

    var componentInfo = projectData.getData('componentInfo');

    $scope.$watch('userDesignInfo.capacity.totalCapacity', function () {
        $scope.userDesignInfo.capacity.componentsNum = Math.ceil(Number($scope.userDesignInfo.capacity.totalCapacity) * 1000 / componentInfo['峰值功率']);
    });

    $scope.$watch('userDesignInfo.componentDirection', function (newVal) {
        if (newVal === "horizontal") {
            $scope.src1 = "res/images/heng1.png";
            $scope.src2 = "res/images/heng2.png";
        } else {
            $scope.src1 = "res/images/shu1.png";
            $scope.src2 = "res/images/shu2.png";
        }
    });

    $scope.$watch('userDesignInfo.rowsPerFixture', function () {
        $scope.fbspace = Number(compute_fbspace());
    });

    $scope.$watch('userDesignInfo.colsPerFixture', function () {
        $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
    });

    $scope.$watch('userDesignInfo.componentDirection', function () {
        $scope.fbspace = Number(compute_fbspace());
        $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
    });

    $scope.$watch('userDesignInfo.area.length', function (newVal) {
        $scope.userDesignInfo.area.totalArea = Number(newVal) * $scope.userDesignInfo.area.width;
        $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
    });

    $scope.$watch('userDesignInfo.area.width', function (newVal) {
        $scope.userDesignInfo.area.totalArea = Number(newVal) * $scope.userDesignInfo.area.length;
        $scope.userDesignInfo.area.rowsNum = compute_rowsNum();
    });

    $scope.$watch('userDesignInfo.lrspace', function (newval) {
        $scope.userDesignInfo.lrspace = Number(newval);
        $scope.userDesignInfo.area.numPerRow = compute_numPerRow();
    });

    $scope.$watch('userDesignInfo.fbspace', function (newval) {
        $scope.userDesignInfo.fbspace = newval;
        $scope.userDesignInfo.area.rowsNum = compute_rowsNum();
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
        var dip = projectData.getData('angleInfo').dip;
        var lat = projectData.getData('basicInfo').lat;
        var w;
        if ($scope.userDesignInfo.componentDirection === 'horizontal') {
            w = componentInfo['宽度'] / 1000;
        } else {
            w = componentInfo['长度'] / 1000;
        }

        var W1 = w * $scope.userDesignInfo.rowsPerFixture;
        var res = Number((W1 * cos(dip) + W1 * sin(dip) * (0.707 * tan(lat) + 0.4338) / (0.707 - 0.4338 * tan(lat))).toFixed(2));
        return res;
    }

    function compute_numPerRow() {                               //计算每行支架数
        var L;
        if ($scope.userDesignInfo.componentDirection === 'horizontal') {
            L = componentInfo['长度'] / 1000;
        } else {
            L = componentInfo['宽度'] / 1000;
        }

        var _L = L * $scope.userDesignInfo.colsPerFixture;

        var res = Math.floor(($scope.userDesignInfo.area.length - _L) / (_L + $scope.userDesignInfo.lrspace)) + 1;
        $scope.userDesignInfo.area.lrRestSpace = ($scope.userDesignInfo.area.length - res * _L - (res - 1) * $scope.userDesignInfo.lrspace).toFixed(2);            //左右剩余间距
        return res;
    }

    function compute_rowsNum() {                                 //计算阵列行数
        var res = Math.floor($scope.userDesignInfo.area.width / $scope.userDesignInfo.fbspace);
        $scope.userDesignInfo.area.fbRestSpace = ($scope.userDesignInfo.area.width - res * $scope.userDesignInfo.fbspace).toFixed(2);
        return res;
    }

    $scope.save = function () {
        projectData.addOrUpdateData($scope.userDesignInfo, 'userDesignInfo');
        projectData.setFinished("userDesign");
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    }

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('userDesignInfo');
        if (temp) {
            $scope.userDesignInfo = _.cloneDeep(temp);
            $scope.fbspace = (compute_fbspace()).toFixed(2);
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

    $scope.setType = function (type) {
        $scope.obj.type = type;
    };

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('chooseInverter');
        if (temp) {
            $scope.obj = _.cloneDeep(temp);
        }
    });

    $scope.save = function () {
        projectData.addOrUpdateData($scope.obj, 'chooseInverter');
        projectData.setFinished("chooseInverter");
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    }

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
                alert("fail");
                break;
        }
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: templateUrl,
            controller: controller + 'Ctrl',
            size: 'lg',
            backdrop: false,
            resolve: {
                parentObj: function () {
                    return $scope.obj;
                }
            }
        });
        modalInstance.result.then(function (data) {
            $scope.obj[data.name] = data.obj;
            projectData.addOrUpdateData($scope.obj, 'chooseInverter');
            projectData.saveToLocal();
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
pvModule.controller('centralizedInverterCtrl', function ($scope, $uibModalInstance, parentObj, projectData) {
    $scope.centralizedInverterInfo = {
        centralizedInverter: {},
        lowTemperature: 0,
        highTemperature: 0,
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

    $scope.$watch('centralizedInverterInfo.serialNumPerBranch', function () {
        $scope.centralizedInverterInfo.branchNumPerInverter = compute_branchNumPerInverter();
    });

    $scope.$watch('centralizedInverterInfo.branchNumPerInverter', function () {
        $scope.centralizedInverterInfo.inverterNumNeeded = compute_inverterNumNeeded();
    });

    $scope.$watch('centralizedInverterInfo.volumeRatio', function () {
        $scope.centralizedInverterInfo.inverterNumNeeded = compute_inverterNumNeeded();
    });

    $scope.$watch('centralizedInverterInfo.inverterNumNeeded', function () {
        $scope.centralizedInverterInfo.totalOpacity = compute_totalOpacity() | 0;
    });

    $scope.$watch('centralizedInverterInfo.lowTemperature', function () {
        $scope.centralizedInverterInfo.serialNumPerBranch = compute_serialNumPerBranch()[1];
    });

    $scope.$watch('centralizedInverterInfo.highTemperature', function () {
        $scope.centralizedInverterInfo.serialNumPerBranch = compute_serialNumPerBranch()[1];
    });

    var componentInfo = projectData.getData('componentInfo');
    $scope.centralizedInverterInfo.lowTemperature = componentInfo['工作温度下限'];
    $scope.centralizedInverterInfo.highTemperature = componentInfo['工作温度上限'];

    function compute_serialNumPerBranch() {
        var n1 = Math.floor($scope.centralizedInverterInfo.centralizedInverter['最大输入电压'] / (componentInfo['开路电压'] * (1 + ($scope.centralizedInverterInfo.lowTemperature - 25) * componentInfo['开路电压温度系数'] / 100)));
        var n2min = Math.ceil($scope.centralizedInverterInfo.centralizedInverter['MPP电压下限'] / (componentInfo['最大功率点电压'] * (1 + ($scope.centralizedInverterInfo.highTemperature - 25) * componentInfo['最大功率温度系数'] / 100)));
        var n2max = Math.floor($scope.centralizedInverterInfo.centralizedInverter['MPP电压上限'] / (componentInfo['最大功率点电压'] * (1 + ($scope.centralizedInverterInfo.highTemperature - 25) * componentInfo['最大功率温度系数'] / 100)));

        if (n1 > n2max) {                               //返回每支路串联数范围
            return [n2min, n2max];
        } else if (n1 < n2min) {
            return [1, n1];
        } else {
            return [n2min, n1];
        }
    }

    function compute_branchNumPerInverter() {
        return Math.floor($scope.centralizedInverterInfo.centralizedInverter['最大直流输入功率'] / (componentInfo['峰值功率'] * $scope.centralizedInverterInfo.serialNumPerBranch));
    }

    function compute_inverterNumNeeded() {
        var userDesignInfo = projectData.getData('userDesignInfo');
        var capacity = userDesignInfo.designType === 'area' ? userDesignInfo.area.totalCapacity : Number(userDesignInfo.capacity.totalCapacity);
        var res = Math.ceil(capacity * $scope.centralizedInverterInfo.volumeRatio / ($scope.centralizedInverterInfo.serialNumPerBranch
            * $scope.centralizedInverterInfo.branchNumPerInverter * (componentInfo['峰值功率'] / 1000)));
        return res;
    }

    function compute_totalOpacity() {
        return $scope.centralizedInverterInfo.branchNumPerInverter * $scope.centralizedInverterInfo.serialNumPerBranch
            * $scope.centralizedInverterInfo.inverterNumNeeded * componentInfo['峰值功率'] / 1000;
    }

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from invertercentralized', function (data) {
            customer.getItems('centralizedInverter').map(function (item) {
                data.push(item.item);
            });
            data.sort(function (a, b) {
                return -(a['最大效率'] - b['最大效率']);
            });
            $scope.$apply(function () {
                $scope.items = data;
                if (parentObj.centralizedInverterInfo) {
                    $scope.centralizedInverterInfo = _.cloneDeep(parentObj.centralizedInverterInfo);
                    $scope.centralizedInverterInfo.lowTemperature = componentInfo['工作温度下限'];
                    $scope.centralizedInverterInfo.highTemperature = componentInfo['工作温度上限'];
                    $scope.savedInfo = _.cloneDeep(parentObj.centralizedInverterInfo);
                    $scope.showSaved = true;
                    $scope.selected = JSON.stringify($scope.centralizedInverterInfo.centralizedInverter);
                }
            });
        });
    });

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
pvModule.controller('directCurrentCtrl', function ($scope, $uibModalInstance, parentObj) {
    $scope.directCurrentInfo = {
        directCurrent: {},
        num: 0,
        branches: 0,
        numPerInverter: 0
    };

    $scope.items = [];
    $scope.selected = '{}';

    $scope.$watch('selected', function (newVal) {
        $scope.directCurrentInfo.directCurrent = JSON.parse(newVal);
        $scope.directCurrentInfo.branches = $scope.directCurrentInfo.directCurrent['输入路数'];
    });

    $scope.$watch('directCurrentInfo.branches', function () {
        $scope.directCurrentInfo.numPerInverter = compute_numPerInverter();
        $scope.directCurrentInfo.num = compute_num() | 0;
    });

    function compute_num() {
        return $scope.directCurrentInfo.numPerInverter * parentObj.centralizedInverterInfo.inverterNumNeeded;
    }

    function compute_numPerInverter() {
        return Math.ceil(parentObj.centralizedInverterInfo.branchNumPerInverter / $scope.directCurrentInfo.branches);
    }

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from dccombiner', function (data) {
            customer.getItems('dcCombiner').map(function (item) {
                data.push(item.item);
            });
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.directCurrentInfo) {
            $scope.directCurrentInfo = _.cloneDeep(parentObj.directCurrentInfo);
            $scope.savedInfo = _.cloneDeep(parentObj.directCurrentInfo);
            $scope.showSaved = true;
            $scope.selected = JSON.stringify($scope.directCurrentInfo.directCurrent);
        }
    })

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
pvModule.controller('directDistributionCtrl', function ($scope, $uibModalInstance, parentObj) {
    $scope.directDistributionInfo = {
        directDistribution: {},
        num: 0,
        branches: 0,
        numPerInverter: 0
    };

    $scope.items = [];
    $scope.selected = '{}';

    $scope.$watch('selected', function (newVal) {
        $scope.directDistributionInfo.directDistribution = JSON.parse(newVal);
        $scope.directDistributionInfo.branches = $scope.directDistributionInfo.directDistribution['接入直流路数'];
    });

    $scope.$watch('directDistributionInfo.branches', function () {
        $scope.directDistributionInfo.numPerInverter = compute_numPerInverter();
        $scope.directDistributionInfo.num = compute_num() | 0;
    });

    function compute_numPerInverter() {
        return Math.ceil(parentObj.directCurrentInfo.numPerInverter / $scope.directDistributionInfo.branches);
    }

    function compute_num() {
        return $scope.directDistributionInfo.numPerInverter * parentObj.centralizedInverterInfo.inverterNumNeeded;
    }

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from dcdistribution', function (data) {
            customer.getItems('dcDistribution').map(function (item) {
                data.push(item.item);
            });
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.directDistributionInfo) {
            $scope.directDistributionInfo = _.cloneDeep(parentObj.directDistributionInfo);
            $scope.savedInfo = _.cloneDeep(parentObj.directDistributionInfo);
            $scope.showSaved = true;
            $scope.selected = JSON.stringify($scope.directDistributionInfo.directDistribution);
        }
    })

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
pvModule.controller('directCurrentCableCtrl', function ($scope, $uibModalInstance, $window, projectData, parentObj) {
    var componentInfo = projectData.getData('componentInfo');
    var maxPowerCurrent = componentInfo['最大功率点电流'];
    var maxPowerVoltage = componentInfo['最大功率点电压'];
    var branchNumPerInverter = parentObj.centralizedInverterInfo.branchNumPerInverter;
    var serialNumPerBranch = parentObj.centralizedInverterInfo.serialNumPerBranch;
    $scope.directCurrentCableInfo = {
        cables: [{
            directCurrentCable: {},
            maxCurrent: maxPowerCurrent,
            branches: 1,
            length: 0,
            lineDrop: 0,
            loss: 0
        }, {
                directCurrentCable: {},
                maxCurrent: maxPowerCurrent * parentObj.directCurrentInfo.branches,
                branches: 1,
                length: 0,
                lineDrop: 0,
                loss: 0
            }, {
                directCurrentCable: {},
                maxCurrent: 0,
                branches: 0,
                length: 0,
                lineDrop: 0,
                loss: 0
            }],
        totalLoss: 0
    };

    $scope.items = [];
    $scope.selected0 = '{}';
    $scope.selected1 = '{}';
    $scope.selected2 = '{}';

    $scope.$watch('selected0', function (newVal) {
        $scope.directCurrentCableInfo.cables[0].directCurrentCable = JSON.parse(newVal);
    });
    $scope.$watch('selected1', function (newVal) {
        $scope.directCurrentCableInfo.cables[1].directCurrentCable = JSON.parse(newVal);
    });
    $scope.$watch('selected2', function (newVal) {
        $scope.directCurrentCableInfo.cables[2].directCurrentCable = JSON.parse(newVal);
        $scope.directCurrentCableInfo.cables[2].branches = Math.ceil(maxPowerCurrent * branchNumPerInverter / $scope.directCurrentCableInfo.cables[2].directCurrentCable['允许载流量']);
    });
    $scope.$watch('directCurrentCableInfo.cables[2].branches', function () {
        $scope.directCurrentCableInfo.cables[2].maxCurrent = Number((maxPowerCurrent * branchNumPerInverter / $scope.directCurrentCableInfo.cables[2].branches).toFixed(3)) || 0;
    });

    $scope.$watch('directCurrentCableInfo.cables', function () {
        update_lineDrop_loss();
    }, true);

    $scope.active = 0;
    $scope.setActive = function (index) {
        $scope.active = index;
    };

    function update_lineDrop_loss() {
        $scope.directCurrentCableInfo.totalLoss = 0;
        var cableTemp;
        for (var i = 0; i < $scope.directCurrentCableInfo.cables.length; i++) {
            cableTemp = $scope.directCurrentCableInfo.cables[i];
            $scope.directCurrentCableInfo.cables[i].lineDrop = 1.25 * 0.0184 * cableTemp.maxCurrent * cableTemp.length * 2 / cableTemp.directCurrentCable['导体截面'];
            if (i === 0) {
                $scope.directCurrentCableInfo.cables[i].loss = $scope.directCurrentCableInfo.cables[i].lineDrop / (maxPowerVoltage * serialNumPerBranch);
            } else {
                $scope.directCurrentCableInfo.cables[i].loss = $scope.directCurrentCableInfo.cables[i].lineDrop / (maxPowerVoltage * serialNumPerBranch - $scope.directCurrentCableInfo.cables[i - 1].lineDrop);
            }
            $scope.directCurrentCableInfo.totalLoss += ($scope.directCurrentCableInfo.cables[i].loss ? $scope.directCurrentCableInfo.cables[i].loss : 0);
        }
    }

    // $scope.getData = function () {
    //     gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/cable')
    //         .then(function (data) {
    //             $scope.items = data.data;
    //         });
    // };
    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from cable', function (data) {
            customer.getItems('cable').map(function (item) {
                data.push(item.item);
            });
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.directCurrentCableInfo) {
            $scope.directCurrentCableInfo = parentObj.directCurrentCableInfo;
            $scope.selected0 = JSON.stringify($scope.directCurrentCableInfo.cables[0].directCurrentCable);
            $scope.selected1 = JSON.stringify($scope.directCurrentCableInfo.cables[1].directCurrentCable);
            $scope.selected2 = JSON.stringify($scope.directCurrentCableInfo.cables[2].directCurrentCable);
        }
    })

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'directCurrentCableInfo',
            obj: $scope.directCurrentCableInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 组串式直流电缆控制器
 */
pvModule.controller('alternatingCurrentCableCtrl', function ($scope, $uibModalInstance, $window, parentObj, projectData) {

    var componentInfo = projectData.getData('componentInfo');
    var maxPowerCurrent = componentInfo['最大功率点电流'];
    var maxPowerVoltage = componentInfo['最大功率点电压'];
    var branchNumPerInverter = parentObj.groupInverterInfo.branchNumPerInverter;
    var serialNumPerBranch = parentObj.groupInverterInfo.serialNumPerBranch;
    $scope.alternatingCurrentCableInfo = {
        alternatingCurrentCable: {},
        maxCurrent: maxPowerCurrent,
        branches: 1,
        length: 0,
        lineDrop: 0,
        loss: 0
    };

    $scope.items = [];
    $scope.selected = '{}';
    $scope.$watch('selected', function (newVal) {
        $scope.alternatingCurrentCableInfo.alternatingCurrentCable = JSON.parse(newVal);
    });

    $scope.$watch('alternatingCurrentCableInfo.length', function () {
        update_lineDrop_loss();
    });

    function update_lineDrop_loss() {
        var cableTemp = $scope.alternatingCurrentCableInfo;
        $scope.alternatingCurrentCableInfo.lineDrop = 1.25 * 0.0184 * cableTemp.maxCurrent * cableTemp.length * 2 / cableTemp.alternatingCurrentCable['导体截面'];
        $scope.alternatingCurrentCableInfo.loss = $scope.alternatingCurrentCableInfo.lineDrop / (maxPowerVoltage * serialNumPerBranch);
    }

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from cable', function (data) {
            customer.getItems('cable').map(function (item) {
                data.push(item.item);
            });
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.alternatingCurrentCableInfo) {
            $scope.alternatingCurrentCableInfo = _.cloneDeep(parentObj.alternatingCurrentCableInfo);
            $scope.selected = JSON.stringify($scope.alternatingCurrentCableInfo.alternatingCurrentCable);
        }
    });

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'alternatingCurrentCableInfo',
            obj: $scope.alternatingCurrentCableInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 组串式逆变器控制器
 */
pvModule.controller('groupInverterCtrl', function ($scope, $uibModalInstance, parentObj, projectData) {
    $scope.groupInverterInfo = {
        groupInverter: {},
        lowTemperature: 0,
        highTemperature: 0,
        serialNumPerBranch: 0,
        branchNumPerInverter: 0,
        volumeRatio: 1.05,
        inverterNumNeeded: 0,
        totalOpacity: 0
    };

    $scope.items = [];
    $scope.selected = '{}';

    $scope.$watch('selected', function (newVal) {
        $scope.groupInverterInfo.groupInverter = JSON.parse(newVal);
        $scope.groupInverterInfo.serialNumPerBranch = compute_serialNumPerBranch()[1];
    });

    $scope.$watch('groupInverterInfo.serialNumPerBranch', function () {
        $scope.groupInverterInfo.branchNumPerInverter = compute_branchNumPerInverter();
    });

    $scope.$watch('groupInverterInfo.branchNumPerInverter', function () {
        $scope.groupInverterInfo.inverterNumNeeded = compute_inverterNumNeeded();
    });

    $scope.$watch('groupInverterInfo.volumeRatio', function () {
        $scope.groupInverterInfo.inverterNumNeeded = compute_inverterNumNeeded();
    });

    $scope.$watch('groupInverterInfo.inverterNumNeeded', function () {
        $scope.groupInverterInfo.totalOpacity = compute_totalOpacity() | 0;
    });

    $scope.$watch('groupInverterInfo.lowTemperature', function () {
        $scope.groupInverterInfo.serialNumPerBranch = compute_serialNumPerBranch()[1];
    });

    $scope.$watch('groupInverterInfo.highTemperature', function () {
        $scope.groupInverterInfo.serialNumPerBranch = compute_serialNumPerBranch()[1];
    });

    var componentInfo = projectData.getData('componentInfo');
    $scope.groupInverterInfo.lowTemperature = componentInfo['工作温度下限'];
    $scope.groupInverterInfo.highTemperature = componentInfo['工作温度上限'];

    function compute_serialNumPerBranch() {
        var n1 = Math.floor($scope.groupInverterInfo.groupInverter['最大输入电压'] / (componentInfo['开路电压'] * (1 + ($scope.groupInverterInfo.lowTemperature - 25) * componentInfo['开路电压温度系数'] / 100)));
        var n2min = Math.ceil($scope.groupInverterInfo.groupInverter['MPP电压下限'] / (componentInfo['最大功率点电压'] * (1 + ($scope.groupInverterInfo.highTemperature - 25) * componentInfo['最大功率温度系数'] / 100)));
        var n2max = Math.floor($scope.groupInverterInfo.groupInverter['MPP电压上限'] / (componentInfo['最大功率点电压'] * (1 + ($scope.groupInverterInfo.highTemperature - 25) * componentInfo['最大功率温度系数'] / 100)));

        if (n1 > n2max) {                               //返回每支路串联数范围
            return [n2min, n2max];
        } else if (n1 < n2min) {
            return [1, n1];
        } else {
            return [n2min, n1];
        }
    }

    function compute_branchNumPerInverter() {
        return Math.ceil($scope.groupInverterInfo.groupInverter['最大输入功率'] / (componentInfo['峰值功率'] * $scope.groupInverterInfo.serialNumPerBranch));
    }

    function compute_inverterNumNeeded() {
        var userDesignInfo = projectData.getData('userDesignInfo');
        var capacity = userDesignInfo.designType == 'area' ? userDesignInfo.area.totalCapacity : userDesignInfo.capacity.totalCapacity;
        return Math.ceil(capacity * $scope.groupInverterInfo.volumeRatio / ($scope.groupInverterInfo.serialNumPerBranch
            * $scope.groupInverterInfo.branchNumPerInverter * (componentInfo['峰值功率'] / 1000)));
    }

    function compute_totalOpacity() {
        return $scope.groupInverterInfo.branchNumPerInverter * $scope.groupInverterInfo.serialNumPerBranch
            * $scope.groupInverterInfo.inverterNumNeeded * componentInfo['峰值功率'] / 1000;
    }

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from invertertandem', function (data) {
            customer.getItems('groupInverter').map(function (item) {
                data.push(item.item);
            });
            data.sort(function (a, b) {
                return -(a['最大效率'] - b['最大效率']);
            });
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.groupInverterInfo) {
            $scope.groupInverterInfo = _.cloneDeep(parentObj.groupInverterInfo);
            $scope.groupInverterInfo.lowTemperature = componentInfo['工作温度下限'];
            $scope.groupInverterInfo.highTemperature = componentInfo['工作温度上限'];
            $scope.savedInfo = _.cloneDeep(parentObj.groupInverterInfo);
            $scope.showSaved = true;
            $scope.selected = JSON.stringify($scope.groupInverterInfo.groupInverter);
        }
    })

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'groupInverterInfo',
            obj: $scope.groupInverterInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 选择电网等级控制器
 */
pvModule.controller('selectTransformerCtrl', function ($scope, $location, $uibModal, projectData) {
    $scope['show_10'] = true;
    $scope['show_35'] = false;

    $scope.obj = {
        type: "10kv"
    };

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('transformer');
        if (temp) {
            $scope.obj = _.cloneDeep(temp);
        }
    });

    $scope.$watch('obj.type', function (newVal) {
        //noinspection JSValidateTypes
        if (newVal == "10kv") {
            $scope['show_10'] = true;
            $scope['show_35'] = false;
        } else { //noinspection JSValidateTypes
            if (newVal == "35kv") {
                $scope['show_10'] = false;
                $scope['show_35'] = true;
            } else {
                $scope['show_10'] = false;
                $scope['show_35'] = false;
            }
        }
    });

    $scope.save = function () {
        projectData.addOrUpdateData($scope.obj, "transformer");
        projectData.setFinished("selectTransformer");
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    };

    $scope.showForm = function (name) {
        var templateUrl, controller;
        switch (name) {
            case 'low_10_35_380':                //低压开关柜
                templateUrl = 'tpls/html/lowVoltage.html';
                controller = 'low_10_35';
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
                templateUrl = 'tpls/html/highVoltage.html';
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
            backdrop: false,
            resolve: {
                parentObj: function () {
                    return $scope.obj;
                }
            }
        });
        modalInstance.result.then(function (data) {
            $scope.obj[data.name] = data.obj;
            projectData.addOrUpdateData($scope.obj, "transformer");
            projectData.saveToLocal();
        });
    }
});

/*
低压开关柜控制器
*/
pvModule.controller('low_10_35Ctrl', function ($scope, $uibModalInstance, parentObj, projectData) {
    $scope.lowSwitchInfo = {
        lowSwitch: {},
        num: 0
    };

    $scope.items = [];
    $scope.selected = '';

    $scope.$watch('selected', function (newVal) {
        $scope.lowSwitchInfo.lowSwitch = JSON.parse(newVal);
    });

    var chooseInverter = projectData.getData('chooseInverter');
    var inverter;
    if (chooseInverter.type == 'centralized') {
        inverter = chooseInverter.centralizedInverterInfo;
    } else {
        inverter = chooseInverter.groupInverterInfo;
    }

    $scope.lowSwitchInfo.num = inverter.inverterNumNeeded;

    // $scope.getData = function () {
    //     gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/switch?type=低压')
    //         .then(function (data) {
    //             $scope.items = data.data;
    //         })
    // };
    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from switch where 类型=\'低压\'', function (data) {
            customer.getItems('switch').map(function (item) {
                if (item.item['类型'] === '低压')
                    data.push(item.item);
            });
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.lowSwitchInfo) {
            $scope.lowSwitchInfo = parentObj.lowSwitchInfo;
            $scope.selected = JSON.stringify($scope.lowSwitchInfo.lowSwitch);
        }
    })

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'lowSwitchInfo',
            obj: $scope.lowSwitchInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 10kv升压变压器控制器
 */
pvModule.controller('up_10Ctrl', function ($scope, $uibModalInstance, parentObj, projectData) {
    $scope.transformerInfo = {
        transformer: {},
        serialNum: 1,
        num: 0
    };

    $scope.items = [];
    $scope.selected = '';

    var chooseInverter = projectData.getData('chooseInverter');
    var inverter, power;
    if (chooseInverter.type == 'centralized') {
        inverter = chooseInverter.centralizedInverterInfo;
        power = inverter.centralizedInverter['额定交流输出功率'];
    } else {
        inverter = chooseInverter.groupInverterInfo;
        power = inverter.groupInverter['额定输出功率'];
    }

    $scope.$watch('selected', function (newVal) {
        $scope.transformerInfo.transformer = JSON.parse(newVal);
        $scope.transformerInfo.serialNum = Math.floor(Number($scope.transformerInfo.transformer['额定容量']) / Number(power));
    });

    $scope.$watch('transformerInfo.serialNum', function () {
        $scope.transformerInfo.num = compute_num();
    });

    function compute_num() {
        if($scope.transformerInfo.serialNum === 0){
            return 0;
        }
        return Math.ceil(inverter.inverterNumNeeded / $scope.transformerInfo.serialNum);
    }

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from transformer where 类型=\'10KV变压器\'', function (data) {
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.transformerInfo10) {
            $scope.transformerInfo10 = _.cloneDeep(parentObj.transformerInfo10);
            $scope.savedInfo = _.cloneDeep(parentObj.transformerInfo10);
            $scope.showSaved = true;
            $scope.selected = JSON.stringify($scope.transformerInfo10.transformer);
        }
    });

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'transformerInfo10',
            obj: $scope.transformerInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
 35kv升压变压器控制器
 */
pvModule.controller('up_35Ctrl', function ($scope, $uibModalInstance, $window, parentObj, projectData) {
    $scope.transformerInfo = {
        transformer1: {},
        transformer2: {},
        type: 'once',
        serialNum: [1, 1],
        num: [1, 1]
    };

    $scope.active = 0;
    $scope.setActive = function (index) {
        $scope.active = index;
    }

    var chooseInverter = projectData.getData('chooseInverter');
    var inverter, power;
    if (chooseInverter.type == 'centralized') {
        inverter = chooseInverter.centralizedInverterInfo;
        power = inverter.centralizedInverter['额定交流输出功率'];
    } else {
        inverter = chooseInverter.groupInverterInfo;
        power = inverter.groupInverter['额定输出功率'];
    }

    $scope.$watch('transformerInfo.serialNum', function () {
        compute_num();
    },true);

    $scope.items1 = [];
    $scope.selectedonce = '';
    $scope.$watch('selectedonce', function (newVal) {
        $scope.transformerInfo.transformer1 = JSON.parse(newVal);
        $scope.transformerInfo.serialNum[0] = Math.floor(Number($scope.transformerInfo.transformer1['额定容量']) / Number(power));
    });

    $scope.items2 = [];
    $scope.selectedtwice = '';
    $scope.$watch('selectedtwice', function (newVal) {
        $scope.transformerInfo.transformer2 = JSON.parse(newVal);
        $scope.transformerInfo.serialNum[1] = Math.floor(Number($scope.transformerInfo.transformer2['额定容量']) / Number(power));
    });

    function compute_num() {
        var s0,s1;
        if($scope.transformerInfo.serialNum[0] === 0){
            s0 = 0;
        }else{
            s0 = Math.ceil(inverter.inverterNumNeeded / $scope.transformerInfo.serialNum[0]);
        }
        
        if($scope.transformerInfo.serialNum[1] === 0){
            s1 = 0;
        }else{
            s1 = Math.ceil(inverter.inverterNumNeeded / Number($scope.transformerInfo.serialNum[1]));
        }
        $scope.transformerInfo.num[0] = s0;
        $scope.transformerInfo.num[1] = s1;
    }

    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from transformer where 类型=\'10KV变压器\'', function (data) {
            $scope.items1 = data;
            $scope.$digest();
        });
        dbHelper.getData('select * from transformer where 类型=\'35KV变压器(0.4-35KV)\'', function (data) {
            $scope.items2 = data;
            $scope.$digest();
        });
        if (parentObj.transformerInfo35) {
            $scope.transformerInfo = _.cloneDeep(parentObj.transformerInfo35);
            $scope.savedInfo = _.cloneDeep(parentObj.transformerInfo35);
            $scope.showSaved = true;
            $scope.selectedonce = JSON.stringify($scope.transformerInfo.transformer1);
            $scope.selectedtwice = JSON.stringify($scope.transformerInfo.transformer2);
        }
    })

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'transformerInfo35',
            obj: $scope.transformerInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
高压开关柜控制器
*/
pvModule.controller('high_10_35Ctrl', function ($scope, $uibModalInstance, $window, parentObj, projectData) {
    $scope.highSwitchInfo = {
        highSwitch: {},
        num: 0
    };

    $scope.items = [];
    $scope.selected = '';

    $scope.$watch('selected', function (newVal) {
        $scope.highSwitchInfo.highSwitch = JSON.parse(newVal);
    });

    $scope.highSwitchInfo.num = parentObj.type == '10kv' ? parentObj.transformerInfo10.num : 12;

    // $scope.getData = function () {
    //     gainData.getDataFromInterface('http://cake.wolfogre.com:8080/pv-data/switch?type=高压')
    //         .then(function (data) {
    //             $scope.items = data.data;
    //         })
    // };
    $scope.$watch('$viewContentLoaded', function () {
        dbHelper.getData('select * from switch where 类型=\'高压\'', function (data) {
            customer.getItems('switch').map(function (item) {
                if (item.item['类型'] === '高压')
                    data.push(item.item);
            });
            $scope.items = data;
            $scope.$digest();
        });
        if (parentObj.highSwitchInfo) {
            $scope.highSwitchInfo = parentObj.highSwitchInfo;
            $scope.selected = JSON.stringify($scope.highSwitchInfo.highSwitch);
        }
    })

    $scope.ok = function () {
        $uibModalInstance.close({
            name: 'highSwitchInfo',
            obj: $scope.highSwitchInfo
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

/*
效率分析控制器
 loss [0] : 阴影损耗
 loss [1] : 灰尘等遮挡损耗
 loss [2] : 组件温升损耗
 loss [3] : 直流电缆损耗
 loss [4] : 组串内失配损耗
 loss [5] : 逆变器损耗
 loss [6] : 变压器损耗
 loss [7] : 交流电缆损耗
 loss [8] : 故障检修、电网等其它损耗
 */
pvModule.controller('efficiencyAnalysisCtrl', function ($scope, $location, projectData) {

    $scope.data = {
        loss: [97.2, 90, 100, 97.8, 98, 96, 99, 99.5, 95],
        componentLoss: 1,
        lossTotal: 0,
        runYears: 1,
        totalYears: 25,
        electricity: [],
        yearBing: 0
    };

    var chooseInverter = projectData.getData('chooseInverter');
    if (chooseInverter.type === 'centralized') {
        $scope.data.loss[3] = Number((100 - chooseInverter.directCurrentCableInfo.totalLoss * 100).toFixed(3));
    } else {
        $scope.data.loss[3] = Number((100 - chooseInverter.alternatingCurrentCableInfo.loss * 100).toFixed(3));
    }

    $scope.active = 0;
    $scope.setActive = function (index) {
        $scope.active = index;
    }

    $scope.$watch('data.loss', function () {
        var total = 0;
        for (var i = 0; i < $scope.data.loss.length; i++) {
            total += Number(100 - $scope.data.loss[i]);
        }
        $scope.data.lossTotal = total;
    }, true);

    $scope.$watch('data.totalYears', function () {
        if ($scope.runYears > $scope.totalYears)
            $scope.runYears = $scope.totalYears;
    });

    var componentInfo = projectData.getData('componentInfo');
    var meteorologyInfo = projectData.getData('meteorologyInfo');
    var angleInfo = projectData.getData('angleInfo');

    var H = [];
    var T = [];

    meteorologyInfo.monthinfos.forEach(function (monthinfo) {
        H.push(monthinfo.H);
        T.push(monthinfo.temperature);
    });

    $scope.options0 = {
        title: {
            display: true,
            text: '月总辐照度图',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '月份'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '辐照度 kWh/m^2'
                }
            }]
        }
    };
    $scope.options1 = {
        title: {
            display: true,
            text: '损耗电量',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '月份'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '损耗电量 kWh'
                }
            }]
        }
    };
    $scope.options2 = {
        title: {
            display: true,
            text: '并入电网电量',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '月份'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '并入电网电量 kWh'
                }
            }]
        }
    }

    $scope.chartData0 = [
        []
    ];

    $scope.chartData1 = [
        []
    ];
    $scope.chartData2 = [];

    var monthDays = util.CONST.monthDays;
    var userDesign = projectData.getData('userDesignInfo');
    var componentsNum = userDesign.designType === 'area' ? userDesign.area.componentsNum : userDesign.capacity.componentsNum;

    for (var i = 1; i <= 12; i++) {
        var h = algorithm.getH_t(i, H[i - 1] * 1000, meteorologyInfo.lat, angleInfo.dip, angleInfo.az) * monthDays[i - 1];
        $scope.chartData0[0].push(Number(h.toFixed(3)));
    }

    $scope.electricity = algorithm.getDataByDip(H, meteorologyInfo.lat, angleInfo.az, componentInfo['转换效率'], componentInfo['长度'], componentInfo['宽度'], T, componentInfo['最大功率温度系数'] / 100, angleInfo.dip).gs.map(function (item) {
        return item * componentsNum;
    });

    compute_chartData();

    $scope.$watch('data.lossTotal', function () {
        compute_chartData();
    });

    $scope.$watch('data.runYears', function () {
        compute_chartData();
    });

    $scope.$watch('data.componentLoss', function () {
        compute_chartData();
    });

    function compute_chartData() {
        var yearLoss = Math.pow(1 - $scope.data.componentLoss / 100, $scope.data.runYears - 1);

        $scope.chartData1 = [
            []
        ];
        $scope.chartData2 = [];

        $scope.data.yearBing = 0;
        $scope.chartData2.push($scope.electricity.map(function (item) {
            var bingrudianliang = item * (1 - $scope.data.lossTotal / 100) * yearLoss;
            $scope.data.yearBing += bingrudianliang;
            $scope.chartData1[0].push(Number((item - bingrudianliang).toFixed(3)));
            return Number(bingrudianliang.toFixed(3));
        }));
    }

    $scope.labelsMonth = util.getLabel(12);

    $scope.save = function () {
        projectData.setFinished("efficiencyAnalysis");
        $scope.data.electricity = $scope.electricity;
        projectData.addOrUpdateData($scope.data, 'efficiencyAnalysisInfo');
        projectData.saveToLocal();
        $location.path('/0');
    };

    $scope.back = function () {
        $location.path('/0');
    }

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('efficiencyAnalysisInfo');
        if (temp) {
            $scope.data = _.cloneDeep(temp);
            if (chooseInverter.type === 'centralized') {
                $scope.data.loss[3] = Number((100 - chooseInverter.directCurrentCableInfo.totalLoss * 100).toFixed(3));
            } else {
                $scope.data.loss[3] = Number((100 - chooseInverter.alternatingCurrentCableInfo.loss * 100).toFixed(3));
            }
        }
    });

});


/*
效益分析控制器
 */
pvModule.controller('benefitCtrl', function ($scope, $location, projectData) {
    $scope.switchToUrl = function (url) {
        $location.path(url);
    };

    $scope.back = function () {
        projectData.setFinished("benefit");
        projectData.saveToLocal();
        $location.path('/0');
    }
});

/*
 参数列表控制器
 */
pvModule.controller('parametersCtrl', function ($scope, $location, projectData) {

    $scope.parameters = {
        AA: 0.9575,
        AB: 0.45927,
        AC: 0.42,
        AD: 0.25,
        AE: 0.9,
        AF: 1,
        AG: 20,
        AH: 5,
        AI: 0.17,
        AJ: 0.86175,
        AY: 0,
        BB: 25,
        BC: 3,
        BD: 4,
        BE: 0,
        DA: 5.6,
        DB: 0.3,
        DC: 1.6,
        DD: 0.1,
        DE: 0.18,
        LC: 0.0793,
        FA: 0.085,
        HA: 0.005,
        JA: 0.02,
        GA: 0.005,
        GB: 0.0655,
        GC: 0.5,
        GD: 10,
        GF: 0,
        GG: 20000,
        GI: 0,
        GR: 0,
        GP: 100000,
        GQ: 0,
        GO: 0,
        GS: 0,
        MM: 0,
        MY: 0.0655
    };

    $scope.parameters.BE = $scope.parameters.BB * (12 / $scope.parameters.BC);

    $scope.save = function () {
        projectData.addOrUpdateData($scope.parameters, 'parameters');
        projectData.saveToLocal();
        $location.path('/8');
    };

    $scope.back = function () {
        $location.path('/8');
    };

    $scope.$watch('$viewContentLoaded', function () {
        var temp = projectData.getData('parameters');
        if (temp) {
            $scope.parameters = _.cloneDeep(temp);
        }
    });
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
pvModule.controller('investmentCostsCtrl', function ($scope, $location, projectData) {

    $scope.hide = true;

    $scope.show = [true, false, false, false];

    $scope.showMe = function (id) {
        for (var i = 0; i < $scope.show.length; i++) {
            if (i === id) {
                $scope.show[i] = true;
            } else {
                $scope.show[i] = false;
            }
        }
    };

    var p = projectData.getData('parameters');
    var efficiencyAnalysis = projectData.getData('efficiencyAnalysisInfo');
    var componentLoss = efficiencyAnalysis.componentLoss;
    var lossTotal = efficiencyAnalysis.lossTotal;
    var electricity = efficiencyAnalysis.electricity;

    var userDesign = projectData.getData('userDesignInfo');
    var BA = userDesign.designType === 'area' ? userDesign.area.totalCapacity : userDesign.capacity.totalCapacity;
    console.log(BA);
    ///////////////////////////////////////////////////////////////////////   项目总收入预算
    $scope.data1 = {
        CA: [],
        CD: [],
        CE: [],
        CF: [],
        CG: [],
        CH: [],
        CI: [],
        CB: 0,
        CC: 0,
        CJ: 0,
        CK: 0,
        CL: 0,
        CM: 0,
        CN: 0,
        CO: 0,
        CP: 0,
        CQ: 0,
        CR: 0,
        CS: 0,
        CT: 0,
        CU: 0,
        CV: 0
    };

    function computeYearBing(year) {
        var yearLoss = Math.pow(1 - componentLoss / 100, year - 1);
        if (yearLoss < 0)
            yearLoss = 0;

        var yearBing = 0;
        electricity.map(function (item) {
            var bingrudianliang = item * (1 - lossTotal / 100) * yearLoss;
            yearBing += bingrudianliang;
        });
        return yearBing;
    }

    var ca, cd, ce, cf, cg, ch, ci;
    for (var i = 0; i < p.BB; i++) {
        ca = computeYearBing(i + 1);

        cd = ca * p.AF * p.AJ + ca * (1 - p.AF) * p.AB;
        ce = cd / (1 + p.AI);

        if (i < p.AH) {
            cf = ca * (p.AC + p.AD);
        } else if (i < p.AG) {
            cf = ca * p.AC;
        } else {
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
        DA: p.DA,
        DB: p.DB,
        DC: p.DC,
        DD: p.DD,
        DE: p.DE,
        DF: p.DA * BA * 1000,
        DG: p.DB * BA * 1000,
        DH: p.DC * BA * 1000,
        DI: p.DD * BA * 1000,
        DJ: p.DE * BA * 1000,
        DK: 0,
        DL: 0,
        DM: 0,
        DN: 0,
        DO: 0,
        DP: 0,
        DQ: 0,
        DR: 0,
        DS: 0
    };
    $scope.data2.DK = $scope.data2.DF / (1 + p.AI);
    $scope.data2.DL = $scope.data2.DG / (1 + p.AI);
    $scope.data2.DM = $scope.data2.DH / (1 + p.AI);
    $scope.data2.DN = $scope.data2.DI / (1 + p.AI);
    $scope.data2.DO = $scope.data2.DJ / (1 + p.AI);

    $scope.data2.DP = p.DA + p.DB + p.DC + p.DD + p.DE;
    $scope.data2.DQ = $scope.data2.DF + $scope.data2.DG + $scope.data2.DH + $scope.data2.DI + $scope.data2.DJ;
    $scope.data2.DR = $scope.data2.DK + $scope.data2.DL + $scope.data2.DM + $scope.data2.DN + $scope.data2.DO;

    $scope.data2.DS = $scope.data2.DK + $scope.data2.DG + $scope.data2.DH + $scope.data2.DI + $scope.data2.DJ;

    //////////////////////////////////////////////////////////////////////////   融资成本和贷款余额
    $scope.otherdata = {
        MI: 0,
        MX: [],
        MF: $scope.data2.DQ * p.GC,
        MG: []
    };

    var mx, mg;
    for (var i = 0; i < p.BB; i++) {
        mg = $scope.otherdata.MF / p.GD * (p.GD - (i + 1));
        if (mg < 0) {
            mg = 0;
        }

        if (i == 0) {
            mx = $scope.otherdata.MF * p.MY;
        } else {
            mx = $scope.otherdata.MG[i - 1] * p.MY;
        }

        $scope.otherdata.MI += mx;
        $scope.otherdata.MX.push(mx);
        $scope.otherdata.MG.push(mg);
    }

    //////////////////////////////////////////////////////////////////////////   合同
    $scope.data3 = {
        EA: 0,
        EB: 0
    };

    $scope.data3.EA = $scope.data1.CV - $scope.data2.DS;
    $scope.data3.EB = $scope.data3.EA / $scope.data1.CV;

    //////////////////////////////////////////////////////////////////////////   运维分包
    $scope.data4 = {
        FA: 0,
        FB: 0
    };

    $scope.data4.FA = p.FA;
    $scope.data4.FB = p.FA * BA * 25 * 1000;

    //////////////////////////////////////////////////////////////////////////   项目直接费用预算
    $scope.data5 = {
        GE: $scope.data1.CV * p.GA * p.BD / 12,
        GF: p.GF,
        GG: p.GG,
        GH: ($scope.data2.DS + $scope.data2.DK * p.AI) * p.BD / 12 * p.GB / 2 * p.GC,
        GI: p.GI,
        GR: p.GR,
        GK: ($scope.data1.CV - $scope.data2.DS) * p.BB * p.GA / 2,
        GO: p.GO,
        GP: p.GP,
        GL: 0,                                                /////////////////////////////// GL=MI
        GQ: p.GQ,
        GS: p.GS,
        S1: 0,
        S2: 0,
        S3: 0,
        S4: 0,
        S5: 0,
        S6: 0,
        GJ: 0,
        GM: 0,
        GN: 0
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
        HB: $scope.data1.CV * p.HA * p.BD / 12,
        HC: ($scope.data1.CV - $scope.data2.DS) * p.HA * p.BB / 2,
        HD: 0
    };
    $scope.data6.HD = $scope.data6.HB + $scope.data6.HC;

    //////////////////////////////////////////////////////////////////////////   项目预计毛利
    $scope.data7 = {
        IA: $scope.data1.CV - $scope.data2.DS - $scope.data4.FB - $scope.data5.GN - $scope.data6.HD,
        IB: 0
    };

    $scope.data7.IB = $scope.data7.IA / $scope.data1.CV;

    //////////////////////////////////////////////////////////////////////////   期间费用分摊
    $scope.data8 = {
        JA: p.JA,
        JB: $scope.data1.CV * p.JA * p.BD / 12 + ($scope.data1.CV - $scope.data2.DS) * p.JA * p.BB / 2
    };

    //////////////////////////////////////////////////////////////////////////   项目预计净利润
    $scope.data9 = {
        KA: $scope.data7.IA - $scope.data8.JB,
        KB: 0
    };

    $scope.data9.KB = $scope.data9.KA / $scope.data1.CV;

    //////////////////////////////////////////////////////////////////////////   其它函数
    $scope.back = function () {
        var investmentCosts = {
            data1: $scope.data1,
            data2: $scope.data2,
            data3: $scope.data3,
            data4: $scope.data4,
            data5: $scope.data5,
            data6: $scope.data6,
            data7: $scope.data7,
            data8: $scope.data8,
            data9: $scope.data9,
            otherdata: $scope.otherdata
        };

        projectData.addOrUpdateData(investmentCosts, 'investmentCosts');

        $location.path('/8');
    };
});

/*
 符合条件EMC表控制器
 */
pvModule.controller('emcCtrl', function ($scope, $location, projectData) {
    $scope.hide = true;

    var finance = new Finance();

    var p = projectData.getData('parameters');

    var itc = projectData.getData('investmentCosts');

    $scope.data = {
        LA: 0,
        LB: 0,
        LC: 0,
        LD: 0,
        LE: 0,
        LF: 0,
        LG: 0,
        LH: 0,
        LI: 0,
        LJ: 0,
        LK: 0,
        LM: 0,
        LN: 0,
        LO: [],
        LP: [],
        LQ: [],
        LR: [],
        sumLO: 0,
        LS: 0,
        sumLQ: 0,
        LT: 0,
        LU: 0
    };

    $scope.data.LA = (itc.data2.DS + itc.data5.GJ) - itc.data5.GH + itc.data6.HB;
    $scope.data.LB = (itc.data1.CV - ((itc.data4.FB + itc.data5.GM) - itc.data5.GL + itc.data6.HC) * 1.1) / p.BB;
    $scope.data.LC = p.LC;
    $scope.data.LD = $scope.data.LC / (12 / p.BC);
    $scope.data.LE = $scope.data.LB / (12 / p.BC);

    var les = [];
    for (var i = 0; i < p.BE; i++) {
        les.push($scope.data.LE);
    }

    $scope.data.LF = finance.NPV($scope.data.LD * 100, les);
    $scope.data.LG = $scope.data.LA * 1.1;
    $scope.data.LH = Math.min($scope.data.LF, $scope.data.LG);
    $scope.data.LI = $scope.data.LH - $scope.data.LA;
    $scope.data.LJ = $scope.data.LI / $scope.data.LH;
    $scope.data.LK = itc.data1.CV - $scope.data.LH;
    $scope.data.LM = itc.data7.IA - $scope.data.LI + itc.data5.GH + itc.data5.GL;
    $scope.data.LN = $scope.data.LM / $scope.data.LK;

    for (var i = 0; i < p.BE; i++) {
        if (i == 0) {
            $scope.data.LO.push($scope.data.LE);
            $scope.data.LP.push($scope.data.LH * $scope.data.LD);
            $scope.data.LQ.push($scope.data.LO[i] - $scope.data.LP[i]);
            $scope.data.LR.push($scope.data.LH - $scope.data.LQ[i]);
        } else {
            $scope.data.LO.push($scope.data.LE);
            $scope.data.LP.push($scope.data.LR[i - 1] * $scope.data.LD);
            $scope.data.LQ.push($scope.data.LO[i] - $scope.data.LP[i]);
            $scope.data.LR.push($scope.data.LR[i - 1] - $scope.data.LQ[i]);
        }

        $scope.data.sumLO += $scope.data.LO[i];
        $scope.data.LS += $scope.data.LP[i];
        $scope.data.sumLQ += $scope.data.LQ[i];
    }

    var t = ((itc.data4.FB + itc.data5.GM) - itc.data5.GL + itc.data6.HC);
    $scope.data.LT = t * 1.1;
    $scope.data.LU = t * 0.1;

    $scope.back = function () {
        var emc = {
            data: $scope.data
        };

        projectData.addOrUpdateData(emc, 'emc');
        projectData.saveToLocal();
        $location.path('/8');
    }
});

/*
 收益期状况表控制器
 */
pvModule.controller('profitPeriodCtrl', function ($scope, $location, projectData) {

    var p = projectData.getData('parameters');
    var itc = projectData.getData('investmentCosts');
    var emc = projectData.getData('emc');

    $scope.show = [true, false, false];
    $scope.showMe = function (id) {
        for (var i = 0; i < $scope.show.length; i++) {
            if (id == i) {
                $scope.show[i] = true;
            } else {
                $scope.show[i] = false;
            }
        }
    };

    $scope.data = {
        MA: 0,
        DS: itc.data2.DS,
        MB: 0,
        MC: 0,
        CL: itc.data1.CL,
        CE: itc.data1.CE,
        CQ: itc.data1.CQ,
        CG: itc.data1.CG,
        CT: itc.data1.CT,
        CZ: itc.data1.CI,
        ME: 0,
        MD: (itc.data4.FB + itc.data5.GK + itc.data5.GO + itc.data5.GP + itc.data6.HC) / p.BB,
        MM: p.MM,
        sumMM: p.MM * p.BB,
        MI: itc.otherdata.MI,
        MX: itc.otherdata.MX,
        MF: itc.otherdata.MF,
        MG: itc.otherdata.MG,
        ML: 0,
        MJ: 0,
        MK: [],
        MR: 0,
        MO: [],
        MT: 0,
        MS: [],
        MW: 0,
        MV: [],
        MP: 0,
        MQ: []
    };

    $scope.data.MA = itc.data2.DF / (1 + p.AI) * p.AI;
    $scope.data.MB = itc.data5.GF + itc.data5.GG + itc.data5.GR + itc.data6.HB;
    $scope.data.MC = $scope.data.DS + itc.data5.GH + $scope.data.MB + itc.data5.GE;
    $scope.data.MJ = -$scope.data.MC;
    $scope.data.MP = $scope.data.MF + $scope.data.MJ;

    $scope.data.ME = $scope.data.MD * p.BB;
    $scope.data.MR = $scope.data.MC / p.BB;

    var mk, mo, ms, mv, mq;
    for (var i = 0; i < p.BB; i++) {
        mk = $scope.data.CZ[i] - $scope.data.MD - $scope.data.MX[i] - p.MM;

        if (i == 0) {
            mo = $scope.data.MF - $scope.data.MG[i];
            mq = mk - mo + $scope.data.MP;
        } else {
            mo = $scope.data.MG[i - 1] - $scope.data.MG[i];
            mq = mk - mo + $scope.data.MQ[i - 1];
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

    $scope.data.MW = $scope.data.MT / $scope.data.CT;

    $scope.labelsYear = util.getLabel(p.BB);

    $scope.series = ['债务偿还图', '投资回收期图'];

    $scope.chartData1 = [
        $scope.data.MG.map(function (item) {
            return item / 10000;
        })
    ];

    $scope.chartData2 = [
        $scope.data.MQ.map(function (item) {
            return item / 10000;
        })
    ];

    $scope.options1 = {
        title: {
            display: true,
            text: '债务偿还图',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '年'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '万元'
                }
            }]
        }
    };
    $scope.options2 = {
        title: {
            display: true,
            text: '投资回收期图',
            fontSize: 14,
            fontStyle: 'normal'
        },
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '年'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: '万元'
                }
            }]
        }
    };

    $scope.back = function () {
        projectData.addOrUpdateData($scope.data, 'profitPeriod');
        $location.path('/8');
    }
});

/*
 综合指标表
 */
pvModule.controller('overallIndexCtrl', function ($scope, $location, projectData) {

    var p = projectData.getData('parameters');
    var itc = projectData.getData('investmentCosts');
    var emc = projectData.getData('emc');
    var pp = projectData.getData('profitPeriod');

    $scope.data = {
        MT: pp.MT,
        NA: pp.ML - pp.MC,
        NB: 0,
        MW: pp.MW,
        IB: itc.data7.IB,
        NC: pp.MT / (pp.MC + pp.ME + pp.MM + pp.MI),
        ND: pp.MT / p.BB / (pp.MC + pp.ME + pp.MM + pp.MI),
        NE: 0,
        NF: 0,
        NG: 0,
        NH: p.BD / 12 + 32 / 111 + 9,
        NI: 0
    };

    var finance = new Finance();
    var rate = p.GB;
    if (rate === 0)
        rate = 0.07;
    var values = [];
    for (var i = 0; i < p.BB; i++) {
        if (i === 0) {
            values.push(pp.MK[i] + pp.MG[i] - pp.MC);
        } else {
            values.push(pp.MK[i] + pp.MK[i] - pp.MK[i - 1]);
        }
    }
    $scope.data.NB = finance.NPV(rate * 100, values);
    $scope.data.NI = $scope.data.NH / (p.BD / 12 + p.BB);
    $scope.data.NE = finance.IRR(pp.MJ, pp.MK);
    $scope.data.NF = p.BD / 12 + (pp.MG[12] - pp.MQ[12]) / pp.MK[12] + 12;
    $scope.data.NG = $scope.data.NF / (p.BD / 12 + p.BB);

    $scope.back = function () {
        projectData.addOrUpdateData($scope.data, 'overallIndex');
        $location.path('/8');
    }
});

/*
报告控制器
 */
pvModule.controller('reportCtrl', function ($scope, $location, $route, projectData) {

    var basicInfo = projectData.getData('basicInfo');
    var angleInfo = projectData.getData('angleInfo');
    var userDesign = projectData.getData("userDesignInfo");
    var meteorologyInfo = projectData.getData('meteorologyInfo');
    var investmentCosts = projectData.getData('investmentCosts');
    var emc = projectData.getData('emc');
    var profitPeriod = projectData.getData('profitPeriod');
    var parameters = projectData.getData('parameters');
    var efficiencyAnalysis = projectData.getData('efficiencyAnalysisInfo');
    var componentInfo = projectData.getData('componentInfo');

    // $scope.getMapPath = function () {
    //     return "http://api.map.baidu.com/staticimage/v2?ak=GFrzxzyQTLiDx6sxx8B4ScTLKuwPNzGi&mcode=666666&center=" + meteorologyInfo.lng + "," + meteorologyInfo.lat + "&width=300&height=200&zoom=11&markers=" + meteorologyInfo.lng + "," + meteorologyInfo.lat + "&markerStyles=I,A";
    // };

    $scope.data = {
        projectInfo: {
            projectName: basicInfo.projectName,
            designTime: basicInfo.projectDate,
            capacity: 0,
            dip: angleInfo.dip,
            az: angleInfo.az,
            arrayArea: 0,
            arrayfbspace: 0,
            lat: meteorologyInfo.lat,
            lng: meteorologyInfo.lng
        },
        meteorology: {
            temperature: [],
            HT: []
        },
        device: [{
            name: '光伏组件',
            model: componentInfo['型号'],
            num: userDesign.designType === 'area' ? userDesign.area.componentsNum : userDesign.capacity.componentsNum,
            price: 0,
            sumPrice: 0
        }],
        electricity: {
            yearCapacity: 0,
            yearHT: 0,
            yearEfficient: 0
        },
        profit: {
            totalCost: investmentCosts.data2.DQ,
            designCost: investmentCosts.data2.DG,
            deviceCost: investmentCosts.data2.DF,
            constructionCost: investmentCosts.data2.DH,
            supervisionCost: investmentCosts.data2.DI,
            otherCost: investmentCosts.data2.DJ,
            projectBuildCost: emc.data.LA,
            buildPeriod: parameters.BD,
            profitPeriod: parameters.BB,
            yearProfit: profitPeriod.CT
        }
    };

    var chooseInverter = projectData.getData('chooseInverter');
    if (chooseInverter.type === 'centralized') {
        $scope.data.device.push({
            name: '集中式逆变器',
            model: chooseInverter.centralizedInverterInfo.centralizedInverter['型号'],
            num: chooseInverter.centralizedInverterInfo.inverterNumNeeded,
            price: 0,
            sumPrice: 0
        });
        $scope.data.device.push({
            name: '直流汇流箱',
            model: chooseInverter.directCurrentInfo.directCurrent['型号'],
            num: chooseInverter.directCurrentInfo.num,
            price: 0,
            sumPrice: 0
        });
        $scope.data.device.push({
            name: '直流配电柜',
            model: chooseInverter.directDistributionInfo.directDistribution['型号'],
            num: chooseInverter.directDistributionInfo.num,
            price: 0,
            sumPrice: 0
        });
        for (var i = 0; i < 3; i++) {
            var cableName;
            if (i === 0) {
                cableName = '电缆:阵列->汇流箱';
            } else if (i === 1) {
                cableName = '电缆:汇流箱->配电柜';
            } else {
                cableName = '电缆:配电柜->逆变器';
            }

            $scope.data.device.push({
                name: cableName,
                model: chooseInverter.directCurrentCableInfo.cables[i].directCurrentCable['型号'],
                num: chooseInverter.directCurrentCableInfo.cables[i].length,
                price: 0,
                sumPrice: 0
            });
        }
    } else {
        $scope.data.device.push({
            name: '组串式逆变器',
            model: chooseInverter.groupInverterInfo.groupInverter['型号'],
            num: chooseInverter.groupInverterInfo.inverterNumNeeded,
            price: 0,
            sumPrice: 0
        });
        $scope.data.device.push({
            name: '电缆:阵列->逆变器',
            model: chooseInverter.alternatingCurrentCableInfo.alternatingCurrentCable['型号'],
            num: chooseInverter.alternatingCurrentCableInfo.length,
            price: 0,
            sumPrice: 0
        });
    }

    //todo: 高压侧设备

    meteorologyInfo.monthinfos.forEach(function (monthinfo) {
        $scope.data.meteorology.temperature.push(monthinfo.temperature);
        $scope.data.meteorology.HT.push(monthinfo.H);
    });

    if (userDesign.designType === "area") {
        $scope.data.projectInfo.capacity = userDesign.area.totalCapacity;
        $scope.data.projectInfo.arrayArea = userDesign.area.totalArea;
        $scope.data.projectInfo.arrayfbspace = userDesign.fbspace;
    } else {
        $scope.data.projectInfo.capacity = userDesign.capacity.totalCapacity;
    }

    $scope.options1 = [
        {
            title: {
                display: true,
                text: '月发电量图',
                fontSize: 14,
                fontStyle: 'normal'
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '月份'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '电量 kWh'
                    }
                }]
            }
        }, {
            title: {
                display: true,
                text: '月辐照度图',
                fontSize: 14,
                fontStyle: 'normal'
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '月份'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '辐照度 kWh/m^2'
                    }
                }]
            }
        }, {
            title: {
                display: true,
                text: '损耗图',
                fontSize: 14,
                fontStyle: 'normal'
            },
            elements: {
                arc: {
                    borderWidth: 1
                }
            }
        }
    ];

    $scope.labelsMonth = util.getLabel(12);
    $scope.labelsYear = util.getLabel(parameters.BB);
    $scope.lossLabel = ['阴影损耗', '灰尘等遮挡损耗', '组件温升损耗', '直流电缆损耗', '组串内失配损耗', '逆变器损耗', '变压器损耗', '交流电缆损耗', '故障检修、电网等其它损耗', '发电量'];

    var yearElectricity = 0;

    $scope.electricityChartData = [
        efficiencyAnalysis.electricity.map(function (item) {
            yearElectricity += item;
            var temp = item * (1 - efficiencyAnalysis.componentLoss / 100) * (1 - efficiencyAnalysis.lossTotal / 100);
            $scope.data.electricity.yearCapacity += temp;
            return Number(temp.toFixed(2));
        })
    ];
    $scope.HChartData = [
        []
    ];

    var monthDays = util.CONST.monthDays;
    for (var i = 1; i <= 12; i++) {
        var temp = algorithm.getH_t(i, $scope.data.meteorology.HT[i - 1] * 1000, meteorologyInfo.lat, angleInfo.dip, angleInfo.az) * monthDays[i - 1];
        $scope.data.electricity.yearHT += temp;
        $scope.HChartData[0].push(temp.toFixed(2));
    }

    $scope.lossChartData = efficiencyAnalysis.loss.map(function (loss) {
        return Number((yearElectricity * (1 - efficiencyAnalysis.componentLoss / 100) * (1 - loss / 100)).toFixed(0));
    });
    $scope.lossChartData.push(Number($scope.data.electricity.yearCapacity.toFixed(0)));

    $scope.data.electricity.yearEfficient = 100 - efficiencyAnalysis.lossTotal;

    $scope.options2 = [
        {
            title: {
                display: true,
                text: '债务偿还图',
                fontSize: 16,
                fontStyle: 'normal'
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '年'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '万元'
                    }
                }]
            }
        }, {
            title: {
                display: true,
                text: '投资回收期图',
                fontSize: 16,
                fontStyle: 'normal'
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '年'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '万元'
                    }
                }]
            }
        }
    ]

    $scope.debtChartData = [
        profitPeriod.MG.map(function (item) {
            return Number((item / 10000).toFixed(1));
        })
    ];

    $scope.investChartData = [
        profitPeriod.MQ.map(function (item) {
            return Number((item / 10000).toFixed(1));
        })
    ];

    $scope.gereratePdf = function () {

        var dialog = require('electron').remote.dialog;
        var savePath = dialog.showSaveDialog({
            title: '保存报告',
            defaultPath: 'D:/',
            buttonLabel: '保存',
            filters: [
                { name: 'pdf', extensions: ['pdf'] }
            ]
        });

        if (savePath) {
            var printDiv = document.getElementById('divPrint');
            var charts = document.getElementsByClassName('chart');

            for (var i = 0; i < charts.length; i++) {
                // var chart = charts[i].lastChild;
                var img = charts[i].toDataURL("image/png");
                var imgNode = document.createElement('img');
                imgNode.src = img;
                var parentNode = charts[i].parentNode;
                // parentNode.innerHTML = '';
                parentNode.appendChild(imgNode);
            }

            document.getElementById('divPrint').style.padding = "60px";
            fs.writeFileSync('report.html', document.getElementsByTagName('html')[0].outerHTML.replace(document.body.innerHTML, document.getElementById('divPrint').outerHTML));

            $route.reload();
            var process = require("child_process");
            process.exec('phantomjs.exe run.js ' + savePath, function (err, stdout, stderr) {
                console.log(err, stdout, stderr);
            });
        }
    };

    $scope.back = function () {
        projectData.setFinished("report");
        $location.path('/0');
    };
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

pvModule.directive('fixedheadertable', function () {
    return {
        restrict: 'C',
        link: function (scope, elem, attrs) {
            elem.css({
                "position": "relative",
                "overflow-y": "auto"
            });
            elem.scroll(function () {
                elem.children('.fixedtop').css('top', elem.scrollTop());
            });
        }
    }
});

pvModule.directive("fixedtop", function () {
    return {
        restrict: "C",
        link: function (scope, elem) {
            elem.css({
                "position": "absolute",
                "background-color": "#fff"
            });
        }
    };
});

//路由
pvModule.config(function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'welcome.html'
    }).when('/0', {
        templateUrl: 'tpls/html/project.html'
    }).when('/1', {
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
    }).when('/14', {
        templateUrl: 'tpls/html/efficiencyAnalysis.html'
    }).when('/15', {
        templateUrl: 'tpls/html/report.html'
    });

    $routeProvider.otherwise({ redirectTo: '/' });
});