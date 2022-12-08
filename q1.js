
d3.csv("totals_sorted.csv").then(

  function(dataset) { // dataset is an object contained in file

    // Scatter plot dimensions
    var dimensions = {
      width: 1000,
      height: 800,
      margin: {
        top: 15,
        bottom: 50,
        right: 10,
        left: 40
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
      }
    })

    console.log("dates", dates)

    var xNLAccessor = d => +d.NL_hits
    var xALAccessor = d => +d.AL_hits

    var years = d3.map(dataset, d => +d.Year)

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
        .attr("class", "line-graph")
        .attr("fill", "none")
        .attr("stroke", NLColor)
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x((d,i) => {
            return xScale(dates[i].date)
          })
          .y(d => yScale(NLAccessor(d))).curve(d3.curveLinear)
         )
        .on("click", function() {
          console.log("===============CLICK NL")
          var selectedLine = d3.select(this)
            .attr("stroke-width", 4)
          showLine(selectedLine)

          showNLSalaries()
        })

      //AL = red
      var AL = bounds.selectAll(line_id)
      //var AL = mouseG.selectAll(line_id)
        .append("g")
        .data([dataset])
        .enter()
        .append("path")
        .attr("class", "line-graph")//added this
        .attr("fill", "none")
        .attr("stroke", ALColor)
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x((d,i) => {
            return xScale(dates[i].date)
          })
          .y(d => yScale(ALAccessor(d))).curve(d3.curveLinear)
         )
        .on("click", function() {
          console.log("===============CLICK AL")
          var selectedLine = d3.select(this)
            .attr("stroke-width", 4)
          showLine(selectedLine)
          showALSalaries()
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
        .on("click", function() {
          console.log("CLICK NL Legend")
        })

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
        .on("click", function() {
          console.log("CLICK AL Legend")
        })
    }

    function showLine(selectedLine) {
      console.log("In showline")
      selectedLine
        .attr("stroke-width", 3)
    }

    function showNLSalaries(){
      d3.selectAll(".myRect").style("opacity", 0.2)
      //d3.selectAll("."+subGroupName).style("opacity",1)
      d3.selectAll(".NL").style("opacity",1)
    }

    function showALSalaries(){
      d3.selectAll(".myRect").style("opacity", 0.2)
      //d3.selectAll("."+subGroupName).style("opacity",1)
      d3.selectAll(".AL").style("opacity",1)
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

    //
    var toolbox = chart.append("div")
      .attr("id", "toolbox")
      .style("position", "absolute")
      .style("background-color", "#D3D3D3")
      .style("padding", 6)
      .style("display", "none")

    var mouseG = bounds.append("g")
      .attr("class", "mouse-over-effects")
      .on("click", function() {
        console.log("this is a bad click")
        d3.selectAll(".line-graph")
          .attr("stroke-width", 2)
        
        // Reduce opacity of all rect to 0.2
        d3.selectAll(".myRect").style("opacity", 1)
      })


    drawGraph(NLHrsAccessor, ALHrsAccessor, maxHrs, yHrsRange, ".line", "Home Runs")
    drawGraph(NLRunsAccessor, ALRunsAccessor, maxRuns, yRunsRange, ".line3", "Runs")
    drawGraph(NLHitsAccessor, ALHitsAccessor, maxHits, yHitsRange, ".line2", "Hits")
    

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
              var xDate = xScale.invert(mouse[0]) // use 'invert' to get date corresponding to distance from mouse position relative to svg

              year = xDate.getFullYear()
              //console.log("year==", year)
            }

            updateColumn(year) 

            d3.select("#year")
              .attr("value", year)
            var evt = new CustomEvent('change');
            document.getElementById('year').dispatchEvent(evt);

            var bisect = d3.bisector(function (d) { 
              return d.Year; 
            }).left // retrieve row index of date on parsed csv

            var idx = bisect(dataset, year.toString());


            var yScale = d3.scaleLinear()
              .domain([0, dimensions.boundedHeight])
              .range([dimensions.boundedHeight,0])

            d3.select(".mouse-line")
              .attr("d", function () {

                var data = "M" + xScale(dates[idx].date) + "," + (dimensions.boundedHeight);
                data += " " + xScale(dates[idx].date) + "," + 0;
                //console.log("data", data)
                return data;
              });
            return "translate(" + xScale(dates[idx].date) + ",0)"
          });

        updateCircles(year)

        updateToolBoxContent(year)
    }

    function updateCircles(year){
      //console.log("calling updateCircles with year = ", year)
      lines.forEach(function (line) {
      if (parseInt(year) < 1900) {
        return
      }

        var bisect = d3.bisector(function (d) { 
          return d.Year; 
        }).left // retrieve row index of date on parsed csv

        var id_dates = bisect(dates, year.toString()); //HERERERERERERERERE
        var id_elems = bisect(dataset, year.toString()); //HERERERERERERERERE

        var element = dataset[id_elems]

        var accessor = line.accessor

        var yLineScale = d3.scaleLinear()
          .domain([0, line.max])
          .range(line.range)

        var cx = xScale(dates[id_dates].date)
        var cy = yLineScale(accessor(element))

        d3.select("#"+line.id + "Circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .style("stroke", line.color)
          .on("click", function() {
            console.log("DETECTED CLICK ON CIRCLE")
          })
      })

    }

    function updateToolBoxContent(year) {

      var bisect = d3.bisector(function (d) { 
        return d.Year; 
      }).left // retrieve row index of date on parsed csv

      if (parseInt(year) < 1900) {
        return
      }
      var idx = bisect(dataset, year); //HERERERERERERERERE

      var element = dataset[idx]

      var coordinates = d3.pointer(event, chart)

      var x = coordinates[0] + 20.5
      var y = coordinates[1] + 10.5

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

      toolbox  
        .style("left", x + "px")
        .style("top", y + "px")

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
