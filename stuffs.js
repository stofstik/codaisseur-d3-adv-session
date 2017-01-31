// Define simple data structure
data = [
  {year: "2013-01", value: 53,  category: "pants"},
  {year: "2013-02", value: 165, category: "pants"},
  {year: "2013-03", value: 269, category: "pants"},
  {year: "2013-04", value: 344, category: "pants"},
  {year: "2013-05", value: 376, category: "shirt"},
  {year: "2013-06", value: 410, category: "shirt"},
  {year: "2013-07", value: 421, category: "shirt"},
  {year: "2013-08", value: 405, category: "shirt"},
  {year: "2013-09", value: 376, category: "shirt"},
  {year: "2013-10", value: 359, category: "shoes"},
  {year: "2013-11", value: 392, category: "shoes"},
  {year: "2013-12", value: 433, category: "shoes"},
];

// Some data time helpers
var dateParser    = d3.timeParse('%Y-%m');
var dateFormatter = d3.timeFormat('%Y-%m');

// Convert datetime string to date object
data.forEach(function(d) {
  d.date  = dateParser(d.year);
  d.value = +d.value;
});

// Define some noice colors
var color = d3.scaleOrdinal().range(['#C5FFB3', '#4EE1FF', '#9232FF']);

// Structure by category
// Creating 3 key value pairs: { category, totalValue }
// Using d3 sum helper to reduce specific values into one for each category
function groupByCategory(data) {
  return d3
    .nest()
    .key( (d) => d.category )
    .sortKeys(d3.ascending)
    .rollup( (v) => d3.sum(v, (d) => d.value) )
    .entries(data);
}

// We clicked a category, rerender with this category omitted
function categoryClicked(e) {
  if(e.key) {
    console.log(e.key);
    drawTable(data.filter( (d) => d.category !== e.key ));
    drawChart(data.filter( (d) => d.category !== e.key ));
    drawDonut(data.filter( (d) => d.category !== e.key ));
  }
  if(e.data) {
    console.log(e.data.key);
    drawTable(data.filter( (d) => d.category !== e.data.key ));
    drawChart(data.filter( (d) => d.category !== e.data.key ));
    drawDonut(data.filter( (d) => d.category !== e.data.key ));
  }
}

/*
 * Create the main top table with our categories and their total amounts
 */
var counterTable = d3.select('#counter_table').append('table');
// Set the header
var counterTHead = counterTable.append('thead').append('tr');
counterTHead.append('th').text('category');
counterTHead.on('click', reset);
counterTHead.append('th').attr('class', 'value').text('value');
// Set the body
var counterTBody = counterTable.append('tbody');
// Use D3 to render tr elements for each data entry
var counterTR = counterTBody.selectAll('tr').data(groupByCategory(data)).enter().append('tr')
counterTR.append('td').html((d) => d.key);
counterTR.append('td').html((d) => d.value);
counterTR.style('background', (d) => color(d.key));
counterTR.on('click', categoryClicked);

/*
 * Draw a donut using combined total per category as slice size
 */
function drawDonut(data) {
  // Define donut size
  const DONUT_WIDTH  = 250;
  const DONUT_HEIGHT = 250;
  const DONUT_RADIUS = 125;

  // Get the donut element and add an svg into it
  if(d3.select('#today').selectAll('#svg')) {
    d3.select('#svg').remove()
  }
  var donutSVG = d3.select('#today').append('svg')
    .attr('id', 'svg')
    .attr('width', DONUT_WIDTH)
    .attr('height', DONUT_HEIGHT);

  // Add an svg group and move down from top left so we are centered nicely
  var donut = donutSVG.append('g')
    .attr('transform', `translate( ${DONUT_WIDTH / 2}, ${DONUT_HEIGHT / 2} )`);

  // Define an arc to draw with D3
  var arc = d3.arc()
    .outerRadius(DONUT_RADIUS - 10)
    .innerRadius(DONUT_RADIUS - 60);

  // Define pie piece size, D3 pie() returns object with angles
  var pie = d3.pie()
    .value( (d) => d.value );

  // Define projection of data set to arc paths
  var g = donut.selectAll('.arc')
    .data(pie(groupByCategory(data)))
    .enter().append('g')
    .attr('class', 'arc');

  // Select the data to be projected onto each arc path
  g.append('path')
    .attr('d', arc)
    .style('fill', (d) => color(d.data.key))
    .on('click', categoryClicked);
}

