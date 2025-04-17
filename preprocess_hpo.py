#!/usr/bin/env python3
import json
import argparse
import sys
import os
from pyhpo import Ontology  # Import pyhpo
import tqdm               # Import the tqdm module

# --- Configuration ---
DEFAULT_SIMILARITY_THRESHOLD = 0.4
DEFAULT_MAX_SIMILAR_TERMS = 10

def get_short_hpo_id(long_id):
    """
    Attempts to extract the short HP:XXXXXXX ID from a potential PURL or return if already short.
    Returns None if the format is unexpected.
    """
    if not isinstance(long_id, str):
        return None

    if long_id.startswith("HP:") and len(long_id.split(':')[-1]) == 7:
        return long_id # Already in the correct format

    if '/' in long_id:
        parts = long_id.split('/')
        last_part = parts[-1]
        if last_part.startswith("HP_") and len(last_part.split('_')[-1]) == 7:
            return last_part.replace("_", ":") # Convert HP_XXXXXXX to HP:XXXXXXX

    # If it doesn't match known patterns, return None
    # print(f"Warning: Could not extract short HPO ID from '{long_id}'") # Optional debug
    return None

def preprocess_hpo(input_file_path, output_file_path, similarity_threshold, max_similar_terms):
    """
    Reads the original HPO JSON file, extracts relevant non-obsolete term data,
    calculates similarities between terms using pyhpo (converting IDs as needed),
    stores the top N similar terms above a threshold, and writes it to a new JSON file.
    """
    print("Initializing HPO Ontology using pyhpo (this might take a moment)...")
    try:
        _ = Ontology()
        print("HPO Ontology initialized.")
    except Exception as e:
        print(f"Error: Failed to initialize pyhpo Ontology. {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading HPO data from: {input_file_path}")
    try:
        with open(input_file_path, 'r', encoding='utf-8') as f:
            hpo_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_file_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Could not parse JSON from {input_file_path}. {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file {input_file_path}: {e}", file=sys.stderr)
        sys.exit(1)

    if not hpo_data or 'graphs' not in hpo_data or not isinstance(hpo_data['graphs'], list) or len(hpo_data['graphs']) == 0 or 'nodes' not in hpo_data['graphs'][0] or not isinstance(hpo_data['graphs'][0]['nodes'], list):
        print(f"Error: Unexpected JSON structure in {input_file_path}. Expected 'graphs[0].nodes'.", file=sys.stderr)
        sys.exit(1)

    term_dict = {} # Store processed data keyed by original ID
    valid_original_ids = set() # Store original IDs that are not obsolete and have a valid format
    original_node_count = len(hpo_data['graphs'][0]['nodes'])
    print(f"Found {original_node_count} total nodes in the original file.")

    # --- First pass: Extract basic info, filter obsolete, store by original ID ---
    print("Extracting non-obsolete terms and validating IDs...")
    skipped_obsolete = 0
    skipped_bad_id = 0
    for node in hpo_data['graphs'][0]['nodes']:
        original_id = node.get('id')
        label = node.get('lbl')

        if not original_id or not label:
            skipped_bad_id += 1
            continue # Skip nodes without ID or label

        if node.get('meta', {}).get('obsolete', False):
            skipped_obsolete += 1
            continue # Skip obsolete terms

        # We store the original ID, even if it's a PURL, in our main dictionary
        # The short ID is derived later specifically for pyhpo calls

        # Extract definition
        definition = node.get('meta', {}).get('definition', {}).get('val', '')

        # Extract synonyms
        synonyms = []
        raw_synonyms = node.get('meta', {}).get('synonyms', [])
        if isinstance(raw_synonyms, list):
            for syn in raw_synonyms:
                if isinstance(syn, dict) and syn.get('val'):
                    synonyms.append(syn['val'])

        term_dict[original_id] = {
            'id': original_id, # Store original ID
            'lbl': label,
            'definition': definition,
            'synonyms': synonyms,
            'similar_terms': [] # Initialize similarity list
        }
        valid_original_ids.add(original_id)

    print(f"Identified {len(valid_original_ids)} potential non-obsolete terms.")
    if skipped_obsolete > 0: print(f"Skipped {skipped_obsolete} obsolete terms.")
    if skipped_bad_id > 0: print(f"Skipped {skipped_bad_id} terms with missing ID or label.")


    # --- Second pass: Fetch pyhpo objects using converted short IDs ---
    print("Fetching pyhpo term objects (converting IDs)...")
    hpo_objects = {} # Store pyhpo objects keyed by *original* ID for consistency
    fetch_errors = 0
    id_conversion_failures = 0
    processed_count = 0

    for original_id in tqdm.tqdm(valid_original_ids, desc="Fetching HPO Objects"):
        processed_count += 1
        short_id = get_short_hpo_id(original_id) # Convert PURL/long ID to short ID

        if short_id is None:
            # print(f"Warning: Could not convert ID '{original_id}' to short format. Skipping.")
            id_conversion_failures += 1
            fetch_errors += 1
            continue # Skip if conversion failed

        try:
            # Use the derived short_id to fetch the object
            hpo_term = Ontology.get_hpo_object(short_id)

            # Check if pyhpo resolved it correctly (sometimes it might return a parent)
            # It's safer to compare the converted short_id with the fetched term's id
            if hpo_term.id == short_id:
                 # Store the object using the original_id as the key
                 hpo_objects[original_id] = hpo_term
            else:
                # print(f"Warning: Term ID {short_id} (from {original_id}) resolved to {hpo_term.id} in pyhpo. Skipping.")
                fetch_errors += 1
        except ValueError:
            # This error now means the *short_id* wasn't found by pyhpo, even after conversion
            # print(f"Warning: Short term ID {short_id} (from {original_id}) not found in pyhpo Ontology. Skipping.")
            fetch_errors += 1
        except Exception as e:
             print(f"Warning: Error fetching term {short_id} (from {original_id}): {e}")
             fetch_errors += 1

    print(f"Attempted to fetch {processed_count} terms.")
    if id_conversion_failures > 0: print(f"Warning: Failed to convert {id_conversion_failures} IDs to short format.")
    if fetch_errors > 0: print(f"Warning: Encountered {fetch_errors} total errors during HPO object fetching (including conversions).")
    print(f"Successfully fetched {len(hpo_objects)} pyhpo objects.")


    # --- Third pass: Calculate similarities using pyhpo objects ---
    print(f"Calculating similarities for {len(hpo_objects)} terms (Threshold: {similarity_threshold}, Max similar: {max_similar_terms}). This may take time...")

    # Get list of original_ids for which we successfully fetched an hpo_object
    valid_ids_for_similarity = list(hpo_objects.keys())
    num_terms_to_compare = len(valid_ids_for_similarity)

    for i in tqdm.tqdm(range(num_terms_to_compare), desc="Calculating Similarities"):
        original_id_a = valid_ids_for_similarity[i]
        term_a = hpo_objects[original_id_a] # Get pyhpo object using original ID key

        term_similarities = [] # Similarities found for term_a in this iteration

        for j in range(i + 1, num_terms_to_compare):
            original_id_b = valid_ids_for_similarity[j]
            term_b = hpo_objects[original_id_b] # Get pyhpo object using original ID key

            try:
                score = term_a.similarity_score(term_b)

                if score >= similarity_threshold:
                    # Store the relationship using the *original* IDs
                    term_similarities.append({'id': original_id_b, 'score': round(score, 3)})
                    # Add the symmetric relationship to term_b's potential list (using original IDs)
                    # Ensure term_b exists in the main term_dict (it should if it's in hpo_objects)
                    if original_id_b in term_dict:
                        term_dict[original_id_b].setdefault('potential_similar', []).append({'id': original_id_a, 'score': round(score, 3)})

            except Exception as e:
                # print(f"Warning: Error calculating similarity between {original_id_a} and {original_id_b}: {e}")
                pass

        # Add the collected similarities for term_a to its entry in term_dict
        if original_id_a in term_dict:
             term_dict[original_id_a].setdefault('potential_similar', []).extend(term_similarities)


    # --- Fourth pass: Sort and prune similarity lists ---
    print("Sorting and pruning similarity lists...")
    final_term_list = []
    skipped_in_final = 0

    for original_id in tqdm.tqdm(term_dict.keys(), desc="Sorting/Pruning"):
        term_data = term_dict[original_id]
        potential_similar = term_data.pop('potential_similar', []) # Get and remove temp list

        if potential_similar:
            # Sort by score descending
            potential_similar.sort(key=lambda x: x['score'], reverse=True)
            # Keep only the top N unique terms (using original IDs)
            seen_ids = set()
            final_similar = []
            for sim_term in potential_similar:
                 if len(final_similar) >= max_similar_terms:
                      break
                 # Check if the similar term's original ID exists in our main term_dict
                 # This ensures we only link to terms that are actually in the final output
                 if sim_term['id'] in term_dict and sim_term['id'] not in seen_ids:
                     final_similar.append(sim_term)
                     seen_ids.add(sim_term['id'])

            term_data['similar_terms'] = final_similar # Assign final list

        # Only include terms that were initially valid and processed
        # (This implicitly excludes terms skipped due to bad ID, obsolescence, or fetch errors if they weren't added to term_dict)
        # A stricter check could be `if original_id in hpo_objects:` but we keep all non-obsolete from input for now
        if original_id in valid_original_ids:
             final_term_list.append(term_data)
        else:
             skipped_in_final +=1


    print(f"Processed {len(final_term_list)} terms for the final output.")
    if skipped_in_final > 0 : print(f"Skipped {skipped_in_final} terms during final list creation (should be 0 if logic is correct).")


    # --- Write final JSON output ---
    print(f"Writing processed data to: {output_file_path}")
    try:
        output_dir = os.path.dirname(output_file_path)
        if output_dir:
             os.makedirs(output_dir, exist_ok=True)

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(final_term_list, f, ensure_ascii=False) # Use final_term_list
        print("Successfully wrote processed HPO data.")
    except IOError as e:
        print(f"Error: Could not write to output file {output_file_path}. {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error writing file {output_file_path}: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess HPO JSON file, calculate similarities, and prepare for web use.")
    parser.add_argument("input_file", help="Path to the input HPO JSON file (e.g., hp.json).")
    parser.add_argument("-o", "--output", default="hpo_data.json",
                        help="Path to the output processed JSON file (default: hpo_data.json).")
    parser.add_argument("-t", "--threshold", type=float, default=DEFAULT_SIMILARITY_THRESHOLD,
                        help=f"Minimum similarity score to store (default: {DEFAULT_SIMILARITY_THRESHOLD}).")
    parser.add_argument("-m", "--max-similar", type=int, default=DEFAULT_MAX_SIMILAR_TERMS,
                        help=f"Maximum number of similar terms to store per term (default: {DEFAULT_MAX_SIMILAR_TERMS}).")

    args = parser.parse_args()

    if not os.path.exists(args.input_file):
         print(f"Error: Input file not found: {args.input_file}", file=sys.stderr)
         sys.exit(1)

    print(f"--- Starting HPO Preprocessing ---")
    print(f"Input: {args.input_file}")
    print(f"Output: {args.output}")
    print(f"Similarity Threshold: {args.threshold}")
    print(f"Max Similar Terms: {args.max_similar}")
    print(f"---------------------------------")

    # Make sure required libraries are installed
    try:
        import pyhpo
        import tqdm # Keep module import
    except ImportError:
        print("Error: Missing required libraries. Please install them:", file=sys.stderr)
        print("pip install pyhpo tqdm", file=sys.stderr)
        sys.exit(1)

    preprocess_hpo(args.input_file, args.output, args.threshold, args.max_similar)
    print("--- Preprocessing Complete ---")
