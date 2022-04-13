function mapBubbles() {
    //REUSABLE globe map

    var width=0,
        height=0,
        mapData = {},
        myData = [],
        colorRange = [],
        colorVar = "",
        legendVar = "",
        myFormat = "",
        myClass="",
        colorExtent=[],
        colorScale = "";


    function my(baseSvg) {

        baseSvg.attr("transform","translate(0,0)");

        const numberFormat = d3.format(myFormat);
        //https://observablehq.com/@sarah37/spinning-globe

        const mapWidth = width;
        const mapHeight = height * 0.95;
        const scl = Math.min(mapWidth, mapHeight)/3; // scale globe

        // map projection
        const projection = d3.geoMercator()
            .scale(scl)
            .translate([ mapWidth/2,(mapHeight*1.2)/2 ]);


        let svg = "";
        //non data elements
        if(d3.select(".backgroundCircle" + myClass)._groups[0][0] === null) {
            baseSvg.append("rect").attr("class","backgroundCircle" + myClass);
            baseSvg.append("clipPath").attr("class","clipPath" + myClass)
                .attr("id","bMapClipPath")
                .append('rect').attr('class', 'clipRect' + myClass);
            const zoomGroup = baseSvg.append('g').attr("class","zoomGroup" + myClass);
            svg = zoomGroup.append('g').attr("class","zoomSvg" + myClass);
        } else {
            svg = d3.select(".zoomSvg" + myClass);
        }

        d3.select(".clipRect" + myClass)
            .attr("width", width)
            .attr("height", height * 0.95);

        d3.select(".zoomGroup" + myClass).attr('clip-path', 'url(#bMapClipPath)');

        d3.select(".backgroundCircle" + myClass)
            .style("fill","#F1F7FF")
            .attr("x",0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height",height * 0.95)
            .attr("rx", 0)
            .attr("ry", 0);

            const zoom = d3.zoom()
                .extent([[0, 0], [width, height * 0.95]])
                .scaleExtent([1, 8])
                .on("zoom", zoomed);

        baseSvg.call(zoom);

        function zoomed({transform}) {
            svg.attr("transform", transform);
        }

            colorExtent = d3.extent(myData, d => +d[colorVar]);
            const radiusExtent = d3.extent(myData, d => Math.sqrt(+d[colorVar]));
            colorScale = d3.scaleLinear().domain(colorExtent).range(colorRange);
            const radiusScale = d3.scaleLinear().domain(radiusExtent).range([2,20]);
            // path generator
            const path = d3.geoPath().projection(projection);


            const convertedMapData = topojson.feature(mapData,mapData.objects.countries).features;

            //bars group
            const pathGroup = svg.selectAll(".pathGroup" + myClass)
                .data(convertedMapData)
                .join(function(group){
                    var enter = group.append("g").attr("class","pathGroup" + myClass);
                    enter.append("path").attr("class","mapPath");
                    return enter;
                });

            pathGroup.select(".mapPath")
                .attr("id",d => d.properties.name)
                .style("fill",  "white")
                .style("stroke", "#ccc")
                .style("stroke-width", "0.3px")
                .attr("d", path);

        //bars group
        const bubbleGroup = svg.selectAll(".bubbleGroup" + myClass)
            .data(myData)
            .join(function(group){
                var enter = group.append("g").attr("class","bubbleGroup" + myClass);
                enter.append("circle").attr("class","mapBubble");
                return enter;
            });

        bubbleGroup.select(".mapBubble")
            .filter(d => convertedMapData.find(f => f.properties.name === d.Country) !== undefined)
            .attr("cx",function(d){
                d.centroid = path.centroid(convertedMapData.find(f => f.properties.name === d.Country));
                return d.centroid[0];
            })
            .attr("cy", d => d.centroid[1])
            .attr("r",d => radiusScale(Math.sqrt(d[colorVar])))
            .style("fill",d => colorScale(d[colorVar]))
            .attr("fill-opacity",0.6)
            .attr("stroke",d => colorScale(d[colorVar]))
            .attr("stroke-width",0.5)
            .on("mousemove",function(event,d){
                var totalValue = d3.sum(myData, d => +d[colorVar]);
                var tooltipText = "<span class='tooltipTitle'>" + legendVar + "</span><br>";
                tooltipText += (d.Country + ": " + numberFormat(+d[colorVar]/totalValue));

                d3.select("#tooltip")
                    .style("visibility","visible")
                    .style("top",event.pageY + "px")
                    .style("left",(event.pageX + 10) + "px")
                    .html(tooltipText);

                if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                holidayMe.mouseoverTimer = d3.timer(function(){
                    d3.select("#tooltip").style("visibility","hidden");
                    holidayMe.mouseoverTimer.stop();
                },1500)
            })
            .on("mouseout",function(event,d){
                d3.select("#tooltip").style("visibility","hidden");
            })


            zoomToBounds();

        function zoomToBounds(){
            let x0 = width, x1 = 0, y0 = (height* 0.95), y1 = 0;
            d3.selectAll(".mapBubble")
                .attr("id",d => d.Country)
                .each(function(d){
                if(d.Country !== "Rest of the World"){
                    var myX = +d3.select(this).attr("cx");
                    var myY = +d3.select(this).attr("cy");
                    var myRadius = +d3.select(this).attr("r");
                    x0 = Math.min(x0,myX - myRadius);
                    x1 = Math.max(x1,myX + myRadius);
                    y0 = Math.min(y0,myY - myRadius);
                    y1 = Math.max(y1,myY + myRadius);
                }
            })


            baseSvg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, svg.node())
            );

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

    my.myFormat = function(value) {
        if (!arguments.length) return myFormat;
        myFormat = value;
        return my;
    };

    return my;
}


function mapDoubleGlobe() {
    //REUSABLE globe map

    var width=0,
        height=0,
        mapData = {},
        myData = [],
        colorRange = [],
        colorVar = "",
        legendVar = "",
        myFormat = "",
        myClass="",
        colorExtent=[],
        colorScale = "";


    function my(svg) {

        const numberFormat = d3.format(myFormat);
        //https://observablehq.com/@sarah37/spinning-globe

        const topMargin = height * 0.1;
        const mapWidth = width;
        const mapHeight = height * 0.8;
        const scl = Math.min(mapWidth, mapHeight)/3; // scale globe

        // map projection
        const projection = d3.geoConicEqualArea()
            .scale(scl)
            .translate([ mapWidth/2,(mapHeight)/2 ]);

        //non data elements
        if(d3.select(".backgroundCircle" + myClass)._groups[0][0] === null) {
            const pathGroup = svg.append("g").attr("class","pathGroup" + myClass);
            pathGroup.append("path").attr("class","backgroundPath" + myClass);
            pathGroup.append("text").attr("class","countryCounter countryCounter" + myClass);
            pathGroup.append("text").attr("class","countryCounterSmall countries" + myClass);
            const legendGroup = svg.append("g").attr("class","legendGroup" + myClass);
            legendGroup.append("rect").attr("class","legendRect" + myClass);
            legendGroup.append("text").attr("class","legendTitle legendTitle" + myClass);
            legendGroup.append("text").attr("class","legendNumber legendStart" + myClass);
            legendGroup.append("text").attr("class","legendNumber legendEnd" + myClass);
            legendGroup.append("defs").append("linearGradient").attr("id", "legend-gradient");
        }

        d3.select(".legendGroup" + myClass).attr("transform", "translate(0," + (height * 0.95) + ")" );


        colorExtent = d3.extent(myData, d => +d[colorVar]);
        colorScale = d3.scaleLinear().domain(colorExtent).range(colorRange);
        // path generator
        const path = d3.geoPath().projection(projection);

        d3.select('.countryCounter' + myClass)
            .attr('x',width/2)
            .attr('y',height * 0.15)
            .transition()
            .ease(d3.easeQuadOut)
            .tween("text", () => {
                const interpolator = d3.interpolateNumber(50, 122);
                return function(t) {
                    d3.select(this).text(Math.round(interpolator(t)))
                }
            })
            .duration(2500);

        d3.select('.countries' + myClass)
            .attr('x',width/2)
            .attr('y',(height * 0.15) + 25)
            .text(holidayMe.language === "AR" ? holidayMe.arabicCountries : 'countries');

        d3.select(".backgroundPath" + myClass)
            .attr("stroke","#ED1A64")
            .attr("stroke-width",3)
            .attr("fill","transparent")
            .attr("d",path({type: "Sphere"}))
            .attr("transform","translate(0," + topMargin + ")");


        const convertedMapData = topojson.feature(mapData,mapData.objects.countries).features;

        //bars group
        const pathGroup = svg.selectAll(".pathGroup" + myClass)
            .data(convertedMapData)
            .join(function(group){
                var enter = group.append("g").attr("class","pathGroup" + myClass);
                enter.append("path").attr("class","clickableGlobeItem mapPath");
                return enter;
            });

        pathGroup.select(".mapPath")
            .attr('display', d => d.properties.name === "Antarctica"?"none":"block")
            .attr("id",d => d.properties.name)
            .style("fill", d => myData.find(f => f.Country === d.properties.name) === undefined ? "white":colorScale(+myData.find(f => f.Country === d.properties.name)[colorVar]))
            .style("stroke", "#ccc")
            .style("stroke-width", "0.3px")
            .attr("d", path)
            .attr("transform","translate(0," + topMargin + ")")
            .on("mousemove",function(event,d){
                var totalValue = d3.sum(myData, d => +d[colorVar]);
                var tooltipText = "";
                if(myData.find(f => f.Country === d.properties.name) === undefined){
                 //do nothing
                } else {
                    if(myData.find(f => f.Country === d.properties.name)[colorVar] >= 0.01){
                        tooltipText += (d.properties.name + ": " + numberFormat(myData.find(f => f.Country === d.properties.name)[colorVar]));
                    } else {
                        tooltipText += (d.properties.name + ": < 1%");
                    }
                }
                if(tooltipText !== ""){
                    d3.select("#tooltip")
                        .style("visibility","visible")
                        .style("top",event.pageY + "px")
                        .style("left",(event.pageX + 10) + "px")
                        .html(tooltipText);
                }
                if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                holidayMe.mouseoverTimer = d3.timer(function(){
                    d3.select("#tooltip").style("visibility","hidden");
                    holidayMe.mouseoverTimer.stop();
                },1500)
            })
            .on("mouseout",function(event,d){
                d3.select("#tooltip").style("visibility","hidden");
            });

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

    my.myFormat = function(value) {
        if (!arguments.length) return myFormat;
        myFormat = value;
        return my;
    };

    return my;
}


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


    function my(baseSvg) {

        baseSvg.attr("transform","translate(0,0)");

        // vars for timer
        let tNew, dt, steps, pos, tOld, oldPos;
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

        const scl = Math.min(width, height)/2.5; // scale globe
        const tRotation = 10000; //30s per rotation

        // map projection
        const geoProjection = d3.geoOrthographic()
            .scale(scl)
            .translate([ width/2, (height * 0.95)/2 ]);

        const scale = d3.interpolate(scl, (width - 2) / (2 * Math.PI));
        const rotate = d3.interpolate([10, -20], [0, 0]);

        let projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
            .scale(scale(0))
            .translate([width / 2, height / 2])
            .rotate(rotate(0))
            .precision(0.1)

        let svg = "";
        //non data elements
        if(d3.select(".backgroundCircle" + myClass)._groups[0][0] === null) {
            baseSvg.append("rect").attr("class","clickableGlobeItem backgroundCircle" + myClass);
            baseSvg.append("clipPath").attr("class","clipPath" + myClass)
                .attr("id","gMapClipPath")
                .append('rect').attr('class', 'clipRect' + myClass);
            const zoomGroup = baseSvg.append('g').attr("class","zoomGroup" + myClass);
            svg = zoomGroup.append('g').attr("class","zoomSvg" + myClass);
        } else {
            svg = d3.select(".zoomSvg" + myClass);
        }

        d3.select(".clipRect" + myClass)
            .attr("width", width)
            .attr("height", height * 0.95);

        d3.select(".zoomGroup" + myClass)
            .attr('clip-path', 'url(#gMapClipPath)');

        d3.select(".backgroundCircle" + myClass)
            .style("fill","#F1F7FF")
            .attr("x", (width/2) - geoProjection.scale())
            .attr("y", ((height * 0.95)/2) - geoProjection.scale())
            .attr("width", geoProjection.scale()*2)
            .attr("height", geoProjection.scale()*2)
            .attr("rx", geoProjection.scale())
            .attr("ry", geoProjection.scale());

        const zoom = d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([1, 8])
            .on("zoom", zoomed);

        let t = 0;

        drawGlobeChart();
        drawFilterButtons(filterSet);

        function zoomed({transform}) {
            svg.attr("transform", transform);
        }


        function drawGlobeChart(){

            colorExtent = d3.extent(filteredData, d => +d[colorVar]);
            colorScale = d3.scaleLinear().domain(colorExtent).range(colorRange);

            //drawLegend();
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
                    var totalValue = d3.sum(filteredData, d => +d[colorVar]);
                    var tooltipText = "<span class='tooltipTitle'>" + legendVar + "</span><br>";
                    if(filteredData.find(f => f.Country === d.properties.name) === undefined){
                        if(filteredData.find(f => f.Country === "Rest of the World") !== undefined){
                            tooltipText += ("Rest of World: " + numberFormat(filteredData.find(f => f.Country === "Rest of the World")[colorVar]/totalValue) + "<br>");
                        }
                    } else {
                        let myValue = filteredData.find(f => f.Country === d.properties.name)[colorVar]/totalValue;
                        if(myValue < 0.01){myValue = 0.01};
                        tooltipText += (d.properties.name + ": " + numberFormat(myValue) + "<br>");

                    }
                    d3.select("#tooltip")
                        .style("visibility","visible")
                        .style("top",event.pageY + "px")
                        .style("left",(event.pageX + 10) + "px")
                        .html(tooltipText);
                    if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                    holidayMe.mouseoverTimer = d3.timer(function(){
                        d3.select("#tooltip").style("visibility","hidden");
                        holidayMe.mouseoverTimer.stop();
                    },1500)
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
                            .attr("height",height * 0.95)
                            .attr("rx", 0)
                            .attr("ry", 0);

                        baseSvg.call(zoom);

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
                .text(legendVar);

            d3.select(".legendStart" + myClass)
                .attr("x",10)
                .attr("y",34)
                .text(legendFormat(0));

            d3.select(".legendEnd" + myClass)
                .attr("text-anchor","end")
                .attr("x",10 + 150)
                .attr("y", 34)
                .text(legendFormat(1));

            d3.select(".legendTitle" + myClass)
                .attr("x",10)
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
                .attr("y",5)
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
        colorScale = "",
        colorRange = [];


    function my(baseSvg) {

        baseSvg.attr("transform","translate(0,0)");

        const seasonColors = [["#D8F0DC","#ACDEB4"],["#F4D4B8","#EBA05F"],["#B5DBEB","#6AB7D9"]]

        const numberFormat = d3.format(myFormat);

        let filterSet = [];
        let filteredData = JSON.parse(JSON.stringify(myData));

        if(filterBy !== ""){
            filterSet = new Set();
            myData.forEach(f => filterSet.add(f[filterBy]));
            filterSet = Array.from(filterSet);
            filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === filterSet[0]);
            colorRange = seasonColors[0];
        }

        const mapWidth = width/1.7;
        const mapHeight = 295;
        const scl = Math.min(mapWidth, mapHeight)/4; // scale globe

        const zoom = d3.zoom()
            .extent([[0, 0], [mapWidth, mapHeight]])
            .scaleExtent([1, 8])
            .on("zoom", zoomed);

        baseSvg.call(zoom);

        // map projection
        const projection = d3.geoMercator()
            .scale(scl)
            .translate([ mapWidth/2,(mapHeight*1.2)/2 ]);


        let svg = "";
        //non data elements
        if(d3.select(".backgroundCircle" + myClass)._groups[0][0] === null) {
            baseSvg.append("rect").attr("class","backgroundCircle" + myClass);
            baseSvg.append("clipPath").attr("class","clipPath" + myClass)
                .attr("id","gMapClipPath")
                .append('rect').attr('class', 'clipRect' + myClass);
            const zoomGroup = baseSvg.append('g').attr("class","zoomGroup" + myClass);
            svg = zoomGroup.append('g').attr("class","zoomSvg" + myClass);
        } else {
            svg = d3.select(".zoomSvg" + myClass);
        }

        d3.select(".topTitle" + myClass)
            .attr("x", 10 )
            .attr("y", ((height - 10 - mapHeight)/2) + 12)
            .text(legendVar);

        d3.select(".backgroundCircle" + myClass)
            .style("fill","transparent")
            .style("stroke",colorRange[1])
            .style("stroke-width",2)
            .attr("x", width - 10 - mapWidth)
            .attr("y", (height - 10 + 50 - mapHeight)/2)
            .attr("width", mapWidth)
            .attr("height", mapHeight);

        d3.select(".clipRect" + myClass)
            .attr("width", mapWidth)
            .attr("height", mapHeight);

        d3.select(".zoomGroup" + myClass)
            .attr('clip-path', 'url(#gMapClipPath)')
            .attr("transform", "translate(" + (width - 10 - mapWidth) + ","
                + ((height - 10 + 50 - mapHeight)/2) + ")");

        drawFilterButtons(filterSet);
        drawMapBar(true);

        function zoomed({transform}) {
            svg.attr("transform", transform);
        }

        function drawMapBar(doZoom){

            d3.select(".backgroundCircle" + myClass).style("stroke",colorRange[1])

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

        //    pathGroup
        //        .attr("transform", "translate(" + (width - 10 - mapWidth) + ","
       //             + ((height - 10 + 50 - mapHeight)/2) + ")");

            pathGroup.select(".mapPath")
                .attr("id",d => d.properties.name.replace(/ /g,'').toLowerCase())
                .style("fill", d => filteredData.find(f => f.Country === d.properties.name) === undefined ? "white":colorScale(+filteredData.find(f => f.Country === d.properties.name)[colorVar]))
                .style("fill-opacity", d => filteredData.find(f => f.Country === d.properties.name) === undefined ? 0.4:1)
                .style("stroke", "#ccc")
                .style("stroke-width", "0.3px")
                .attr("d", path)
                .on("mousemove",function(event,d){
                    var tooltipText = "";
                    if(filteredData.find(f => f.Country === d.properties.name) === undefined){

                       // tooltipText += "REST OF WORLD<br>" + numberFormat(1 - d3.sum(filteredData, d => +d[colorVar]));
                    } else {
                        tooltipText +="<strong>" + d.properties.name.toUpperCase() + "</strong><br>";
                        tooltipText +=  numberFormat(filteredData.find(f => f.Country === d.properties.name)[colorVar]);
                        d3.selectAll(".hBarGroup" + myClass).attr("opacity",0.1);
                        d3.selectAll("#" + d.properties.name.replace(/ /g,'').toLowerCase()).attr("opacity",1);
                    }
                    if(tooltipText !== ""){
                        d3.select("#tooltip")
                            .style("visibility","visible")
                            .style("top",event.pageY + "px")
                            .style("left",(event.pageX + 10) + "px")
                            .html(tooltipText);
                    }
                    if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                    holidayMe.mouseoverTimer = d3.timer(function(){
                        d3.select("#tooltip").style("visibility","hidden");
                        holidayMe.mouseoverTimer.stop();
                    },1500)
                })
                .on("mouseout",function(event,d){
                    d3.selectAll(".hBarGroup" + myClass).attr("opacity",1);
                    d3.select("#tooltip").style("visibility","hidden");
                });

            const xScale = d3.scaleLinear().domain([0,colorExtent[1]]).range([0,width - 40 - mapWidth - 110 - 60]);
            const hBarHeight = 30;
            //bars group
            const hBarGroup = baseSvg.selectAll(".hBarGroup" + myClass)
                .data(filteredData)
                .join(function(group){
                    var enter = group.append("g").attr("class","hBarGroup" + myClass);
                    enter.append("rect").attr("class","backgroundBar");
                    enter.append("svg:image").attr("class","dataFlag");
                    enter.append("text").attr("class","countryName");
                    enter.append("rect").attr("class","dataBar");
                    enter.append("text").attr("class","valueLabel");
                    return enter;
                });

            hBarGroup
                .attr("id", d => d.Country.replace(/ /g,'').toLowerCase())
                .attr("transform", "translate(10," + ((height - 10 + 50 - mapHeight)/2) + ")")
                .on("mousemove",function(event,d){
                    d3.selectAll(".hBarGroup" + myClass).attr("opacity",0.1);
                    d3.selectAll(".mapPath").attr("opacity",0.1);
                    d3.selectAll("#" + d.Country.replace(/ /g,'').toLowerCase()).attr("opacity",1);
                    if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                    holidayMe.mouseoverTimer = d3.timer(function(){
                        d3.selectAll(".mapPath").attr("opacity",1);
                        d3.selectAll(".hBarGroup" + myClass).attr("opacity",1);
                        holidayMe.mouseoverTimer.stop();
                    },1500)
                })
                .on("mouseout",function(){
                    d3.selectAll(".mapPath").attr("opacity",1);
                    d3.selectAll(".hBarGroup" + myClass).attr("opacity",1);
                });

            hBarGroup.select(".backgroundBar")
                .attr("y",(d,i) => (i * hBarHeight))
                .attr("width",width - 40 - mapWidth)
                .attr("height",25);

            hBarGroup.select(".dataFlag")
                .style("pointer-events","none")
                .attr("x",5)
                .attr("y",(d,i) => (i * hBarHeight) + 7)
                .attr("width",20)
                .attr("height",12)
                .attr("xlink:href", d => "flags/" + d.Country.replace(/ /g,"") + ".png");

            hBarGroup.select(".countryName")
                .style("fill","black")
                .style("pointer-events","none")
                .attr("x",30)
                .attr("y",(d,i) => (i * hBarHeight) + 18)
                .text((d,i) => holidayMe.language === "AR" ? holidayMe.arabicCountryDataset.find(f => f.Country === d.Country).Arabic : d.Country);

            hBarGroup.select(".dataBar")
                .style("pointer-events","none")
                .attr("x",130)
                .attr("y",(d,i) => (i * hBarHeight) + 2.5)
                .attr("width",0)
                .attr("height",20)
                .attr("fill", d => colorScale(+d[colorVar]))
                .transition()
                .duration(1000)
                .attr("width",d => xScale(+d[colorVar]));

            hBarGroup.select(".valueLabel")
                .style("fill","black")
                .style("pointer-events","none")
                .attr("x",d => 133)
                .attr("y",(d,i) => (i * hBarHeight) + 17)
                .text((d,i) => numberFormat(+d[colorVar]))
                .transition()
                .duration(1000)
                .attr("x",d => 133 + xScale(+d[colorVar]));

          //  if(doZoom === true){
                zoomToBounds();
          //  }

            function zoomToBounds(){
                let x0 = width, x1 = 0, y0 = (height* 0.95), y1 = 0;
                d3.selectAll(".mapPath")
                    .filter(d => filteredData.find(f => f.Country === d.properties.name) !== undefined)
                    .each(function(d){
                        var myBounds = d3.select(this).node().getBBox();
                        x0 = Math.min(x0,myBounds.x);
                        x1 = Math.max(x1,myBounds.x + myBounds.width);
                        y0 = Math.min(y0,myBounds.y);
                        y1 = Math.max(y1,myBounds.y + myBounds.height);
                })

                baseSvg.transition().duration(750)
                    .call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate( (mapWidth / 2), (mapHeight / 2))
                        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / mapWidth, (y1 - y0) / mapHeight)))
                        .translate(-(x0 + x1) / 2 , -(y0 + y1) / 2 ),
                    d3.pointer(event, svg.node())
                );

            }

        }


        function drawFilterButtons(filterSet){
            //button group
            const filterButtonGroup = baseSvg.selectAll(".filterButtonGroup" + myClass)
                .data(filterSet)
                .join(function(group){
                    var enter = group.append("g").attr("class","filterButtonGroup" + myClass);
                    enter.append("rect").attr("class","filterButtonRect filterButtonRect");
                    enter.append("text").attr("class","filterButtonText");
                    return enter;
                });
            filterButtonGroup.select(".filterButtonRect")
                .style("fill","#707070")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("id",d => d)
                .attr("width",100)
                .attr("height",30)
                .attr("x",(d,i) => 10 + ((100+5) * i))
                .attr("y",10)
                .attr("rx",5)
                .attr("ry",5)
                .on("click",function(event,d){
                    var myIndex = filterSet.findIndex(f => f === d);
                    d3.selectAll(".filterButtonRect").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    d3.selectAll(".filterButtonText").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === d);
                    colorRange = seasonColors[myIndex];
                    baseSvg.call(zoom.transform,d3.zoomIdentity);
                    drawMapBar(myIndex < 2 ? true : false);
                });

            filterButtonGroup.select(".filterButtonText")
                .style("fill","white")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("text-anchor","middle")
                .attr("x",(d,i) => 10 + (100/2) + ((100+5) * i))
                .attr("y",10 + (30/2) + 5)
                .attr("rx",5)
                .attr("ry",5)
                .text(d => d);

            const buttonWidth = (filterSet.length * 100) + ((filterSet.length - 1) * 5);

            filterButtonGroup.attr("transform","translate(" +  ((width-buttonWidth)/2) + ",0)");
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
        myData.forEach(d => filterSet.add(d[filterBy]));
        filterSet = Array.from(filterSet);
        currentFilter = filterSet[0];
        drawFilterButtons(filterSet,0,"#707070",myClass + "_0",140);

        let headerLabel = d3.select("#headerDiv").text().split(" | ")[0] + " | " + currentFilter;
        let mainLabel = ""
        if(holidayMe.language === "AR"){
            mainLabel =  d3.select("#headerDiv").text().split(" | ")[0];
            headerLabel =  mainLabel + "|" + holidayMe.buttonVarsArabic[0];
        }
        d3.select("#headerDiv").text(headerLabel);
        var filterSet2 = new Set();
        myData.forEach(d => filterSet2.add(d[filterBy2]));
        filterSet2 = Array.from(filterSet2);
        currentFilter2 = filterSet2[0];

        drawFilterButtons(filterSet2,35,"#A0A0A0",myClass + "_1",120);

        let filteredData = JSON.parse(JSON.stringify(myData));
        filteredData = filteredData.filter(f => f[filterBy] === currentFilter);
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
            .style("cursor" ,"pointer")
            .attr("x",(width/2) - pyramidGap/2)
            .attr("y",margins.top - 45)
            .text(colorVars[0])
            .on("mousemove",function(){
                d3.selectAll(".histogramGroup").attr("opacity",0.2);
                d3.select(".titleRight" + myClass).attr("opacity",0.2);
                d3.selectAll(".left").attr("opacity",1);
                if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                holidayMe.mouseoverTimer = d3.timer(function(){
                    d3.selectAll(".histogramGroup").attr("opacity",1);
                    d3.select(".titleLeft" + myClass).attr("opacity",1);
                    d3.select(".titleRight" + myClass).attr("opacity",1);
                    holidayMe.mouseoverTimer.stop();
                },1500)
            })
            .on("mouseout",function(){
                d3.selectAll(".histogramGroup").attr("opacity",1);
                d3.select(".titleLeft" + myClass).attr("opacity",1);
                d3.select(".titleRight" + myClass).attr("opacity",1);
            });

        d3.select(".titleRight" + myClass)
            .style("cursor" ,"pointer")
            .attr("x",(width/2) + pyramidGap/2)
            .attr("y",margins.top - 45)
            .text(colorVars[1])
            .on("mousemove",function(){
                d3.selectAll(".histogramGroup").attr("opacity",0.2);
                d3.select(".titleLeft" + myClass).attr("opacity",0.2);
                d3.selectAll(".right").attr("opacity",1);
                if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                holidayMe.mouseoverTimer = d3.timer(function(){
                    d3.selectAll(".histogramGroup").attr("opacity",1);
                    holidayMe.mouseoverTimer.stop();
                },1500)
            })
            .on("mouseout",function(){
                d3.selectAll(".histogramGroup").attr("opacity",1);
            });

        d3.select(".titleMid" + myClass)
            .style("pointer-events" ,"none")
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
            .call(d3.axisLeft(yScale).tickFormat(d => d +  " *"))
            .attr("transform","translate(" + (width/2) + "," +  margins.top + ")");

        d3.selectAll(".yAxis" + myClass + " .tick text")
            .attr("x",0)
            .style("text-anchor" ,"middle")
            .style("cursor" ,"pointer")
            .on("mousemove",function(event,d){
                d3.selectAll(".histogramGroup").attr("opacity",0.2);
                d3.selectAll("#p" + d.replace(/ /g,"").replace(/&/g,"")).attr("opacity",1);
                if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                holidayMe.mouseoverTimer = d3.timer(function(){
                    d3.selectAll(".histogramGroup").attr("opacity",1);
                    holidayMe.mouseoverTimer.stop();
                },1500)
            })
            .on("mouseout",function(){
                d3.selectAll(".histogramGroup").attr("opacity",1);
            });

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
                .call(d3.axisTop(xScale).tickSizeOuter(0).ticks(4,myFormat).tickSizeOuter(0))
                .attr("transform","translate(" + ((width/2) + (pyramidGap/2)) + "," + (margins.top - 10) + ")")

            d3.select(".xAxisRight" + myClass)
                .call(d3.axisTop(xScaleReverse).tickSizeOuter(0).ticks(4,myFormat).tickSizeOuter(0))
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
                    enter.append("rect").attr("class","histogramGroup histogramBar");
                    enter.append("text").attr("class","histogramGroup histogramText");
                    return enter;
                });

            histogramGroup.select(".histogramBar")
                .style("cursor" ,"pointer")
                .attr("class", d => "histogramGroup histogramBar " + d.position)
                .attr("id", d =>  "p" + d.binVal.replace(/ /g,"").replace(/&/g,""))
                .attr("x", d => d.position === "left" ? (width/2) - (pyramidGap/2) : (width/2) + (pyramidGap/2))
                .attr("y", d => yScale(d.binVal) + margins.top + 5)
                .attr("width", 0)
                .attr("height", yScale.bandwidth() - 10)
                .on("mousemove",function(){
                    d3.selectAll(".histogramGroup").attr("opacity",0.2);
                    d3.selectAll("#" + this.id).attr("opacity",1);
                    if(holidayMe.mouseoverTimer !== ""){holidayMe.mouseoverTimer.stop()};
                    holidayMe.mouseoverTimer = d3.timer(function(){
                        d3.selectAll(".histogramGroup").attr("opacity",1);
                        holidayMe.mouseoverTimer.stop();
                    },1500)
                })
                .on("mouseout",function(){
                    d3.selectAll(".histogramGroup").attr("opacity",1);
                })
                .style("fill", d => d.fill)
                .transition()
                .duration(1000)
                .attr("x", d => d.position === "left" ? (width/2) - (pyramidGap/2) - xScale(d.value) : (width/2) + (pyramidGap/2))
                .attr("width", d => xScale(d.value))


            histogramGroup.select(".histogramText")
                .attr("id", d =>  "p" + d.binVal.replace(/ /g,"").replace(/&/g,""))
                .attr("pointer-events","none")
                .attr("class", d => "histogramGroup histogramText " + d.position)
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
                .attr("height",30)
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
                        let headerLabel = d3.select("#headerDiv").text().split(" | ")[myIndex] + " | " + currentFilter
                        if(holidayMe.language === "AR"){
                            headerLabel =  mainLabel + " | " +  holidayMe.buttonVarsArabic[myIndex];
                        }
                        d3.select("#headerDiv").text(headerLabel);
                    } else {
                        currentFilter2 = d;
                        myIndex = filterSet2.findIndex(f => f === d);
                    }
                    d3.selectAll(".pyramidFilterButtonRect#" + this.id).attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    d3.selectAll(".pyramidFilterButtonText#" + this.id).attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === currentFilter);
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
                .attr("y", (30/2) + 5.5 + buttonY)
                .text((d,i) => holidayMe.language === "AR" && myFilterSet.length === 2 ? holidayMe.buttonVarsArabic[i] : d);

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
            .style("fill",getButtonFill)
            .attr("class",(d,i) => i < 4 ? "buttonRect buttonRect" + myClass + " topButton" : "buttonRect buttonRect" + myClass + " bottomButton")
            .attr("id",(d,i) => "button" + i)
            .attr("width",buttonWidth)
            .attr("height",buttonHeight)
            .attr("x",(d,i) => ((buttonWidth+5) * (i > 3 ? i - 4 : i)))
            .attr("y",(d,i) => startY + (i > 3 ? (buttonHeight + 10): 0))
            .attr("rx",5)
            .attr("ry",5);

        buttonGroup.select(".buttonText")
            .attr("class",(d,i) => i < 4 ? "buttonText topButton" : "buttonText bottomButton")
            .attr("text-anchor","middle")
            .style("fill",getButtonTextFill)
            .attr("height",buttonHeight)
            .attr("x",(d,i) => (buttonWidth/2) + ((buttonWidth+5) * (i > 3 ? i - 4 : i)))
            .attr("y",(d,i) => startY + (buttonHeight/2) + 6 + (i > 3 ? (buttonHeight + 10): 0))
            .attr("rx",5)
            .attr("ry",5)
            .text(d => d);

        const buttonX = (buttonWidth * 4) + ((5 * 3));
        const buttonX2 = (buttonWidth * 3) + ((5 * 3));
        d3.selectAll(".topButton").attr("transform","translate(" + ((width-buttonX)/2) + ",0)");
        d3.selectAll(".bottomButton").attr("transform","translate(" + ((width-buttonX2)/2) + ",0)");

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
        console.log(filterSet)
        let currentFilter = filterSet[0];

        drawFilterButtons(filterSet);

        const brushHeight = 50;
        myData.map(m => m.fullDate = convertDate(m.Date));

        let filteredData = myData.filter(f => f[filterBy] === filterSet[0]);

        const xExtent = d3.extent(filteredData, d => d.fullDate);
        const xScaleBrush = d3.scaleTime().domain(xExtent).range([0,width - margins.left - margins.right]);
        let xScaleChart = d3.scaleTime().domain(xExtent).range([0,width - margins.left - margins.right]);
        const weeksInvolved = d3.timeWeek.count(xExtent[0],xExtent[1]) + 1;
        const xScaleBarBrush = d3.scaleBand().domain(d3.range(0,weeksInvolved,1)).range([0,width - margins.left - margins.right]);
        let xScaleBarChart = d3.scaleBand().domain(d3.range(0,weeksInvolved,1)).range([0,width - margins.left - margins.right]);

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
            .on("brush", brushed);

        d3.select(".xAxisBrush" + myClass)
            .style("pointer-events","none")
            .call(d3.axisBottom(xScaleBrush).tickSizeOuter(0))
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom) + ")");

        redrawBarChart();

        function redrawBarChart(){

            xScaleChart = d3.scaleTime().domain(xExtent).range([0,width - margins.left - margins.right]);
            xScaleBarChart = d3.scaleBand().domain(d3.range(0,weeksInvolved,1)).range([0,width - margins.left - margins.right]);

            d3.select(".brushGroup" + myClass)
                .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - brushHeight) + ")")
                .call(brush)
                .call(brush.move, [0,width - margins.right-margins.left]);

            filteredData = filteredData.sort((a,b) => d3.ascending(a.fullDate,b.fullDate));
            filteredData.map(m => m.weekCount = d3.timeWeek.count(filteredData[0].fullDate, m.fullDate));

            const yScaleBrush = d3.scaleLinear().domain(d3.extent(filteredData, d => d.Value)).range([brushHeight,0]);
            yScaleChart = d3.scaleLinear().domain(d3.extent(filteredData, d => d.Value)).range([height - brushHeight - margins.top - margins.middle - margins.bottom,0]);
            d3.select(".yAxisChart" + myClass)
                .call(d3.axisLeft(yScaleChart).tickSizeOuter(0).ticks(5,myFormat))
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
                .style("pointer-events","none")
                .attr("x",d => margins.left + xScaleBarBrush(d.weekCount))
                .attr("y",d => yScaleBrush(d.Value) + (height - margins.bottom - brushHeight))
                .attr("width",xScaleBarBrush.bandwidth()-1)
                .attr("height", d => yScaleBrush(yScaleBrush.domain()[0]) - yScaleBrush(d.Value))
                .attr("fill",myColor[currentFilter])
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
                const filteredWeeksInvolved = d3.timeWeek.count(extent[0],extent[1]) + 1;
                xScaleBarChart.domain(d3.range(0,filteredWeeksInvolved,1));
                let filteredBarData = JSON.parse(JSON.stringify(filteredData));
                filteredBarData.map(m => m.fullDate = new Date(m.fullDate));
                filteredBarData = filteredBarData.filter(f => f.fullDate >= extent[0] && f.fullDate <= extent[1]);
                filteredBarData.map(m => m.weekCount = d3.timeWeek.count(extent[0], m.fullDate));
                drawChartBar(filteredBarData,1000)
            }

        }

        function drawChartBar(myFilteredBarData,transitionTime){

            d3.select(".xAxisChart" + myClass)
                .style("pointer-events","none")
                .transition()
                .duration(transitionTime)
                .call(d3.axisBottom(xScaleChart).tickSizeOuter(0))
                .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - margins.middle - brushHeight) + ")")

            //button group
            const chartBarData = svg.selectAll(".chartBarGroup" + myClass)
                .data(myFilteredBarData, d => d.weekCount)
                .join(function(group){
                    var enter = group.append("g").attr("class","chartBarGroup" + myClass);
                    enter.append("rect").attr("class","chartBar");
                    return enter;
                });

            chartBarData.select(".chartBar")
                .style("pointer-events","none")
                .attr("x",d => margins.left + xScaleBarChart(d.weekCount))
                .attr("y",d => height - margins.bottom - margins.middle - brushHeight)
                .attr("width",xScaleBarChart.bandwidth()-1)
                .attr("fill",myColor[currentFilter])
                .attr("height", 0)
                .transition()
                .duration(transitionTime === 0 ? 1000 : 0)
                .attr("y",d => yScaleChart(d.Value) + margins.top)
                .attr("height", d => yScaleChart(yScaleChart.domain()[0]) - yScaleChart(d.Value))
            ;

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
                .style("fill","#707070")
                .attr("id",d => d)
                .attr("width",100)
                .attr("height",30)
                .attr("x",(d,i) => 10 + ((100+5) * i))
                .attr("y",10)
                .attr("rx",5)
                .attr("ry",5)
                .on("click",function(event,d){
                    var myIndex = filterSet.findIndex(f => f === d);
                    d3.selectAll(".filterButtonRect").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    d3.selectAll(".filterButtonText").attr("opacity", (d,i) => i === myIndex ? 1 : 0.2);
                    filteredData = JSON.parse(JSON.stringify(myData)).filter(f => f[filterBy] === d);
                    filteredData.map(m => m.fullDate = new Date(m.fullDate));
                    currentFilter = filterSet[myIndex];
                    redrawBarChart();
                });

            filterButtonGroup.select(".filterButtonText")
                .style("pointer-events","none")
                .attr("opacity", (d,i) => i === 0 ? 1 : 0.2)
                .attr("text-anchor","middle")
                .attr("height",15)
                .attr("x",(d,i) => 10 + (100/2) + ((100+5) * i))
                .attr("y",10 + (30/2) + 5)
                .attr("rx",5)
                .attr("ry",5)
                .text((d,i) => holidayMe.language === "AR" ? holidayMe.arabicTransport[i]: d);

            const buttonWidth = (100 * filterSet.length) + (5 * (filterSet.length-1));
            filterButtonGroup.attr("transform","translate(" + ((width - buttonWidth)/2) + ",0)")
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

