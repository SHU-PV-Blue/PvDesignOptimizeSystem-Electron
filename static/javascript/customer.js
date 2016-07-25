
var customer = require('./common/customer/customerDevice');
var dialog = require('electron').remote.dialog;

var pvCustomer = angular.module('PVCustomer', ['ui.bootstrap', 'ngRoute'],function(){});

pvCustomer.controller('chooseDeviceCtrl',function($scope,$location){
    $scope.switchDevice = function(deviceName){
        $location.path('/' + deviceName);
    }
});

pvCustomer.controller('pvmoduleCtrl',function($scope,$uibModal){
    $scope.pvmodule = {
        "公司":"",
        "类型":"",
        "系列":"",
        "型号":"",
        "峰值功率":"",
        "转换效率":"",
        "开路电压":"",
        "最大功率点电压":"",
        "最大功率点电流":"",
        "短路电流":"",
        "开路电压温度系数":"",
        "最大功率温度系数":"",
        "短路电流温度系数":"",
        "长度":"",
        "宽度":"",
        "重量":"",
        "工作温度下限":"",
        "工作温度上限":"",
    };

    function openModal(item,type){
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'tpls/html/customer/pvmodule/operate.html',
            controller: 'pvmoduleOperateCtrl',
            size: 'lg',
            backdrop: false,
            resolve: {
                item : function () {
                    return item;
                },
                type : function(){
                    return type;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.flush();
        });
    }

    $scope.items = customer.getItems('pvmodule');

    $scope.flush = function(){
        $scope.items = customer.getItems('pvmodule');
    }

    $scope.addItem = function(){
        openModal({
            index : -1,
            item : $scope.pvmodule
        },'add');
    }

    $scope.editItem = function(index){
        openModal(customer.getItem('pvmodule',index),'edit');
    }

    $scope.deleteItem = function(index){
        dialog.showMessageBox(null,{
            type : 'info',
            message : '确认删除？',
            title : 'pv',
            buttons : ['确定','取消']
        },function(response){
            if(response === 0){
                customer.deleteItem('pvmodule',index);
                $scope.flush();
                $scope.$digest();
            }
        });
    }
    
    $scope.viewItem = function(index){
        openModal(customer.getItem('pvmodule',index),'view');
    }
});

pvCustomer.controller('pvmoduleOperateCtrl',function($scope, $uibModalInstance, item, type){

    $scope.item = item.item;
    $scope.disable = type === 'view';
    $scope.isEdit = type === 'edit';
    $scope.isAdd = type === 'add';

    $scope.save = function () {
        customer.saveItem('pvmodule', item.index, $scope.item);
        $uibModalInstance.close();
    };

    $scope.add = function(){
        customer.addItem('pvmodule',$scope.item);
        $uibModalInstance.close();
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

pvCustomer.controller('centralizedInverterCtrl',function($scope){

});
pvCustomer.controller('groupInverterCtrl',function($scope){

});
pvCustomer.controller('dcCombinerCtrl',function($scope){

});
pvCustomer.controller('dcDistributionCtrl',function($scope){

});
pvCustomer.controller('switchCtrl',function($scope){

});
pvCustomer.controller('transformerCtrl',function($scope){

});
pvCustomer.controller('dableCtrl',function($scope){

});

//路由
pvCustomer.config(function ($routeProvider) {
    $routeProvider.when('/pvmodule', {
        templateUrl: 'tpls/html/customer/pvmodule/pvmodule.html'
    }).when('/centralizedInverter', {
        templateUrl: 'tpls/html/customer/centralizedInverter/centralizedInverter.html'
    }).when('/groupInverter', {
        templateUrl: 'tpls/html/customer/groupInverter/groupInverter.html'
    }).when('/dcCombiner', {
        templateUrl: 'tpls/html/customer/dcCombiner/dcCombiner.html'
    }).when('/dcDistribution', {
        templateUrl: 'tpls/html/customer/dcDistribution/dcDistribution.html'
    }).when('/cable', {
        templateUrl: 'tpls/html/customer/cable/cable.html'
    }).when('/switch', {
        templateUrl: 'tpls/html/customer/switch/switch.html'
    }).when('/transformer', {
        templateUrl: 'tpls/html/customer/transformer/transformer.html'
    });

    $routeProvider.otherwise({ redirectTo: '/pvmodule' });
});