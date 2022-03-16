function globeMap() {
    //REUSABLE globe map

    var width=0,
        height=0,
        mapData = {},
        myData = [],
        colorRange = [],
        colorVar = "",
        legendVar = "",
        filterBy = "",
        myFormat = "",
        myClass="",
        colorExtent=[],
        colorScale = "";


    function my(svg) {

        // vars for timer
        var tNew, dt, steps, pos, tOld, oldPos;
        tOld = 0;
        oldPos = 0;


        const numberFormat = d3.format(myFormat);
        //https://observablehq.com/@sarah37/spinning-globe

        let filterSet = [];
        let filteredData = JSON.parse(JSON.stringify(myData));

        if(filterBy !== ""){
            filterSet = new Set();
            myData.forEach(f => filterSet.add(f[filterBy]));
            filterSet = Array.from(filterSet);
            filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === filterSet[0]);
        }

        const scl = Math.min(width, (height-90))/2.5; // scale globe
        const tRotation = 10000; //30s per rotation

        // map projection
       const geoProjection = d3.geoOrthographic()
            .scale(scl)
            .translate([ width/2, (height-90)/2 ]);

        const scale = d3.interpolate(scl, (width - 2) / (2 * Math.PI));
        const rotate = d3.interpolate([10, -20], [0, 0]);
        let projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
            .scale(scale(0))
            .translate([width / 2, (height-90) / 2])
            .rotate(rotate(0))
            .precision(0.1)

        //non data elements
        if(d3.select(".backgroundCircle" + myClass)._groups[0][0] === null) {
            svg.append("rect").attr("class","clickableGlobeItem backgroundCircle" + myClass);
            svg.append("rect").attr("class","legendRect" + myClass);
            svg.append("text").attr("class","legendTitle legendTitle" + myClass);
            svg.append("text").attr("class","legendNumber legendStart" + myClass);
            svg.append("text").attr("class","legendNumber legendEnd" + myClass);
            svg.append("defs").append("linearGradient").attr("id", "legend-gradient");
        }

        d3.select(".backgroundCircle" + myClass)
            .style("fill","#F1F7FF")
            .attr("x", (width/2) - geoProjection.scale())
            .attr("y", ((height-90)/2) - geoProjection.scale())
            .attr("width", geoProjection.scale()*2)
            .attr("height", geoProjection.scale()*2)
            .attr("rx", geoProjection.scale())
            .attr("ry", geoProjection.scale());

        drawGlobeChart();
        drawFilterButtons(filterSet);

        let t = 0;


        function drawGlobeChart(){

            colorExtent = d3.extent(filteredData, d => +d[colorVar]);
            colorScale = d3.scaleLinear().domain(colorExtent).range(colorRange);

            drawLegend();
            // path generator
            const path = d3.geoPath().projection(geoProjection);

            // start timer
            holidayMe.rotationOn = true;
            holidayMe.timer = d3.timer(rotateTimer);


            //bars group
            const pathGroup = svg.selectAll(".pathGroup" + myClass)
                .data(topojson.feature(mapData,mapData.objects.countries).features, d => d.properties.name)
                .join(function(group){
                    var enter = group.append("g").attr("class","pathGroup" + myClass);
                    enter.append("path").attr("class","clickableGlobeItem mapPath");
                    return enter;
                });

            pathGroup.select(".mapPath")
                .attr("id",d => d.properties.name)
                .style("fill", d => filteredData.find(f => f.Country === d.properties.name) === undefined ? "white":colorScale(+filteredData.find(f => f.Country === d.properties.name)[colorVar]))
                .style("stroke", "#ccc")
                .style("stroke-width", "0.3px")
                .attr("d", path)
                .on("mousemove",function(event,d){
                    var tooltipText = "<strong># OF " + legendVar.toUpperCase() + "</strong><br>";
                    if(filteredData.find(f => f.Country === d.properties.name) === undefined){
                        if(filteredData.find(f => f.Country === "Rest of the World") !== undefined){
                            tooltipText += "Rest of World: " + numberFormat(filteredData.find(f => f.Country === "Rest of the World")[colorVar]) + "<br>";
                        }
                    } else {
                        tooltipText += d.properties.name + ": " + numberFormat(filteredData.find(f => f.Country === d.properties.name)[colorVar]) + "<br>";

                    }
                    tooltipText += "<span id='grey'><i>(Total: " + numberFormat(d3.sum(filteredData, d => +d[colorVar])) + ")</i></span>";
                    d3.select("#tooltip")
                        .style("visibility","visible")
                        .style("top",event.pageY + "px")
                        .style("left",(event.pageX + 10) + "px")
                        .html(tooltipText);
                })
                .on("mouseout",function(event,d){
                    d3.select("#tooltip").style("visibility","hidden");
                })

                d3.selectAll(".clickableGlobeItem")
                  .on("click",function(){
                    if(holidayMe.rotationOn === true){
                        d3.selectAll(".clickableGlobeItem").style("cursor","default");
                        t = 0;
                        holidayMe.timer.stop();
                        holidayMe.timer = d3.timer(changeProjectionTimer);
                        holidayMe.rotationOn = false;
                        d3.select(".backgroundCircle" + myClass)
                            .transition()
                            .duration(1000)
                            .attr("x",0)
                            .attr("y", 0)
                            .attr("width", width)
                            .attr("height",height-90)
                            .attr("rx", 0)
                            .attr("ry", 0);
                    }
                });


            // function that rotates the earth
            function rotateTimer(now) {
                if (holidayMe.rotationOn) {
                    tNew = now;
                    dt = tOld - tNew;
                    steps = dt * 360 / tRotation;

                    pos = oldPos - steps //the earth rotates towards the east

                    if (pos <= -180) {pos = pos+360}

                    geoProjection.rotate([pos, 0]);
                    svg.selectAll(".mapPath").attr("d", path);

                    tOld = tNew;
                    oldPos = pos;
                }
                else {
                    tOld = now;
                }
            }

            function changeProjectionTimer(){
                projection.alpha(t).rotate(rotate(t)).scale(scale(t));
                d3.selectAll(".mapPath").attr("d", d3.geoPath().projection(projection));
                t += 0.1;
                if(t >= 1){
                    holidayMe.timer.stop();
                }
            }

        }


        function drawFilterButtons(filterSet){
            //button group
            const filterButtonGroup = svg.selectAll(".filterButtonGroup" + myClass)
                .data(filterSet)
                .join(function(group){
                    var enter = group.append("g").attr("class","filterButtonGroup" + myClass);
                    enter.append("rect").attr("class","filterButtonRect filterButtonRect");
                    enter.append("text").attr("class","filterButtonText");
                    return enter;
                });

            filterButtonGroup.select(".filterButtonRect")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("id",d => d)
                .attr("width",60)
                .attr("height",15)
                .attr("x",(d,i) => 10 + ((60+5) * i))
                .attr("y",10)
                .attr("rx",5)
                .attr("ry",5)
                .on("click",function(event,d){
                    var myIndex = filterSet.findIndex(f => f === d);
                    d3.selectAll(".filterButtonRect").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    d3.selectAll(".filterButtonText").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === d);
                    drawGlobeChart();
                    drawLegend();
                });

            filterButtonGroup.select(".filterButtonText")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("text-anchor","middle")
                .attr("height",15)
                .attr("x",(d,i) => 10 + (60/2) + ((60+5) * i))
                .attr("y",10 + (15/2) + 3.5)
                .attr("rx",5)
                .attr("ry",5)
                .text(d => d);
        }

        function drawLegend(){

            var legendFormat = d3.format(myFormat === "," ? ",.2r" : myFormat);

            d3.select(".legendTitle" + myClass)
                .attr("x",10)
                .attr("y",height - 40)
                .text(legendVar);

            d3.select(".legendStart" + myClass)
                .attr("x",10)
                .attr("y",height - 8)
                .text(legendFormat(colorExtent[0]));

            d3.select(".legendEnd" + myClass)
                .attr("text-anchor","end")
                .attr("x",10 + 150)
                .attr("y",height - 8)
                .text(legendFormat(colorExtent[1]));

            d3.select(".legendTitle" + myClass)
                .attr("x",10)
                .attr("y",height - 40)
                .text(legendVar);

            d3.select("#legend-gradient")
                .selectAll("stop")
                .data(colorRange)
                .join("stop")
                .attr("offset",(d,i) => i === 0 ? "0%" : "100%")
                .attr("stop-color", d => d);

            d3.select(".legendRect" + myClass)
                .attr("fill", "url(#legend-gradient)")
                .attr("x",10)
                .attr("y",height - 35)
                .attr("width",150)
                .attr("height",15);


        }

        function interpolateProjection(raw0, raw1) {
            const mutate = d3.geoProjectionMutator(t => (x, y) => {
                const [x0, y0] = raw0(x, y), [x1, y1] = raw1(x, y);
                return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
            });
            let t = 0;
            return Object.assign(mutate(t), {
                alpha(_) {
                    return arguments.length ? mutate(t = +_) : t;
                }
            });
        }

    }


    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return my;
    };

    my.mapData = function(value) {
        if (!arguments.length) return mapData;
        mapData = value;
        return my;
    };

    my.myData = function(value) {
        if (!arguments.length) return myData;
        myData = value;
        return my;
    };

    my.myClass = function(value) {
        if (!arguments.length) return myClass;
        myClass = value;
        return my;
    };

    my.colorRange = function(value) {
        if (!arguments.length) return colorRange;
        colorRange = value;
        return my;
    };

    my.colorVar = function(value) {
        if (!arguments.length) return colorVar;
        colorVar = value;
        return my;
    };

    my.legendVar = function(value) {
        if (!arguments.length) return legendVar;
        legendVar = value;
        return my;
    };

    my.filterBy = function(value) {
        if (!arguments.length) return filterBy;
        filterBy = value;
        return my;
    };

    my.myFormat = function(value) {
        if (!arguments.length) return myFormat;
        myFormat = value;
        return my;
    };

    return my;
}

