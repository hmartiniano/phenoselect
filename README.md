# Phenoselect - HPO Phenotype Selector with Related Terms

This web-based tool allows users to search for Human Phenotype Ontology (HPO) terms, create a list of selected terms, and view other HPO terms that are semantically related to the selected ones. The selected list can be downloaded as a CSV file.

The tool uses a pre-processed HPO data file (`hpo_data.json`) which includes pre-calculated similarity scores between terms and the HPO version used for processing.

## Features

*   **Search:** Search HPO terms by name, definition, or synonyms.
*   **Selection:** Add terms from search results to a "Selected Terms" list.
*   **Related Terms:** View a list of terms semantically similar to the currently selected ones, based on pre-calculated scores. Click related terms to add them to the main selection.
*   **HPO Version Display:** Shows the HPO ontology version used during data preprocessing in the footer.
*   **Multi-language UI:** Supports English (en), German (de), and Portuguese (pt). Easily extendable.
*   **Download:** Export the selected terms list (HPO ID and Term Name) as a CSV file.
*   **Client-Side:** Operates entirely in the browser after the initial data load.
*   **Data Preprocessing (`preprocess_hpo.py`):**
    *   **Automatic Data Download:** Downloads necessary HPO master files (`hp.json`, `hp.obo`, `phenotype.hpoa`, etc.) from official PURLs to a local directory. Ensures all required files are present and version-consistent.
    *   **Consistent Ontology Initialization:** Initializes `pyhpo` (or compatible library like `hpo3`) using the directory containing the downloaded master files.
    *   **Library-Based Version Reading:** Reads the HPO version directly from the `Ontology.version` attribute provided by the `pyhpo`/`hpo3` library after initialization.
    *   Handles potential PURL identifiers (e.g., `http://.../HP_XXXXXXX`) in the JSON by converting them to the short format (`HP:XXXXXXX`).
    *   Calculates term similarities using the initialized ontology object.
    *   Includes the HPO version (obtained from the library) in the output JSON file.

## Technology Stack

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5 (via CDN)
*   **Preprocessing:** Python 3
*   **Key Python Libraries:** `pyhpo` (or `hpo3`), `tqdm`, `requests`
*   **Data Format:** JSON
*   **Automation:** GNU Make

## Prerequisites

1.  **Python 3:** Version 3.7 or higher recommended.
2.  **pip:** Python package installer.
3.  **Web Browser:** A modern web browser.
4.  **Git:** For version control and the Makefile's commit/tag/push steps.
5.  **GNU Make:** To run the automation tasks defined in the `Makefile`.
6.  **(Optional) GitHub CLI (`gh`):** Required *only* if you want to use `make release` to automatically create GitHub releases. Install from [https://cli.github.com/](https://cli.github.com/) and authenticate using `gh auth login -s workflow`.

## Setup and Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/hmartiniano/phenoselect.git
    cd phenoselect
    ```

2.  **Install Python Dependencies:**
    ```bash
    pip install pyhpo tqdm requests
    # Or: pip install hpo3 tqdm requests (if using the newer fork)
    ```

3.  **Run the Preprocessing Script via Make:**
    This command will download the latest HPO master files (if missing or `--force-download` used), initialize the ontology library, read the version from the library, process the data, calculate similarities, and save the result to `hpo_data.json`.
    ```bash
    make hpo_data.json
    ```
    *   Alternatively, run `make update_data` to force downloads and processing.

    **Optional Arguments (Passed via script call within Makefile, or modify Makefile):**
    *   See `preprocess_hpo.py -h` for options like threshold, max-similar, data-dir. The Makefile uses defaults but can be modified.

4.  **Verify Output:**
    *   Ensure `hpo_data.json` exists.
    *   Check the `./hpo_master_data/` directory for downloaded files.

## Usage (Web Application)

1.  **Open:** Open `index.html` in your browser.
2.  **Wait:** Data loads. The HPO version (obtained via the library during preprocessing) appears in the footer.
3.  **Use:** Search, select terms, view related terms, download CSV.

## Automation (Makefile)

The included `Makefile` automates common tasks:

*   `make hpo_data.json`: Creates or updates the `hpo_data.json` file by running the preprocessing script (downloads data if needed).
*   `make update_data`: Forces redownload of HPO master files and runs preprocessing.
*   `make commit`: Stages and commits `hpo_data.json` and the `hpo_master_data` directory with a message indicating the HPO version retrieved from the processed file.
*   `make tag`: Creates a Git tag (e.g., `v2025-03-05`) based on the HPO version from the processed data.
*   `make push`: Pushes the current commit and the created tag to the `origin` remote.
*   `make release` (Requires `gh` CLI): Performs `commit`, `tag`, `push`, and then creates a GitHub release associated with the tag, uploading `hpo_data.json` and an archive of `hpo_master_data` as assets.
*   `make all`: Alias for `make release`.
*   `make clean`: Removes generated `hpo_data.json`, the data archive, and the `hpo_master_data` directory.

**Typical Release Workflow:**

```bash
# 1. Ensure you have the latest HPO data (optional, only if needed)
make update_data

# 2. Verify hpo_data.json looks correct

# 3. Run the full release process
make release
```


## File Structure

```
.
├── index.html          # Main HTML structure
├── style.css           # Minimal CSS overrides for Bootstrap
├── script.js           # JavaScript application logic
├── preprocess_hpo.py   # Python script for data download & preprocessing
├── Makefile            # Automation script
├── hpo_data.json       # (Generated) Processed HPO data {version, nodes}
├── hpo_master_data/    # (Generated by script) Directory containing downloaded files
│   ├── hp.json         # Downloaded HPO structure file
│   ├── hp.obo          # Downloaded HPO ontology file
│   ├── phenotype.hpoa
│   └── ... (other downloaded files)
└── README.md           # This file
```

## Customization

*   **Related Terms:** Adjust `-t` (threshold) and `-m` (max similar) arguments in the `Makefile`'s call to `preprocess_hpo.py` or run the script manually with desired options.
*   **UI Languages:** Add translations in `script.js` and options in `index.html`.
*   **Styling:** Modify `style.css` or use Bootstrap utility classes in `index.html`.
*   **Data Directory:** Change the default download/storage location using the `--data-dir` argument.

## License

This project is licensed under the **GNU General Public License v3.0**.

The full text of the license can be found in the `LICENSE` file in this repository (if added) or online at:
[https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)

