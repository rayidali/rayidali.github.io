// Set graph margins and dimensions
var margin = {top: 90, right: 90, bottom: 90, left: 90},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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


// create tooltip element  
const tooltip = d3.select("body")
.append("div")
.attr("class","d3-tooltip")
.style("position", "absolute")
.style("z-index", "10")
.style("visibility", "hidden")
.style("padding", "15px")
.style("background", "rgba(0,0,0,0.6)")
.style("border-radius", "5px")
.style("color", "#fff")
.text("a simple tooltip");
// var tip = d3.tip()
//   .attr('class', 'd3-tip')
//   .offset([-10, 0])
//   .html(function(d) {
//     return "<strong>Salary:</strong> <span style='color:red'>" + +d.salary + "</span>";
//   })

// svg.call(tip);

var slider = document.getElementById("slider");
var output = document.getElementById("demo");
output.innerHTML = slider.value;






slider.oninput = function() {
  output.innerHTML = this.value;
}

// Get data
d3.csv("df5.csv").then(function(data) {

  var allGroup = new Set(data.map(d => +d.yearID))



    // A color scale: one color for each group
    const myColor = d3.scaleOrdinal()
      .domain(allGroup)
      .range(["#3957ff", "#d3fe14", "#c9080a", "#fec7f8", "#0b7b3e", "#0bf0e9", "#c203c8", "#fd9b39", "#888593", "#906407", "#98ba7f", "#fe6794", "#10b0ff", "#ac7bff", "#fee7c0", "#964c63", "#1da49c", "#0ad811", "#bbd9fd", "#fe6cfe", "#297192", "#d1a09c", "#78579e", "#81ffad", "#739400", "#ca6949", "#d9bf01", "#646a58", "#d5097e", "#bb73a9", "#ccf6e9", "#9cb4b6", "#b6a7d4", "#9e8c62", "#6e83c8"]);

      // var nameSelected = "yearID"

  // Format data
  data.forEach(function(d) {
    d.salary = +d.salary;
  });

  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.teamID; }));
  y.domain([0, d3.max(data, function(d) { return d.salary; })]);
  // y.domain([0, d3.max(data.map(function(d){return d["1985"]}), salary => +salary)])

  // List of groups (here I have one group per column)
  var allGroup = d3.map(data, function(d){return(d.yearID)}).keys()

  var div = d3.select("body").append("div")
     .attr("class", "tooltip-donut")
     .style("opacity", 0);

  var text = svg
                .append('text')
                .attr("id", 'topbartext')
                .attr("x", 700)
                .attr("y", 20)
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("font-family", "sans-serif")
                .text("Count per year: 0")

  // Append rectangles for bar chart
  // const bar = svg.selectAll(".bar")
  // .data(data.filter(function(d){return +d.yearID=="1985"}))
  var bar = svg.selectAll(".bar")
  // .data(data.filter(function(d){return +d.yearID=="1985"}))

  // .datum(data.filter(function(d){return d.yearID=="1985"}))
      .data(data)
      // .data(data.filter(function(d){return +d.yearID=="1985"}))      
