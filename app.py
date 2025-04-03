from flask import Flask, request, jsonify, send_from_directory
import hpo_data # Import the data loading module
import sys
import os # Import os module

# --- Initialize Flask App ---
# Use 'static_folder=None' to prevent conflict if you happened to name a folder 'static'
# We are serving files manually from the root '.' directory in this simple setup.
app = Flask(__name__, static_folder=None)

# --- Load HPO Data ONCE on Startup ---
print("Loading HPO data...")
HPO_DATA = hpo_data.load_hpo_data()

# Check if data loading was successful, exit if not
if not HPO_DATA:
    print("Critical Error: HPO data could not be loaded. Exiting.")
    sys.exit(1) # Exit the application if data isn't available
print("HPO data loaded successfully. Starting server...")
# --- End Data Loading ---


# --- Serve Frontend Files ---

@app.route('/')
def index():
    """Serves the main index.html file."""
    # Serve index.html from the same directory as app.py
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def style():
    """Serves the style.css file."""
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def script():
    """Serves the script.js file."""
    return send_from_directory('.', 'script.js')


# --- API Endpoints ---

@app.route('/search')
def search_hpo():
    """
    Searches HPO terms based on a query string (q).
    Matches against term names, definitions, and synonyms (case-insensitive).
    """
    query = request.args.get('q', '').lower().strip()

    # Return empty list if query is too short or missing
    if len(query) < 2: # Require at least 2 characters for search
        return jsonify([])

    results = []
    max_results = 50 # Limit the number of results returned

    for term in HPO_DATA:
        match = False
        # Prioritize matching name first
        if query in term['name'].lower():
            match = True
        # Then check definition
        elif query in term['definition'].lower():
            match = True
        # Finally check synonyms
        else:
            for syn in term['synonyms']:
                if query in syn.lower():
                    match = True
                    break # Found in synonyms, stop checking synonyms for this term

        if match:
            # Add only ID and Name to results for the frontend
            results.append({'id': term['id'], 'name': term['name']})
            if len(results) >= max_results:
                break # Stop searching once max results are reached

    # Return the list of matching terms as JSON
    return jsonify(results)

# --- Run the App ---
if __name__ == '__main__':
    # Note: debug=True is useful for development but should be False in production
    # host='0.0.0.0' makes the server accessible on your network, not just localhost
    app.run(host='0.0.0.0', port=5000, debug=True)
