
d3.csv("People.csv").then(
    function(dataset){
    d3.json("map.json").then(function(mapdata){    
        
        var maxValue = 0
        var minValue = 0
        var countries = ""
        var colors = ""
        var color_countries = {}
//===================== Data prep ====================
        function data_prep(){

            for (var i = 0; i < dataset.length; i++) {

                //1. Extract year from debut year
                dataset[i].debut = dataset[i].debut.substring(0,4)  
                
                //2. Handle blanks
                if(dataset[i].debut == ""){
                    dataset[i].debut = "Not available"
                }
                
                if(dataset[i].birthCountry == ""){
                    dataset[i].birthCountry = "Not available"
                }
        
                if(dataset[i].nameGiven == ""){
                    dataset[i].nameGiven = dataset[i].nameLast
                }
        
            }
            //3. Remove unnecessary columns
            var data = dataset.map(function(d) {
                return {
                    playerID: d.playerID,
                    nameGiven: d.nameGiven,
                    debut: d.debut,
                    birthCountry: d.birthCountry
                }
                })
            var debutYears = []
            dataset.map( function(d){
                if(d.debut != "Not available"){
                    debutYears.push(d.debut)
                }
                
            })
            minValue = d3.min(debutYears)
            maxValue = d3.max(debutYears)

            for (var i = maxValue; i >= minValue; i--) {
                
                Object.assign(color_countries, {[i]: {}})

                for( var j = 0; j <= dataset.length; j++){
                    
                    if(dataset[j] != undefined){

                        if( dataset[j].debut == i){

                            if(color_countries[i][dataset[j].birthCountry] == undefined){
                                Object.assign(color_countries[i], {[dataset[j].birthCountry]: parseInt(0)})
                            } else if (color_countries[i][dataset[j].birthCountry] != undefined){
                                color_countries[i][dataset[j].birthCountry] += 1
                            } 
                        
                        }
       
                    }
                    
                }
                
            }           
        
        }
        
//===================== Visualization ====================
    function visualize(){
        var box = document.getElementsByClassName("q2")
        
        colors = d3.scaleSequential().domain([0, 10]).range(["white","#8E4C6A"])
        
        var dimensions = ({
            width: box[0].clientWidth, 
            height: box[0].clientHeight,
            margin: {
                top: 0,
                bottom: 0,
                right: 0,
                left: 0
              }
            })

        console.log("width", box[0].clientWidth, "height", box[0].clientHeight)
        var svg = d3.select("#map").attr("width", dimensions.width - dimensions.margin.right - dimensions.margin.left)
                                    .attr("height", dimensions.height - dimensions.margin.top - dimensions.margin.bottom)
        
        var legend_svg = d3.select("#legend").attr("width",(3*box[0].clientWidth)/4)
        var defs = legend_svg.append('defs');
        var linearGradient = defs.append('linearGradient')
		                        .attr('id', 'linear-gradient');

        linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        
        //Set the color for the start (0%)
        linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white"); //light blue

        //Set the color for the end (100%)
        linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#8E4C6A"); //dark blue

        // draw the rectangle and fill with gradient
        legend_svg.append("rect")
            .attr("x", 10)
            .attr("y",  80)
            .attr("width", 20)
            .attr("height", 200)
            .attr("z-index", 100)
            .style("fill", "url(#linear-gradient)");
        
        legend_svg.append("text")
                .attr("x", 0)
                .attr("y", 90)
                .text("0")

        legend_svg.append("text")
        .attr("x", 0)
        .attr("y", 275)
        .text("225")

        var projection = d3.geoEqualEarth() //geoMercator() geoEqualEarth()
                                    .fitWidth(dimensions.width, {type: "Sphere"})
                                    .scale(80)
                                    .center([0,0])
                                    // .rotate([0, -30])
                                    // .clipAngle(90)
        var ranks = document.getElementById("ranks")
        const initialScale = projection.scale();
        var pathGenerator = d3.geoPath(projection)
        var earth = svg.append("path")
                        .attr("d", pathGenerator({type: "Sphere"}))
                        .attr("fill", "#00000000")
                        //#7393B3 #ddddff #00000000
        
        var graticule = svg.append("path")
                            .attr("d", pathGenerator(d3.geoGraticule10()))
                            .attr("fill", "none")
      
        var tip = d3.select("body").append("div")
                    .attr("id", "tooltip")  
                    .style("opacity", 0)
                    .attr('style', 'position: absolute;')

        var count = 0
        var mouseover = function(d, i) {
            
            //get count from color_countries
            count = color_countries[slider.value][i.properties.ADMIN]
            
            if(count == undefined){
                count = color_countries[slider.value][i.properties.ABBREV]
            }
            if (count == undefined){
                count = color_countries[slider.value][i.properties.ADM0_A3]
            }
            if(count == undefined){
                count = 0
            }            
            
            tip.style("opacity", 1)
                .style("color", "black")
                .style("left", d.clientX + 'px')
                .style("top", d.clientY + 'px')
                .text(i.properties.ADMIN + " " + count)
            
        }

        var dragging = function(d){
            var c = projection.rotate();
            var sensitivity = 75
            const k = sensitivity / projection.scale()
            
            projection.rotate([c[0] + d.dx*k, c[1] - d.dy*k])
            path = d3.geoPath(projection)
            
            svg.selectAll("path").attr("d", pathGenerator)
            
            
           }
        
        var drag = d3.drag()
        .on("drag", dragging)
       

        countries = svg.append("g")
        .selectAll(".country")
        .data(mapdata.features)
        .enter()
        .append("path")
        .on("mouseover", mouseover)
        .attr("class", "country")
        .attr("d", d => pathGenerator(d))
        .style("fill", function(d, i){
            if(d.properties.ADMIN=="United States of America"){
                return "#8E4C6A"
            }
            count = color_countries[slider.value][d.properties.ADMIN]
            if(count>10){
                return "#8E4C6A"
            }
            if(count == undefined){
                count = color_countries[slider.value][d.properties.ABBREV]
            }
            if (count == undefined){
                count = color_countries[slider.value][d.properties.ADM0_A3]
            }
            if(count == undefined){
                count = 0
            }            
            
            return colors(count)
        })
        .style("stroke", "black")
        .call(drag)
        
    }


    var slider = document.getElementById("year")
    data_prep()
    visualize()
    
    slider.onchange = ()=>{

        
        countries.style("fill", (d, i)=>{
                       
            if(d.properties.ADMIN=="United States of America"){
                return "#702963"
            }
            count = color_countries[slider.value][d.properties.ADMIN]
            
            if(count == undefined){
                count = color_countries[slider.value][d.properties.ABBREV]
            }
            if (count == undefined){
                count = color_countries[slider.value][d.properties.ADM0_A3]
            }
            if(count == undefined){
                count = 0
            }
            
            return colors(count)
        })
    }  

    })
}
)
