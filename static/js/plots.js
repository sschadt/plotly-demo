// Base URL logic: If hosted on Heroku, format differently
var host = window.location.hostname;
if (host.includes("heroku")) {
    var base_url = "https://" + host;
} else {
    var base_url = "http://localhost:5000";
}

var $selSamples = Plotly.d3.select("#selSamples");  // Locate dropdown box containing samples
var $plotly = Plotly.d3.select('#pie').select(".plotly");
var selectedSample = "";  // Initialize selectedSample variable
var isBeingUpdated = false; // Define page initialization variable (if true, then plot is on page)
var otu_ids = [];
var otu_descriptions = [];
var top_sample_values = [];

/**
 * When page loads, build the dropdown list.
 * @param {string} base_url - Base URL for data endpoints. 
 */
function BuildDropdown(base_url) {
    // Get data from '/names' endpoint
    endpoint = base_url + "/names";
    Plotly.d3.json(endpoint, function(error, response) {
        if (error) return console.warn(error);

        // On select of new sample, add data to the array and chart
        $selSamples.on('change', optionChanged);

        // Add options to dropdown
        var options = $selSamples
            .selectAll('option')
            .data(response).enter()
            .append('option')
                .attr("value", (d => d))
                .text(d => d);
        
        // Add a blank option at the top.
        var $ddBlank = $selSamples.insert("option", ":first-child")
            .text("Select...").attr("value", "").attr("selected", true);
        });
}

// Initialize page dropdown list
BuildDropdown(base_url);

/**
 * When a new sample is selected from the dropdown, redraw chart.
 * @fires buildPieChart()
 */
function optionChanged() {
    // Obtain selected sample from dropdown
    selectedSample = Plotly.d3.select('select').property('value'); 
    
    // Call plot function with the new sample value
    buildPieChart(selectedSample);
};

/**
 * Update the pie chart.
 * @param {string} sample - Sample for which to show results. 
 * @param {boolean} isUpdate - Whether or not this is a plot update.
 */
