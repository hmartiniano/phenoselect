# Makefile for HPO Phenotype Selector Data Processing and Release

# --- Variables ---
PYTHON         := python3
SCRIPT         := preprocess_hpo.py
GET_VERSION_SCRIPT := get_hpo_version.py # Helper script name
OUTPUT_JSON    := hpo_data.json
DATA_DIR       := hpo_master_data
DATA_DIR_ARCHIVE := $(DATA_DIR).tar.gz
REPO           := hmartiniano/phenoselect
GH_CLI         := $(shell command -v gh 2> /dev/null)

# --- NEW: File to store the version ---
VERSION_FILE   := .hpo_version

# --- Targets ---

# Default target runs the full process
.PHONY: all
all: release

# Target to run the preprocessing script and generate data
$(OUTPUT_JSON): $(SCRIPT)
	@echo ">>> Running preprocessing script..."
	$(PYTHON) $(SCRIPT) -o $(OUTPUT_JSON) --data-dir $(DATA_DIR)
	@echo ">>> Preprocessing complete. Output: $(OUTPUT_JSON)"

# --- Target to extract version into the VERSION_FILE using the helper script ---
$(VERSION_FILE): $(OUTPUT_JSON) $(GET_VERSION_SCRIPT) # Depends on JSON and helper script
	@echo ">>> Extracting HPO version from $(OUTPUT_JSON) into $(VERSION_FILE)..."
	@# Run helper script, redirect its stdout (the version) to the file.
	$(PYTHON) $(GET_VERSION_SCRIPT) $(OUTPUT_JSON) > $(VERSION_FILE)
	@# Check if the previous command failed (non-zero exit code)
	@if [ $$? -ne 0 ]; then \
		echo "!!! Make Error: Failed to extract version using $(GET_VERSION_SCRIPT)." >&2; \
		rm -f $(VERSION_FILE); \
		exit 1; \
	fi
	@# Check if the resulting file is empty
	@if [ ! -s $(VERSION_FILE) ]; then \
		echo "!!! Make Error: Extracted version file $(VERSION_FILE) is empty." >&2; \
		rm -f $(VERSION_FILE); \
		exit 1; \
	fi
	@echo ">>> Version written to $(VERSION_FILE)"
	@sleep 0.5 # Keep the small delay just in case

# --- Read version from the file ---
HPO_VERSION := $(shell cat $(VERSION_FILE) 2>/dev/null)
TAG_NAME    := v$(HPO_VERSION)


# Target to archive the downloaded master data directory
$(DATA_DIR_ARCHIVE): $(DATA_DIR)/hp.obo $(DATA_DIR)/hp.json
	@echo ">>> Archiving HPO master data directory..."
	tar czf $@ $(DATA_DIR)
	@echo ">>> Created archive: $@"

# Target to commit the generated data and downloaded master files
.PHONY: commit
# Depends on the version file existing
commit: $(VERSION_FILE) $(DATA_DIR)/hp.obo $(DATA_DIR)/hp.json
	@# Simple check if HPO_VERSION is empty after reading file
	@if [ -z "$(HPO_VERSION)" ]; then \
		echo "!!! Make Error: HPO_VERSION variable is empty. Check $(VERSION_FILE)." >&2; \
		exit 1; \
	fi
	@echo ">>> Using HPO Version: $(HPO_VERSION) / Tag: $(TAG_NAME)"
	@echo ">>> Adding files to Git..."
	git add $(OUTPUT_JSON) $(DATA_DIR) $(VERSION_FILE)
	@echo ">>> Committing changes (if any)..."
	git diff --staged --quiet || git commit -m "Update HPO data to version $(HPO_VERSION)"
	@echo ">>> Commit step complete."

# Target to tag the commit
.PHONY: tag
tag: commit # Depends on commit being done
	@# Simple check if HPO_VERSION is empty
	@if [ -z "$(HPO_VERSION)" ]; then echo "!!! Make Error: HPO_VERSION variable empty, cannot tag." >&2; exit 1; fi
	@echo ">>> Tagging commit with $(TAG_NAME)..."
	(git rev-parse $(TAG_NAME) >/dev/null 2>&1 && \
		echo ">>> Warning: Tag $(TAG_NAME) already exists.") || \
	(git tag -a $(TAG_NAME) -m "Release for HPO version $(HPO_VERSION)" && \
		echo ">>> Tag $(TAG_NAME) created.")

# Target to push commit and tag to remote
.PHONY: push
push: tag # Depends on the tag existing locally
	@# Simple check if HPO_VERSION is empty (prevents pushing tag "v")
	@if [ -z "$(HPO_VERSION)" ]; then echo "!!! Make Error: HPO_VERSION variable empty, cannot push tag." >&2; exit 1; fi
	@echo ">>> Pushing commit to origin..."
	git push origin HEAD
	@echo ">>> Pushing tag $(TAG_NAME) to origin..."
	git push origin $(TAG_NAME)

# Target to create GitHub release (requires gh CLI)
.PHONY: release
release: push $(DATA_DIR_ARCHIVE) $(VERSION_FILE) # Depends on push, archive, and version file
ifndef GH_CLI
	$(error GitHub CLI 'gh' not found in PATH. Please install it: https://cli.github.com/)
endif
	@# Simple check if HPO_VERSION is empty
	@if [ -z "$(HPO_VERSION)" ]; then echo "!!! Make Error: HPO_VERSION variable empty, cannot create release." >&2; exit 1; fi
	@echo ">>> Creating GitHub release for tag $(TAG_NAME)..."
	$(GH_CLI) release create $(TAG_NAME) \
		--repo $(REPO) \
		--title "HPO Version $(HPO_VERSION)" \
		--notes "Automated release including data files for HPO version $(HPO_VERSION)." \
		"$(OUTPUT_JSON)" "$(DATA_DIR_ARCHIVE)" # REMOVED --clobber
	@echo ">>> GitHub release created/updated."

# Target to clean generated files
.PHONY: clean
clean:
	@echo ">>> Cleaning generated files..."
	rm -f $(OUTPUT_JSON) $(DATA_DIR_ARCHIVE) $(VERSION_FILE) # Clean version file too
	rm -rf $(DATA_DIR)
	@echo ">>> Clean complete."

# Target to explicitly force data download and preprocess
.PHONY: update_data
# This will trigger $(OUTPUT_JSON) and $(VERSION_FILE) updates via dependencies
update_data: clean $(VERSION_FILE)
	@echo ">>> Data update complete."
