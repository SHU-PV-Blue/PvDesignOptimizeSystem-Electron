
var customer = require('./common/customer/customerDevice');

var pvCustomer = angular.module('PVCustomer', ['ui.bootstrap', 'ngRoute'],function(){});

pvCustomer.controller('chooseDeviceCtrl',function($scope){
    
});

pvCustomer.controller('pvmoduleCtrl',function($scope,$uibModal){
    $scope.pvmodule = {

    };

    function openModal(item){
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'tpls/html/customer/pvmodule/operate.html',
            controller: 'pvmoduleOperateCtrl',
            size: 'lg',
            backdrop: false,
            resolve: {
                item : function () {
                    return item;
                }
            }
        });
    }

    $scope.items = customer.getItems('pvmodule');

    $scope.flush = function(){
        $scope.items = customer.getItems('pvmodule');
    }

    $scope.addItem = function(){
        openModal({
            index : 0,
            item : $scope.pvmodule
        });
    }

    $scope.editItem = function(index){
        openModal(customer.getItem('pvmodule',index));
    }

    $scope.deleteItem = function(index){
        customer.deleteItem('pvmodule',index);
    }
    
    $scope.viewItem = function(index){
        openModal(customer.getItem('pvmodule',index));
    }
});

pvCustomer.controller('pvmoduleOperateCtrl',function($scope, $uibModalInstance, item){

    $scope.item = item.item;

    $scope.ok = function () {
        $uibModalInstance.close({
            
        });
    };

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
    $routeProvider.when('/', {
        templateUrl: 'tpls/html/customer/pvmodule/pvmodule.html'
    });

    $routeProvider.otherwise({ redirectTo: '/' });
});