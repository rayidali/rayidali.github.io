
d3.csv("totals_sorted.csv").then(

  //object in which data will live
  function(dataset) { // dataset is an object contained in file
    //console.log(dataset)

    // Scatter plot dimensions
    var dimensions = {
      width: 800,
      height: 800,
      margin: {
        top: 10,
        bottom: 50,
        right: 10,
        left: 50
      }
    }

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

    var xScale = d3.scaleBand()
      .domain(years)
      .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
      .padding([0.1])

    var nl_hits = d3.map(dataset, d => +d.NL_hits)
    //console.log("nl_hits", nl_hits)
    var yScale = d3.scaleLinear()
      .domain([0, d3.max(nl_hits)])
      .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top])

    var svg = d3.select("#line_chart")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      //.style("background-color", "green")

    //xAxis = d3.axisBottom()
    //  .scale(xScale)

    //svg.append("g")
    //  .attr("class", "axis")
    //  .attr("transform", "translate(0,620)")
    //  .call(xAxis)
    //  .append("text")
    //  .attr("x", (900+70)/2)
    //  .attr("y", "50")
    //  .text("year")

    
    yAxis = d3.axisLeft()
      .scale(yScale)
      .ticks(25)

    svg.append("g")
      .attr("class", "axis")
      //.attr("transform", `translate(${dimensions.margin.left},20)`)
      .attr("transform", `translate(${70},20)`)
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", "-150")
      .attr("y", "-50")
      .attr("text-anchor", "end")
      .attr("some text")

      //var line = d3.line()
      //  .x(d => xScale(+d.Year))
      //  .y(d => yScale(+d.NL_hits)).curve(d3.curveCardinal)

      //console.log("line", line)

    // select path - three types: curveBasis, curveStep, curveCardinal
    svg.selectAll(".line")
      .append("g")
      .attr("class", "line")
      .data(dataset)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 2)
      .attr("d", function (d) {
        var line = d3.line()
          .x(d => xScale(+d.Year))
          .y(d => yScale(+d.NL_hits)).curve(d3.curveCardinal)
        return line
      })

    svg.selectAll("circle")
      .append("g")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("r", 2)
      .attr("cx", d => xScale(+d.Year))
      .attr("cy", d => yScale(+d.NL_hits))
      .style("fill", "red")



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
