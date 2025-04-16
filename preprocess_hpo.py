#!/usr/bin/env python3
import json
import argparse
import sys
import os

def preprocess_hpo(input_file_path, output_file_path):
    """
    Reads the original HPO JSON file, extracts relevant non-obsolete term data,
    and writes it to a new, simpler JSON file for web application use.
    """
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

    processed_nodes = []
    original_node_count = len(hpo_data['graphs'][0]['nodes'])
    print(f"Found {original_node_count} total nodes in the original file.")

    for node in hpo_data['graphs'][0]['nodes']:
        # Skip nodes without basic info or marked as obsolete
        if not node.get('id') or not node.get('lbl') or node.get('meta', {}).get('obsolete', False):
            continue

        # Extract definition (handle potential absence)
        definition = node.get('meta', {}).get('definition', {}).get('val', '')

        # Extract synonyms (handle potential absence and structure)
        synonyms = []
        raw_synonyms = node.get('meta', {}).get('synonyms', [])
        if isinstance(raw_synonyms, list):
            for syn in raw_synonyms:
                if isinstance(syn, dict) and syn.get('val'):
                    synonyms.append(syn['val'])

        processed_nodes.append({
            'id': node['id'],
            'lbl': node['lbl'],
            'definition': definition,
            'synonyms': synonyms
        })

    print(f"Processed {len(processed_nodes)} non-obsolete nodes.")

    print(f"Writing processed data to: {output_file_path}")
    try:
        # Ensure output directory exists
        output_dir = os.path.dirname(output_file_path)
        if output_dir: # Create directory if it's not the current one
             os.makedirs(output_dir, exist_ok=True)

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(processed_nodes, f, ensure_ascii=False) # Use ensure_ascii=False for non-English chars
        print("Successfully wrote processed HPO data.")
    except IOError as e:
        print(f"Error: Could not write to output file {output_file_path}. {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error writing file {output_file_path}: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess HPO JSON file for web application use.")
    parser.add_argument("input_file", help="Path to the input HPO JSON file (e.g., hp.json).")
    parser.add_argument("-o", "--output", default="hpo_data.json",
                        help="Path to the output processed JSON file (default: hpo_data.json).")

    args = parser.parse_args()

    preprocess_hpo(args.input_file, args.output)
