document.addEventListener('DOMContentLoaded', () => {
    // --- UI Translation Strings ---
    const uiStrings = {
        'en': {
             'title': "HPO Phenotype Selector", 'search_heading': "Search Phenotypes", 'search_placeholder': "Enter phenotype (e.g., tall stature)", 'search_button': "Search", 'results_placeholder': "Search results will appear here.", 'selected_heading': "Selected Terms", 'selected_placeholder': "No terms selected yet.", 'download_button': "Download List (CSV)",
             'related_heading': "Related Terms", 'related_placeholder': "Select terms to see related ones.", 'related_info': "Click on a related term to add it to your selection.",
             'add_related_tooltip_prefix': "Add related term", 'add_tooltip_prefix': "Click to add", 'remove_tooltip_prefix': "Remove",
             'hpo_version_label': "HPO Version:",
             'error_search_failed': "Search logic error.", 'error_min_chars': "Please enter at least 2 characters to search.", 'error_no_results': "No matching terms found.",
             'loading_wait': "Processing data, please wait...", 'loading_error': "Error loading or processing HPO data.", 'loading_success': "HPO data loaded successfully.", 'loading_initial': 'Loading HPO data, please wait...'
          },
        'de': {
             'title': "HPO Phänotyp-Auswahl", 'search_heading': "Phänotypen suchen", 'search_placeholder': "Phänotyp eingeben (z.B. Großwuchs)", 'search_button': "Suchen", 'results_placeholder': "Suchergebnisse werden hier angezeigt.", 'selected_heading': "Ausgewählte Begriffe", 'selected_placeholder': "Noch keine Begriffe ausgewählt.", 'download_button': "Liste herunterladen (CSV)",
             'related_heading': "Verwandte Begriffe", 'related_placeholder': "Begriffe auswählen, um verwandte anzuzeigen.", 'related_info': "Klicken Sie auf einen verwandten Begriff, um ihn zur Auswahl hinzuzufügen.",
             'add_related_tooltip_prefix': "Verwandten Begriff hinzufügen", 'add_tooltip_prefix': "Klicken zum Hinzufügen von", 'remove_tooltip_prefix': "Entfernen",
             'hpo_version_label': "HPO Version:",
             'error_search_failed': "Fehler in der Suchlogik.", 'error_min_chars': "Bitte mindestens 2 Zeichen für die Suche eingeben.", 'error_no_results': "Keine passenden Begriffe gefunden.",
             'loading_wait': "Daten werden verarbeitet, bitte warten...", 'loading_error': "Fehler beim Laden oder Verarbeiten der HPO-Daten.", 'loading_success': "HPO-Daten erfolgreich geladen.", 'loading_initial': 'HPO-Daten werden geladen, bitte warten...'
         },
        'pt': {
             'title': "Seletor de Fenótipos HPO", 'search_heading': "Pesquisar Fenótipos", 'search_placeholder': "Introduza o fenótipo (ex: estatura alta)", 'search_button': "Pesquisar", 'results_placeholder': "Resultados da pesquisa aparecerão aqui.", 'selected_heading': "Termos Selecionados", 'selected_placeholder': "Nenhum termo selecionado ainda.", 'download_button': "Descarregar Lista (CSV)",
             'related_heading': "Termos Relacionados", 'related_placeholder': "Selecione termos para ver os relacionados.", 'related_info': "Clique num termo relacionado para adicioná-lo à sua seleção.",
             'add_related_tooltip_prefix': "Adicionar termo relacionado", 'add_tooltip_prefix': "Clicar para adicionar", 'remove_tooltip_prefix': "Remover",
             'hpo_version_label': "HPO Versão:",
             'error_search_failed': "Erro na lógica de pesquisa.", 'error_min_chars': "Por favor, introduza pelo menos 2 caracteres para pesquisar.", 'error_no_results': "Nenhum termo correspondente encontrado.",
             'loading_wait': "A processar dados, por favor aguarde...", 'loading_error': "Erro ao carregar ou processar os dados HPO.", 'loading_success': "Dados HPO carregados com sucesso.", 'loading_initial': 'A carregar dados HPO, por favor aguarde...'
          }
    };

    // --- DOM Elements ---
    const loadingArea = document.getElementById('loading-area');
    const loadingMessageDiv = document.getElementById('loading-message');
    const mainContentDiv = document.getElementById('main-content');
    const langSelector = document.getElementById('lang-selector');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsList = document.getElementById('results-list'); // The list-group <div> or <ul>
    const selectedList = document.getElementById('selected-list'); // The <ul>
    const downloadButton = document.getElementById('download-button');
    const searchIndicator = document.getElementById('search-indicator'); // The spinner's container span
    const relatedList = document.getElementById('related-list'); // The <ul>
    const hpoVersionDisplay = document.getElementById('hpo-version-display');

    // --- State ---
    let selectedTerms = [];
    let currentUiLang = langSelector.value || 'en';
    let hpoNodes = [];
    let hpoNodeMap = {};
    let isDataLoaded = false;
    let lastSearchResults = [];
    let loadedHpoVersion = "N/A";

    // --- Constants ---
    const MAX_DISPLAY_RELATED_TERMS = 15;

    // --- Functions ---

    // processHpoData (Now receives only the nodes array)
    function processHpoData(processedNodes) { // Expects the array
        try {
            // --- DEBUGGING INSIDE processHpoData ---
            console.log(">>> processHpoData received argument (processedNodes):", processedNodes);
            console.log(">>> typeof processedNodes:", typeof processedNodes);
            console.log(">>> Array.isArray(processedNodes):", Array.isArray(processedNodes));
            // --- END DEBUGGING ---

            if (!Array.isArray(processedNodes)) {
                 // This is where the error is thrown
                 console.error(">>> Throwing error because processedNodes is not an array.");
                 throw new Error("Invalid HPO node data format (expected an array).");
            }

            hpoNodes = processedNodes; // Assign the validated array
            if (hpoNodes.length === 0) {
                // Consider if this should be an error or just a state
                console.warn("Warning: No valid HPO nodes found in the processed data array.");
                // Optionally throw an error if this is unexpected:
                // throw new Error("No valid HPO nodes found in the processed data array.");
            }

            // Create map from the validated array
            hpoNodeMap = {};
            hpoNodes.forEach(node => {
                if (node && node.id && node.lbl) {
                    hpoNodeMap[node.id] = node;
                } else {
                    console.warn("Skipping node during map creation due to missing id or lbl:", node);
                }
            });

            isDataLoaded = true;
            console.log(`Processed ${hpoNodes.length} HPO nodes. Map created with ${Object.keys(hpoNodeMap).length} entries.`);

            // Update UI elements now that data is ready
            loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_success || 'HPO data loaded successfully.';
            loadingArea.classList.remove('alert-secondary'); // Change alert style on success
            loadingArea.classList.add('alert-success');
            hpoVersionDisplay.textContent = loadedHpoVersion || "Unknown"; // Display the loaded version
            mainContentDiv.style.display = 'block'; // Show main content
            loadingArea.style.display = 'none'; // Hide loading area after success
            searchInput.disabled = false;
            searchButton.disabled = false;
            translateUI(currentUiLang); // Re-translate UI elements

        } catch (error) {
            console.error(">>> Error in processHpoData catch block:", error);
            // Keep loading message showing the error
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error processing data.'} (${error.message})`;
            loadingArea.classList.remove('alert-secondary');
            loadingArea.classList.add('alert-danger'); // Error style
            isDataLoaded = false; hpoNodes = []; hpoNodeMap = {}; loadedHpoVersion = "Error";
            hpoVersionDisplay.textContent = "Error"; // Indicate version loading error
            mainContentDiv.style.display = 'none';
            searchInput.disabled = true; searchButton.disabled = true;
        }
    }

    // loadHpoDataFromServer (Handles new JSON structure + DEBUGGING)
    async function loadHpoDataFromServer(url) {
        console.log(`Fetching HPO data from: ${url}`);
        // Reset styles, show loading message
        loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_initial || 'Loading HPO data...';
        loadingArea.classList.remove('alert-success', 'alert-danger');
        loadingArea.classList.add('alert-secondary');
        hpoVersionDisplay.textContent = "Loading...";
        loadingArea.style.display = 'block';
        mainContentDiv.style.display = 'none';
        searchInput.disabled = true; searchButton.disabled = true;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
            }
            loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_wait || 'Processing data...';
            const jsonData = await response.json();

            // --- DETAILED DEBUGGING ---
            console.log(">>> Fetched jsonData:", jsonData); // Log the whole parsed object
            if (jsonData && typeof jsonData === 'object') {
                console.log(">>> typeof jsonData.nodes:", typeof jsonData.nodes);
                console.log(">>> Array.isArray(jsonData.nodes):", Array.isArray(jsonData.nodes));
                console.log(">>> jsonData.hpo_version:", jsonData.hpo_version);
            } else {
                 console.error(">>> jsonData is NOT an object or is null/undefined!");
            }
            // --- END DEBUGGING ---

            // Check for the expected structure
            if (!jsonData || typeof jsonData !== 'object' || !jsonData.nodes || typeof jsonData.hpo_version === 'undefined') { // Check if key exists
                 console.error(">>> Data structure validation FAILED."); // Log validation failure
                 throw new Error("Invalid data structure in hpo_data.json. Expected 'hpo_version' and 'nodes'.");
            }

            loadedHpoVersion = jsonData.hpo_version; // Store the version
            console.log(`>>> Calling processHpoData with jsonData.nodes (Type: ${typeof jsonData.nodes}, IsArray: ${Array.isArray(jsonData.nodes)})`);
            processHpoData(jsonData.nodes); // Process only the nodes array

        } catch (error) {
            console.error(">>> Error in loadHpoDataFromServer catch block:", error);
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error loading HPO data.'} (${error.message})`;
            loadingArea.classList.remove('alert-secondary');
            loadingArea.classList.add('alert-danger');
            isDataLoaded = false; hpoNodes = []; hpoNodeMap = {}; loadedHpoVersion = "Error";
            hpoVersionDisplay.textContent = "Error"; // Show error in version display
            mainContentDiv.style.display = 'none';
            searchInput.disabled = true; searchButton.disabled = true;
        }
    }

    // translateUI
    function translateUI(lang) {
        const translations = uiStrings[lang] || uiStrings['en'];
        document.title = translations['title'];
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) element.textContent = translations[key];
        });
         document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            if (translations[key]) element.placeholder = translations[key];
        });
        updatePlaceholders(lang);
        if(isDataLoaded){
            renderSearchResults(lastSearchResults || []); // Update tooltips/text
            renderSelectedList(); // Update tooltips/text (calls updateRelatedTerms)
        }
         // Restore dynamic text if needed (loading messages, version)
         if (!isDataLoaded && !loadingMessageDiv.textContent.startsWith("Error")) {
             loadingMessageDiv.textContent = translations['loading_initial'] || 'Loading HPO data, please wait...';
         }
         // Use loadedHpoVersion state variable to set version display text
         if (loadedHpoVersion && loadedHpoVersion !== "N/A") {
              hpoVersionDisplay.textContent = loadedHpoVersion;
         } else if (!isDataLoaded) {
              hpoVersionDisplay.textContent = "Loading..."; // Reset if still loading
         }
    }

    // updatePlaceholders (Use Bootstrap classes for placeholder items)
    function updatePlaceholders(lang) {
        const translations = uiStrings[lang] || uiStrings['en'];
        // Use CSS selector to check for placeholder by class
        if (resultsList.children.length === 0 || resultsList.querySelector('.placeholder-item')) {
            resultsList.innerHTML = `<div class="list-group-item text-muted text-center p-5 placeholder-item" data-translate="results_placeholder">${translations['results_placeholder']}</div>`;
        }
        if (selectedList.children.length === 0 || selectedList.querySelector('.placeholder-item')) {
            selectedList.innerHTML = `<li class="list-group-item text-muted text-center p-5 placeholder-item" data-translate="selected_placeholder">${translations['selected_placeholder']}</li>`;
        }
        if (relatedList.children.length === 0 || relatedList.querySelector('.placeholder-item')) {
            // Determine correct placeholder for related list
             let relatedPlaceholderKey = 'related_placeholder';
             let relatedPlaceholderText = translations[relatedPlaceholderKey];
             // If terms are selected, but related list is empty, show 'no results' instead
             if (selectedTerms.length > 0 && relatedList.children.length === 0) {
                  relatedPlaceholderKey = 'error_no_results'; // Or a more specific key like 'related_no_results' if added
                  relatedPlaceholderText = translations[relatedPlaceholderKey] || "No related terms found for current selection.";
             }
            relatedList.innerHTML = `<li class="list-group-item text-muted text-center p-5 placeholder-item" data-translate="${relatedPlaceholderKey}">${relatedPlaceholderText}</li>`;
        }
    }

    // toggleSearchIndicator
    function toggleSearchIndicator(show) {
         if (show) {
             searchIndicator.classList.remove('d-none');
             searchButton.disabled = true; // Disable button during search
         } else {
              searchIndicator.classList.add('d-none');
              searchButton.disabled = false; // Re-enable button
         }
    }

    // performSearch (Toggle spinner)
    function performSearch() {
        if (!isDataLoaded) return;
        const query = searchInput.value.trim().toLowerCase();
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        resultsList.innerHTML = ''; // Clear previous results
        toggleSearchIndicator(true); // Show spinner
        lastSearchResults = [];

        if (query.length < 2) {
            resultsList.innerHTML = `<div class="list-group-item list-group-item-warning text-center placeholder-item">${translations['error_min_chars']}</div>`;
            toggleSearchIndicator(false); return;
        }

        // Simulate async search if needed, otherwise run directly
        // Using setTimeout to allow spinner to render before potential blocking loop
        setTimeout(() => {
            try {
                const results = []; const max_results = 50;
                for (const node of hpoNodes) {
                    let matchFound = false;
                    if (node.lbl?.toLowerCase().includes(query)) matchFound = true;
                    if (!matchFound && node.definition?.toLowerCase().includes(query)) matchFound = true;
                    if (!matchFound && Array.isArray(node.synonyms)) {
                        for (const syn of node.synonyms) {
                            if (syn?.toLowerCase().includes(query)) { matchFound = true; break; }
                        }
                    }
                    if (matchFound) {
                        results.push({ id: node.id, name: node.lbl });
                        if (results.length >= max_results) break;
                    }
                }
                lastSearchResults = results;
                renderSearchResults(results);
            } catch (error) {
                 console.error("Search error:", error);
                 resultsList.innerHTML = `<div class="list-group-item list-group-item-danger text-center placeholder-item">${translations['error_search_failed']}</div>`;
                 lastSearchResults = [];
            } finally {
                 toggleSearchIndicator(false); // Hide spinner
            }
        }, 10); // Short delay
    }

    // renderSearchResults (Create Bootstrap list group items - use links)
    function renderSearchResults(results) {
        resultsList.innerHTML = ''; // Clear previous content or placeholder
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        if (results.length === 0 && searchInput.value.trim().length >= 2) {
            resultsList.innerHTML = `<div class="list-group-item text-muted text-center placeholder-item">${translations['error_no_results']}</div>`;
        } else if (results.length === 0) {
             updatePlaceholders(currentUiLang); // Show default placeholder if input is empty/short
        } else {
            results.forEach(term => {
                const item = document.createElement('a'); // Use link for better interaction
                item.href = "#"; // Prevent page jump
                item.classList.add('list-group-item', 'list-group-item-action');
                item.textContent = `${term.name} (${term.id})`;
                item.dataset.id = term.id;
                item.dataset.name = term.name;
                item.title = `${translations['add_tooltip_prefix']} ${term.name}`; // Use title attribute for tooltip
                item.addEventListener('click', (e) => {
                     e.preventDefault(); // Prevent link behavior
                     handleSelectTerm(e);
                });
                resultsList.appendChild(item);
            });
        }
    }

    // handleSelectTerm (Event target is now the link)
    function handleSelectTerm(event) {
        const target = event.currentTarget; // Target is the link element
        const termId = target.dataset.id;
        const termName = target.dataset.name;
        if (!selectedTerms.some(term => term.id === termId)) {
            selectedTerms.push({ id: termId, name: termName });
            renderSelectedList();
             // Optional: Provide visual feedback (e.g., briefly highlight selected)
             target.classList.add('active');
             setTimeout(() => target.classList.remove('active'), 500);
        } else {
            console.log(`${termName} (${termId}) is already selected.`);
            // Optional: Indicate already selected (e.g., flash background)
             target.classList.add('list-group-item-secondary');
             setTimeout(() => target.classList.remove('list-group-item-secondary'), 500);
        }
    }

    // renderSelectedList (Create Bootstrap list items with remove button)
    function renderSelectedList() {
        selectedList.innerHTML = ''; // Clear previous
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        if (selectedTerms.length === 0) {
            updatePlaceholders(currentUiLang); // Show placeholder
            downloadButton.disabled = true;
            updateRelatedTerms(); // Update related terms list (will show placeholder)
            return;
        }
        downloadButton.disabled = false;
        selectedTerms.forEach(term => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

            const textSpan = document.createElement('span');
            textSpan.textContent = `${term.name} (${term.id})`;
            textSpan.classList.add('me-2'); // Margin end for spacing

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.innerHTML = '×'; // Simple 'X'
            removeBtn.classList.add('btn', 'btn-danger', 'btn-sm');
            removeBtn.dataset.id = term.id;
            removeBtn.title = `${translations['remove_tooltip_prefix']} ${term.name}`; // Tooltip
            removeBtn.setAttribute('aria-label', `Remove ${term.name}`);
            removeBtn.addEventListener('click', handleRemoveTerm);

            listItem.appendChild(textSpan);
            listItem.appendChild(removeBtn);
            selectedList.appendChild(listItem);
        });
        updateRelatedTerms(); // Update related terms list
    }

    // handleRemoveTerm
    function handleRemoveTerm(event) {
        const termIdToRemove = event.target.dataset.id;
        selectedTerms = selectedTerms.filter(term => term.id !== termIdToRemove);
        renderSelectedList();
    }

    // updateRelatedTerms
    function updateRelatedTerms() {
        if (!isDataLoaded) return;

        let relatedCandidates = {};
        const selectedIds = new Set(selectedTerms.map(term => term.id));

        selectedTerms.forEach(selectedTerm => {
            const nodeData = hpoNodeMap[selectedTerm.id];
            if (nodeData?.similar_terms?.length) {
                nodeData.similar_terms.forEach(similar => {
                    if (!selectedIds.has(similar.id)) {
                        const relatedNodeData = hpoNodeMap[similar.id];
                        if (relatedNodeData) {
                             const existingCandidate = relatedCandidates[similar.id];
                             if (existingCandidate) {
                                 existingCandidate.score = Math.max(existingCandidate.score, similar.score);
                             } else {
                                 relatedCandidates[similar.id] = { id: similar.id, name: relatedNodeData.lbl, score: similar.score };
                             }
                        }
                    }
                });
            }
        });
        const sortedRelated = Object.values(relatedCandidates)
                                    .sort((a, b) => b.score - a.score)
                                    .slice(0, MAX_DISPLAY_RELATED_TERMS);
        renderRelatedList(sortedRelated); // Render results (or placeholder if empty)
    }

    // renderRelatedList (Create Bootstrap list items)
    function renderRelatedList(relatedTerms) {
        relatedList.innerHTML = ''; // Clear previous
        const translations = uiStrings[currentUiLang] || uiStrings['en'];

        if (relatedTerms.length === 0) {
            updatePlaceholders(currentUiLang); // Handles correct placeholder logic
            return;
        }

        relatedTerms.forEach(term => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'list-group-item-action'); // Action makes it hoverable/clickable looking
            listItem.dataset.id = term.id;
            listItem.dataset.name = term.name;
            listItem.title = `${translations['add_related_tooltip_prefix']} ${term.name} (Score: ${term.score.toFixed(3)})`;
            listItem.style.cursor = 'pointer'; // Indicate clickability

            const textSpan = document.createElement('span');
            textSpan.textContent = `${term.name} (${term.id})`;
            textSpan.classList.add('me-2');

            const scoreSpan = document.createElement('span');
            scoreSpan.classList.add('badge', 'bg-secondary', 'rounded-pill'); // Use Bootstrap badge
            scoreSpan.textContent = `${term.score.toFixed(3)}`;

            listItem.appendChild(textSpan);
            listItem.appendChild(scoreSpan);
            listItem.addEventListener('click', handleAddRelatedTerm);
            relatedList.appendChild(listItem);
        });
    }

    // handleAddRelatedTerm
    function handleAddRelatedTerm(event) {
        const target = event.currentTarget;
        const termId = target.dataset.id;
        const termName = target.dataset.name;
        if (!selectedTerms.some(term => term.id === termId)) {
            selectedTerms.push({ id: termId, name: termName });
            renderSelectedList();
        } else {
            console.log(`${termName} (${termId}) is already selected.`);
            target.classList.add('list-group-item-secondary');
             setTimeout(() => target.classList.remove('list-group-item-secondary'), 500);
        }
    }

    // downloadCSV
    function downloadCSV() {
        if (selectedTerms.length === 0) return;
        let csvContent = `"HPO ID","Term Name"\n`;
        selectedTerms.forEach(term => {
            const safeName = /[",\n]/.test(term.name) ? `"${term.name.replace(/"/g, '""')}"` : term.name;
            csvContent += `"${term.id}",${safeName}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a"); const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `hpo_selection_${timestamp}.csv`);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    }

    // handleLanguageChange
    function handleLanguageChange() {
        currentUiLang = langSelector.value;
        console.log("UI Language changed to:", currentUiLang);
        translateUI(currentUiLang);
    }

    // --- Event Listeners ---
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') performSearch(); });
    downloadButton.addEventListener('click', downloadCSV);
    langSelector.addEventListener('change', handleLanguageChange);

    // --- Initial Setup ---
    translateUI(currentUiLang); // Translate static elements initially
    updatePlaceholders(currentUiLang); // Set initial placeholders correctly
    loadHpoDataFromServer('hpo_data.json');

}); // End DOMContentLoaded