/*
 * Draw a bar chart containing 'value' per month
 */
function drawChart(data) {
  // Remove if already exists
  if(d3.select('#month').selectAll('#barchart')) {
    d3.select('#barchart').remove();
  }
  var graphMargin = {
    top:    20,
    right:  20,
    bottom: 70,
    left:   40
  };
  var graphWidth  = 600 - graphMargin.left - graphMargin.right;
  var graphHeight = 300 - graphMargin.top  - graphMargin.bottom;

  var svg = d3.select('#month').append('svg')
    .attr('id', 'barchart')
    .attr('width',  graphWidth  + graphMargin.left + graphMargin.right)
    .attr('height', graphHeight + graphMargin.top  + graphMargin.bottom)
    .append('g')
    .attr('transform', ` translate( ${graphMargin.left}, ${graphMargin.top} ) `);

  // Add one month to domain otherwise we end up with one bar out of the graph
  // Feels hacky...
  var lastDate = new Date(d3.max(data, (d) => d.date));
  lastDate.setMonth(lastDate.getMonth() + 1);

  // Calc scales
  var x = d3.scaleTime()
    .range([0, graphWidth])
    .domain([d3.min(data, (d) => d.date), lastDate]);
  var y = d3.scaleLinear()
    .range([graphHeight, 0])
    .domain([0, d3.max(data, (d) => d.value)]);

  // Define how to draw rectangles (bars)
  svg.selectAll('rect').remove()
  svg.selectAll('rect')
    .data(data)
    .enter().append('rect')
    .style('fill', '#A4C639')
    .attr('x', (d) => x(d.date))
    .attr('width', (graphWidth + graphMargin.left + graphMargin.right) / data.length)
    .attr('y', (d) => y(d.value))
    .attr('height', (d) => graphHeight - y(d.value));

  // Define x and y axis for amount indication
  var xAxis = d3.axisBottom()
    .scale(x)
    .tickFormat(d3.timeFormat('%Y-%m'));
  var yAxis = d3.axisLeft()
    .scale(y)
    .tickSize(-graphWidth)
    .ticks(3);

  // Add x and y axis 
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate( 0, ${graphHeight} )`)
    .call(xAxis);
  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis);

  // Add labels with actual amount
  svg.selectAll('label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'label')
    .style('fill', '#333')
    .attr('x', (d) => x(d.date))
    .attr('y', (d) => y(d.value))
    .attr('dx', '.7em')
    .attr('dy', '-.35em')
    .text((d) => d.value);
}

/*
 * Draw the bottom table with a tr per item in the data array
 */
function drawTable(data) {
  // Remove if already exists
  if(d3.select('#table').selectAll('table')) {
    d3.select('#table').selectAll('table').remove()
  }
  var table = d3.select('#table').append('table');
  var thead = table.append('thead').append('tr');

  thead.append('th').text('date');
  thead.append('th').text('category');
  thead.append('th').text('class', 'value').text('value');

  var tbody = table.append('tbody');
  var tr    = tbody.selectAll('tr')
    .data(data).enter()
    .append('tr');

  tr.append('td').html((d) => dateFormatter(d.date))
  tr.append('td').html((d) => d.category)
  tr.append('td').html((d) => d.value);
}

function reset() {
  drawTable(data);
  drawChart(data);
  drawDonut(data);
}

reset();
