// functions related to the pie charts

var pie = d3.pie()
    .sort(null)
    .value(function(d) { return d.value; });

var arcpath = d3.arc()
    .innerRadius(0);

function addPieCharts() {
  
  //relies on map and pieformdata as a global variable
  
  var pies = map.selectAll('.pie')
    .data(pieformdata)
    .enter()
    .append('g')
      .classed("pie", true)
      .attr("data-totalwu", function (d) {
        //include as attribute to use for outerRadius for each arc
        //when arcs are added data is already subsetted to just the single category
        //but they need to use "total" to set the outer radius
        return d.piechartmeta[1]; 
      })
      .attr("transform", function(d) {
        var xcoord = projectX(d.piechartmeta[0]),
            ycoord = projectY(d.piechartmeta[0]);
        //var radius = scaleCircles(d.piechartmeta[1]);
        return "translate("+xcoord+","+ycoord+")";// scale("+(radius/10)+")";
      });
    
  
  var pieslices = map.selectAll('.pie').selectAll('.pieslice')  
      .data(function(d) {
        return pie(d.piechartdata);
      });
  
  var pieenter = pieslices
      .enter()
      .append("path")
        .classed("pieslice", true);
  
  //var pieupdate = pieenter
  //      .merge(pieslices); // merges update selection (where pieslices var is created) w/ enter selection (comes out of above line)
  
  piesBaked = true;
  updatePieCharts();
  
}

function updatePieCharts() {
  
  map.selectAll('.pie').selectAll('.pieslice')
        //.transition().duration(0)
        .attr("d", arcpath.outerRadius(function(d) {
          var totalwuvalue = +d3.select(this.parentNode).attr("data-totalwu");
          return scaleCircles(totalwuvalue);
        }))
        //.attr("d", arcpath)
        .attr("fill", function(d) { 
          return categoryToColor(d.data.category); 
        });
  
}

function pieData(geodata) {
  
  var pieAll = [];
  
    for (var i=0; i<geodata.features.length; i++) {
        pieAll.push( {
          piechartdata: [
            {"category": "thermoelectric", 
                "value": parseInt(geodata.features[i].properties.thermoelectric)},
            {"category": "publicsupply", 
                "value": parseInt(geodata.features[i].properties.publicsupply)},
            {"category": "irrigation", 
                "value": parseInt(geodata.features[i].properties.irrigation)},
            {"category": "industrial", 
                "value": parseInt(geodata.features[i].properties.industrial)},
            {"category": "other", 
                "value": parseInt(geodata.features[i].properties.other)}],
          piechartmeta: [
            geodata.features[i].geometry.coordinates,
            parseInt(geodata.features[i].properties.total)
          ]
        });
    }
    
  return pieAll;
}
