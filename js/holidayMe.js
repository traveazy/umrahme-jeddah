var holidayMe = {
    "selectedButtons":"",
    "selectedButton":"",
    "timer":"",
    "rotationOn":true,
    "currentChart":""

}

function initialiseDashboard(myData,divId,buttonDivId){
    holidayMe.selectedButtons = myData.currentButtons;
    holidayMe.selectedButton = myData.currentButtons[0];
    holidayMe.currentChart = myData.charts[0].type;

    d3.select("#headerDiv").text(myData.charts.find(f => f.name === holidayMe.selectedButton).title);

    drawSvg(divId);
    drawSvg(buttonDivId);
    drawButtons(buttonDivId,holidayMe.selectedButtons,"chartButtons",90,25,0);
    activateButtons();

    drawCharts(divId,myData.map,myData.charts);

    function activateButtons(){

        d3.selectAll(".buttonRect")
            .on("click",function(event,d){
                if(holidayMe.selectedButton === d){
                    //selected already
                } else {
                    holidayMe.selectedButton = d;
                    d3.select("#headerDiv").text(myData.charts.find(f => f.name === d).title)
                    d3.selectAll(".buttonRect").attr("opacity",getButtonOpacity);
                    drawCharts(divId,myData.map,myData.charts);
                }
            })

    }

}
function drawButtons(divId,buttonGroup, buttonClass,buttonWidth,buttonHeight,buttonY){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");

    var myChart = buttonChart()
        .myData(buttonGroup)
        .myClass(buttonClass)
        .width(width)
        .startY(buttonY)
        .buttonWidth(buttonWidth)
        .buttonHeight(buttonHeight);

    myChart(svg);
}

function drawCharts(divId,mapData,chartData){

    if(holidayMe.timer !== ""){
        holidayMe.timer.stop();
    }
    const currentChart = chartData.find(f => f.name === holidayMe.selectedButton);
    if(holidayMe.currentChart !== currentChart.type){
        d3.select("." + divId + "_svg").selectAll("*").remove();
        holidayMe.currentChart = currentChart.type;
    }
    if(currentChart.type === "globe"){
        drawGlobe(divId,mapData,currentChart);
    } else if (currentChart.type === "pyramid"){
        drawPyramid(divId,currentChart);
    } else if (currentChart.type === "map_bar"){
        drawMapBar(divId,mapData,currentChart);
    } else if (currentChart.type === "bar"){
        drawBar(divId,currentChart);
    }
}

function drawMapBar(divId,topoData,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = mapBarChart()
        .width(width)
        .height(height)
        .mapData(topoData)
        .myData(currentChart.data)
        .myClass(divId)
        .colorRange(currentChart.colorRange)
        .colorVar(currentChart.colorVar)
        .legendVar(currentChart.name)
        .myFormat(currentChart.format)
        .filterBy(currentChart.filterBy);

    my_chart(svg);
}


function drawBar(divId,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = barChart()
        .width(width)
        .height(height)
        .myData(currentChart.data)
        .myClass(divId)
        .myColor(currentChart.color)
        .legendVar(currentChart.name)
        .myFormat(currentChart.format)
        .filterBy(currentChart.filterBy);

    my_chart(svg);
}

function drawGlobe(divId,topoData,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = globeMap()
        .width(width)
        .height(height)
        .mapData(topoData)
        .myData(currentChart.data)
        .myClass(divId)
        .colorRange(currentChart.colorRange)
        .colorVar(currentChart.colorVar)
        .legendVar(currentChart.name)
        .myFormat(currentChart.format)
        .filterBy(currentChart.filterBy);

    my_chart(svg);
}


function drawPyramid(divId,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = pyramidChart()
        .width(width)
        .height(height)
        .myData(currentChart.data)
        .myClass(divId)
        .colorRange(currentChart.colorRange)
        .colorVars(currentChart.colorVars)
        .binVar(currentChart.binVar)
        .myFormat(currentChart.format)
        .filterBy(currentChart.filterBy)
        .filterBy2(currentChart.filterBy2);

    my_chart(svg);
}

function drawSvg(divId){

    var chartDiv = document.getElementById(divId);
    var width = chartDiv.clientWidth;
    var height = chartDiv.clientHeight;
    if(d3.select("." + divId + "_svg")._groups[0][0] === null){
        var svg = d3.select("#" + divId)
            .append("svg")
            .attr("class",divId + "_svg")
            .attr("width",width)
            .attr("height",height);

    } else {
        var svg = d3.select("." + divId + "_svg");
    }
    return svg;
}