function buildPieChart(sample) {
    // Determine number of labels to show
    var num_items = 10;

     // Get data from '/sample/<sample>' endpoint (for our metadata table)
     endpoint = base_url + "/sample/" + sample;
     Plotly.d3.json(endpoint, function(error, response) {
         if (error) return console.warn(error);
        
         // Place sample metadata values into table
         $sidebar = Plotly.d3.select(".sample-sidebar");
         $sidebar.select("table").classed("displayed", true);  // Show table
         $sidebar.select(".age").text(response.AGE);
         $sidebar.select(".bbtype").text(response.BBTYPE);
         $sidebar.select(".ethnicity").text(response.ETHNICITY);
         $sidebar.select(".gender").text(response.GENDER);
         $sidebar.select(".location").text(response.LOCATION);
         $sidebar.select(".sampleid").text(response.SAMPLEID);

         // Place sample name in header
         Plotly.d3.select(".col-md-9").select(".panel-body").text("Biodiversity Breakdown for Patient " + response.SAMPLEID);         
     });

    // Get data from '/samples/<sample>' endpoint (for the top 10 samples for our pie chart)
    endpoint = base_url + "/samples/" + sample;
    Plotly.d3.json(endpoint, function(error, response) {
        if (error) return console.warn(error);
    
        // Place the top 10 OTU_ID's into a list
        top_otu_ids = response.otu_ids.slice(0, num_items).map(d => d);
        console.log(top_otu_ids);

        // Get all OTU_IDs and samples
        sample_values = response.sample_values.filter(d => d =! 0); // Only non-zero sample values
        otu_ids = response.otu_ids.slice(0, sample_values.length).map(d => d);  // Only OTU_ids for non-zero sample_values

        // Place the top 10 sample values into a list
        top_sample_values = response.sample_values.slice(0, num_items).map(d => d);

        // Get data from '/otu' endpoint
        endpoint = base_url + "/otu";
        Plotly.d3.json(endpoint, function(error, response) {
            if (error) return console.warn(error);
            
            // Get the corresponding OTU descriptions for the otu_id list from above
            // Place top 10 OTU descriptions into a list
            var top_otu_descriptions = [], otu_descriptions = [];      
            for (i = 0; i < 10; i++) { 
                var otu_index = otu_ids[i] - 1; // Set index to OTU_ID minus one, to get the index for the descriptions array

                // Append to otu_descriptions array
                otu_descriptions.push(response[otu_index]);

                // Append to top_otu_descriptions array
                if (i < 10)
                    top_otu_descriptions.push(response[otu_index]);
            }

            // Assemble pie plot data
            var data = [{
                values: top_sample_values,
                labels: top_otu_ids,
                text: otu_descriptions,
                type: 'pie',
                textinfo: 'none'
            }];
        
            // Define pie plot layout
            var layout = {
                height: 600,
                width: 800
              };
            
            // Output pie plot
            if ($plotly.node() != null) {   // Redraw, if updating
                var PlotArea = document.getElementById("pie");
                // Call plotly.restyle to pass new data to it
                Plotly.restyle(PlotArea, "values", [data]);
            } else {
                // Build it fresh
                Plotly.plot("pie", data, layout);
                isBeingUpdated = true;  // From now on, we are updating the plot
            }   
            
            // Output bubble plot
            var sample_values_sizes = sample_values.map(d => d*5); // Increase the size of the bubbles fourfold, so we can see them!
            var trace1 = {
                x: otu_ids,
                y: sample_values,
                mode: 'markers',
                text: otu_descriptions,
                marker: {
                    color: otu_ids,
                    colorscale: [[0, 'rgb(200, 255, 200)'], [1, 'rgb(0, 100, 0)']],
                    cmin: Math.min(otu_ids),
                    cmax: Math.max(otu_ids),
                    size: sample_values_sizes,
                    sizemode: 'area',
                    sizeref: 1,
                    showscale: true,
                    colorbar: {
                      thickness: 10,
                      y: 0.5,
                      ypad: 0,
                      title: 'OTU ID',
                      titleside: 'bottom',
                      outlinewidth: 1,
                      outlinecolor: 'black',
                      tickfont: {
                        family: 'Lato',
                        size: 14,
                        color: 'green'
                      }
                    }
                  }
              };
              var data = [trace1];
              Plotly.newPlot('bubble', data);
        });
    });

    // Gauge Plot 
    endpoint = base_url + "/wfreq/" + sample;
    Plotly.d3.json(endpoint, function (error, response) {
        // Enter a speed between 0 and 180
        var freq_adj = response.WFREQ * 18

        // Trig to calc meter point
        var degrees = 180 - freq_adj,
            radius = .5;
        var radians = degrees * Math.PI / 180;
        var x = radius * Math.cos(radians);
        var y = radius * Math.sin(radians);

        // Path: may have to change to create a better triangle
        var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
            pathX = String(x),
            space = ' ',
            pathY = String(y),
            pathEnd = ' Z';
        var path = mainPath.concat(pathX, space, pathY, pathEnd);

        var data = [{
            type: 'scatter',
            x: [0], y: [0],
            marker: { size: 14, color: '850000' },
            showlegend: false,
            name: 'Washing Frequency',
            text: response.WFREQ,
            hoverinfo: 'text+name'
        },
        {
            values: [50 / 5, 50 / 5, 50 / 5, 50 / 5, 50 / 5, 50],
            rotation: 90,
            text: ['Very high', 'High', 'Average', 'Low',
                'Very low'],
            textinfo: 'text',
            textposition: 'inside',
            marker: {
                colors: ['rgba(rgba(0, 255, 0, .75)',
                    'rgba(200, 255, 150, .75)', 'rgba(255, 255, 42, .75)',
                    'rgba(255, 140, 0, .75)', 'rgba(255, 0, 0, .75)',
                    'rgba(255, 255, 255, 0)']
            },
            labels: ['More than 9', '6 to 8', '4 to 6', '2 to 4', '0 to 2', ''],
            hoverinfo: 'label',
            hole: .5,
            type: 'pie',
            showlegend: false
        }];

        var layout = {
            shapes: [{
                type: 'path',
                path: path,
                fillcolor: '850000',
                line: {
                    color: '850000'
                }
            }],
            title: '<b>Washing Frequency Gauge</b> <br> Washing times/wk',
            height: 400,
            width: 400,
            xaxis: {
                zeroline: false, showticklabels: false,
                showgrid: false, range: [-1, 1]
            },
            yaxis: {
                zeroline: false, showticklabels: false,
                showgrid: false, range: [-1, 1]
            }
        };

        Plotly.newPlot('gauge', data, layout);
    });
}
