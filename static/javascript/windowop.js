$(document).ready(function(){

    var remote = require('electron').remote;
    var win = remote.getCurrentWindow();

    $('.maximum').click(function(){
        if(win.isMaximized()){
            win.unmaximize();
        }else{
            win.maximize();
        }
    });

    $('.minimum').click(function(){
        win.minimize();
    });

    $('.closebtn').click(function(){
        win.close();
    });
});