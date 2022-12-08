// set the dimensions and margins of the graph
const margin = {top: 50, right: 100, bottom: 20, left: 100},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

var slider = document.getElementById("slider");
var output = document.getElementById("demo");
output.innerHTML = slider.value;

slider.oninput = function() {
  output.innerHTML = this.value;
}

// Parse the Data
d3.csv("df7.csv").then( function(data) {

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
  var x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.2])
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // Add Y axis
  var y = d3.scaleLinear()
    // .domain([0, 60])
    .domain([0, 10000000])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // color palette = one color per subgroup
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#e41a1c','#377eb8'])

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

// Three function that change the tooltip when user hover / move / leave a cell
const mouseover = function(event, d) {
  const subgroupName = d3.select(this.parentNode).datum().key;
  const subgroupValue = d.data[subgroupName];
  tooltip
      .html("League: " + subgroupName + "<br>" + "Salary: " + d3.format(",.1f")(subgroupValue))
      .style("opacity", 1)

}
const mousemove = function(event, d) {
  tooltip.style("transform","translateY(-55%)")
         .style("left",(event.x)/2+"px")
         .style("top",(event.y)/2-30+"px")
}
const mouseleave = function(event, d) {
  tooltip
    .style("opacity", 0)
}




  // Show the bars
  svg.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .join("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(d => d)
      .join("rect")
        .attr("x", d => x(d.data.yearID))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width",x.bandwidth())
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)

// A function that update the chart
function update(selectedGroup) {

    // d3.selectAll("rect").style("opacity", 0.2)

    // d3.selectAll("."+groups)
    //   .style("opacity", 1)
    var subgroupName = d3.select(this.parentNode).datum().key; // This was the tricky part
    var subgroupValue = d.data[subgroupName];
    // Reduce opacity of all rect to 0.2
    d3.selectAll(".myRect").style("opacity", 0.2)
    // Highlight all rects of this subgroup with opacity 0.8. It is possible to select them since they have a specific class = their name.
    d3.selectAll("."+subgroupName)
      .style("opacity", 1)
    
}

//On change, update styling
d3.select("input")
.on("change", function() {
  update(this.value);
  // newbar1.exit().remove();
});




})

//---------------------------------------------------------------------------------------------




