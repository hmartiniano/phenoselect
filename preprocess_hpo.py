#!/usr/bin/env python3
import json
import argparse
import sys
import os
import requests # For downloading files
from pathlib import Path # For easier path handling
from pyhpo import Ontology
import tqdm

# --- Configuration ---
DEFAULT_SIMILARITY_THRESHOLD = 0.4
DEFAULT_MAX_SIMILAR_TERMS = 10
DEFAULT_DATA_DIR = "./hpo_master_data/" # Default directory for HPO files

# URLs for the required HPO data files (NOW INCLUDES hp.json)
HPO_DATA_URLS = {
    "hp.json": "http://purl.obolibrary.org/obo/hp.json", # ADDED
    "hp.obo": "http://purl.obolibrary.org/obo/hp.obo",
    "genes_to_phenotype.txt": "http://purl.obolibrary.org/obo/hp/hpoa/genes_to_phenotype.txt",
    "phenotype.hpoa": "http://purl.obolibrary.org/obo/hp/hpoa/phenotype.hpoa",
    "phenotype_to_genes.txt": "http://purl.obolibrary.org/obo/hp/hpoa/phenotype_to_genes.txt"
}

# Define critical files needed to proceed
CRITICAL_FILES = ["hp.json", "hp.obo"]

# --- Helper Functions ---

def get_short_hpo_id(long_id):
    """Extracts HP:XXXXXXX ID from PURL or returns if already short."""
    # ... (function remains the same) ...
    if not isinstance(long_id, str): return None
    if long_id.startswith("HP:") and len(long_id.split(':')[-1]) == 7: return long_id
    if '/' in long_id:
        last_part = long_id.split('/')[-1]
        if last_part.startswith("HP_") and len(last_part.split('_')[-1]) == 7:
            return last_part.replace("_", ":")
    return None

def download_file(url, target_path):
    """Downloads a file from a URL to a target path."""
    # ... (function remains the same) ...
    print(f"  Downloading {os.path.basename(target_path)} from {url}...")
    try:
        response = requests.get(url, stream=True, timeout=60) # Added timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        with open(target_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"  Successfully downloaded {os.path.basename(target_path)}.")
        return True
    except requests.exceptions.RequestException as e:
        print(f"  Error downloading {url}: {e}", file=sys.stderr)
        if os.path.exists(target_path):
             try: os.remove(target_path)
             except OSError: pass
        return False
    except Exception as e:
        print(f"  An unexpected error occurred during download of {url}: {e}", file=sys.stderr)
        if os.path.exists(target_path):
             try: os.remove(target_path)
             except OSError: pass
        return False

def ensure_hpo_data_files(data_dir, force_download=False):
    """Ensures required HPO data files exist in data_dir, downloading if necessary."""
    # ... (function logic mostly the same, just checks CRITICAL_FILES at the end) ...
    data_path = Path(data_dir)
    data_path.mkdir(parents=True, exist_ok=True)
    print(f"Ensuring HPO data files are present in: {data_path.resolve()}")

    all_downloads_successful = True
    for filename, url in HPO_DATA_URLS.items():
        target_file = data_path / filename
        if not target_file.exists() or force_download:
            if force_download and target_file.exists():
                print(f"  Force download requested. Removing existing {filename}...")
                try: target_file.unlink()
                except OSError as e: print(f"  Warning: Could not remove existing file {target_file}: {e}")

            if not download_file(url, target_file):
                all_downloads_successful = False
                if filename in CRITICAL_FILES:
                     print(f"  Critical error: Failed to download essential file '{filename}'.", file=sys.stderr)
                     # No need to return None yet, check all critical files at the end
                else:
                     print(f"  Warning: Failed to download optional file {filename}. Proceeding without it...")
        else:
            print(f"  {filename} already exists.")

    # Check if all *critical* files are present after attempts
    missing_critical = []
    for filename in CRITICAL_FILES:
        if not (data_path / filename).exists():
            missing_critical.append(filename)

    if missing_critical:
        print(f"Critical error: The following essential HPO data files are missing in '{data_path.resolve()}' after download attempts: {', '.join(missing_critical)}", file=sys.stderr)
        return None # Indicate critical failure

    return str(data_path.resolve()) # Return the resolved path to the directory


# --- Main Preprocessing Function ---

