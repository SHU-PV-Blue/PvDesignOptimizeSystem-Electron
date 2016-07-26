
var customer = require('./common/customer/customerDevice');
var _ = require('lodash');
var dialog = require('electron').remote.dialog;

var pvCustomer = angular.module('PVCustomer', ['ui.bootstrap', 'ngRoute'],function(){});

pvCustomer.controller('chooseDeviceCtrl',function($scope,$location){
    $scope.switchDevice = function(deviceName){
        $location.path('/' + deviceName);
    }
});
//////////////////////////////// pvmodule 光伏组件

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

    $scope.items = customer.getItems('pvmodule');

    $scope.flush = function(){
        $scope.items = customer.getItems('pvmodule');
    }

    function openModal(item, type){
        var modalInstance = $uibModal.open({
            animation: false,
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

    $scope.item = {};
    _.assign($scope.item,item.item);
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

/////////////////////////////// centralizedInverter  集中式逆变器

pvCustomer.controller('centralizedInverterCtrl',function($scope, $uibModal){
    $scope.centralizedInverter = {
        "厂家":"",
        "型号":"",
        "最大直流输入功率":"",
        "最大输入电压":"",
        "启动电压":"",
        "MPP电压下限":"",
        "MPP电压上限":"",
        "最大直流输入电流":"",
        "额定交流输出功率":"",
        "最大输出功率":"",
        "最大交流输出电流":"",
        "额定电网电压":"",
        "最大效率":""
    };

    $scope.items = customer.getItems('centralizedInverter');

    $scope.flush = function(){
        $scope.items = customer.getItems('centralizedInverter');
    }

    function openModal(item, type){
        var modalInstance = $uibModal.open({
            animation: false,
            templateUrl: 'tpls/html/customer/centralizedInverter/operate.html',
            controller: 'centralizedInverterOperateCtrl',
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

    $scope.addItem = function(){
        openModal({
            index : -1,
            item : $scope.centralizedInverter
        },'add');
    }

    $scope.editItem = function(index){
        openModal(customer.getItem('centralizedInverter',index),'edit');
    }

    $scope.deleteItem = function(index){
        dialog.showMessageBox(null,{
            type : 'info',
            message : '确认删除？',
            title : 'pv',
            buttons : ['确定','取消']
        },function(response){
            if(response === 0){
                customer.deleteItem('centralizedInverter',index);
                $scope.flush();
                $scope.$digest();
            }
        });
    }
    
    $scope.viewItem = function(index){
        openModal(customer.getItem('centralizedInverter',index),'view');
    }
});

pvCustomer.controller('centralizedInverterOperateCtrl',function($scope, $uibModalInstance, item, type){

    $scope.item = {};
    _.assign($scope.item,item.item);
    $scope.disable = type === 'view';
    $scope.isEdit = type === 'edit';
    $scope.isAdd = type === 'add';

    $scope.save = function () {
        customer.saveItem('centralizedInverter', item.index, $scope.item);
        $uibModalInstance.close();
    };

    $scope.add = function(){
        customer.addItem('centralizedInverter',$scope.item);
        $uibModalInstance.close();
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

////////////////////////////// groupInverter  组串式逆变器

pvCustomer.controller('groupInverterCtrl',function($scope, $uibModal){
    $scope.groupInverter = {
        "厂家":"",
        "型号":"",
        "最大输入功率":"",
        "最大输入电压":"",
        "启动电压":"",
        "额定输入电压":"",
        "MPP电压下限":"",
        "MPP电压上限":"",
        "MPPT数量":"",
        "最大输入电流":"",
        "输入端子最大允许电流":"",
        "额定输出功率":"",
        "最大输出功率":"",
        "最大输出电流":"",
        "最大效率":""
    };

    $scope.items = customer.getItems('groupInverter');

    $scope.flush = function(){
        $scope.items = customer.getItems('groupInverter');
    }

    function openModal(item, type){
        var modalInstance = $uibModal.open({
            animation: false,
            templateUrl: 'tpls/html/customer/groupInverter/operate.html',
            controller: 'groupInverterOperateCtrl',
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

    $scope.addItem = function(){
        openModal({
            index : -1,
            item : $scope.groupInverter
        },'add');
    }

    $scope.editItem = function(index){
        openModal(customer.getItem('groupInverter',index),'edit');
    }

    $scope.deleteItem = function(index){
        dialog.showMessageBox(null,{
            type : 'info',
            message : '确认删除？',
            title : 'pv',
            buttons : ['确定','取消']
        },function(response){
            if(response === 0){
                customer.deleteItem('groupInverter',index);
                $scope.flush();
                $scope.$digest();
            }
        });
    }
    
    $scope.viewItem = function(index){
        openModal(customer.getItem('groupInverter',index),'view');
    }
});

pvCustomer.controller('groupInverterOperateCtrl',function($scope, $uibModalInstance, item, type){

    $scope.item = {};
    _.assign($scope.item,item.item);
    $scope.disable = type === 'view';
    $scope.isEdit = type === 'edit';
    $scope.isAdd = type === 'add';

    $scope.save = function () {
        customer.saveItem('groupInverter', item.index, $scope.item);
        $uibModalInstance.close();
    };

    $scope.add = function(){
        customer.addItem('groupInverter',$scope.item);
        $uibModalInstance.close();
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

///////////////////////////// dcCombiner  直流汇流箱

pvCustomer.controller('dcCombinerCtrl',function($scope, $uibModal){
    $scope.dcCombiner = {
        "厂家":"",
        "型号":"",
        "输入路数":"",
        "输入电流上限":"",
        "直流断路器":"",
        "防雷失效监控":"Y",
        "监控单元":"Y",
        "辅助电源":"Y",
        "价格下限":"",
        "价格上限":""
    };

    $scope.items = customer.getItems('dcCombiner');

    $scope.flush = function(){
        $scope.items = customer.getItems('dcCombiner');
    }

    function openModal(item, type){
        var modalInstance = $uibModal.open({
            animation: false,
            templateUrl: 'tpls/html/customer/dcCombiner/operate.html',
            controller: 'dcCombinerOperateCtrl',
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

    $scope.addItem = function(){
        openModal({
            index : -1,
            item : $scope.dcCombiner
        },'add');
    }

    $scope.editItem = function(index){
        openModal(customer.getItem('dcCombiner',index),'edit');
    }

    $scope.deleteItem = function(index){
        dialog.showMessageBox(null,{
            type : 'info',
            message : '确认删除？',
            title : 'pv',
            buttons : ['确定','取消']
        },function(response){
            if(response === 0){
                customer.deleteItem('dcCombiner',index);
                $scope.flush();
                $scope.$digest();
            }
        });
    }
    
    $scope.viewItem = function(index){
        openModal(customer.getItem('dcCombiner',index),'view');
    }
});

pvCustomer.controller('dcCombinerOperateCtrl',function($scope, $uibModalInstance, item, type){

    $scope.item = {};
    _.assign($scope.item,item.item);
    $scope.disable = type === 'view';
    $scope.isEdit = type === 'edit';
    $scope.isAdd = type === 'add';

    $scope.save = function () {
        customer.saveItem('dcCombiner', item.index, $scope.item);
        $uibModalInstance.close();
    };

    $scope.add = function(){
        customer.addItem('dcCombiner',$scope.item);
        $uibModalInstance.close();
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

//////////////////////////// dcDistribution  直流配电柜

pvCustomer.controller('dcDistributionCtrl',function($scope, $uibModal){
     $scope.dcDistribution = {
        "公司":"",
        "型号":"",
        "接入直流路数":"",
        "输入直流功率上限":"",
        "输入输出总电流上限":"",
        "接入开路电压上限":""
    };

    $scope.items = customer.getItems('dcDistribution');

    $scope.flush = function(){
        $scope.items = customer.getItems('dcDistribution');
    }

    function openModal(item, type){
        var modalInstance = $uibModal.open({
            animation: false,
            templateUrl: 'tpls/html/customer/dcDistribution/operate.html',
            controller: 'dcDistributionOperateCtrl',
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

    $scope.addItem = function(){
        openModal({
            index : -1,
            item : $scope.dcDistribution
        },'add');
    }

    $scope.editItem = function(index){
        openModal(customer.getItem('dcDistribution',index),'edit');
    }

    $scope.deleteItem = function(index){
        dialog.showMessageBox(null,{
            type : 'info',
            message : '确认删除？',
            title : 'pv',
            buttons : ['确定','取消']
        },function(response){
            if(response === 0){
                customer.deleteItem('dcDistribution',index);
                $scope.flush();
                $scope.$digest();
            }
        });
    }
    
    $scope.viewItem = function(index){
        openModal(customer.getItem('dcDistribution',index),'view');
    }
});

pvCustomer.controller('dcDistributionOperateCtrl',function($scope, $uibModalInstance, item, type){

    $scope.item = {};
    _.assign($scope.item,item.item);
    $scope.disable = type === 'view';
    $scope.isEdit = type === 'edit';
    $scope.isAdd = type === 'add';

    $scope.save = function () {
        customer.saveItem('dcDistribution', item.index, $scope.item);
        $uibModalInstance.close();
    };

    $scope.add = function(){
        customer.addItem('dcDistribution',$scope.item);
        $uibModalInstance.close();
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

//////////////////////////// switch  开关柜
pvCustomer.controller('switchCtrl',function($scope){

});
///////////////////////////  transformer  变压器
pvCustomer.controller('transformerCtrl',function($scope){

});
//////////////////////////   cable  电缆
pvCustomer.controller('cableCtrl',function($scope){

});

//////路由
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