function networkChart() {
    //REUSABLE bar Chart

    var myData = [],
        myClass="",
        width = 0,
        height = 0;


    function my(svg) {

        const radiusBig = Math.min(width,height)/8;
        const radiusSmall = Math.min(width,height)/10;

        myData.nodes.map(m => m.fx = (m.id === 0 ? width/2 : (m.id === 1 ? ((width/2) - (radiusBig * 4)): null)));
        myData.nodes.map(m => m.fy = (m.id <= 1 ? height/2  : null));



        const simulation = d3.forceSimulation(myData.nodes)
            .force("link", d3.forceLink(myData.links).id(d => d.id).distance(radiusBig * 3))
            .force("charge",d3.forceManyBody().strength(-200))
            .force("collide", d3.forceCollide().radius(d =>  d.size === "big" ? radiusBig * 1.4 : radiusSmall * 1.4).strength(0.7))
            .force("x",  d3.forceX(width/2).strength(0.3))
            .force("y",d3.forceY(height/2).strength(0.3))
            .on("tick", ticked);


        //button group
        const linksGroup = svg.selectAll(".linksGroup" + myClass)
            .data(myData.links)
            .join(function(group){
                var enter = group.append("g").attr("class","linksGroup" + myClass);
                enter.append("line").attr("class","linkLine");
                return enter;
            });

        linksGroup.select(".linkLine")
            .attr("stroke", "#A0A0A0")
            .attr("stroke-width", 1);

        //nodes group
        const nodesGroup = svg.selectAll(".nodesGroup" + myClass)
            .data(myData.nodes)
            .join(function(group){
                var enter = group.append("g").attr("class","nodesGroup" + myClass);
                enter.append("circle").attr("class","nodeCircle");
                enter.append("text").attr("class","nodeLabel");
                enter.append("text").attr("class","nodeLabel2");
                enter.append("text").attr("class","fal nodeIcon");
                enter.append("svg:image").attr("class","nodeImage");
                return enter;
            });

        nodesGroup.select(".nodeCircle")
            .attr("fill","white")
            .attr("stroke","#A0A0A0")
            .attr("r", d => d.size === "big" ? radiusBig : radiusSmall);

        nodesGroup.select(".nodeIcon")
            .attr("text-anchor","middle")
            .attr("dy",d => d.name.split(" ").length === 1 ? -radiusSmall*0.1 : -radiusSmall*0.2)
            .attr("fill","#ED1A64")
            .attr("font-size",radiusSmall/2)
            .text(d => d.icon === undefined ? "" : d.icon);


        nodesGroup.select(".nodeImage")
            .attr("x",-radiusBig*0.75)
            .attr("y",-radiusBig*0.375)
            .attr("width",radiusBig*1.5)
            .attr("height",radiusBig*0.75)
            .attr("xlink:href", d => d.image === undefined ? "" : "flags/" + d.image);

        nodesGroup.select(".nodeLabel")
            .attr("text-anchor","middle")
            .style("fill","black")
            .style("text-transform","capitalize")
            .style("font-size","0.9em")
            .attr("y",d => d.name.split(" ").length === 1 ? radiusSmall * 0.35 : radiusSmall*0.15)
            .text(function(d) {
                return d.image !== undefined ? "" :
                    (holidayMe.language === "AR" ?
                        (d.name.split(" ").length === 1
                            ? holidayMe.arabicCountryDataset.find(f => f.Country === d.name.split(" ")[0]).Arabic
                        :holidayMe.arabicCountryDataset.find(f => f.Country === d.name.split(" ")[1]).Arabic)
                        :d.name.split(" ")[0])
            } );

        nodesGroup.select(".nodeLabel2")
            .attr("y",(radiusSmall*0.15) + 12)
            .style("fill","black")
            .attr("text-anchor","middle")
            .style("text-transform","capitalize")
            .style("font-size","0.9em")
            .text(d => d.name.split(" ").length > 1 ? (
                holidayMe.language === "AR" ? holidayMe.arabicCountryDataset.find(f => f.Country === d.name.split(" ")[0]).Arabic
                        :d.name.split(" ")[1]
            ) : "");

        const drag = d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
        }

        d3.selectAll(".nodesGroup" + myClass)
            .call(drag);

        function ticked() {

            d3.selectAll(".linkLine")
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            d3.selectAll(".nodesGroup" + myClass)
                .attr("transform", d =>  "translate(" +  d.x + "," + d.y + ")");
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


    return my;
}

function areaChart() {
    //REUSABLE area Chart

    var myData = [],
        myClass="",
        width = 0,
        height = 0,
        margins = {"left":50,"right":10,"top":50,"bottom":30,"middle":50};


    function my(svg) {

        const brushHeight = 50;

        myData = myData.sort((a,b) => d3.ascending(a.Week,b.Week));

        const xExtent = d3.extent(myData, d => d.Week);
        const xScaleBrush = d3.scaleLinear().domain(xExtent).range([0,width - margins.left - margins.right]);
        let xScaleChart = d3.scaleLinear().domain(xExtent).range([0,width - margins.left - margins.right]);

        //non data elements
        if(d3.select(".clipPath" + myClass)._groups[0][0] === null) {
            svg.append("rect").attr("class","backgroundRect" + myClass);
            svg.append("rect").attr("class","brushBackgroundRect" + myClass);
            svg.append("clipPath").attr("class","clipPath" + myClass)
                .attr("id","areaClipPath")
                .append('rect').attr('class', 'clipRect' + myClass);
            svg.append("g").attr("class"," brushGroup" + myClass);
            svg.append("g").attr("class","brushAxis xAxisBrush" + myClass);
            svg.append("g").attr("class","brushAxis xAxisChart" + myClass);
            svg.append("g").attr("class","brushAxis yAxisChart" + myClass);
            svg.append("path").attr("class","brushPath" + myClass);
            svg.append("path").attr("class","chartPath" + myClass);
            svg.append("path").attr("class","brushArea" + myClass);
            svg.append("path").attr("class","chartArea" + myClass);
            svg.append("rect").attr("class","animationRect" + myClass);
            svg.append("rect").attr("class","brushAnimationRect" + myClass);
        }


        d3.select(".backgroundRect" + myClass)
            .style("pointer-events","none")
            .style("fill","#A8679A")
            .attr("width",width - margins.left - margins.right)
            .attr("height",height - margins.top - margins.middle - margins.bottom - brushHeight)
            .attr("transform","translate(" + margins.left + "," + margins.top + ")");

        d3.select(".brushBackgroundRect" + myClass)
            .style("pointer-events","none")
            .style("fill","#A8679A")
            .attr("width",width - margins.left - margins.right)
            .attr("height",brushHeight)
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - brushHeight) + ")");

        d3.select(".animationRect" + myClass)
            .style("pointer-events","none")
            .style("fill","#A8679A")
            .attr("width",width - margins.left - margins.right)
            .attr("height",height - margins.top - margins.middle - margins.bottom - brushHeight)
            .attr("transform","translate(" + margins.left + "," + margins.top + ")")
            .transition()
            .duration(2000)
            .attr("x",width - margins.right)
            .attr("width",0);

        d3.select(".brushAnimationRect" + myClass)
            .style("fill","#A8679A")
            .style("pointer-events","none")
            .attr("x",margins.left)
            .attr("width",width - margins.left - margins.right)
            .attr("height",brushHeight)
            .attr("transform","translate(0," + (height - margins.bottom - brushHeight) + ")")
            .transition()
            .duration(2000)
            .attr("x",width - margins.right)
            .attr("width",0);;

        d3.select(".clipRect" + myClass)
            .attr("width",width - margins.left - margins.right)
            .attr("height",height - margins.top - margins.middle - margins.bottom - brushHeight);


        const brush = d3.brushX()
            .extent([[0, 0], [width - margins.right-margins.left, brushHeight]])
            .on("brush", brushed);

        d3.select(".xAxisBrush" + myClass)
            .style("pointer-events","none")
            .call(d3.axisBottom(xScaleBrush).tickSizeOuter(0))
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom) + ")");


        d3.select(".brushGroup" + myClass)
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - brushHeight) + ")")
            .call(brush)
            .call(brush.move, [0,width - margins.right-margins.left]);

        const yScaleBrush = d3.scaleLinear().domain(d3.extent(myData, d => d.Growth)).range([brushHeight,0]);
        let yScaleChart = d3.scaleLinear().domain(d3.extent(myData, d => d.Growth)).range([height - brushHeight - margins.top - margins.middle - margins.bottom,0]);

        const lineBrush = d3.line()
            .x(d => xScaleBrush(d.Week))
            .y(d => yScaleBrush(d.Growth));

        const areaBrush = d3.area()
            .x(d => xScaleBrush(d.Week))
            .y0(d => yScaleBrush(d.Growth))
            .y1(yScaleBrush(0));

        const lineChart = d3.line()
            .x(d => xScaleChart(d.Week))
            .y(d => yScaleChart(d.Growth));

        const areaChart = d3.area()
            .x(d => xScaleChart(d.Week))
            .y0(d => yScaleChart(d.Growth))
            .y1(yScaleChart(0));

        d3.select(".brushPath" + myClass)
            .style("pointer-events","none")
            .attr("stroke","#C6A5A5")
            .attr("stroke-width",2)
            .attr("fill","transparent")
            .attr("d",lineBrush(myData))
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - brushHeight) + ")");

        d3.select(".brushArea" + myClass)
            .style("pointer-events","none")
            .attr("fill","#FFDDE0")
            .attr("fill-opacity",0.4)
            .attr("stroke","transparent")
            .attr("d",areaBrush(myData))
            .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - brushHeight) + ")");


        d3.select(".yAxisChart" + myClass)
            .style("pointer-events","none")
            .call(d3.axisLeft(yScaleChart).tickSizeOuter(0).tickFormat(d => d > 0 ? d3.format(myFormat)(d):  ""))
            .attr("transform","translate(" + margins.left + "," + margins.top + ")");

       drawChartLine(myData,0);


        function brushed(event) {

            if(event.sourceEvent !== undefined){
                let extent = event.selection.map(xScaleBrush.invert, xScaleBrush);
                if(extent[1] > xExtent[1]){extent[1] = xExtent[1]};
                if(extent[0] < xExtent[0]){extent[0] = xExtent[0]};
                xScaleChart.domain(extent);
                drawChartLine(1000)
            }

        }

        function drawChartLine(transitionTime){

            d3.select(".chartPath" + myClass)
                .style("pointer-events","none")
                .attr('clip-path', 'url(#areaClipPath)')
                .attr("stroke","#C6A5A5")
                .attr("stroke-width",2)
                .attr("fill","transparent")
                .attr("d",lineChart(myData))
                .attr("transform","translate(" + margins.left + "," + margins.top + ")");

            d3.select(".chartArea" + myClass)
                .style("pointer-events","none")
                .attr('clip-path', 'url(#areaClipPath)')
                .attr("fill","#FFDDE0")
                .attr("fill-opacity",0.4)
                .attr("stroke","transparent")
                .attr("d",areaChart(myData))
                .attr("transform","translate(" + margins.left + "," + margins.top + ")");


            d3.select(".xAxisChart" + myClass)
                .style("pointer-events","none")
                .transition()
                .duration(transitionTime)
                .call(d3.axisBottom(xScaleChart).tickSizeOuter(0))
                .attr("transform","translate(" + margins.left + "," + (height - margins.bottom - margins.middle - brushHeight) + ")")

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

    my.myFormat = function(value) {
        if (!arguments.length) return myFormat;
        myFormat = value;
        return my;
    };

    return my;
}

function getButtonFill(d){

    if(holidayMe.selectedButton === d){
        return "#7F85AF";
    } else {
        return "#E8E4E6";
    }
}

function getButtonTextFill(d){

    if(holidayMe.selectedButton === d){
        return "white";
    } else {
        return "#A8679A";
    }
}
