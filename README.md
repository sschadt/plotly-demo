# Plotly.js demo: "Belly Button Biodiversity"

Interactive dashboard to explore the [Belly Button Biodiversity DataSet](http://robdunnlab.com/projects/belly-button-biodiversity/).

See [hosted demo here](https://sleepy-earth-98949.herokuapp.com/).

## Step 1 - Flask app to expose endpoints

Flask used to serve HTML and JavaScript for dashboard page. SQLite database / SQLAlchemy used to output the data as JSON in four different routes.

## Step 2 - Plotly.js

Plotly.js / Plotly.d3.json used to build interactive charts.

* Sample metadata displayed in table from the route `/sample/<sample>`

* Pie chart uses data from `/samples/<sample>` and `/otu` routes to display the top 10 samples.

* Bubble chart that uses data from routes `/samples/<sample>` and `/otu` to plot the __Sample Value__ vs the __OTU ID__ for the selected sample.

* Gauge chart plots the Weekly Washing Frequency obtained from the route `/wfreq/<sample>`

* Flask app deployed to Heroku (link TBD).