# REMOVED input_file_path from arguments
def preprocess_hpo(output_file_path, similarity_threshold, max_similar_terms, data_dir, force_download):
    """
    Downloads HPO data, initializes pyhpo, calculates similarities, and writes output JSON.
    Uses hp.json from the specified data directory.
    """
    # 1. Ensure HPO data files are downloaded
    hpo_data_directory = ensure_hpo_data_files(data_dir, force_download)
    if hpo_data_directory is None:
        print("Failed to obtain necessary HPO data files. Exiting.", file=sys.stderr)
        sys.exit(1)

    # Construct path to the hp.json file WITHIN the data directory
    input_json_path = os.path.join(hpo_data_directory, "hp.json")

    # 2. Initialize pyhpo Ontology from the directory
    hpo_version = "Unknown"
    print(f"\nInitializing HPO Ontology from directory: {hpo_data_directory}")
    try:
        _ = Ontology(hpo_data_directory)
        print("Successfully initialized Ontology from directory.")
        try:
             hpo_version = Ontology.version
             if not hpo_version: hpo_version = "Not specified by pyhpo"
        except AttributeError:
             hpo_version = "Version attribute not found in pyhpo"
        print(f"Using HPO Version: {hpo_version}")
    except Exception as e: # ... (rest of Ontology init error handling) ...
        print(f"Error: Failed to initialize pyhpo Ontology from directory '{hpo_data_directory}'. {e}", file=sys.stderr)
        print("Please check if the required files (especially hp.obo) are present and valid in the directory.", file=sys.stderr)
        sys.exit(1)


    # 3. Read Input HPO JSON File (using the path constructed above)
    print(f"\nReading HPO data from: {input_json_path}") # Use constructed path
    try:
        with open(input_json_path, 'r', encoding='utf-8') as f:
            hpo_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Downloaded hp.json file not found at expected location: {input_json_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e: # ... (rest of file reading error handling) ...
        print(f"Error: Could not parse JSON from {input_json_path}. {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file {input_json_path}: {e}", file=sys.stderr)
        sys.exit(1)

    if not hpo_data or 'graphs' not in hpo_data: # Simplified check
        print(f"Error: Unexpected JSON structure in {input_json_path}. Expected 'graphs' key.", file=sys.stderr)
        sys.exit(1)
    if not isinstance(hpo_data.get('graphs'), list) or len(hpo_data['graphs']) == 0 or 'nodes' not in hpo_data['graphs'][0] or not isinstance(hpo_data['graphs'][0].get('nodes'), list):
         print(f"Error: Unexpected JSON structure in {input_json_path}. Expected 'graphs[0].nodes' as a list.", file=sys.stderr)
         sys.exit(1)


    # 4. Process Terms (Pass 1: Extract/Filter)
    # ... (This section remains the same) ...
    term_dict = {}
    valid_original_ids = set()
    original_node_count = len(hpo_data['graphs'][0]['nodes'])
    print(f"Found {original_node_count} total nodes in the original file.")
    print("Extracting non-obsolete terms and validating IDs...")
    skipped_obsolete = 0; skipped_bad_id = 0
    for node in hpo_data['graphs'][0]['nodes']:
        original_id = node.get('id'); label = node.get('lbl')
        if not original_id or not label: skipped_bad_id += 1; continue
        if node.get('meta', {}).get('obsolete', False): skipped_obsolete += 1; continue
        definition = node.get('meta', {}).get('definition', {}).get('val', '')
        synonyms = []
        raw_synonyms = node.get('meta', {}).get('synonyms', [])
        if isinstance(raw_synonyms, list):
            for syn in raw_synonyms:
                if isinstance(syn, dict) and syn.get('val'): synonyms.append(syn['val'])
        term_dict[original_id] = {'id': original_id, 'lbl': label, 'definition': definition, 'synonyms': synonyms, 'similar_terms': []}
        valid_original_ids.add(original_id)
    print(f"Identified {len(valid_original_ids)} potential non-obsolete terms.")
    if skipped_obsolete > 0: print(f"Skipped {skipped_obsolete} obsolete terms.")
    if skipped_bad_id > 0: print(f"Skipped {skipped_bad_id} terms with missing ID or label.")


    # 5. Fetch pyhpo Objects (Pass 2)
    # ... (This section remains the same) ...
    print("\nFetching pyhpo term objects (converting IDs)...")
    hpo_objects = {}; fetch_errors = 0; id_conversion_failures = 0; processed_count = 0
    for original_id in tqdm.tqdm(valid_original_ids, desc="Fetching HPO Objects"):
        processed_count += 1; short_id = get_short_hpo_id(original_id)
        if short_id is None: id_conversion_failures += 1; fetch_errors += 1; continue
        try:
            hpo_term = Ontology.get_hpo_object(short_id)
            if hpo_term.id == short_id: hpo_objects[original_id] = hpo_term
            else: fetch_errors += 1
        except ValueError: fetch_errors += 1
        except Exception as e: fetch_errors += 1; print(f"Warning: Error fetching {short_id}: {e}")
    print(f"Attempted to fetch {processed_count} terms.")
    if id_conversion_failures > 0: print(f"Warning: Failed to convert {id_conversion_failures} IDs.")
    if fetch_errors > 0: print(f"Warning: Encountered {fetch_errors} HPO object fetching errors.")
    print(f"Successfully fetched {len(hpo_objects)} pyhpo objects.")


    # 6. Calculate Similarities (Pass 3)
    # ... (This section remains the same) ...
    print(f"\nCalculating similarities for {len(hpo_objects)} terms...")
    valid_ids_for_similarity = list(hpo_objects.keys()); num_terms_to_compare = len(valid_ids_for_similarity)
    for i in tqdm.tqdm(range(num_terms_to_compare), desc="Calculating Similarities"):
        original_id_a = valid_ids_for_similarity[i]; term_a = hpo_objects[original_id_a]
        term_similarities = []
        for j in range(i + 1, num_terms_to_compare):
            original_id_b = valid_ids_for_similarity[j]; term_b = hpo_objects[original_id_b]
            try:
                score = term_a.similarity_score(term_b)
                if score >= similarity_threshold:
                    term_similarities.append({'id': original_id_b, 'score': round(score, 3)})
                    if original_id_b in term_dict: term_dict[original_id_b].setdefault('potential_similar', []).append({'id': original_id_a, 'score': round(score, 3)})
            except Exception: pass
        if original_id_a in term_dict: term_dict[original_id_a].setdefault('potential_similar', []).extend(term_similarities)

    # 7. Sort and Prune (Pass 4)
    # ... (This section remains the same) ...
    print("\nSorting and pruning similarity lists...")
    final_term_list = []
    for original_id in tqdm.tqdm(term_dict.keys(), desc="Sorting/Pruning"):
        term_data = term_dict[original_id]
        potential_similar = term_data.pop('potential_similar', [])
        if potential_similar:
            potential_similar.sort(key=lambda x: x['score'], reverse=True)
            seen_ids = set(); final_similar = []
            for sim_term in potential_similar:
                 if len(final_similar) >= max_similar_terms: break
                 if sim_term['id'] in term_dict and sim_term['id'] not in seen_ids:
                     final_similar.append(sim_term); seen_ids.add(sim_term['id'])
            term_data['similar_terms'] = final_similar
        if original_id in valid_original_ids: final_term_list.append(term_data)
    print(f"Processed {len(final_term_list)} terms for the final output.")


    # 8. Write Final JSON Output
    # ... (This section remains the same) ...
    print(f"\nWriting processed data to: {output_file_path}")
    output_data = {"hpo_version": hpo_version, "nodes": final_term_list}
    try:
        output_dir = os.path.dirname(output_file_path)
        if output_dir: os.makedirs(output_dir, exist_ok=True)
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False)
        print("Successfully wrote processed HPO data.")
    except IOError as e:
        print(f"Error: Could not write output: {e}", file=sys.stderr); sys.exit(1)
    except Exception as e:
        print(f"Error writing file: {e}", file=sys.stderr); sys.exit(1)


