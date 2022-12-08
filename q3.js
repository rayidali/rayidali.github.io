
var xScale;
var yScale;
var loadedData;
var svg;

  function updateColumn(year) {
    if (year >= 1985 && year <= 2016) {
      console.log("year is in range", year)
      //console.log("svg", svg) this does not work
      //d3.selectAll("myRect AL")
      //  .style("opacity", 0.2)

      //d3.selectAll("myRect NL")
      //  .style("opacity", 0.2)

      for (let i = 1985; i < 2017; i++) {
        console.log("not doing this")
        var x = d3.selectAll(".rect" + i)
          .style("opacity", 0.2)
        //console.log("x", x)
      }

      d3.selectAll(".rect" + year)
        .style("opacity", 1)
      
      //
       //var bisect = d3.bisector(function (d) {
       //  return d.yearID
       //}).left

       //var idx = bisect(loadedData, year)
       //console.log("idx: ",idx)
   
       // svg.append("g")
       //   .selectAll("g")
       // // Enter in the stack data = loop key per key = group per group
       //   //.data(stackedData)
       //   //.join("g")
       //   //.attr("fill", d => color(d.key))
       //   //.attr("class", d => "myRect " + d.key ) // Add a class to each subgroup: their name
       //   .selectAll("rect")
       // // enter a second time = loop subgroup per subgroup to add all rectangles
       //   .data(d => d)
       //   .join("rect")
       //   .attr("x", d => xScale(d.data.yearID))
       //   .attr("y", d => yScale(d[1]))
       //   .attr("height", d => yScale(d[0]) - yScale(d[1]))
       //   .attr("width",xScale.bandwidth())
       //   .style("opacity", 0.2)
    }
  }

