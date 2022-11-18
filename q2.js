d3.csv("People.csv").then(
    function(dataset){

    d3.json("map.json").then(function(mapdata){    

//===================== Data prep ====================
    
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
    var minValue = d3.min(debutYears)
    var maxValue = d3.max(debutYears)
    select = document.getElementById('year');

    for (var i = maxValue; i >= minValue; i--) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i;
        select.appendChild(opt);
      }

    var size = 1000
    var dimensions = ({
        width: size, 
        height: size/2,
        margin: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        }
        })
    var svg = d3.select("#map").attr("width", dimensions.width)
                                .attr("height", dimensions.height)
    var projection = d3.geoEqualEarth() //geoOrthographic() //geoMercator()
                                .fitWidth(dimensions.width, {type: "Sphere"})
    var pathGenerator = d3.geoPath(projection)
    var earth = svg.append("path")
                        .attr("d", pathGenerator({type: "Sphere"}))
                        .attr("fill", "lightblue")
    var graticule = svg.append("path")
                        .attr("d", pathGenerator(d3.geoGraticule10()))
                        .attr("stroke", "gray")
                        .attr("fill", "none")
    
    var tip = d3.select("body").append("div")
                .attr("id", "tooltip")  
                .style("opacity", 0)
                .attr('style', 'position: absolute;')

    var mouseover = function(d, i) {
        count = 0
        for (var j = 0; j < dataset.length; j++){
            try{
                if( dataset[j].debut == select.value){

                    if (dataset[j].birthCountry == i.properties.ADMIN){
                        count += 1
                    }
                    else if(dataset[j].birthCountry == i.properties.ABBREV) {
                        count += 1
                    }
                    else if (dataset[j].birthCountry == i.properties.ADM0_A3){ 
                        count += 1
                    }

                } else {
                    continue
                }    
            } catch(error){
                console.log(dataset[j])
            }
        }
        console.log(d)
        tip.style("opacity", 1)
            .style("color", "black")
            .style("left", d.layerX + 'px')
            .style("top", d.layerY + 'px')
            .text(i.properties.ADMIN + " " + count)        
        }
    
    var countries = svg.append("g")
    .selectAll(".country")
    .data(mapdata.features)
    .enter()
    .append("path")
    .on("mouseover", mouseover)
    .attr("class", "country")
    .attr("d", d => pathGenerator(d))
    .style("fill", "white")
    .style("stroke", "black")

    })
}
)