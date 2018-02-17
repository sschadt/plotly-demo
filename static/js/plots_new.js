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
        $selSamples
        .on('change', optionChanged);

        // Add options to dropdown
        var options = $selSamples
            .selectAll('option')
            .data(response).enter()
            .append('option')
                .attr("value", (d => d))
                .text(d => d) ; 
             
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

    // Get data from '/samples/<sample>' endpoint
    endpoint = base_url + "/samples/" + sample;
    Plotly.d3.json(endpoint, function(error, response) {
        if (error) return console.warn(error);
    
        otu_ids = response.otu_ids.slice(0, num_items).map(i => i);
        console.log(otu_ids);

        // Place top 10 OTU_ID's into a list
        //for (i = 0; i < 10; i++) { 
        //    console.log("OTU_ID: " + response.otu_ids[i]);
        //    otu_ids.push(response.otu_ids[i]);
       // }

        // Place top 10 sample sizes into a list
        //var top_sample_values = [];
        //for (i = 0; i < 10; i++) { 
        //    console.log("TOP SAMPLE VALUE" + response.sample_values[i]);
        //    top_sample_values.push(response.sample_values[i].toString());
       // }
        top_sample_values = response.sample_values.slice(0, num_items).map(i => i);
 
        // Get data from '/otu' endpoint
        endpoint = base_url + "/otu";
        Plotly.d3.json(endpoint, function(error, response) {
            if (error) return console.warn(error);
            
            // Get the corresponding OTU descriptions for the otu_id list from above
            // Place top 10 OTU descriptions into a list
            var otu_descriptions = [];        
            for (i = 0; i < 10; i++) { 
                var otu_index = otu_ids[i] - 1; // Set index to OTU_ID minus one, to get the index for the descriptions array
                //console.log("OTU index: " + otu_index);
                //console.log("OTU_ID: " + otu_ids[i] + "; Description: " + response[otu_index]);
                
                // Add description to our array
                otu_descriptions.push(otu_ids[i] + "<br>" + response[otu_index]);
            }

            //console.log(top_sample_values);
            //console.log(otu_ids);
            //console.log(otu_descriptions);
        
            // Assemble plot data
            var data = [{
                values: top_sample_values,
                //values: [1, 2, 3, 4, 5, 6, 6, 7, 8, 9],
                labels: otu_descriptions,
                type: 'pie'
            }];
        
            // Define plot layout
            var layout = {
                height: 600,
                width: 800
              };
            
            // Output plot
            if ($plotly.node() != null) {   // Redraw, if updating
                var PlotArea = document.getElementById("pie");
                // Call plotly.restyle to pass new data to it
                Plotly.restyle(PlotArea, "values", [data]);
            } else {
                // Build it fresh
                Plotly.plot("pie", data, layout);
                isBeingUpdated = true;  // From now on, we are updating the plot
            }
        });
    });

}
