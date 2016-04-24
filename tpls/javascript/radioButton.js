/**
 * Created by Administrator on 2016/4/24.
 */
$(document).ready(function() {
   //调用bootstrap自己的方法
    $("#user-give-area").on('ifChecked', function(){
        $("#give-area-component").css("display","block");
            $("#user-defined").css("display","none");
    });
    $("#user-define").on('ifChecked', function(){
        $("#user-defined").css("display","block");
        $("#give-area-component").css("display","none");
    });
    $('.iCheck').iCheck({
        checkboxClass: 'icheckbox_flat-blue',
        radioClass: 'iradio_flat-blue'
    });

});