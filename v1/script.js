
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

    dimensions.boundedWidth = dimensions.width - dimensions.margin.right - dimensions.margin.left
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    console.log(dataset)

    //var years = d3.map(dataset, d => {
    //  console.log("d", d)
    //  console.log("d.Year", d.Year)
    //  console.log("typeof(d.Year)", typeof(d.Year))
    //  console.log("typeof(+d.Year)", typeof(+d.Year))
    //  return +d.Year
    //})
    var years = d3.map(dataset, d => +d.Year)
    console.log("years", years)

    var nl_hits = d3.map(dataset, d => +d.NL_hits)
    var nl_max_hits = d3.max(nl_hits)
    console.log("nl_hits", nl_hits)

    var al_hits = d3.map(dataset, d => +d.AL_hits)
    var al_max_hits = d3.max(al_hits)
    console.log("al_hits", al_hits)

    var max_hits = Math.max(d3.max(nl_hits), d3.max(al_hits))
    console.log("al_max_hits", al_max_hits)
    console.log("nl_max_hits", nl_max_hits)
    console.log("max_hits", max_hits)

    var xScale = d3.scaleBand()
      .domain(years)
      //.range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
      //.padding([0.1])
      .range([0,dimensions.boundedWidth]).padding(0.2)

    var yScale = d3.scaleLinear()
      //.domain([0, d3.max(nl_hits)])
      .domain([0, max_hits])
      //.range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top])
      .range([dimensions.boundedHeight,0]);

    var svg = d3.select("#line_chart")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      //.style("background-color", "green")

    var bounds = svg.append("g")
      .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)

    //NL_hits
    // select path - three types: curveBasis, curveStep, curveCardinal
    bounds.selectAll(".line")
      .append("g")
      .attr("class", "line")
      .data([dataset])
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 2)
      .attr("d", d3.line()
          .x(d => xScale(+d.Year))
          //.y(d => yScale(+d.NL_hits)).curve(d3.curveCardinal)
          .y(d => yScale(+d.NL_hits)).curve(d3.curveLinear)
       )

    bounds.selectAll("circle")
      .append("g")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("r", 1.5)
      .attr("cx", d => xScale(+d.Year))
      .attr("cy", d => yScale(+d.NL_hits))
      .style("fill", "red")

    //AL_hits
    bounds.selectAll(".line")
      .append("g")
      .attr("class", "line")
      .data([dataset])
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("d", d3.line()
          .x(d => xScale(+d.Year))
          //.y(d => yScale(+d.NL_hits)).curve(d3.curveCardinal)
          .y(d => yScale(+d.AL_hits)).curve(d3.curveLinear)
       )

    bounds.selectAll("circle")
      .append("g")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("r", 1.5)
      .attr("cx", d => xScale(+d.Year))
      .attr("cy", d => yScale(+d.AL_hits))
      .style("fill", "blue")

    var xAxis = d3.axisBottom(xScale)
      .tickValues(xScale.domain().filter(function(d,i){ return !(i%3)})).tickSizeOuter(0)

    svg.append("g")
      .attr("transform", "translate("+ dimensions.margin.left + "," + (dimensions.boundedHeight+dimensions.margin.bottom/4) + ")")
      .call(xAxis)
      .selectAll("text")	
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    var yAxisGen = d3.axisLeft().scale(yScale)
    var yAxis = svg.append("g")
      .call(yAxisGen)
      .style("transform", `translateX(${dimensions.margin.left}px)`)

    //svg.append("g")
    //  .selectAll("g")
    //  .data(dataset)
    //  .enter()
    //  .append("path")
    //  .attr("fill", "blue")
    //  .attr("stroke", "blue")
    //  .attr("stroke-width", 1.5)
    //  .attr("d", d3.line()
    //    .x(xScale(d => +d.Year))
    //    .y(yScale(d => +d.NL_hits))
    //  )

//
//    //console.log(svg)
//
//    console.log(d3.extent(dataset, d => d["dewPoint"]))
//
//    console.log(
//      //d3.extent --> get max and min values of given parameter
//      //d3.extent(dataset, d => d.dewPoint) 
//      //d3.extent(dataset, d => d["dewPoint"]) 
//      /* 
//       * Same way but debugging
//      d3.extent(dataset, d => {
//        console.log(d.humidity)
//        return d.humidity
//      })
//      */
//    )
//
//
//    var xAxisGen = d3.axisBottom().scale(xScale) // create axis
//
//    var xAxis = svg.append("g")
//      .call(xAxisGen) 
//      .style("transform", `translateY(${dimensions.height-dimensions.margin.bottom}px)`)
//
//    var yAxisGen = d3.axisLeft().scale(yScale)
//    var yAxis = svg.append("g")
//      .call(yAxisGen)
//      .style("transform", `translateX(${dimensions.margin.left}px)`)

  }
)
