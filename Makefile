# Makefile for HPO Phenotype Selector Data Processing and Release

# --- Variables ---
PYTHON         := python3
SCRIPT         := preprocess_hpo.py
OUTPUT_JSON    := hpo_data.json
DATA_DIR       := hpo_master_data
DATA_DIR_ARCHIVE := $(DATA_DIR).tar.gz
REPO           := hmartinianno/phenoselect # Your GitHub repo owner/name
GH_CLI         := $(shell command -v gh 2> /dev/null) # Check if gh exists

# --- Targets ---

# Default target runs the full process
.PHONY: all
all: release

# Target to run the preprocessing script and generate data
# Depends on the script itself. Creates the output JSON file.
$(OUTPUT_JSON): $(SCRIPT)
	@echo ">>> Running preprocessing script..."
	$(PYTHON) $(SCRIPT) -o $(OUTPUT_JSON) --data-dir $(DATA_DIR)
	@echo ">>> Preprocessing complete. Output: $(OUTPUT_JSON)"

# Target to archive the downloaded master data directory
$(DATA_DIR_ARCHIVE): $(DATA_DIR)/hp.obo $(DATA_DIR)/hp.json # Depend on key files being present
	@echo ">>> Archiving HPO master data directory..."
	tar czf $@ $(DATA_DIR)
	@echo ">>> Created archive: $@"

# Get the HPO version *after* the JSON file is created
# This will be evaluated when needed by targets depending on $(OUTPUT_JSON)
HPO_VERSION := $(shell $(PYTHON) -c "import json; import sys; \
    try: \
        with open('$(OUTPUT_JSON)', 'r') as f: data = json.load(f); \
        print(data.get('hpo_version', 'unknown').strip().replace(' ', '_').replace('/', '-')); \
    except FileNotFoundError: \
        print('unknown_version', file=sys.stderr); sys.exit(1); \
    except (json.JSONDecodeError, KeyError): \
        print('invalid_json', file=sys.stderr); sys.exit(1)" \
)
TAG_NAME    := v$(HPO_VERSION) # Define tag name based on extracted version

# Target to commit the generated data and downloaded master files
.PHONY: commit
commit: $(OUTPUT_JSON) $(DATA_DIR)/hp.obo $(DATA_DIR)/hp.json # Ensure data exists before committing
	@echo ">>> Checking for HPO version..."
	$(if $(filter unknown_version invalid_json,$(HPO_VERSION)), \
		$(error Error extracting HPO version from $(OUTPUT_JSON). Cannot proceed.), \
		@echo ">>> Found HPO Version: $(HPO_VERSION)" \
	)
	@echo ">>> Adding files to Git..."
	git add $(OUTPUT_JSON) $(DATA_DIR)
	@echo ">>> Committing changes (if any)..."
	# Only commit if there are staged changes
	git diff --staged --quiet || git commit -m "Update HPO data to version $(HPO_VERSION)"
	@echo ">>> Commit step complete."

# Target to tag the commit
.PHONY: tag
tag: commit # Depends on commit being done
	@echo ">>> Tagging commit with $(TAG_NAME)..."
	# Check if tag already exists first
	(git rev-parse $(TAG_NAME) >/dev/null 2>&1 && \
		echo ">>> Warning: Tag $(TAG_NAME) already exists.") || \
	(git tag -a $(TAG_NAME) -m "Release for HPO version $(HPO_VERSION)" && \
		echo ">>> Tag $(TAG_NAME) created.")

# Target to push commit and tag to remote
.PHONY: push
push: tag # Depends on the tag existing locally
	@echo ">>> Pushing commit to origin..."
	git push origin HEAD # Push current branch commit(s)
	@echo ">>> Pushing tag $(TAG_NAME) to origin..."
	git push origin $(TAG_NAME)

# Target to create GitHub release (requires gh CLI)
.PHONY: release
release: push $(DATA_DIR_ARCHIVE) # Depends on push and the data archive
ifndef GH_CLI
	$(error GitHub CLI 'gh' not found in PATH. Please install it: https://cli.github.com/)
endif
	@echo ">>> Creating GitHub release for tag $(TAG_NAME)..."
	$(GH_CLI) release create $(TAG_NAME) \
		--repo $(REPO) \
		--title "HPO Version $(HPO_VERSION)" \
		--notes "Automated release including data files for HPO version $(HPO_VERSION)." \
		"$(OUTPUT_JSON)" "$(DATA_DIR_ARCHIVE)" # Attach the JSON and the data archive
	@echo ">>> GitHub release created."

# Target to clean generated files
.PHONY: clean
clean:
	@echo ">>> Cleaning generated files..."
	rm -f $(OUTPUT_JSON) $(DATA_DIR_ARCHIVE)
	rm -rf $(DATA_DIR)
	@echo ">>> Clean complete."

# Target to force data download and preprocess
# Useful before making a release with updated data
.PHONY: update_data
update_data:
	@echo ">>> Forcing download and running preprocessing..."
	$(PYTHON) $(SCRIPT) -o $(OUTPUT_JSON) --data-dir $(DATA_DIR) --force-download
	@echo ">>> Data update complete. Output: $(OUTPUT_JSON)"
