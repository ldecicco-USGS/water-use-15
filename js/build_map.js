// Width and height
var chart_width     =   1000;
var chart_height    =   700;

// define categories
var categories = ["total", "thermoelectric", "publicsupply", "irrigation", "industrial"];

// Projection
var projection = albersUsaTerritories()
  .scale([1200])
  .translate([chart_width / 2, chart_height / 2]);
  // default is .rotate([96,0]) to center on US (we want this)
    
var buildPath = d3.geoPath()
  .projection(projection);

// circle scale
var scaleCircles = d3.scaleSqrt()
  .range([0, 15]);
    
//Create container
var container = d3.select('body')
  .append('div')
  .classed('svg-container', true);

// Setup tooltips
var tooltipDiv = d3.select("body").append("div")
  .classed("tooltip hidden", true);

// Create SVG
var svg = d3.select(".svg-container")
  .append("svg")
  .attr('viewBox', '0 0 ' + chart_width + ' ' + chart_height + '')
  .attr('preserveAspectRatio', 'xMidYMid');

var map = svg.append("g")
  .attr("id", "map");

var mapBackground = map.append("rect")
  .attr("id", "map-background")
  .attr("width", chart_width)
  .attr("height", chart_height)
  .on('click', zoomToFromState);

// Datasets
var stateBoundsUSA, stateBoundsZoom, countyBoundsUSA, countyCentroids, circlesPaths;
var countyBoundsZoom = new Map();
var circlesAdded = false;

d3.queue()
  .defer(d3.json, "data/state_boundaries_USA.json")
  .defer(d3.json, "data/county_centroids_wu.json")
  .defer(d3.json, "data/wu_data_15_range.json")
  .await(fillMap);

// Zoom status: default is nation-wide
var activeView = getHash('view');
if(!activeView) activeView = 'USA';

// Water use category: default is total. To make these readable in the URLs,
// let's use full-length space-removed lower-case labels, e.g. publicsupply and thermoelectric
var activeCategory = getHash('category');
if(!activeCategory) activeCategory = 'total';
// default for prev is total
var prevCategory = 'total';
function renameCountyData(data) {
  // reverse the column name simplifications done in merge_centroids_wu.R
  dataVerbose = [];
  for (var i = 0; i < data.length; i++) {
    dataVerbose.push({
      GEOID: data[i].G,
      STATE_ABBV: data[i].A,
      COUNTY: data[i].C,
      countypop: data[i].p,
      total: data[i].t,
      thermoelectric: data[i].e,
      publicsupply: data[i].s,
      irrigation: data[i].i,
      industrial: data[i].n,
      other: data[i].o,
      lon: data[i].x,
      lat: data[i].y
    });
  }
  return(dataVerbose);
}

svg.append("text")
  .attr("id", "maptitle")
  .attr("x", chart_width/2)
  .attr("y", chart_height*0.10); // bring in 10% of chart height

function prepareMap() {
  // Initialize page info
  updateTitle(activeCategory);
  setHash('view', activeView);
  setHash('category', activeCategory);
  
  // add watermark
  addWatermark();
}
prepareMap();

// add placeholder groups for geographic boundaries and circles
map.append('g').attr('id', 'county-bounds');
map.append('g').attr('id', 'state-bounds');
map.append('g').attr('id', 'wu-circles');


function fillMap() {

  // arguments[0] is the error
	var error = arguments[0];
	if (error) throw error;

	// the rest of the indices of arguments are all the other arguments passed in -
	// so in this case, all of the results from q.await. Immediately convert to
	// geojson so we have that converted data available globally.
	stateBoundsUSA = topojson.feature(arguments[1], arguments[1].objects.states);
	countyCentroids = renameCountyData(arguments[2]);
	
  // set up scaling for circles
  var rangeWateruse = arguments[3],
      minWateruse = rangeWateruse[0],
      maxWateruse = rangeWateruse[1];
  
  // update circle scale with data
  scaleCircles = scaleCircles
    .domain(rangeWateruse);
    
  // add the main, active map features
  addStates(map, stateBoundsUSA);
  
  // add the circles
  circlesPaths = prepareCirclePaths(categories, countyCentroids);
  updateCircles(activeCategory);
  
  // load all county data - it's OK if it's not done right away
  // it should be loaded by the time anyone tries to hover!
  updateCounties('USA');
}


var buttonContainer = d3.select('.svg-container')
  .append('div')
  .attr('id', 'button-container');
  
buttonContainer.append('div').classed('select-arrowbox', true);
  
var categoryButtons = d3.select('#button-container')
  .selectAll('button')
  .data(categories)
  .enter()
  .append('button')
  .text(function(d){
    return categoryToName(d);
  })
  .attr('class', function(d){
    return d;
  })
  .on('click', function(d){
    prevCategory = activeCategory;
    activeCategory = d.toLowerCase(); // put this here so it only changes on click
    updateCategory(activeCategory, action = 'click');
  })
  .on('mouseover', function(d){
    updateCategory(d.toLowerCase(), activeCategory, action = 'mouseover');
  })
  .on('mouseout', function(d){
    updateCategory(activeCategory, d.toLowerCase(),
    action = 'mouseout');
  });
