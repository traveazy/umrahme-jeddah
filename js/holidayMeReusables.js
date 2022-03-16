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



function histogramChart() {
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
        margins = {"left":40,"right":10,"top":20,"bottom":20};


    function my(svg) {

        myData = myData.filter(f => f.Season ==="2020-2021");
        var xBins = new Set();
        myData.forEach(d => xBins.add(d[binVar]));
        xBins = Array.from(xBins);

        var xScale = d3.scaleBand()
            .domain(xBins)
            .range([0, width-margins.left-margins.right]);

        const maxY = d3.max(myData, d => Math.max(d[colorVars[0]],d[colorVars[1]]));
        var yScale = d3.scaleLinear()
            .range([height-margins.top-margins.bottom, 0])
            .domain([0 ,maxY]);

        //non data elements
        if(d3.select(".xAxis" + myClass)._groups[0][0] === null) {
            svg.append("g").attr("class","xAxis" + myClass);
            svg.append("g").attr("class","yAxis" + myClass);
         }

        d3.select(".xAxis" + myClass)
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom) + ")")

        d3.select(".yAxis" + myClass)
            .call(d3.axisLeft(yScale).tickFormat(d => d3.format(myFormat)(d)).tickSizeOuter(0))
            .attr("transform","translate(" + margins.left + "," +  margins.top + ")")

        let histogramData = [];
        myData.forEach(function(d){
            histogramData.push({
                "binVal": d[binVar],
                "fill":colorRange[0],
                "value": d[colorVars[0]]
            });
            histogramData.push({
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
                return enter;
            });

        histogramGroup.select(".histogramBar")
            .attr("x", d => xScale(d.binVal) + margins.left)
            .attr("y", d => yScale(d.value) + margins.top)
            .attr("width", xScale.bandwidth())
            .attr("height", d =>  yScale(0) - yScale(d.value))
            .style("fill", d => d.fill)
            .style("opacity", 0.4)


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

function getButtonOpacity(d){

    if(holidayMe.selectedButton === d){
        return 1;
    } else {
        return 0.1;
    }
}