# --- Main Execution Block ---

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download HPO data, preprocess ontology JSON, calculate similarities, and prepare data for phenoselect web app.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    # REMOVED positional input_file argument
    parser.add_argument("-o", "--output", default="hpo_data.json",
                        help="Path for the output processed JSON file.")
    parser.add_argument("-t", "--threshold", type=float, default=DEFAULT_SIMILARITY_THRESHOLD,
                        help="Minimum similarity score to store.")
    parser.add_argument("-m", "--max-similar", type=int, default=DEFAULT_MAX_SIMILAR_TERMS,
                        help="Max similar terms to store per term.")
    parser.add_argument("--data-dir", default=DEFAULT_DATA_DIR,
                        help="Directory to store/find downloaded HPO master files.")
    parser.add_argument("--force-download", action='store_true',
                        help="Force redownload of HPO master files.")

    args = parser.parse_args()

    # No input file validation needed here anymore

    print(f"--- Starting HPO Preprocessing ---")
    print(f"HPO Data Dir: {args.data_dir}")
    print(f"Force Download: {args.force_download}")
    print(f"Output File: {args.output}")
    print(f"Similarity Threshold: {args.threshold}")
    print(f"Max Similar Terms: {args.max_similar}")
    print(f"---------------------------------")

    # Check necessary libraries
    try:
        import pyhpo, tqdm, requests
    except ImportError as e: # ... (library check remains the same) ...
        print(f"Error: Missing required library: {e.name}", file=sys.stderr)
        print("Please install required libraries: pip install pyhpo tqdm requests", file=sys.stderr)
        sys.exit(1)


    # Run the main preprocessing function (without input_file arg)
    preprocess_hpo(
        args.output,
        args.threshold,
        args.max_similar,
        args.data_dir,
        args.force_download
    )

    print("\n--- Preprocessing Complete ---")
