
d3.csv("totals_sorted.csv").then(

  //object in which data will live
  function(dataset) { // dataset is an object contained in file
    //console.log(dataset)

    // Scatter plot dimensions
    var dimensions = {
      width: 1000,
      height: 800,
      margin: {
        top: 10,
        bottom: 50,
        right: 10,
        left: 50
      }
    }

    const NLColor = "#377eb8"
    const ALColor = "#e41a1c"

    var NLTextLegend = "National League Hits"
    var ALTextLegend = "American League Hits"

    dimensions.boundedWidth = dimensions.width - dimensions.margin.right - dimensions.margin.left
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    console.log(dataset)

    //var xNLAccessor = d => +d.NL_hits
    //var xALAccessor = d => +d.AL_hits

    var xNLAccessor = d => +d.NL_hits
    var xALAccessor = d => +d.AL_hits
    //var years = d3.map(dataset, d => {
    //  console.log("d", d)
    //  console.log("d.Year", d.Year)
    //  console.log("typeof(d.Year)", typeof(d.Year))
    //  console.log("typeof(+d.Year)", typeof(+d.Year))
    //  return +d.Year
    //})
    var years = d3.map(dataset, d => +d.Year)
    console.log("years", years)

    //var nl_hits = d3.map(dataset, d => +d.NL_hits)
    var nl_x = d3.map(dataset, xNLAccessor)
    var nl_max_x = d3.max(nl_x)
    console.log("nl_x", nl_x)

    var al_x = d3.map(dataset, xALAccessor)
    var al_max_x = d3.max(al_x)
    console.log("al_hits", al_x)

    var max_x = Math.max(d3.max(nl_x), d3.max(al_x))
    console.log("al_max_x", al_max_x)
    console.log("nl_max_x", nl_max_x)
    console.log("max_x", max_x)

    var xScale = d3.scaleBand()
      .domain(years)
      //.range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
      //.padding([0.1])
      .range([0,dimensions.boundedWidth]).padding(0.2)

    var yScale = d3.scaleLinear()
      //.domain([0, d3.max(nl_hits)])
      .domain([0, max_x])
      //.range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top])
      .range([dimensions.boundedHeight,0]);

    var svg = d3.select("#line_chart")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      //.style("background-color", "green")

    var bounds = svg.append("g")
      .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)

    //NL = blue
    // select path - three types: curveBasis, curveStep, curveCardinal
    var NL = bounds.selectAll(".line")
      .append("g")
      .attr("class", "line")
      .data([dataset])
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", NLColor)
      .attr("stroke-width", 2)
      .attr("d", d3.line()
          .x(d => xScale(+d.Year))
          .y(d => yScale(xNLAccessor(d))).curve(d3.curveLinear)
       )

    NL.selectAll("circle")
      .append("g")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("r", 1.5)
      .attr("cx", d => xScale(+d.Year))
      .attr("cy", d => yScale(xNLAccessor(d)))
      .style("fill", "black")

    //AL = red
    var AL = bounds.selectAll(".line")
      .append("g")
      .attr("class", "line")
      .data([dataset])
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", ALColor)
      .attr("stroke-width", 2)
      .attr("d", d3.line()
          .x(d => xScale(+d.Year))
          .y(d => yScale(xALAccessor(d))).curve(d3.curveLinear)
       )

    AL.selectAll("circle")
      .append("g")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("r", 1.5)
      .attr("cx", d => xScale(+d.Year))
      .attr("cy", d => yScale(xALAccessor(d)))
      .style("fill", "black")

    var xAxis = d3.axisBottom(xScale)
      .tickValues(xScale.domain().filter(function(d,i){ return !(i%4)})).tickSizeOuter(0)

    svg.append("g")
      .attr("transform", "translate("+ dimensions.margin.left + "," + (dimensions.boundedHeight+dimensions.margin.bottom/4) + ")")
      .call(xAxis)
      .selectAll("text")	
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    var yAxis = d3.axisLeft(yScale)

    var changing_axis = svg.append("g")
      .attr("transform", "translate("+dimensions.margin.left+","+ dimensions.margin.top +")")
      .call(yAxis)

    // NL Legend
    bounds.append("circle")
      .attr("cx", 30)
      .attr("cy", 20)
      .attr("r", 6)
      .style("fill", NLColor)

    var NLLegend = bounds
      .append("text")
      .attr("id", "NLLegend")
      .attr("x", 50)
      .attr("y", 20)
      .text(NLTextLegend)
      .style("font-size", "15px")
      .attr("alignment-baseline","middle")

    // AL Legend
    bounds.append("circle")
      .attr("cx", 30)
      .attr("cy", 40)
      .attr("r", 6)
      .style("fill", ALColor)

    var ALLegend = bounds
      .append("text")
      .attr("id", "ALLegend")
      .attr("x", 50)
      .attr("y", 40)
      .text(ALTextLegend)
      .style("font-size", "15px")
      .attr("alignment-baseline","middle")

    //ON CLICK
    d3.select("#hrs").on("click", function() {
      console.log("Hrs clicked")
      xNLAccessor = d => +d.NL_hrs
      xALAccessor = d => +d.AL_hrs
      
      NLTextLegend = "National League HRs"
      ALTextLegend = "National League HRs"

      update()
    })

    d3.select("#hits").on("click", function() {
      console.log("Hits clicked")
      xNLAccessor = d => +d.NL_hits
      xALAccessor = d => +d.AL_hits

      NLTextLegend = "National League Hits"
      ALTextLegend = "American League Hits"
      update()
    })

    d3.select("#runs").on("click", function() {
      console.log("Runs clicked")
      xNLAccessor = d => +d.NL_runs
      xALAccessor = d => +d.AL_runs

      NLTextLegend = "National League Runs"
      ALTextLegend = "American League Runs"
      update()
    })

    function update() {

      console.log("updating yScale")
      nl_x = d3.map(dataset, xNLAccessor)
      nl_max_x = d3.max(nl_x)
      al_x = d3.map(dataset, xALAccessor)
      al_max_x = d3.max(al_x)
      max_x = Math.max(d3.max(nl_x), d3.max(al_x))

      console.log("max_x", max_x)
      yScale
        .domain([0, max_x])

      console.log("updating chart")
      NL.transition()
        .attr("d", d3.line()
            .x(d => xScale(+d.Year))
            .y(d => yScale(xNLAccessor(d))).curve(d3.curveLinear)
        )
        
      var al_x = d3.map(dataset, xALAccessor)

      AL.transition()
        .attr("d", d3.line()
            .x(d => xScale(+d.Year))
            .y(d => yScale(xALAccessor(d))).curve(d3.curveCardinal)
        )

      changing_axis.transition()
        .call(yAxis)

      console.log("updating labels")
      d3.select("#NLLegend") 
        .text(NLTextLegend)
      d3.select("#ALLegend") 
        .text(ALTextLegend)
    }



  }
)
