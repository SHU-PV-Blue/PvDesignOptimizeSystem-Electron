var _ = require('lodash');
var remote = require('electron').remote;
var dialog = remote.dialog;
var UserDao = require('./common/sqlite/db').UserDao;

var pvUser = angular.module('PVUser', ['ui.bootstrap', 'ngRoute'], function () { });

pvUser.controller('loginCtrl', function ($scope, $location) {
    $scope.username = "";
    $scope.password = "";

    $scope.login = function () {
        if ($scope.username == "" || $scope.password == "") {
            $scope.errorInfo = "用户名或密码不能为空!";
            return;
        }
        UserDao.getUser($scope.username, function (err, user) {
            $scope.$apply(function () {
                if (err || !user) {
                    $scope.errorInfo = "用户名或密码错误";
                    return;
                }
                if (user.password == $scope.password) {
                    if (user.role == 0) {
                        $location.path('/admin');
                    } else {
                        remote.getCurrentWindow().loadURL('file://' + __dirname + '/index.html');
                    }
                } else {
                    $scope.errorInfo = "用户名或密码错误";
                }
            });
        });
    };

    $scope.errorInfo = "";
});

pvUser.controller('adminCtrl', function ($scope, $location) {
    $scope.users = [];
    $scope.user = {
        username : "",
        password: "",
        role: 1
    };

    $scope.errorInfo = "";

    $scope.addUser = function(){
        if($scope.user.username == "" || $scope.user.password == ""){
            $scope.errorInfo = "用户名或密码不能为空"
        }else if($scope.user.username.indexOf(" ") != -1 || $scope.user.password.indexOf(" ") != -1){
            $scope.errorInfo = "用户名或密码不能包含空格"
        }else{
            $scope.errorInfo = "";
            UserDao.addUser($scope.user,function(err){
                if(err){
                    $scope.$apply(function(){
                        $scope.errorInfo = "用户名已存在";
                    });
                    return console.log(err);
                }
                $scope.$apply(function(){
                    refresh();
                })
            });
        }
    };

    function refresh(){
        UserDao.getUsers(function(err, users){
            if(err){
                return console.log(err);
            }
            $scope.$apply(function(){
                $scope.users = users;
            });
        });
    }

    refresh();

    $scope.deleteUser = function(username){
        UserDao.deleteUser(username, function(err){
            if(err){
                return console.log(err);
            }
            alert("删除成功");
            refresh();
        });
    };

    $scope.backToLogin = function(){
        $location.path('/');
    }

});

//路由
pvUser.config(function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'tpls/html/user/login.html'
    }).when('/admin', {
        templateUrl: 'tpls/html/user/admin.html'
    });

    $routeProvider.otherwise({ redirectTo: '/' });
});