bar       
        // .join("rect").merge(bar)
        
        .enter().append("rect")
        .data(data.filter(function(d){return +d.yearID=="1985"}))
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.teamID); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.salary); })
      // .attr('y', function(d) { return yScale(d[nameSelected]); })
      .attr("fill", function(d){ return myColor("valueA") })
      .attr("height", function(d) { return height - y(d.salary); })
      // .attr('height', function(d){return height - y(d[nameSelected])})
      .on("mouseover", function(d, i) {
        tooltip.html("<strong>Frequency:</strong> <span style='color:red'>" + salary + "</span>").style("visibility", "visible");
        d3.select(this)
          .attr("fill", "#d3fe14");
      })
      .on("mousemove", function(){
        tooltip
          .style("top", (event.pageY-10)+"px")
          .style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function() {
        tooltip.html(``).style("visibility", "hidden");
        d3.select(this).attr("fill", function(d){ return myColor("valueA") });
      });
      //-------------------------------------------------------
    //   .on('mouseover', function(d, i){

    //     d3.select(this)
    //     .style("stroke", "black");
    //     d3.select("#topbartext")
    //         .text(`Count per year: `+ d.salary);
    // })

    // .on('mouseout', function (d, i) {
    //     d3.select(this)
    //     .style("stroke", "none");
    //    d3.select("#topbartext")
    //     .text(`Count per year: ${0}`);
    // })

      
      
      // .on('mouseover', tip.show)
      // .on('mouseout', tip.hide)

      //  bar.exit().remove();

    
  // Add x axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // Add y axis
  svg.append("g")
      // .transition()
      .call(d3.axisLeft(y));


      // bar.exit().remove();

  // A function that update the chart
  function update(selectedGroup) {

// Create new data with the selection?
const dataFilter = data.filter(function(d){return +d.yearID==slider.value})

bar = svg.selectAll(".bar")
					.remove()
					.exit()
					.data(data)

// Give these new data to update line
bar
// .join("rect").merge(bar)
    // .enter()
    .enter().append("rect")
    .data(dataFilter)
    .on("mouseover", function(d, i) {
      tooltip.html(`Salary: ${slider.value}`).style("visibility", "visible");
      d3.select(this)
        .attr("fill", "#d3fe14");
    })
    .on("mousemove", function(){
      tooltip
        .style("top", (event.pageY-10)+"px")
        .style("left",(event.pageX+10)+"px");
    })
    .on("mouseout", function() {
      tooltip.html(``).style("visibility", "hidden");
      d3.select(this).attr("fill", function(d){ return myColor(selectedGroup) });
    })
    // .join("rect").merge(bar)
    .merge(bar)
    .transition()
    .duration(5)
    .attr("class", "bar")
      .attr("x", function(d) { return x(d.teamID); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.salary); })
      .attr("height", function(d) { return height - y(d.salary); })
    .attr("fill", function(d){ return myColor(selectedGroup) })
    


    

    // .on('mouseover', tip.show)
    //   .on('mouseout', tip.hide)

      //  newbar1.exit().remove()
}


  // A function that update the chart
  function updateAmerican(selectedamerican, yearr) {

    // Create new data with the selection?
    const dataFilterAmerican = data.filter(function(d){return (d.lgID==selectedamerican && +d.yearID==yearr)})

    bar = svg.selectAll(".bar")
					.remove()
					.exit()
					.data(data)
    
    // Give these new data to update line
  newbar2 =   bar
    // .join("rect").merge(bars)
        .data(dataFilterAmerican)
        .join("rect").merge(bar)
        .transition()
        .duration(5)
        .attr("class", "bar")
          .attr("x", function(d) { return x(d.teamID); })
          .attr("width", x.bandwidth())
          .attr("y", function(d) { return y(d.salary); })
          .attr("height", function(d) { return height - y(d.salary); })
        .attr("fill", "#0000FF" )
      //   .on('mouseover', tip.show)
      // .on('mouseout', tip.hide)

        //  newbar2.exit().remove();
    }

     // A function that update the chart
  function updateNational(selectednational, yearr) {

    // Create new data with the selection?
    const dataFilterNational = data.filter(function(d){return (d.lgID==selectednational && +d.yearID==yearr)})

    bar = svg.selectAll(".bar")
					.remove()
					.exit()
					.data(data)

    
    
    // Give these new data to update line
    newbar3 = bar
        .data(dataFilterNational)
        .join("rect").merge(bar)
        .transition()
        .duration(5)
        .attr("class", "bar")
          .attr("x", function(d) { return x(d.teamID); })
          .attr("width", x.bandwidth())
          .attr("y", function(d) { return y(d.salary); })
          .attr("height", function(d) { return height - y(d.salary); })
        .attr("fill", "#FF0000" )
      //   .on('mouseover', tip.show)
      // .on('mouseout', tip.hide)

        // newbar3.exit().remove();
    }

    // bar.exit().remove();
// update("1985")
//On change, update styling
d3.select("input")
.on("change", function() {
  update(this.value);
  // newbar1.exit().remove();
});

// newbar1.exit().remove();



d3.select("#americanlg").on("click", function() {


  updateAmerican("AL", slider.value)
  // newbar2.exit().remove();
  
});


d3.select("#nationallg").on("click", function() {

  updateNational("NL", slider.value)
  // newbar3.exit().remove();

});





  // // Add x axis
  // svg.append("g")
  //     .attr("transform", "translate(0," + height + ")")
  //     .call(d3.axisBottom(x));

  // // Add y axis
  // svg.append("g")
  //     // .transition()
  //     .call(d3.axisLeft(y));

});