function mapBarChart() {
    //REUSABLE globe map

    var width=0,
        height=0,
        mapData = {},
        myData = [],
        colorRange = [],
        colorVar = "",
        legendVar = "",
        filterBy = "",
        myFormat = "",
        myClass="",
        colorExtent=[],
        colorScale = "";


    function my(svg) {


        const numberFormat = d3.format(myFormat);

        let filterSet = [];
        let filteredData = JSON.parse(JSON.stringify(myData));

        if(filterBy !== ""){
            filterSet = new Set();
            myData.forEach(f => filterSet.add(f[filterBy]));
            filterSet = Array.from(filterSet);
            filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === filterSet[0]);
        }

        const mapWidth = width/1.5;
        const mapHeight = mapWidth/1.7;
        const scl = Math.min(mapWidth, mapHeight)/4; // scale globe

        // map projection
        const projection = d3.geoMercator()
            .scale(scl)
            .translate([ mapWidth/2,(mapHeight*1.2)/2 ]);

        //non data elements
        if(d3.select(".backgroundCircle" + myClass)._groups[0][0] === null) {
            svg.append("clipPath").attr("class","clipPath" + myClass)
                .attr("id","mapClipPath")
                .append('rect').attr('class', 'clipRect' + myClass);
            svg.append("rect").attr("class","backgroundRect" + myClass);
            svg.append("rect").attr("class","legendRect" + myClass);
            svg.append("text").attr("class","legendTitle legendTitle" + myClass);
            svg.append("text").attr("class","legendNumber legendStart" + myClass);
            svg.append("text").attr("class","legendNumber legendEnd" + myClass);
            svg.append("text").attr("class","legendTitle topTitle" + myClass);
            svg.append("defs").append("linearGradient").attr("id", "legend-gradient");
        }

        d3.select(".topTitle" + myClass)
            .attr("x", 10 )
            .attr("y", ((height - 10 - mapHeight)/2) + 12)
            .text(legendVar);

        d3.select(".backgroundRect" + myClass)
            .style("fill","#F1F7FF")
            .attr("x", width - 10 - mapWidth)
            .attr("y", (height - 10 - mapHeight)/2)
            .attr("width", mapWidth)
            .attr("height", mapHeight);

        d3.select(".clipRect" + myClass)
            .attr("width", mapWidth)
            .attr("height", mapHeight);

        drawFilterButtons(filterSet);
        drawMapBar();

        function drawMapBar(){

            filteredData = filteredData.sort((a,b) => d3.descending(+a[colorVar],+b[colorVar]));
            colorExtent = d3.extent(filteredData, d => +d[colorVar]);
            colorScale = d3.scaleLinear().domain(colorExtent).range(colorRange);

            // path generator
            const path = d3.geoPath().projection(projection);

            //bars group
            const pathGroup = svg.selectAll(".mapPathGroup" + myClass)
                .data(topojson.feature(mapData,mapData.objects.countries).features, d => d.properties.name)
                .join(function(group){
                    var enter = group.append("g").attr("class","mapPathGroup" + myClass);
                    enter.append("path").attr("class","mapPath");
                    return enter;
                });

            pathGroup
                .attr("transform", "translate(" + (width - 10 - mapWidth) + ","
                    + ((height - 10 - mapHeight)/2) + ")");

            pathGroup.select(".mapPath")
                .attr('clip-path', 'url(#mapClipPath)')
                .attr("id",d => d.properties.name.toLowerCase())
                .style("fill", d => filteredData.find(f => f.Country === d.properties.name) === undefined ? "white":colorScale(+filteredData.find(f => f.Country === d.properties.name)[colorVar]))
                .style("stroke", "#ccc")
                .style("stroke-width", "0.3px")
                .attr("d", path)
                .on("mousemove",function(event,d){
                    var tooltipText = "";
                    if(filteredData.find(f => f.Country === d.properties.name) === undefined){

                        tooltipText += "REST OF WORLD<br>" + numberFormat(1 - d3.sum(filteredData, d => +d[colorVar]));
                    } else {
                        tooltipText +="<strong>" + d.properties.name.toUpperCase() + "</strong><br>";
                        tooltipText +=  numberFormat(filteredData.find(f => f.Country === d.properties.name)[colorVar]);
                        d3.selectAll(".hBarGroup" + myClass).attr("opacity",0.1);
                        d3.selectAll("#" + d.properties.name.toLowerCase()).attr("opacity",1);
                    }
                    d3.select("#tooltip")
                        .style("visibility","visible")
                        .style("top",event.pageY + "px")
                        .style("left",(event.pageX + 10) + "px")
                        .html(tooltipText);
                })
                .on("mouseout",function(event,d){
                    d3.selectAll(".hBarGroup" + myClass).attr("opacity",1);
                    d3.select("#tooltip").style("visibility","hidden");
                });


            const xScale = d3.scaleLinear().domain([0,colorExtent[1]]).range([0,width - 40 - mapWidth - 110 - 30]);
            const hBarHeight = 30;
            //bars group
            const hBarGroup = svg.selectAll(".hBarGroup" + myClass)
                .data(filteredData)
                .join(function(group){
                    var enter = group.append("g").attr("class","hBarGroup" + myClass);
                    enter.append("rect").attr("class","backgroundBar");
                    enter.append("text").attr("class","dataPosition");
                    enter.append("svg:image").attr("class","dataFlag");
                    enter.append("text").attr("class","countryName");
                    enter.append("rect").attr("class","dataBar");
                    enter.append("text").attr("class","valueLabel");
                    return enter;
                });

            hBarGroup
                .attr("id", d => d.Country.toLowerCase())
                .attr("transform", "translate(10," + ((height - 10 + 50 - mapHeight)/2) + ")")
                .on("mouseover",function(event,d){
                    d3.selectAll(".hBarGroup" + myClass).attr("opacity",0.1);
                    d3.selectAll(".mapPath").attr("opacity",0.1);
                    d3.selectAll("#" + d.Country.toLowerCase()).attr("opacity",1);
                })
                .on("mouseout",function(){
                    d3.selectAll(".mapPath").attr("opacity",1);
                    d3.selectAll(".hBarGroup" + myClass).attr("opacity",1);
                });

            hBarGroup.select(".backgroundBar")
                .attr("y",(d,i) => (i * hBarHeight))
                .attr("width",width - 40 - mapWidth)
                .attr("height",25);

            hBarGroup.select(".dataPosition")
                .style("pointer-events","none")
                .attr("x",5)
                .attr("y",(d,i) => (i * hBarHeight) + 18)
                .text((d,i) => i + 1);

            hBarGroup.select(".dataFlag")
                .style("pointer-events","none")
                .attr("x",20)
                .attr("y",(d,i) => (i * hBarHeight) + 7)
                .attr("width",20)
                .attr("height",12)
                .attr("xlink:href", d => "flags/" + d.Country + ".png");

            hBarGroup.select(".countryName")
                .style("pointer-events","none")
                .attr("x",75)
                .attr("text-anchor","middle")
                .attr("y",(d,i) => (i * hBarHeight) + 17)
                .text((d,i) => d.Country);

            hBarGroup.select(".dataBar")
                .style("pointer-events","none")
                .attr("x",110)
                .attr("y",(d,i) => (i * hBarHeight) + 2.5)
                .attr("width",0)
                .attr("height",20)
                .attr("fill", d => colorScale(+d[colorVar]))
                .transition()
                .duration(1000)
                .attr("width",d => xScale(+d[colorVar]));

            hBarGroup.select(".valueLabel")
                .style("pointer-events","none")
                .attr("x",d => 114)
                .attr("y",(d,i) => (i * hBarHeight) + 17)
                .text((d,i) => numberFormat(+d[colorVar]))
                .transition()
                .duration(1000)
                .attr("x",d => 114 + xScale(+d[colorVar]));

        }


        function drawFilterButtons(filterSet){
            //button group
            const filterButtonGroup = svg.selectAll(".filterButtonGroup" + myClass)
                .data(filterSet)
                .join(function(group){
                    var enter = group.append("g").attr("class","filterButtonGroup" + myClass);
                    enter.append("rect").attr("class","filterButtonRect filterButtonRect");
                    enter.append("text").attr("class","filterButtonText");
                    return enter;
                });

            filterButtonGroup.select(".filterButtonRect")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("id",d => d)
                .attr("width",60)
                .attr("height",15)
                .attr("x",(d,i) => 10 + ((60+5) * i))
                .attr("y",10)
                .attr("rx",5)
                .attr("ry",5)
                .on("click",function(event,d){
                    var myIndex = filterSet.findIndex(f => f === d);
                    d3.selectAll(".filterButtonRect").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    d3.selectAll(".filterButtonText").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === d);
                    drawMapBar();
                });

            filterButtonGroup.select(".filterButtonText")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("text-anchor","middle")
                .attr("height",15)
                .attr("x",(d,i) => 10 + (60/2) + ((60+5) * i))
                .attr("y",10 + (15/2) + 3.5)
                .attr("rx",5)
                .attr("ry",5)
                .text(d => d);
        }

    }


    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return my;
    };

    my.mapData = function(value) {
        if (!arguments.length) return mapData;
        mapData = value;
        return my;
    };

    my.myData = function(value) {
        if (!arguments.length) return myData;
        myData = value;
        return my;
    };

    my.myClass = function(value) {
        if (!arguments.length) return myClass;
        myClass = value;
        return my;
    };

    my.colorRange = function(value) {
        if (!arguments.length) return colorRange;
        colorRange = value;
        return my;
    };

    my.colorVar = function(value) {
        if (!arguments.length) return colorVar;
        colorVar = value;
        return my;
    };

    my.legendVar = function(value) {
        if (!arguments.length) return legendVar;
        legendVar = value;
        return my;
    };

    my.filterBy = function(value) {
        if (!arguments.length) return filterBy;
        filterBy = value;
        return my;
    };

    my.myFormat = function(value) {
        if (!arguments.length) return myFormat;
        myFormat = value;
        return my;
    };

    return my;
}



