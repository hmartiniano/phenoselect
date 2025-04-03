import pronto
import os

# --- Configuration ---
# Expects hp.obo to be in the same directory as this script
HPO_OBO_FILE = os.path.join(os.path.dirname(__file__), 'hp.obo')
# --- End Configuration ---

def load_hpo_data(obo_file_path=HPO_OBO_FILE):
    """
    Loads HPO terms from the .obo file.

    Args:
        obo_file_path (str): The path to the hp.obo file.

    Returns:
        list: A list of dictionaries, where each dictionary represents
              an HPO term with 'id', 'name', 'definition', and 'synonyms'.
              Returns an empty list if loading fails.
    """
    hpo_terms_list = []
    print(f"Attempting to load HPO data from: {obo_file_path}")

    if not os.path.exists(obo_file_path):
        print(f"ERROR: HPO file not found at {obo_file_path}")
        print("Please download hp.obo and place it in the same directory as this script.")
        return [] # Return empty list if file doesn't exist

    try:
        ontology = pronto.Ontology(obo_file_path)
        print("Successfully parsed hp.obo.")

        for term in ontology.terms():
            # Skip obsolete terms
            if term.obsolete:
                continue

            # Extract necessary information
            term_id = term.id
            term_name = term.name if term.name else "" # Handle missing names
            term_def = str(term.definition) if term.definition else "" # Handle missing definitions
            
            # Extract synonym descriptions
            term_synonyms = []
            if term.synonyms:
                 term_synonyms = [syn.description for syn in term.synonyms if syn.description]

            hpo_terms_list.append({
                'id': term_id,
                'name': term_name,
                'definition': term_def,
                'synonyms': term_synonyms
            })

        print(f"Loaded {len(hpo_terms_list)} non-obsolete HPO terms.")
        return hpo_terms_list

    except Exception as e:
        print(f"ERROR: Failed to load or parse HPO data: {e}")
        return [] # Return empty list on error

# Example of how to use it (optional, for testing)
if __name__ == '__main__':
    loaded_data = load_hpo_data()
    if loaded_data:
        print("\nSample loaded term:")
        print(loaded_data[100]) # Print a sample term
    else:
        print("\nHPO data loading failed.")