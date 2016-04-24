/**
 * Created by Administrator on 2016/4/24.
 */
var data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
        {
            fillColor: "#CCCCFF",
            strokeColor: "rgba(220,220,220,1)",
            label: "2010年",
            data: [65, 59, 90, 81, 56, 55, 40]
        },
        {
            fillColor: "#CCFFCC",
            strokeColor: "#CCFFCC",
            label:"2011年",
            data: [28, 48, 40, 19, 96, 27, 100]
        },
        {
            fillColor: "#FFFFCC",
            strokeColor: "#FFFFCC",
            label: "2012年",
            data: [13, 55, 40, 19, 23, 27, 64]
        },
        {
            fillColor: "#99FFFF",
            strokeColor: "#99FFFF",
            label: "2013年",
            data: [98, 11, 52, 19, 65, 20, 77]
        }
    ]
}
$(document).ready(function() {
    var ctx = $("#myChart").get(0).getContext("2d");
    var myNewChart = new Chart(ctx);
    myNewChart.Bar(data);
});

