
function initialiseDashboard(myData,divId,buttonDivId){
    myData = JSON.parse(JSON.stringify(myData))
    holidayMe.language = myData.language;
    console.log(holidayMe.language)
    holidayMe.arabicCountryDataset = myData.arabicCountries;


    if(holidayMe.language === "AR"){
        var newButtons = []
        myData.currentButtons.forEach(function(d){
            newButtons.push(myData.charts.find(f => f.name === d).arabicName);
        })
        myData.currentButtons = newButtons;
        myData.charts.forEach(function(d){
            if(d.name === "hotel sales"){
                d.data.forEach(function(s){
                 s[d.colorVarsArabic[0]] = s[d.colorVars[0]];
                 s[d.colorVarsArabic[1]] = s[d.colorVars[1]];
                })
                d.colorVars = d.colorVarsArabic;
                holidayMe.buttonVarsArabic = d.buttonVarsArabic;
            } else if (d.name === "transport"){
                holidayMe.arabicTransport = d.arabicTransport;
            } else if (d.name === "traffic"){
                holidayMe.arabicCountries = d.arabicCountries;
            }
            d.name = d.arabicName;
            d.title = d.arabicTitle;

        })
    }

    holidayMe.selectedButtons = myData.currentButtons;
    holidayMe.selectedButton = myData.currentButtons[0];
    holidayMe.currentChart = myData.charts[0].type;

    d3.select("#headerDiv").text(myData.charts.find(f => f.name === holidayMe.selectedButton).title);

    drawSvg(divId);
    drawSvg(buttonDivId);
    drawButtons(buttonDivId,holidayMe.selectedButtons,"chartButtons",120,30,0);
    activateButtons();

    drawCharts(divId,myData.map,myData.charts);

    function activateButtons(){

        d3.selectAll(".buttonRect")
            .on("mouseover",function(){d3.select(this).style("fill","#FFF2F3")})
            .on("mouseout",function(){d3.select(this).style("fill",getButtonFill)})
            .on("click",function(event,d){
                if(holidayMe.selectedButton === d){
                    //selected already
                } else {
                    holidayMe.selectedButton = d;
                    d3.select("#headerDiv").text(myData.charts.find(f => f.name === d).title)
                    d3.selectAll(".buttonRect").style("fill",getButtonFill);
                    d3.selectAll(".buttonText").style("fill",getButtonTextFill);
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
    } else if (currentChart.type === "network"){
        drawNetwork(divId,currentChart);
    } else if (currentChart.type === "area"){
        drawArea(divId,currentChart);
    } else if (currentChart.type === "bubble"){
        drawMapBubble(divId,mapData,currentChart);
    } else if (currentChart.type === "globe_double"){
        drawMapDoubleGlobe(divId,mapData,currentChart);
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
        .colorVar(currentChart.colorVar)
        .legendVar(currentChart.name)
        .myFormat(currentChart.format)
        .filterBy(currentChart.filterBy);

    my_chart(svg);
}


function drawMapBubble(divId,topoData,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = mapBubbles()
        .width(width)
        .height(height)
        .mapData(topoData)
        .myData(currentChart.data)
        .myClass(divId)
        .colorRange(currentChart.colorRange)
        .colorVar(currentChart.colorVar)
        .legendVar(currentChart.name)
        .myFormat(currentChart.format);

    my_chart(svg);
}

function drawMapDoubleGlobe(divId,topoData,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = mapDoubleGlobe()
        .width(width)
        .height(height)
        .mapData(topoData)
        .myData(currentChart.data)
        .myClass(divId)
        .colorRange(currentChart.colorRange)
        .colorVar(currentChart.colorVar)
        .legendVar(currentChart.name)
        .myFormat(currentChart.format);

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

function drawArea(divId,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = areaChart()
        .width(width)
        .height(height)
        .myData(currentChart.data)
        .myClass(divId)
        .myColor(currentChart.color)
        .myFormat(currentChart.format);

    my_chart(svg);
}

function drawNetwork(divId,currentChart){

    var svg = d3.select("." + divId + "_svg");
    var width = +svg.attr("width");
    var height = +svg.attr("height");

    var my_chart = networkChart()
        .width(width)
        .height(height)
        .myData(currentChart.data)
        .myClass(divId);

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


