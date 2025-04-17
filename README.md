# Phenoselect - HPO Phenotype Selector with Related Terms

This web-based tool allows users to search for Human Phenotype Ontology (HPO) terms, create a list of selected terms, and view other HPO terms that are semantically related to the selected ones. The selected list can be downloaded as a CSV file.

The tool uses a pre-processed HPO data file (`hpo_data.json`) which includes pre-calculated similarity scores between terms and the HPO version used for processing, enabling fast display of related phenotypes and version information on the client-side.

## Features

*   **Search:** Search HPO terms by name, definition, or synonyms.
*   **Selection:** Add terms from search results to a "Selected Terms" list.
*   **Related Terms:** View a list of terms semantically similar to the currently selected ones, based on pre-calculated scores. Click related terms to add them to the main selection.
*   **HPO Version Display:** Shows the HPO ontology version used during data preprocessing.
*   **Multi-language UI:** Supports English (en), German (de), and Portuguese (pt). Easily extendable.
*   **Download:** Export the selected terms list (HPO ID and Term Name) as a CSV file.
*   **Client-Side:** Operates entirely in the browser after the initial data load.
*   **Data Preprocessing (`preprocess_hpo.py`):**
    *   **Automatic Data Download:** Downloads necessary HPO master files (`hp.json`, `hp.obo`, `phenotype.hpoa`, etc.) from official PURLs to a local directory. Ensures all required files for `pyhpo` are present and version-consistent.
    *   **Consistent Ontology Initialization:** Initializes `pyhpo` using the directory containing the downloaded master files.
    *   Handles potential PURL identifiers (e.g., `http://.../HP_XXXXXXX`) in the JSON by converting them to the short format (`HP:XXXXXXX`).
    *   Calculates term similarities using `pyhpo`.
    *   Includes the HPO version (read from the downloaded `.obo` file) in the output JSON.

## Technology Stack

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **Preprocessing:** Python 3
*   **Key Python Libraries:** `pyhpo`, `tqdm`, `requests`
*   **Data Format:** JSON

## Prerequisites

1.  **Python 3:** Version 3.7 or higher recommended.
2.  **pip:** Python package installer.
3.  **Web Browser:** A modern web browser (e.g., Chrome, Firefox, Edge, Safari).

## Setup and Installation

1.  **Clone the Repository (or Download Files):**
    ```bash
    git clone https://github.com/hmartiniano/phenoselect.git
    cd phenoselect
    ```
    Or download `index.html`, `style.css`, `script.js`, and `preprocess_hpo.py` into a single directory.

2.  **Install Python Dependencies:**
    Navigate to the project directory in your terminal and install the required Python libraries:
    ```bash
    pip install pyhpo tqdm requests
    ```

3.  **Run the Preprocessing Script:**
    This command will first download the necessary HPO master files (including `hp.json`, `hp.obo`, `phenotype.hpoa`) corresponding to the *latest official release* (as defined by the PURLs) into the `--data-dir` (defaulting to `./hpo_master_data/`) if they don't exist. It then initializes `pyhpo` using these downloaded files, processes the downloaded `hp.json`, calculates similarities, and saves the result to the specified output file (`hpo_data.json` by default).
    ```bash
    python preprocess_hpo.py -o hpo_data.json
    ```
    *   The script no longer takes an input file path as a positional argument; it uses the `hp.json` downloaded into the data directory.
    *   `-o hpo_data.json`: Specifies the name for the final processed output file (required by the web app).

    **Optional Arguments:**
    *   `--data-dir <directory_path>`: Specify a different directory to store/find the downloaded HPO master files (default: `./hpo_master_data/`).
    *   `--force-download`: Add this flag to force redownloading of all master files, even if they already exist in the data directory. Useful for updating to the latest official HPO data.
    *   `-t <threshold>`: Minimum similarity score (default: 0.4).
    *   `-m <max_terms>`: Max similar terms stored per term (default: 10).

    **Note:** The first time you run the script, it will download several files from the official HPO PURLs, which may take a moment depending on your internet connection. Subsequent runs will use the existing files unless `--force-download` is used. The similarity calculation step can still take significant time (minutes to hours depending on the CPU).

4.  **Verify Output:**
    *   Ensure the output file (e.g., `hpo_data.json`) has been successfully created in the project directory.
    *   Check the data directory (e.g., `./hpo_master_data/`) for the downloaded HPO files (`hp.json`, `hp.obo`, `phenotype.hpoa`, etc.).

## Usage

1.  **Open Application:** Open the `index.html` file in your web browser.
2.  **Wait for Data Load:** A "Loading HPO data..." message will appear. Wait until it changes to "HPO data loaded successfully." The HPO version used during preprocessing will appear at the top.
3.  **Search:** Enter phenotype terms (at least 2 characters) into the search box and click "Search" or press Enter.
4.  **Select Terms:** Click on terms in the "Search Results" panel to add them to the "Selected Terms" list.
5.  **View Related Terms:** As you add terms to the selection, the "Related Terms" panel will update automatically, showing terms similar to your selection (that are not already selected). Scores indicate the calculated similarity.
6.  **Add Related Terms:** Click on a term in the "Related Terms" panel to add it directly to your "Selected Terms" list.
7.  **Remove Terms:** Click the 'X' button next to a term in the "Selected Terms" list to remove it.
8.  **Change Language:** Use the language dropdown in the top-right corner.
9.  **Download List:** Click the "Download List (CSV)" button below the "Selected Terms" list to save your selection.

## File Structure

```
.
├── index.html          # Main HTML structure
├── style.css           # CSS styling rules
├── script.js           # JavaScript application logic
├── preprocess_hpo.py   # Python script for data download & preprocessing
├── hpo_data.json       # (Generated) Processed HPO data {version, nodes}
├── hpo_master_data/    # (Generated by script) Directory containing downloaded files
│   ├── hp.json         # Downloaded HPO structure file
│   ├── hp.obo          # Downloaded HPO ontology file
│   ├── phenotype.hpoa
│   └── ... (other downloaded files)
└── README.md           # This file
```

## Customization

*   **Related Terms:** Adjust `-t` (threshold) and `-m` (max similar) arguments when running `preprocess_hpo.py`.
*   **UI Languages:** Add more languages by modifying the `uiStrings` object in `script.js` and adding an `<option>` to the `#lang-selector` dropdown in `index.html`.
*   **Styling:** Modify `style.css`.
*   **Data Directory:** Change the default download/storage location for HPO files using the `--data-dir` argument during preprocessing.

## License

This project is licensed under the **GNU General Public License v3.0**.

The full text of the license can be found in the `LICENSE` file in this repository (if added) or online at:
[https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)
