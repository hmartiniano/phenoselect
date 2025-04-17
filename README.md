Okay, here is a `README.md` file for your project based on the provided code.

```markdown
# HPO Phenotype Selector with Related Terms

This web-based tool allows users to search for Human Phenotype Ontology (HPO) terms, create a list of selected terms, and view other HPO terms that are semantically related to the selected ones. The selected list can be downloaded as a CSV file.

The tool uses a pre-processed HPO data file (`hpo_data.json`) which includes pre-calculated similarity scores between terms to enable fast display of related phenotypes on the client-side.

## Features

*   **Search:** Search HPO terms by name, definition, or synonyms.
*   **Selection:** Add terms from search results to a "Selected Terms" list.
*   **Related Terms:** View a list of terms semantically similar to the currently selected ones, based on pre-calculated scores. Click related terms to add them to the main selection.
*   **Multi-language UI:** Supports English (en), German (de), and Portuguese (pt). Easily extendable.
*   **Download:** Export the selected terms list (HPO ID and Term Name) as a CSV file.
*   **Client-Side:** Operates entirely in the browser after the initial data load, requiring no server backend for searching or selection.
*   **Data Preprocessing:** Includes a Python script (`preprocess_hpo.py`) to prepare the necessary JSON data file from the official HPO JSON file, including similarity calculations using `pyhpo`.

## Technology Stack

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **Preprocessing:** Python 3
*   **Key Python Libraries:** `pyhpo`, `tqdm`
*   **Data Format:** JSON

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Python 3:** Version 3.7 or higher recommended.
2.  **pip:** Python package installer (usually comes with Python).
3.  **Web Browser:** A modern web browser (e.g., Chrome, Firefox, Edge, Safari).
4.  **HPO JSON File:** You need the `hp.json` file from the Human Phenotype Ontology. You can usually download it from:
    *   [HPO Website Downloads](https://hpo.jax.org/app/download/ontology)
    *   [OBO Foundry](http://purl.obolibrary.org/obo/hp.json)

## Setup and Installation

1.  **Clone the Repository (or Download Files):**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```
    Or download the `index.html`, `style.css`, `script.js`, and `preprocess_hpo.py` files into a single directory.

2.  **Install Python Dependencies:**
    Navigate to the project directory in your terminal and install the required Python libraries for preprocessing:
    ```bash
    pip install pyhpo tqdm requests
    ```
    *(Note: `requests` is often used internally by `pyhpo` for fetching data if needed).*

3.  **Download `hp.json`:**
    Place the downloaded `hp.json` file either in the project directory or note its location.

4.  **Run the Preprocessing Script:**
    This step generates the `hpo_data.json` file required by the web application. It reads the `hp.json` file, filters terms, calculates similarities, and saves the result.
    ```bash
    python preprocess_hpo.py /path/to/your/hp.json -o hpo_data.json
    ```
    *   Replace `/path/to/your/hp.json` with the actual path to the file you downloaded.
    *   The `-o hpo_data.json` argument ensures the output file is named correctly for the `script.js` to find it (assuming it's in the same directory as `index.html`).

    **Optional Arguments for Preprocessing:**
    *   `-t <threshold>`: Set the minimum similarity score threshold for storing related terms (e.g., `-t 0.5`). Default is 0.4. Higher values reduce file size but show fewer related terms.
    *   `-m <max_terms>`: Set the maximum number of similar terms to store per HPO term (e.g., `-m 20`). Default is 10. Higher values increase file size but provide more potential related terms.

    **Warning:** The preprocessing step can take a significant amount of time (minutes to potentially hours) depending on your computer's speed and the size of the HPO file, as it involves numerous similarity calculations. The script uses `tqdm` to display progress bars.

5.  **Verify Output:**
    Ensure that the `hpo_data.json` file has been successfully created in the same directory as `index.html`.

## Usage

1.  **Open the Application:** Open the `index.html` file in your web browser.
2.  **Wait for Data Load:** A "Loading HPO data..." message will appear. Wait until it changes to "HPO data loaded successfully."
3.  **Search:** Enter phenotype terms (at least 2 characters) into the search box and click "Search" or press Enter.
4.  **Select Terms:** Click on terms in the "Search Results" panel to add them to the "Selected Terms" list.
5.  **View Related Terms:** As you add terms to the selection, the "Related Terms" panel will update automatically, showing terms similar to your selection (that are not already selected). Scores indicate the calculated similarity.
6.  **Add Related Terms:** Click on a term in the "Related Terms" panel to add it directly to your "Selected Terms" list.
7.  **Remove Terms:** Click the 'X' button next to a term in the "Selected Terms" list to remove it. The "Related Terms" panel will update accordingly.
8.  **Change Language:** Use the language dropdown in the top-right corner to change the UI language.
9.  **Download List:** Click the "Download List (CSV)" button below the "Selected Terms" list to save your selection as a CSV file.

## File Structure

```
.
├── index.html          # Main HTML structure
├── style.css           # CSS styling rules
├── script.js           # JavaScript application logic
├── preprocess_hpo.py   # Python script for data preprocessing
├── hpo_data.json       # (Generated) Processed HPO data with similarities
└── README.md           # This file
```

## Customization

*   **Related Terms:** Adjust the `-t` (threshold) and `-m` (max similar) arguments when running `preprocess_hpo.py` to control the related terms included in `hpo_data.json`.
*   **UI Languages:** Add more languages by:
    1.  Adding a new language key and translations to the `uiStrings` object in `script.js`.
    2.  Adding a corresponding `<option>` to the `#lang-selector` dropdown in `index.html`.
*   **Styling:** Modify `style.css` to change the visual appearance.

## License


This project is licensed under the MIT License - see the LICENSE.md file for details.
```