function pyramidChart() {
    //REUSABLE button Chart

    var myData = [],
        myClass="",
        width = 0,
        height = 0,
        colorRange="",
        colorVars="",
        binVar ="",
        filterBy="",
        myFormat="",
        margins = {"left":40,"right":40,"top":150,"bottom":80},
        currentFilter = "",
        currentFilter2 = "";


    function my(svg) {

        var filterSet = new Set();
        myData.forEach(d => filterSet.add(d[filterBy].toUpperCase()));
        filterSet = Array.from(filterSet);
        currentFilter = filterSet[0];
        drawFilterButtons(filterSet,0,"#707070",myClass + "_0",120);

        var filterSet2 = new Set();
        myData.forEach(d => filterSet2.add(d[filterBy2]));
        filterSet2 = Array.from(filterSet2);
        currentFilter2 = filterSet2[0];

        drawFilterButtons(filterSet2,35,"#A0A0A0",myClass + "_1",100);

        let filteredData = JSON.parse(JSON.stringify(myData));
        filteredData = filteredData.filter(f => f[filterBy].toUpperCase() === currentFilter);
        filteredData = filteredData.filter(f => f[filterBy2] === currentFilter2);

        var pyramidGap = 100;

        //non data elements
        if(d3.select(".xAxis" + myClass)._groups[0][0] === null) {
            svg.append("g").attr("class","axis xAxisLeft" + myClass);
            svg.append("g").attr("class","axis xAxisRight" + myClass);
            svg.append("g").attr("class","midAxis yAxis" + myClass);
            svg.append("text").attr("class","largerTitle titleLeft" + myClass);
            svg.append("text").attr("class","titleMid" + myClass);
            svg.append("text").attr("class","largerTitle titleRight" + myClass);
        }

        d3.select(".titleLeft" + myClass)
            .style("text-anchor" ,"end")
            .attr("x",(width/2) - pyramidGap/2)
            .attr("y",margins.top - 45)
            .text(colorVars[0]);

        d3.select(".titleRight" + myClass)
            .attr("x",(width/2) + pyramidGap/2)
            .attr("y",margins.top - 45)
            .text(colorVars[1]);

        d3.select(".titleMid" + myClass)
            .style("text-anchor" ,"middle")
            .attr("x",(width/2))
            .attr("y",margins.top - 45)
            .text("v");

        var yBins = new Set();
        filteredData.forEach(d => yBins.add(d[binVar]));
        yBins = Array.from(yBins);

        var yScale = d3.scaleBand()
            .domain(yBins)
            .range([0, height-margins.top-margins.bottom]);

        d3.select(".yAxis" + myClass)
            .call(d3.axisLeft(yScale).tickFormat(d => d +  " star"))
            .attr("transform","translate(" + (width/2) + "," +  margins.top + ")");

        d3.selectAll(".yAxis" + myClass + " .tick text")
            .attr("x",0)
            .style("text-anchor" ,"middle");

        redrawPyramid();

        function redrawPyramid(){

            const maxX = d3.max(filteredData, d => Math.max(d[colorVars[0]],d[colorVars[1]]));
            var xScale = d3.scaleLinear()
                .range([0,(width - pyramidGap - margins.left - margins.right)/2])
                .domain([0 ,maxX]);

            var xScaleReverse = d3.scaleLinear()
                .range([0,(width - pyramidGap - margins.left - margins.right)/2])
                .domain([maxX,0]);

            d3.select(".xAxisLeft" + myClass)
                .call(d3.axisTop(xScale).tickSizeOuter(0).tickFormat(d => d > 0 ? d3.format(myFormat)(d):"").tickSizeOuter(0))
                .attr("transform","translate(" + ((width/2) + (pyramidGap/2)) + "," + (margins.top - 10) + ")")

            d3.select(".xAxisRight" + myClass)
                .call(d3.axisTop(xScaleReverse).tickSizeOuter(0).tickFormat(d => d > 0 ?d3.format(myFormat)(d):"").tickSizeOuter(0))
                .attr("transform","translate(" + margins.left + "," + (margins.top - 10) + ")")

            let histogramData = [];

            filteredData.forEach(function(d){
                histogramData.push({
                    "position": "left",
                    "binVal": d[binVar],
                    "fill":colorRange[0],
                    "value": d[colorVars[0]]
                });
                histogramData.push({
                    "position": "right",
                    "binVal": d[binVar],
                    "fill":colorRange[1],
                    "value": d[colorVars[1]]
                })
            })
            //button group
            const histogramGroup = svg.selectAll(".histogramGroups" + myClass)
                .data(histogramData)
                .join(function(group){
                    var enter = group.append("g").attr("class","histogramGroups" + myClass);
                    enter.append("rect").attr("class","histogramBar");
                    enter.append("text").attr("class","histogramText");
                    return enter;
                });

            histogramGroup.select(".histogramBar")
                .attr("x", d => d.position === "left" ? (width/2) - (pyramidGap/2) : (width/2) + (pyramidGap/2))
                .attr("y", d => yScale(d.binVal) + margins.top + 5)
                .attr("width", 0)
                .attr("height", yScale.bandwidth() - 10)
                .style("fill", d => d.fill)
                .transition()
                .duration(1000)
                .attr("x", d => d.position === "left" ? (width/2) - (pyramidGap/2) - xScale(d.value) : (width/2) + (pyramidGap/2))
                .attr("width", d => xScale(d.value));

            histogramGroup.select(".histogramText")
                .attr("x", d => d.position === "left" ? (width/2) - (pyramidGap/2) - 3 : (width/2) + (pyramidGap/2) + 3)
                .attr("text-anchor", d => d.position === "left" ? "end" : "start")
                .attr("y", d => yScale(d.binVal) + margins.top + 8 + ( yScale.bandwidth() - 10)/2)
                .attr("height", yScale.bandwidth() - 10)
                .text(d => d3.format(myFormat)(d.value))
                .transition()
                .duration(1000)
                .attr("x", d => d.position === "left" ? (width/2) - (pyramidGap/2) - xScale(d.value) - 3 : (width/2) + (pyramidGap/2) + 3 + xScale(d.value))
        }


        function drawFilterButtons(myFilterSet, buttonY, buttonFill, buttonClass,buttonWidth){
            //button group
            const filterButtonGroup = svg.selectAll(".filterButtonGroup" + buttonClass)
                .data(myFilterSet)
                .join(function(group){
                    var enter = group.append("g").attr("class","filterButtonGroup" + buttonClass);
                    enter.append("rect").attr("class","pyramidFilterButtonRect");
                    enter.append("text").attr("class","pyramidFilterButtonText");
                    return enter;
                });

            filterButtonGroup.select(".pyramidFilterButtonRect")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .style("cursor","pointer")
                .attr("id",buttonClass)
                .attr("width",buttonWidth)
                .attr("height",20)
                .attr("x",(d,i) =>  ((buttonWidth+5) * i) + ((width - ((buttonWidth + 5) * myFilterSet.length)-5)/2))
                .attr("y",buttonY)
                .attr("rx",5)
                .attr("ry",5)
                .attr("fill",buttonFill)
                .on("click",function(event,d){
                    var myIndex = -1;
                    if(this.id === myClass + "_0"){
                        myIndex = filterSet.findIndex(f => f === d);
                        currentFilter = d;
                    } else {
                        currentFilter2 = d;
                        myIndex = filterSet2.findIndex(f => f === d);
                    }
                    d3.selectAll(".pyramidFilterButtonRect#" + this.id).attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    d3.selectAll(".pyramidFilterButtonText#" + this.id).attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy].toUpperCase() === currentFilter);
                    filteredData = filteredData.filter(f => f[filterBy2] === currentFilter2);
                    redrawPyramid();
                });

            filterButtonGroup.select(".pyramidFilterButtonText")
                .attr("id",buttonClass)
                .style("pointer-events","none")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("text-anchor","middle")
                .attr("fill","white")
                .attr("x",(d,i) =>  (buttonWidth/2) + ((buttonWidth+5) * i) + ((width - ((buttonWidth + 5) * myFilterSet.length)-5)/2))
                .attr("y", (20/2) + 4.5 + buttonY)
                .text(d => d);

        }
    }

    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return my;
    };

    my.myData = function(value) {
        if (!arguments.length) return myData;
        myData = value;
        return my;
    };

    my.myClass = function(value) {
        if (!arguments.length) return myClass;
        myClass = value;
        return my;
    };

    my.colorRange = function(value) {
        if (!arguments.length) return colorRange;
        colorRange = value;
        return my;
    };

    my.colorVars = function(value) {
        if (!arguments.length) return colorVars;
        colorVars = value;
        return my;
    };

    my.binVar = function(value) {
        if (!arguments.length) return binVar;
        binVar = value;
        return my;
    };

    my.filterBy = function(value) {
        if (!arguments.length) return filterBy;
        filterBy = value;
        return my;
    };

    my.filterBy2 = function(value) {
        if (!arguments.length) return filterBy2;
        filterBy2 = value;
        return my;
    };

    my.myFormat = function(value) {
        if (!arguments.length) return myFormat;
        myFormat = value;
        return my;
    };

    return my;
}