//
// Parse the Data
d3.csv("df7.csv").then( function(data) {
  // set the dimensions and margins of the graph
  loadedData = data
  var q3_box = document.getElementsByClassName("q3")
  const margin = {top: 50, right: 100, bottom: 40, left: 100},
    width = q3_box[0].clientWidth - margin.left - margin.right,
    height = q3_box[0].clientHeight - margin.top - margin.bottom;

  // append the svg object to the body of the page
  svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // var slider = document.getElementById("slider");
  // var output = document.getElementById("demo");
  // // output.innerHTML = slider.value;

  // slider.oninput = function() {
  //   output.innerHTML = this.value;
  // }

  // List of subgroups = header of the csv files = soil condition here
  const subgroups = data.columns.slice(1)
  console.log(subgroups)

  //   var slider = document.getElementById("slider");
  //   var output = document.getElementById("demo");
  //   output.innerHTML = slider.value;

  //   slider.oninput = function() {
  //   output.innerHTML = this.value;

  // d3.select("#slider")
  // .on("input", function() {
  //     var bisect = d3.bisector(function (d){
  //         return d.yearID
  //       }).left

  //       var idx = bisect(data, +this.value)
  //       console.log("idx: ",idx)
  // }

  // )
  //   var bisect = d3.bisector(function (d){
  //     return d.yearID
  //   }).left

  //   var idx = bisect(data, yearID.toString())
  //   console.log("idx: ",idx)


  // List of groups = species here = value of the first column called group -> I show them on the X axis
  const groups = data.map(d => (d.yearID))

  // Add X axis
  xScale = d3.scaleBand()
    .domain(groups)
    .range([0, width])
    .padding([0.2])

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0))
    .call(xScale)
    .selectAll("text")	
    .attr("dx", "-2.25em")
    .attr("dy", "-.1em")
    //.style("font-size", "9px")
    .attr("transform", "rotate(-65)")

  // Add Y axis
  yScale = d3.scaleLinear()
  // .domain([0, 60])
    .domain([0, 10000000])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(yScale));

  const NLColor = "#377eb8"
  const ALColor = "#e41a1c"

  // color palette = one color per subgroup
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    //.range(['#e41a1c','#377eb8'])
    .range([ALColor,NLColor])

  //stack the data? --> stack per subgroup
  const stackedData = d3.stack()
    .keys(subgroups)
  (data)

  console.log("stacked:",stackedData)

  // ----------------
  // Create a tooltip
  // ----------------
  const tooltip = d3.select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")

  // // Three function that change the tooltip when user hover / move / leave a cell
  // const mouseover = function(event, d) {
  //   const subgroupName = d3.select(this.parentNode).datum().key;
  //   const subgroupValue = d.data[subgroupName];
  //   // Reduce opacity of all rect to 0.2
  //   d3.selectAll("rect").style("opacity", 0.2)

  //   // Highlight all rects of this subgroup with opacity 1. It is possible to select them since they have a specific class = their name.
  //    d3.selectAll("."+subGroupName).style("opacity",1)
  // //   tooltip
  // //       .html("League: " + subgroupName + "<br>" + "Salary: " + d3.format(",.1f")(subgroupValue))
  // //       .style("opacity", 1)

  // // }
  // const mousemove = function(event, d) {
  //   tooltip.style("transform","translateY(-55%)")
  //          .style("left",(event.x)/2+"px")
  //          .style("top",(event.y)/2-30+"px")
  // }
  // const mouseleave = function(event, d) {
  //   tooltip
  //     .style("opacity", 0)
  // }

  d3.select("#year")
    .on("change", function() {
      console.log("here")
      console.log("value", this.value);
    });

  // Show the bars
  svg.append("g")
    .selectAll("g")
  // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .join("g")
    .attr("fill", d => color(d.key))
    .attr("class", d => "myRect " + d.key ) // Add a class to each subgroup: their name
    .selectAll("rect")
  // enter a second time = loop subgroup per subgroup to add all rectangles
    .data(d => d)
    .join("rect")
    //.attr("class", d => "myRect " + d.key ) // Add a class to each subgroup: their name
    .attr("class", d => "rect" + d.data.yearID ) // Add a class to each subgroup: their name
    .attr("x", d => xScale(d.data.yearID))
    .attr("y", d => yScale(d[1]))
    .attr("height", d => yScale(d[0]) - yScale(d[1]))
    .attr("width",xScale.bandwidth())
    .style("opacity", 0.2)
    .on("mouseover", function (event,d) { // What happens when user hover a bar

      // what subgroup are we hovering?
      const subGroupName = d3.select(this.parentNode).datum().key
      console.log("subGroupName", subGroupName)

      // Reduce opacity of all rect to 0.2
      d3.selectAll(".myRect").style("opacity", 0.2)

      // Highlight all rects of this subgroup with opacity 1. It is possible to select them since they have a specific class = their name.
      d3.selectAll("."+subGroupName).style("opacity",1)
    })
    .on("mouseleave", function (event,d) { // When user do not hover anymore

      // Back to normal opacity: 1
      d3.selectAll(".myRect")
        .style("opacity",1)
    })
    // Legends
    
    // NL Legend
    svg.append("circle")
      .attr("cx", 30)
      //.attr("cy", 20)
      .attr("cy", 20 + 20)
      .attr("r", 6)
      .style("fill", NLColor)

    var NLLegend = svg
      .append("text")
      .attr("id", "NLLegend")
      .attr("x", 50)
      .attr("y", 20 + 20)
      .text("National League Salaries")
      .style("font-size", "15px")
      .attr("alignment-baseline","middle")
      //.on("click", function() {
      //  console.log("CLICK NL Legend")
      //})

    // AL Legend
    svg.append("circle")
      .attr("cx", 30)
      .attr("cy", 20 + 40)
      .attr("r", 6)
      .style("fill", ALColor)

    var ALLegend = svg
      .append("text")
      .attr("id", "ALLegend")
      .attr("x", 50)
      .attr("y", 20 + 40)
      .text("American League Salaries")
      .style("font-size", "15px")
      .attr("alignment-baseline","middle")
      //.on("click", function() {
      //  console.log("CLICK AL Legend")
      //})
  // .on("mouseover", mouseover)
  // .on("mousemove", mousemove)
  // .on("mouseleave", mouseleave)

  // A function that update the chart
  function update(selectedGroup) {

    // d3.selectAll("rect").style("opacity", 0.2)

    // d3.selectAll("."+groups)
    //   .style("opacity", 1)
    //var subgroupName = d3.select(this.parentNode).datum().key; // This was the tricky part
    //var subgroupValue = d.data[subgroupName];
    //// Reduce opacity of all rect to 0.2
    //d3.selectAll(".myRect").style("opacity", 0.2)
    // Highlight all rects of this subgroup with opacity 0.8. It is possible to select them since they have a specific class = their name.
    //d3.selectAll("."+subgroupName)
    //  .style("opacity", 1)

  }

  //On change, update styling
  d3.select("input")
    .on("change", function() {
      update(this.value);
      // newbar1.exit().remove();
    });




})

//---------------------------------------------------------------------------------------------




