
//d3.csv("all_years.csv").then(
d3.csv("totals_sorted.csv").then(

  //object in which data will live
  function(dataset) { // dataset is an object contained in file
    //console.log(dataset)

    // Scatter plot dimensions
    var dimensions = {
      width: 1000,
      height: 800,
      margin: {
        top: 15,
        bottom: 50,
        right: 10,
        left: 50
      }
    }

    const NLColor = "#377eb8"
    const ALColor = "#e41a1c"

    dimensions.boundedWidth = dimensions.width - dimensions.margin.right - dimensions.margin.left
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    console.log("dataset", dataset)

    var parseDate = d3.timeParse("%Y")

    var dates = dataset.map((d, i) => {
      return {
        date: parseDate(d.Year),
        //nl_hits: +d.NL_hits,
        //nl_runs: +d.NL_runs,
        //nl_hrs: +d.NL_hrs,
        //al_hits: +d.AL_hits,
        //al_runs: +d.AL_runs,
        //al_hrs: +d.AL_hrs
      }
    })

    console.log("dates", dates)
    //console.log("dates[0]", dates[0])

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
    //console.log("years", years)


    //var xScale = d3.scaleBand()
    //  .domain(years)
    //  //.range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
    //  //.padding([0.1])
    //  .range([0,dimensions.boundedWidth]).padding(0.2)

    // Gets slider input change
    var slider = d3.select("#myRange")
      slider.on("input", function() {
        var year = this.value
        console.log("year", year)
        console.log("typeof", typeof(year))
        updateToolBoxContent(year)
        showLine()
        showCircles()
        updateToolBoxLineCircles(null, null, year)
        
    })


    var xDomain = d3.extent(dates, d => d.date)
    //console.log("xDomain", xDomain)

    var xScale = d3.scaleTime()
      .domain(xDomain)
      //.domain(d3.extent(date, d => d.date))
      .range([0,dimensions.boundedWidth])//.padding(0.2)

    var chart = d3.select(".q1")
    var svg = chart.append("svg")
      .attr("id", "v1")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

    //var svg = d3.select("#v1")
    //  .attr("width", dimensions.width)
    //  .attr("height", dimensions.height)
    //  //.style("background-color", "green")

    var bounds = svg.append("g")
      .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)

    var padding = 20


    var NLHrsAccessor = d => +d.NL_hrs
    var ALHrsAccessor = d => +d.AL_hrs
    var yHrsRange = [dimensions.boundedHeight,(2*dimensions.boundedHeight/3) + padding]
    var maxHrs = Math.max(d3.max(d3.map(dataset, NLHrsAccessor)), d3.max(d3.map(dataset, ALHrsAccessor)))
    //drawGraph(NLHrsAccessor, ALHrsAccessor, maxHrs, yHrsRange, ".line", "Home Runs")

    var NLRunsAccessor = d => +d.NL_runs
    var ALRunsAccessor = d => +d.AL_runs
    var yRunsRange = [(dimensions.boundedHeight/3) - padding, 0]
    var maxRuns = Math.max(d3.max(d3.map(dataset, NLRunsAccessor)), d3.max(d3.map(dataset, ALRunsAccessor)))
    //drawGraph(NLRunsAccessor, ALRunsAccessor, maxRuns, yRunsRange, ".line3", "Runs")

    var NLHitsAccessor = d => +d.NL_hits
    var ALHitsAccessor = d => +d.AL_hits
    var yHitsRange = [(2*dimensions.boundedHeight/3), dimensions.boundedHeight/3]
    var maxHits = Math.max(d3.max(d3.map(dataset, NLHitsAccessor)), d3.max(d3.map(dataset, ALHitsAccessor)))
    //drawGraph(NLHitsAccessor, ALHitsAccessor, maxHits, yHitsRange, ".line2", "Hits")

    var lines = [
      { id: "nlRuns",
        accessor:NLRunsAccessor,
        max: maxRuns,
        range: yRunsRange,
        color: NLColor
      }, 
      { id: "alRuns",
        accessor:ALRunsAccessor,
        max: maxRuns,
        range: yRunsRange,
        color: ALColor
      }, 
      { id: "nlHits",
        accessor:NLHitsAccessor,
        max: maxHits,
        range: yHitsRange,
        color: NLColor
      }, 
      { id: "alHits",
        accessor:ALHitsAccessor,
        max: maxHits,
        range: yHitsRange,
        color: ALColor
      }, 
      { id: "nlHrs",
        accessor:NLHrsAccessor,
        max: maxHrs, 
        range:yHrsRange,
        color: NLColor
      }, 
      { id: "alHrs",
        accessor:ALHrsAccessor,
        max: maxHrs, 
        range: yHrsRange,
        color: ALColor
      }, 
    ]

    function drawGraph(NLAccessor, ALAccessor, max, yRange, line_id, title) {
    //function drawGraph(max, yRange, line_id, title) {
      console.log("executed drawGraph")
      //var nl = d3.map(dataset, NLAccessor)
      //var al = d3.map(dataset, ALAccessor)

      //var max = Math.max(d3.max(nl), d3.max(al))
      //var max = Math.max(d3.max(d3.map(dataset, NLAccessor)), d3.max(d3.map(dataset, ALAccessor)))

      var NLTextLegend = "National League " + title
      var ALTextLegend = "American League " + title

      var yScale = d3.scaleLinear()
        .domain([0, max])
        .range(yRange)
      
      var NL = bounds.selectAll(line_id)
      //var NL = mouseG.selectAll(line_id)
        .append("g")
        .attr("class", "line")
        .data([dataset])
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", NLColor)
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x((d,i) => {
            return xScale(dates[i].date)
          })
          .y(d => yScale(NLAccessor(d))).curve(d3.curveLinear)
         )
        .on("mouseover", function() {
          console.log("Mouseover NL")
        })
        .on("click", function() {
          console.log("CLICK NL")
        })

      //AL = red
      var AL = bounds.selectAll(line_id)
      //var AL = bounds.selectAll(line_id)
        .append("g")
        .data([dataset])
        .enter()
        .append("path")
        .attr("class", "line")//added this
        .attr("fill", "none")
        .attr("stroke", ALColor)
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x((d,i) => {
            return xScale(dates[i].date)
          })
          .y(d => yScale(ALAccessor(d))).curve(d3.curveLinear)
         )
        .on("mouseover", function() {
          console.log("Mouseover NL")
        })
        .on("click", function() {
          console.log("CLICK AL")
        })

      var yAxis = d3.axisLeft(yScale)

      var changing_axis = svg.append("g")
        .attr("transform", "translate("+dimensions.margin.left+","+ dimensions.margin.top +")")
        .call(yAxis)

      // NL Legend
      bounds.append("circle")
        .attr("cx", 30)
        //.attr("cy", 20)
        .attr("cy", yRange[1] + 20)
        .attr("r", 6)
        .style("fill", NLColor)

      var NLLegend = bounds
        .append("text")
        .attr("id", "NLLegend")
        .attr("x", 50)
        .attr("y", yRange[1] + 20)
        .text(NLTextLegend)
        .style("font-size", "15px")
        .attr("alignment-baseline","middle")

      // AL Legend
      bounds.append("circle")
        .attr("cx", 30)
        .attr("cy", yRange[1] + 40)
        .attr("r", 6)
        .style("fill", ALColor)

      var ALLegend = bounds
        .append("text")
        .attr("id", "ALLegend")
        .attr("x", 50)
        .attr("y", yRange[1] + 40)
        .text(ALTextLegend)
        .style("font-size", "15px")
        .attr("alignment-baseline","middle")
    }

    var axisPad = 6 // axis formatting

    var xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeYear.every(2))
      .tickSizeOuter(axisPad*2)
      .tickSizeInner(axisPad*2)

    svg.append("g")
      .attr("transform", "translate("+ dimensions.margin.left + "," + (dimensions.boundedHeight+dimensions.margin.bottom/4) + ")")
      .call(xAxis)
      .selectAll("text")	
      .style("text-anchor", "end")
      .attr("dx", "-1.25em")
      .attr("dy", "-.3em")
      .attr("transform", "rotate(-65)");

    // 1973 year line
    bounds.append("line")
      .style("stroke", "black")
      .attr("x1", xScale(1973))
      .attr("y1", 10)
      .attr("x2", xScale(1973))
      .attr("y2", dimensions.height)

    // 1973 label
    bounds.append("text")
      //.attr("id", "ALLegend")
      .attr("x", xScale(1973))
      .attr("y", 5)
      .text("DH rule")
      .style("font-size", "15px")
      .attr("alignment-baseline","middle")
      .attr("text-align","center")
    //

    // CREATE HOVER TOOLBOX WITH VERTICAL LINE
    var lineStroke = "2px"

    //function createToolBox(id) {
    //  //toolbox = svg.append("div")
    //  toolbox = d3.select("#chart").append("div")
    //  //.attr("id", "toolbox")
    //  .style("position", "absolute")
    //  .style("background-color", "#D3D3D3")
    //  .style("padding", 6)
    //  .style("display", "none")

    //  return toolbox
    //}
    //var toolbox = createToolBox("toolbox")

    //toolbox = svg.append("div")
    //var toolbox = d3.select("#chart").append("div")
    //var toolbox = d3.select(".q1").append("div")
    //
    var toolbox = chart.append("div")
    .attr("id", "toolbox")
    .style("position", "absolute")
    .style("background-color", "#D3D3D3")
    .style("padding", 6)
    .style("display", "none")

    var mouseG = bounds.append("g")
      .attr("class", "mouse-over-effects")
      //.on("click", function() {
      //  console.log("this is a bad click")
      //})

    ///
    

    drawGraph(NLHrsAccessor, ALHrsAccessor, maxHrs, yHrsRange, ".line", "Home Runs")
    drawGraph(NLRunsAccessor, ALRunsAccessor, maxRuns, yRunsRange, ".line3", "Runs")
    drawGraph(NLHitsAccessor, ALHitsAccessor, maxHits, yHitsRange, ".line2", "Hits")
    
    //

    //Line that follows mouse
    mouseG.append("path")
      .attr("class", "mouse-line")
      .style("stroke", "#A9A9A9")
      //.style("stroke", "green")
      //.style("stroke-width", lineStroke)
      .style("stroke-width", "2px")
      .style("opacity", "0")
      .on("mousemove", function() {
        console.log("detected mousemove on mouseG")
      })
    
    //var lines = document.getElementsByClassName("line")
    //var lines = d3.selectAll(".line")

    //console.log("lines", lines)

    var mousePerLine = mouseG.selectAll(".mouse-per-line")
      .data([dataset])
      //.data(lines)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line")

    function addCircle(id) {
      //TODO: This needs to be fixed
      mousePerLine.append("circle")
        .attr("id", id+"Circle")
        .attr("r", 2)
        .style("stroke", "orange")
        .style("fill", "none")
        .style("stroke-width", lineStroke)
        .style("opacity", "0")
    }

    lines.forEach(function (line) {
      addCircle(line.id)
    })

    //mousePerLine.append("circle")
    //  .attr("r", 2)
    //  .style("stroke", "black")
    //  .style("fill", "none")
    //  .style("stroke-width", lineStroke)
    //  .style("opacity", "0")

    // append a rect to catch mose movements on canvas
    mouseG.append("svg:rect")
      .attr("width", dimensions.boundedWidth)
      .attr("height", dimensions.boundedHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseout", function () { // on mouse out hide line, circles and text
        hideLineCirclesText()
      })
      .on("mouseover", function () { // on mouse in show line, circles and text
        showLine()
        showCircles()
        showText()
      })
      .on('mousemove', function (event, d) { // update toolbox content, line, circles and text when mouse moves
        updateToolBoxLineCircles(event, d)
      
      }) 

    function hideLineCirclesText() {
      //console.log("Mouse out... hiding")
      d3.select(".mouse-line")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "0");
      d3.selectAll("#toolbox")
        .style("display", "none")
    }

    function showLine() {
      //console.log("showing line")
      d3.select(".mouse-line")
        .style("opacity", "1");
    }

    function showCircles() {
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "1");
    }

    function showText() {
      d3.selectAll("#toolbox")
        .style("display", "block")
    }
