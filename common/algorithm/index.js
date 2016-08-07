var CONST = require('../util').CONST;

/**
 * 计算倾斜面上日均辐照度
 * @param  {number} month --月份
 * @param  {number} H --该月日均辐照度
 * @param  {number} lat --纬度
 * @param  {number} dip --倾角
 * @param  {number} az --方位角
 * @return {number} --倾斜面上日均辐照度
 */
function getH_t(month,H,lat,dip,az){
	var n = [15, 45, 74, 105, 135, 166, 197, 227, 258, 289, 319, 349];
	//var lat, dip, az;     //纬度，倾角，方位角

	function toRadian(degree){
		return degree * 0.017453293;
	};

	function getDeclination(month){        //计算太阳赤纬角
		return 23.45*sin(360*(284 + n[month-1]) /365);
	};

	var sin = function(degree){
		return Math.sin(toRadian(degree));
	};

	var cos = function(degree){
		return Math.cos(toRadian(degree));
	};
	var tan = function(degree){
		return Math.tan(toRadian(degree));
	};

	var sin_lat = sin(lat);
	var cos_lat = cos(lat);
	var tan_lat = tan(lat);

	var sin_dip = sin(dip);
	var cos_dip = cos(dip);
	var tan_dip = tan(dip);

	var sin_az = sin(az);
	var cos_az = cos(az);
	var tan_az = tan(az);

	var sin_dec = sin(getDeclination(month));
	var cos_dec = cos(getDeclination(month));
	var tan_dec = tan(getDeclination(month));

	var a = (sin_lat * cos_dip - sin_dip*cos_lat*cos_az) * sin_dec;
	var b = (cos_lat * cos_dip + sin_dip*sin_lat*cos_az) * cos_dec;
	var c = cos_dec * sin_dip * sin_az;
	var D = Math.sqrt(c*c + b*b);

	var w_s = Math.acos(-tan_lat * tan_dec);
	var w_ss = Math.min(w_s, ( Math.acos(-a/D) + Math.asin(c/D)));
	var w_sr = -Math.min(w_s, Math.abs( Math.acos(-a/D) + Math.asin(c/D) ));


	var Gsc = 1367;

	var H_0 = 24*3600*Gsc*(1 + 0.033*cos(360*n[month-1]/365))*(cos_lat*cos_dec*Math.sin(w_s) + w_s*sin_lat*sin_dec)/Math.PI;
	H_0 = H_0/(3.6*Math.pow(10,3));
	var Kt = H/H_0;    //大写的K

	function getH_d(){
		if(Kt < 0.22){
			return H*(1.00 - 1.13*Kt);
		}else if(Kt > 0.8){
			return H*(1.390-4.027*Kt+5.532*Kt*Kt-3.108*Kt*Kt*Kt);
		}else{
			if(w_s*180/Math.PI <= 81.4){
				return H*(1.391-3.56*Kt+4.189*Kt*Kt-2.137*Kt*Kt*Kt);
			}else{
				return H*(1.311-3.022*Kt+3.427*Kt*Kt-1.821*Kt*Kt*Kt);
			}
		}
	};
	// if(w_s*180/Math.PI < 81.4){
		// 	if(Kt < 0.715){
		// 		return H*(1.0-0.2727*Kt + 2.4495*Kt*Kt - 11.9514*Kt*Kt*Kt + 9.3879*Kt*Kt*Kt*Kt);
		// 	}else{
		// 		return H*0.143;
		// 	}
		// }else{
		// 	if(Kt < 0.722){
		// 		return H*(1.0 + 0.2832*Kt - 2.5557*Kt*Kt + 0.8448*Kt*Kt*Kt);
		// 	}else{
		// 		return H*0.175;
		// 	}
		// }
	var H_d = getH_d();
	var H_b = H - H_d;

	var R_b = ((cos_lat*cos_dip + sin_dip*sin_lat*cos_az)*cos_dec*(Math.sin(w_ss) - Math.sin(w_sr)) +
		(w_ss - w_sr)*(sin_lat*cos_dip - sin_dip*cos_lat*cos_az)*sin_dec +
		(Math.cos(w_ss) - Math.cos(w_sr))*cos_dec*sin_dip*sin_az) / (2*(cos_lat*cos_dec*Math.sin(w_s) + (w_s*sin_lat*sin_dec)));

	var H_t = H_b*R_b + H_d*( R_b*H_b/H_0 + 1/2*(1-H_b/H_0)*(1 + cos_dip)) + 1/2*0.2*H*(1 - cos_dip);
	return H_t / 1000;
}

