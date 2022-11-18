// Set graph margins and dimensions
var margin = {top: 90, right: 90, bottom: 90, left: 90},
    width = 1000 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// Set ranges
var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
var y = d3.scaleLinear()
          .range([height, 0]);
var svg = d3.select("#my_dataviz1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// Get data
d3.csv("df1.csv").then(function(data) {

  var allGroup = new Set(data.map(d => +d.yearID))

    // add the options to the button
    d3.select("#selectButton")
      .selectAll('myOptions')
     	.data(allGroup)
      .enter()
    	.append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; }) // corresponding value returned by the button

    // A color scale: one color for each group
    const myColor = d3.scaleOrdinal()
      .domain(allGroup)
      .range(d3.schemeSet2);

  // Format data
  data.forEach(function(d) {
    d.salary = +d.salary;
  });

  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.teamID; }));
  y.domain([0, d3.max(data, function(d) { return d.salary; })]);

  // List of groups (here I have one group per column)
  var allGroup = d3.map(data, function(d){return(d.yearID)}).keys()

  // Append rectangles for bar chart
  var bar = svg.selectAll(".bar")
  // .datum(data.filter(function(d){return d.yearID=="1985"}))
      // .data(data)
      .data(data.filter(function(d){return +d.yearID=="1985"}))
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.teamID); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.salary); })
      .attr("fill", function(d){ return myColor("valueA") })
      .attr("height", function(d) { return height - y(d.salary); });


  // A function that update the chart
  function update(selectedGroup) {

// Create new data with the selection?
const dataFilter = data.filter(function(d){return +d.yearID==selectedGroup})

// Give these new data to update line
bar
    .data(dataFilter)
    .transition()
    .duration(1000)
    .attr("class", "bar")
      .attr("x", function(d) { return x(d.teamID); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.salary); })
      .attr("height", function(d) { return height - y(d.salary); })
    .attr("fill", function(d){ return myColor(selectedGroup) })
}

// When the button is changed, run the updateChart function
d3.select("#selectButton").on("change", function(event,d) {
  // recover the option that has been chosen
  var selectedOption = d3.select(this).property("value")
  // run the updateChart function with this selected option
  update(selectedOption)
})

  // Add x axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // Add y axis
  svg.append("g")
      .call(d3.axisLeft(y));

});