function buttonChart() {
    //REUSABLE button Chart

    var myData = [],
        myClass="",
        width = 0,
        startY = 0,
        buttonHeight = 0,
        buttonWidth = 0;


    function my(svg) {

        //button group
        const buttonGroup = svg.selectAll(".buttonGroup" + myClass)
            .data(myData)
            .join(function(group){
                var enter = group.append("g").attr("class","buttonGroup" + myClass);
                enter.append("rect").attr("class","buttonRect buttonRect" + myClass);
                enter.append("text").attr("class","buttonText");
                return enter;
            });

        buttonGroup.select(".buttonRect")
            .attr("opacity",getButtonOpacity)
            .attr("id",d => d)
            .attr("width",buttonWidth)
            .attr("height",buttonHeight)
            .attr("x",(d,i) => ((buttonWidth+5) * i))
            .attr("y",startY)
            .attr("rx",5)
            .attr("ry",5);

        buttonGroup.select(".buttonText")
            .attr("text-anchor","middle")
            .attr("height",buttonHeight)
            .attr("x",(d,i) => (buttonWidth/2) + ((buttonWidth+5) * i))
            .attr("y",startY + (buttonHeight/2) + 4.5)
            .attr("rx",5)
            .attr("ry",5)
            .text(d => d);

        const buttonX = (buttonWidth * myData.length) + ((5 * myData.length-1));
        buttonGroup.attr("transform","translate(" + ((width-buttonX)/2) + ",0)");

    }

    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.startY = function(value) {
        if (!arguments.length) return startY;
        startY = value;
        return my;
    };

    my.myData = function(value) {
        if (!arguments.length) return myData;
        myData = value;
        return my;
    };

    my.myClass = function(value) {
        if (!arguments.length) return myClass;
        myClass = value;
        return my;
    };

    my.buttonHeight = function(value) {
        if (!arguments.length) return buttonHeight;
        buttonHeight = value;
        return my;
    };

    my.buttonWidth = function(value) {
        if (!arguments.length) return buttonWidth;
        buttonWidth = value;
        return my;
    };

    return my;
}


