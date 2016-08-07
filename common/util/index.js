module.exports = {
    CONST : {
        monthDays : [31, 28, 31, 30, 31, 30, 31, 31 ,30, 31, 30, 31]
    },
    getLabel : function(max){
        var label = [],i;
        for(i = 1; i <= max; i++){
            label.push(i);
        }
        return label;
    },
    getDipLabel : function(){
        var label = [],i;
        for(i = 0; i<= 90; i++){
            label.push((i % 5 === 0 ? i + '' : ''));
        }
        return label;
    }
};