/**
 * 获取az方位角时各倾角的年总辐照度、组件年输出电量折线图数据
 * @param  {number[]} H --月日均辐照度
 * @param  {number} lat --纬度
 * @param  {number} az --方位角
 * @param  {number} com_e --组件的转换效率
 * @param  {number} com_len --组件的长度(mm)
 * @param  {number} com_wid --组件的宽度(mm)
 * @param  {number} T --月平均温度
 * @param  {number} d --组件最大功率温度系数
 */
function getChartData(H,lat,az,com_e,com_len,com_wid,T,d){
	var monthDays = CONST.monthDays;
	var sums = [],sums_g=[];
    var sum,max = 0,sum_g,res = 0, S,S_d,T_d,H_t,e, g,max_H = 0,res1;
	for(var i = 0; i <=90; i++){
		sum = 0;
        sum_g = 0;
		for(var j = 1; j<=12; j++){
			H_t =  getH_t(j,H[j-1]*1000,lat,i,az);
            S = H_t * 100;
            S_d = H_t / 10 - 1;
            T_d = T[j-1] + 0.03*S -25;
            e = com_e /100 *(1 + d*T_d)*Math.log(Math.E + 0.094*S_d);
            g = e*H_t*(com_len*com_wid/1000000) * monthDays[j-1];
            sum_g += g;
            sum += H_t * monthDays[j-1];   
		}

		if(max < sum_g){
			max = sum_g;
			res = i;
		}
        if(max_H < sum){
            max_H = sum;
            res1 = i;
        }
		sums.push(sum.toFixed(3));
		sums_g.push((sum_g).toFixed(3));
	}

	return {
        sums_g : sums_g,   //组件年输出电量
		sums : sums,       //组件年总辐照度
		best : res,        //年输出电量最优倾角
        bestH :res1,       //年总辐照度最优倾角
		max : max,         //年输出电量最大值
		max_H: max_H       //年总辐照度最大值
	};
};

/**
 * 获取特定倾角和方位角下的月总辐照度、月总组件输出电量折线图数据
 * @param  {number[]} H --月日均辐照度
 * @param  {number} lat --纬度
 * @param  {number} az --方位角
 * @param  {number} com_e --组件的转换效率
 * @param  {number} com_len --组件的长度(mm)
 * @param  {number} com_wid --组件的宽度(mm)
 * @param  {number} T --月平均温度
 * @param  {number} d --组件最大功率温度系数
 * @param  {number} dip --倾角
 */
function getDataByDip(H,lat,az,com_e,com_len,com_wid,T,d,dip){
	var monthDays = CONST.monthDays;
    var S,S_d,T_d,H_t,e, g;
    var H_ts = [],gs = [];

    for(var j = 1; j<=12; j++){
        H_t =  getH_t(j,H[j-1]*1000,lat,dip,az);
        S = H_t * 100;
        S_d = H_t / 10 - 1;
        T_d = T[j-1] + 0.03*S -25;
        e = com_e /100 *(1 + d*T_d)*Math.log(Math.E + 0.094*S_d);
        //console.log(e)
        g = e*H_t*(com_len*com_wid/1000000) *monthDays[j-1];
        H_ts.push(H_t * monthDays[j-1]);
        gs.push(g);
    }

    return {
        H_ts : H_ts,
        gs : gs
    }
}

exports.getH_t = getH_t;
exports.getChartData = getChartData;
exports.getDataByDip = getDataByDip;