//
    function updateToolBoxLineCircles(event, d, year) {
        //console.log("update toolbox content circle", event)
        if (event == null) {
          var mouse = [0, 0]
        } else {
          var mouse = d3.pointer(event) // Returns a two-element array of numbers [x, y] representing the coordinates of the specified event relative to the specified target.
        }
        //console.log("updating toolbox content")
        //console.log("this", this) //this = current DOM element
        //console.log("mouse", mouse)

        d3.selectAll(".mouse-per-line")
          .attr("transform", function (d, i) {
            //
            if (year == null) {
              //console.log("d.Year", d.Year)
              //console.log("i", i)
              //console.log("mouse[0]", mouse[0])
              //var x = xScale(mouse[0])
              //console.log("x", x)
              var xDate = xScale.invert(mouse[0]) // use 'invert' to get date corresponding to distance from mouse position relative to svg

              //console.log("d", d)
              //console.log("i", i)
              //console.log("d.values", d.values)
              //console.log("xDate", xDate)
              //console.log("getFullYear", xDate.getFullYear())
              year = xDate.getFullYear()
              //console.log("year==", year)
            }

            var bisect = d3.bisector(function (d) { 
              //console.log("getting here ===========>")
              //console.log("d in bisect = ", d)
              return d.Year; 
            }).left // retrieve row index of date on parsed csv

            var idx = bisect(dataset, year.toString());
            //console.log("d==", d)
            //console.log("id", idx)
            //console.log("d[idx]", d[idx])


            var yScale = d3.scaleLinear()
              //.domain([0, d3.max(nl_hits)])
              //.domain([0, max_x])
              .domain([0, dimensions.boundedHeight])
              //.range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top])
              .range([dimensions.boundedHeight,0])
              //.range([dimensions.boundedHeight,2*dimensions.boundedHeight/3])
              //.range(yRange)

            d3.select(".mouse-line")
              .attr("d", function () {

                var data = "M" + xScale(dates[idx].date) + "," + (dimensions.boundedHeight);
                data += " " + xScale(dates[idx].date) + "," + 0;
                //console.log("data", data)
                return data;
              });
            //return "translate(" + xScale(+d[idx].Year) + "," + yScale(xALAccessor(d[idx])) + ")"
            //console.log("returned==>", "translate(" + xScale(dates[idx].date) + ",0)")
            return "translate(" + xScale(dates[idx].date) + ",0)"
          });

        updateCircles(year)

        //updateToolBoxContent(mouse, res_nested)
        //updateToolBoxContent(mouse, event)
        updateToolBoxContent(year)
    }

    function updateCircles(year){
      console.log("calling updateCircles with year = ", year)
      lines.forEach(function (line) {
      if (parseInt(year) < 1900) {
        //console.log("=========why are you not here=======")
        //console.log("year " + i + "is less than 1900" )
        return
      }
        //if (year == null) {
        //  var xDate = xScale.invert(mouse[0]) // use 'invert' to get date corresponding to distance from mouse position relative to svg
        //  //console.log("xDate", xDate)

        //  var year = xDate.getFullYear()
        //}

        var bisect = d3.bisector(function (d) { 
          //console.log("getting here ===========>")
          //console.log("d in bisect = ", d)
          return d.Year; 
        }).left // retrieve row index of date on parsed csv

        var id_dates = bisect(dates, year.toString()); //HERERERERERERERERE
        var id_elems = bisect(dataset, year.toString()); //HERERERERERERERERE

        var element = dataset[id_elems]

        var accessor = line.accessor

        console.log("element===", element)
        console.log("working on line: " + line.id)
        console.log("accessor: ", accessor)
        console.log("range: ", line.range)

        var yLineScale = d3.scaleLinear()
          .domain([0, line.max])
          .range(line.range)

        var cx = xScale(dates[id_dates].date)
        var cy = yLineScale(accessor(element))

        //if (line.id == "nlRuns" || line.id == "alRuns") {
        //  //console.log("in if statements")
        //  cy = cy + 65
        //} else if (line.id == "nlHrs" || line.id == "alHrs") {
        //  cy = cy - 40
        //}

        d3.select("#"+line.id + "Circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .style("stroke", line.color)
          //.style("fill", "green")
          //.attr("transform", function (d, i) {
          //  return "translate(" + xScale(dates[idx].date) + "," + yLineScale(line.accessor(d[idx])) + ")"
          //})
      })

    }

    function updateToolBoxContent(year) {
    //function updateToolBoxContent(mouse, myEvent) {
      //console.log("in updateToolBoxContent")
      //console.log("mouse", mouse)
      //if (year == null) {
      //  var xDate = xScale.invert(mouse[0]) // use 'invert' to get date corresponding to distance from mouse position relative to svg
      //  //console.log("xDate", xDate)

      //  year = xDate.getFullYear().toString()
      //}

      var bisect = d3.bisector(function (d) { 
        //console.log("getting here ===========>")
        //console.log("d in bisect = ", d)
        return d.Year; 
      }).left // retrieve row index of date on parsed csv

      //console.log("year", year)
      //console.log("parseInt(year)", parseInt(year))
      if (parseInt(year) < 1900) {
        //console.log("=========why are you not here=======")
        //console.log("year " + year + "is less than 1900" )
        return
      }
      var idx = bisect(dataset, year); //HERERERERERERERERE
      //console.log("==> idx", idx)

      var element = dataset[idx]
      //console.log("==> element", element)

      //var coordinates = d3.pointer(event)
      //var coordinates = d3.pointer(event, this)
      //var coordinates = d3.pointer(this, svg.node())
      //console.log("event", event)
      //console.log("myEvent", myEvent)
      //console.log("this", this)
      //console.log("mouse", mouse)

      //console.log("chart", chart)
      //console.log("chart[0]", chart[0])
      //console.log("chart.node()", chart.node())

      //var coordinates = d3.pointer(event, d3.select("#chart"))
      var coordinates = d3.pointer(event, chart)

      //console.log("Still need to update rect accroding to coordinates:")
      //console.log("coordinates", coordinates)

      //var text_coord = "x="+ coordinates[0] + " y=" + coordinates[1]
      var x = coordinates[0] + 20.5
      var y = coordinates[1] + 10.5

      //console.log("x==", x)
      //console.log("y==", y)

      //var event_coord = d3.pointer(event)
      //var event_x = event_coord[0]
      //var event_y = event_coord[1]

      //console.log("event_x==", event_x)
      //console.log("event_y==", event_y)

      //var diff_x = x - event_x
      //var diff_y = y - event_y

      //var new_x = event_x + diff_x
      //var new_y = event_y + diff_y

      //console.log("typeof", typeof(parseInt(element.NL_runs)))

      var yearText = "Year: " + element.Year 
      if (year == "1914") {
        yearText += " Federal League"
      } else if (year == "1961") {
        yearText += " League Expansion"
      } else if (year == "1977") {
        yearText += " League Expansion"
      } else if (year == "1981") {
        yearText += " Players' Strike"
      } else if (year == "1994") {
        yearText += " Players' Strike"
      } else if (year == "1999") {
        yearText += " Steroid Era"
      } else if (year == "2006") {
        yearText += " Players testify before Congress"
      } else if (year == "2020") {
        yearText += " COVID-19"
      }

      var yearText = yearText
      var NLRunsText = " National League Runs: "+ parseInt(element.NL_runs).toLocaleString() + " "
      var ALRunsText = "  American League Runs: "+ parseInt(element.AL_runs).toLocaleString() + "  "
      var NLHitsText = " National League Hits: "+ parseInt(element.NL_hits).toLocaleString() + " "
      var ALHitsText = "  American League Hits: "+ parseInt(element.AL_hits).toLocaleString() + "  "
      var NLRunsText = " National League Runs: "+ parseInt(element.NL_runs).toLocaleString() + " "
      var ALRunsText = "  American League Runs: "+ parseInt(element.AL_runs).toLocaleString() + "  "

      //console.log("x",x)
      //console.log("y",y) 

      //toolbox.html("toolbox text")
      //toolbox.html("some text")
      //d3.selectAll("#toolbox")
      toolbox  
        //.style("display", "block")

        //.style("left", "0px")
        //.style("top", "0px")

        .style("left", x + "px")
        .style("top", y + "px")

        //.style("left", event_x + "px")
        //.style("top",  event_y + "px")

        //.style("left", new_x + "px")
        //.style("top",  new_y + "px")

        .text(yearText)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("text-align", "center")

        .append("div")
        .text(NLRunsText)
        .style("font-weight", "normal")
        .style("color", NLColor)

        .append("div")
        .style("color", ALColor)
        .text(ALRunsText)

        .append("div")
        .text(".")
        .style("font-size", "7px")

        .append("div")
        .style("color", NLColor)
        .style("font-size", "16px")
        .text(NLHitsText)

        .append("div")
        .style("color", ALColor)
        .text(ALHitsText)

        .append("div")
        .text(".")
        .style("font-size", "7px")

        .append("div")
        .style("color", NLColor)
        .style("font-size", "16px")
        .text(NLRunsText)

        .append("div")
        .style("color", ALColor)
        .text(ALRunsText)

    }
  }
)