function barChart() {
    //REUSABLE bar Chart

    var myData = [],
        myClass="",
        width = 0,
        height = 0,
        margins = {"left":50,"right":10,"top":50,"bottom":30,"middle":50};


    function my(svg) {

        let filterSet = new Set();
        myData.forEach(m => filterSet.add(m[filterBy]));
        filterSet = Array.from(filterSet);

        drawFilterButtons(filterSet);

        const brushHeight = 50;
        myData.map(m => m.fullDate = convertDate(m.Date));

        let filteredData = myData.filter(f => f[filterBy] === filterSet[0]);

        const xExtent = d3.extent(filteredData, d => d.fullDate);
        const xScaleBrush = d3.scaleTime().domain(xExtent).range([0,width - margins.left - margins.right]);
        let xScaleChart = d3.scaleTime().domain(xExtent).range([0,width - margins.left - margins.right]);
        const monthsInvolved = d3.timeMonth.count(xExtent[0],xExtent[1]) + 1;
        const xScaleBarBrush = d3.scaleBand().domain(d3.range(0,monthsInvolved,1)).range([0,width - margins.left - margins.right]);
        let xScaleBarChart = d3.scaleBand().domain(d3.range(0,monthsInvolved,1)).range([0,width - margins.left - margins.right]);

        //non data elements
        if(d3.select(".clipPath" + myClass)._groups[0][0] === null) {
            svg.append("clipPath").attr("class","clipPath" + myClass)
                .attr("id","mapClipPath")
                .append('rect').attr('class', 'clipRect' + myClass);
            svg.append("g").attr("class"," brushGroup" + myClass);
            svg.append("g").attr("class","brushAxis xAxisBrush" + myClass);
            svg.append("g").attr("class","brushAxis xAxisChart" + myClass);
            svg.append("g").attr("class","brushAxis yAxisChart" + myClass);
        }

        let yScaleChart = "";

        const brush = d3.brushX()
            .extent([[0, 0], [width - margins.right-margins.left, brushHeight]])
            .on("end", brushed);

        d3.select(".xAxisBrush" + myClass)
            .call(d3.axisBottom(xScaleBrush).tickSizeOuter(0))
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom) + ")");

        redrawBarChart();

        function redrawBarChart(){

            xScaleChart = d3.scaleTime().domain(xExtent).range([0,width - margins.left - margins.right]);
            xScaleBarChart = d3.scaleBand().domain(d3.range(0,monthsInvolved,1)).range([0,width - margins.left - margins.right]);

            d3.select(".brushGroup" + myClass)
                .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - brushHeight) + ")")
                .call(brush)
                .call(brush.move, [0,width - margins.right-margins.left]);

            filteredData = filteredData.sort((a,b) => d3.ascending(a.fullDate,b.fullDate));
            filteredData.map(m => m.monthCount = d3.timeMonth.count(filteredData[0].fullDate, m.fullDate));

            const yScaleBrush = d3.scaleLinear().domain(d3.extent(filteredData, d => d.Value)).range([brushHeight,0]);
            yScaleChart = d3.scaleLinear().domain(d3.extent(filteredData, d => d.Value)).range([height - brushHeight - margins.top - margins.middle - margins.bottom,0]);
            d3.select(".yAxisChart" + myClass)
                .call(d3.axisLeft(yScaleChart).tickSizeOuter(0).tickFormat(d => d > 0 ? d3.format(myFormat)(d):  ""))
                .attr("transform","translate(" + margins.left + "," + margins.top + ")");

            //button group
            const brushBarGroup = svg.selectAll(".brushBarGroup" + myClass)
                .data(filteredData)
                .join(function(group){
                    var enter = group.append("g").attr("class","brushBarGroup" + myClass);
                    enter.append("rect").attr("class","brushBar");
                    return enter;
                });

            brushBarGroup.select(".brushBar")
                .attr("x",d => margins.left + xScaleBarBrush(d.monthCount))
                .attr("y",d => yScaleBrush(d.Value) + (height - margins.bottom - brushHeight))
                .attr("width",xScaleBarBrush.bandwidth()-1)
                .attr("height", d => yScaleBrush(yScaleBrush.domain()[0]) - yScaleBrush(d.Value))
                .attr("fill",myColor)
                .attr("fill-opacity",0.4);

            drawChartBar(filteredData,0);

        }

        function brushed(event) {

            if(event.sourceEvent !== undefined){
                let extent = event.selection.map(xScaleBrush.invert, xScaleBrush);
                extent[0] = new Date(extent[0].getFullYear(),extent[0].getMonth(),1);
                extent[1] = new Date(extent[1].getFullYear(),extent[1].getMonth(),1);
                if(extent[1] > xExtent[1]){extent[1] = xExtent[1]};
                if(extent[0] < xExtent[0]){extent[0] = xExtent[0]};
                xScaleChart.domain(extent);
                const filteredMonthsInvolved = d3.timeMonth.count(extent[0],extent[1]) + 1;
                xScaleBarChart.domain(d3.range(0,filteredMonthsInvolved,1));
                let filteredBarData = JSON.parse(JSON.stringify(filteredData));
                filteredBarData.map(m => m.fullDate = new Date(m.fullDate));
                filteredBarData = filteredBarData.filter(f => f.fullDate >= extent[0] && f.fullDate <= extent[1]);
                filteredBarData.map(m => m.monthCount = d3.timeMonth.count(extent[0], m.fullDate));
                drawChartBar(filteredBarData,1000)
            }

        }

        function drawChartBar(myFilteredBarData,transitionTime){

            d3.select(".xAxisChart" + myClass)
                .transition()
                .duration(transitionTime)
                .call(d3.axisBottom(xScaleChart).tickSizeOuter(0))
                .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - margins.middle - brushHeight) + ")")

            //button group
            const chartBarData = svg.selectAll(".chartBarGroup" + myClass)
                .data(myFilteredBarData, d => d.monthCount)
                .join(function(group){
                    var enter = group.append("g").attr("class","chartBarGroup" + myClass);
                    enter.append("rect").attr("class","chartBar");
                    return enter;
                });

            chartBarData.select(".chartBar")
                .attr("x",d => margins.left + xScaleBarChart(d.monthCount))
                .attr("y",d => yScaleChart(d.Value) + margins.top)
                .attr("width",xScaleBarChart.bandwidth()-1)
                .attr("height", d => yScaleChart(yScaleChart.domain()[0]) - yScaleChart(d.Value))
                .attr("fill",myColor);

        }

        function drawFilterButtons(filterSet){
            //button group
            const filterButtonGroup = svg.selectAll(".filterButtonGroup" + myClass)
                .data(filterSet)
                .join(function(group){
                    var enter = group.append("g").attr("class","filterButtonGroup" + myClass);
                    enter.append("rect").attr("class","filterButtonRect filterButtonRect");
                    enter.append("text").attr("class","filterButtonText");
                    return enter;
                });

            filterButtonGroup.select(".filterButtonRect")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("id",d => d)
                .attr("width",60)
                .attr("height",15)
                .attr("x",(d,i) => 10 + ((60+5) * i))
                .attr("y",10)
                .attr("rx",5)
                .attr("ry",5)
                .on("click",function(event,d){
                    var myIndex = filterSet.findIndex(f => f === d);
                    d3.selectAll(".filterButtonRect").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    d3.selectAll(".filterButtonText").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === d);
                    filteredData.map(m => m.fullDate = new Date(m.fullDate));
                    redrawBarChart();
                });

            filterButtonGroup.select(".filterButtonText")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("text-anchor","middle")
                .attr("height",15)
                .attr("x",(d,i) => 10 + (60/2) + ((60+5) * i))
                .attr("y",10 + (15/2) + 3.5)
                .attr("rx",5)
                .attr("ry",5)
                .text(d => d);
        }


        function convertDate(myDate){
            const dateSplit = myDate.split("/");
            return new Date(dateSplit[2],+dateSplit[1]-1,dateSplit[0]);
        }
    }

    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return my;
    };

    my.myData = function(value) {
        if (!arguments.length) return myData;
        myData = value;
        return my;
    };

    my.myClass = function(value) {
        if (!arguments.length) return myClass;
        myClass = value;
        return my;
    };

    my.myColor = function(value) {
        if (!arguments.length) return myColor;
        myColor = value;
        return my;
    };

    my.legendVar = function(value) {
        if (!arguments.length) return legendVar;
        legendVar = value;
        return my;
    };

    my.myFormat = function(value) {
        if (!arguments.length) return myFormat;
        myFormat = value;
        return my;
    };

    my.filterBy = function(value) {
        if (!arguments.length) return filterBy;
        filterBy = value;
        return my;
    };


    return my;
}
function getButtonOpacity(d){

    if(holidayMe.selectedButton === d){
        return 1;
    } else {
        return 0.1;
    }
}
