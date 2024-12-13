// Set up margins and dimensions
// Margins define the space around the chart for axes and labels
var margin = { top: 20, right: 30, bottom: 50, left: 60 },
    width = 800 - margin.left - margin.right, // Width of the SVG container minus margins
    height = 400 - margin.top - margin.bottom; // Height of the SVG container minus margins

// Create the main SVG container
// The chart will be drawn inside this SVG
var svg = d3.select("#chart") // Select the HTML element with id 'chart'
    .append("svg") // Append an SVG element
    .attr("width", width + margin.left + margin.right) // Set the overall width
    .attr("height", height + margin.top + margin.bottom) // Set the overall height
    .append("g") // Append a group element to apply margins
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); // Position the group element

// Tooltip for interaction
// This will display information about points on hover
var tooltip = d3.select("body")
    .append("div") // Create a div element for the tooltip
    .attr("class", "tooltip") // Add a class for styling
    .style("opacity", 0); // Initially hide the tooltip

// Define initial attributes
// These are the default X and Y axis attributes
var xAttribute = "Study_Hours_Per_Day"; // Default attribute for the X-axis
var yAttribute = "GPA"; // Default attribute for the Y-axis

// Load the CSV data file
d3.csv("student_lifestyle_dataset.csv", function (error, data) {
    if (error) {
        console.error("Error loading data:", error); // Log error if data loading fails
        return;
    }

    // Parse numeric fields and convert `Stress_Level` to numeric values
    data.forEach(function (d) {
        // Convert strings to numbers for numeric attributes
        d.Study_Hours_Per_Day = +d.Study_Hours_Per_Day;
        d.Extracurricular_Hours_Per_Day = +d.Extracurricular_Hours_Per_Day;
        d.Sleep_Hours_Per_Day = +d.Sleep_Hours_Per_Day;
        d.Social_Hours_Per_Day = +d.Social_Hours_Per_Day;
        d.Physical_Activity_Hours_Per_Day = +d.Physical_Activity_Hours_Per_Day;
        d.GPA = +d.GPA;

        // Map `Stress_Level` to numeric values for potential calculations
        d.Stress_Level_Numeric = (d.Stress_Level === "Low") ? 0 :
                                 (d.Stress_Level === "Moderate") ? 1 :
                                 (d.Stress_Level === "High") ? 2 : null;
    });

    console.log("Parsed Data:", data); // Log the parsed data for debugging

    // Filter out invalid rows
    // Only keep rows with valid numeric values
    data = data.filter(function (d) {
        return !isNaN(d.Study_Hours_Per_Day) && !isNaN(d.Extracurricular_Hours_Per_Day) &&
               !isNaN(d.Sleep_Hours_Per_Day) && !isNaN(d.Social_Hours_Per_Day) &&
               !isNaN(d.Physical_Activity_Hours_Per_Day) && !isNaN(d.GPA) &&
               d.Stress_Level_Numeric !== null;
    });

    console.log("Filtered Data:", data); // Log the filtered data for debugging

    // List of numeric attributes for dropdown
    // These attributes can be selected for the X and Y axes
    var attributes = [
        "Study_Hours_Per_Day",
        "Extracurricular_Hours_Per_Day",
        "Sleep_Hours_Per_Day",
        "Social_Hours_Per_Day",
        "Physical_Activity_Hours_Per_Day",
        "GPA",
        "Stress_Level_Numeric"
    ];

    // Utility function to format column names
function formatColumnName(columnName) {
    // Replace underscores with spaces and capitalize words
    return columnName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

// Populate X-axis dropdown menu
var xDropdown = d3.select("#x-axis");
attributes.forEach(function (attr) {
    xDropdown.append("option")
        .text(formatColumnName(attr)) // Display formatted column names
        .attr("value", attr); // Use the original column names as values
});

// Populate Y-axis dropdown menu
var yDropdown = d3.select("#y-axis");
attributes.forEach(function (attr) {
    yDropdown.append("option")
        .text(formatColumnName(attr)) // Display formatted column names
        .attr("value", attr); // Use the original column names as values
});


    // Utility function to format column names
function formatColumnName(columnName) {
    return columnName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

// Function to update the scatterplot
function updateScatterplot() {
    // Clear previous elements
    svg.selectAll("*").remove();

    // Get the selected attributes
    xAttribute = xDropdown.property("value"); // Original column name for X-axis
    yAttribute = yDropdown.property("value"); // Original column name for Y-axis

    console.log("Selected X Attribute:", xAttribute);
    console.log("Selected Y Attribute:", yAttribute);

    // Define scales for the axes
    var x = d3.scale.linear()
        .domain([d3.min(data, function (d) { return d[xAttribute]; }), d3.max(data, function (d) { return d[xAttribute]; })])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([d3.min(data, function (d) { return d[yAttribute]; }), d3.max(data, function (d) { return d[yAttribute]; })])
        .range([height, 0]);

    console.log("X Scale Domain:", x.domain());
    console.log("Y Scale Domain:", y.domain());

    // Define axes
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    // Add X-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .style("text-anchor", "middle")
        .text(formatColumnName(xAttribute)); // Use formatted column name for X-axis label

    // Add Y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .style("text-anchor", "middle")
        .text(formatColumnName(yAttribute)); // Use formatted column name for Y-axis label

    // Add points to the scatterplot
    svg.selectAll(".point")
        .data(data) // Bind data to the points
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", function (d) { return x(d[xAttribute]); }) // Set X position
        .attr("cy", function (d) { return y(d[yAttribute]); }) // Set Y position
        .attr("r", 5) // Set radius of points
        .attr("fill", "steelblue") // Color of points
        .on("mouseover", function (d) {
            tooltip.style("opacity", 1) // Show tooltip
                .html(`${formatColumnName(xAttribute)}: ${d[xAttribute]}<br>${formatColumnName(yAttribute)}: ${d[yAttribute]}`) // Display formatted values
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0); // Hide tooltip
        });
   }


    // Initial rendering
    updateScatterplot();

    // Add event listeners for dropdowns
    xDropdown.on("change", updateScatterplot); // Update when X-axis dropdown changes
    yDropdown.on("change", updateScatterplot); // Update when Y-axis dropdown changes
});
