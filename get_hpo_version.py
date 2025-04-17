# get_hpo_version.py
import json
import sys
import os

def get_clean_version(json_file_path):
    """
    Reads the JSON file, extracts hpo_version, cleans it for tags,
    and prints it to stdout. Exits non-zero on error, printing errors to stderr.
    """
    error_prefix = "ERROR_GET_VERSION:" # Consistent prefix for errors

    if not os.path.exists(json_file_path):
        print(f"{error_prefix} File not found: {json_file_path}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        version = data.get('hpo_version', '').strip()

        if not version or version == 'Unknown':
            print(f"{error_prefix} 'hpo_version' key missing or empty in {json_file_path}", file=sys.stderr)
            sys.exit(2)

        # Clean version for tags/filenames (replace space, slash)
        cleaned_version = version.replace(' ', '_').replace('/', '-')
        print(cleaned_version) # Print *only* the cleaned version to stdout on success

    except (json.JSONDecodeError, KeyError) as e:
        print(f"{error_prefix} Invalid JSON or key error in {json_file_path}: {e}", file=sys.stderr)
        sys.exit(3)
    except Exception as e:
        print(f"{error_prefix} Unknown error reading {json_file_path}: {e}", file=sys.stderr)
        sys.exit(4)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <path_to_hpo_data.json>", file=sys.stderr)
        sys.exit(1)
    get_clean_version(sys.argv[1])
