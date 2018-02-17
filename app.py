
# Import necessary libraries
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import *
from sqlalchemy import create_engine
from flask import (
    Flask,
    render_template,
    jsonify
    )

#################################################
# Database Setup
#################################################
engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)

# Save references to the tables
Otu = Base.classes.otu
Samples = Base.classes.samples
SamplesMetadata = Base.classes.samples_metadata

# Create our session and metadata objects pulling from the SQLite DB
session = Session(engine)
metadata = MetaData()

#################################################
# Flask Setup
#################################################
app = Flask(__name__)

# Home route
#   Route renders index.html template.
@app.route("/")
def home():
    return render_template("index.html")

# "names" route
#   List of sample names.
#   Returns: List of sample names in the format:
#       ["BB_940", "BB_941", ...]
@app.route('/names')
def names():
    # Query metadata of the 'samples' table 
    samples_table = Table('samples', metadata, autoload=True, autoload_with=engine)
    sample_list = [s.name for s in samples_table.columns if s.name != 'otu_id']

    # Return jsonified results
    return jsonify(sample_list)

# "otu" route
# List of OTU descriptions.
#    Returns: List of OTU descriptions in the following format
#       [   "Archaea;Euryarchaeota;Halobacteria;Halobacteriales;Halobacteriaceae;Halococcus",
#           "Bacteria"
#           ...
#    ]
@app.route('/otu')
def otu():
    # Grab list of all OTU descriptions
    otu_results = session.query(Otu.lowest_taxonomic_unit_found).all()
    otu = []
    for result in otu_results:
        otu.append(result[0])
    
    # Return jsonified result
    return jsonify(otu)

# "metadata" route, for specified sample
# MetaData for a given sample.
#    Args: Sample in the format: `BB_940`
#    Returns: JSON dictionary of sample metadata in the format
#       {  
#           AGE: 24,
#           BBTYPE: "I",
#           ETHNICITY: "Caucasian",
#           GENDER: "F",
#           LOCATION: "Beaufort/NC",
#           SAMPLEID: 940
#       }
@app.route('/sample/<sample>')
def sample(sample):
    # Grab only the number part of the sample ID
    sample_id = int(sample.split("_")[1])

    # Query the DB for this particular sample
    sample_metadata_result = session.query(
        SamplesMetadata.AGE, 
        SamplesMetadata.BBTYPE,
        SamplesMetadata.ETHNICITY,
        SamplesMetadata.GENDER,
        SamplesMetadata.LOCATION,
        SamplesMetadata.SAMPLEID
    ).filter(SamplesMetadata.SAMPLEID == sample_id).all()
    
    # Break out fields from list
    record = sample_metadata_result[0]

    # Add result record object
    sample_metadata =   {
                            "AGE": record[0],
                            "BBTYPE": record[1],
                            "ETHNICITY": record[2],
                            "GENDER": record[3],
                            "LOCATION": record[4],
                            "SAMPLEID": record[5]
                        }
    # Return jsonified result
    return jsonify(sample_metadata)

# "wfreq" route, for specified sample
# Weekly Washing Frequency as a number.
#     Args: Sample in the format: `BB_940`
#     Returns: Integer value for the weekly washing frequency `WFREQ`
@app.route('/wfreq/<sample>')
def wfreq(sample):
    sample_id = int(sample.split("_")[1])
    sample_wfreq_result = session.query(
        SamplesMetadata.WFREQ
    ).filter(SamplesMetadata.SAMPLEID == sample_id).all()
    
    # Assign wfreq value to object result
    sample_wfreq = {
        "WFREQ": sample_wfreq_result[0]
    }
    # Return jsonified result
    return jsonify(sample_wfreq)

# OTU IDs and Sample Values, for a given sample.
#     Args: Sample in the form: `BB_940`
#     Returns: Dictionary containing sorted lists for `otu_ids`
#             and `sample_values` (descending on sample_value). E.g.:
#                     [
#                         {
#                             otu_ids: [
#                                 1166,
#                                 2858,
#                                 ...
#                             ],
#                             sample_values: [
#                                 163,
#                                 126,
#                                 ...
#                             ]
#                         }
#                     ]
@app.route('/samples/<sample_name>')
def samples(sample_name):
    # Query specified sample field + otu_id from the 'samples' table
    query_values = f"SELECT {sample_name}, otu_id FROM samples ORDER BY {sample_name} DESC"
    data = engine.execute(query_values).fetchall()

    # Create lists of values and otu_id's
    values = [item[0] for item in data]  
    otus = [item[1] for item in data]

    # Place the lists into an object
    otus_and_values = {"otu_ids": otus, "sample_values": values}

    # Return jsonified list
    return jsonify(otus_and_values)

# Script execution
if __name__ == "__main__":
    app.run()
