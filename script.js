document.addEventListener('DOMContentLoaded', () => {
    // --- UI Translation Strings ---
    const uiStrings = {
        'en': {
             'title': "HPO Phenotype Selector", 'search_heading': "Search Phenotypes", 'search_placeholder': "Enter phenotype (e.g., tall stature)", 'search_button': "Search", 'results_placeholder': "Search results will appear here.", 'selected_heading': "Selected Terms", 'selected_placeholder': "No terms selected yet.", 'download_button': "Download List (CSV)",
             'related_heading': "Related Terms", // New
             'related_placeholder': "Select terms to see related ones.", // New
             'related_info': "Click on a related term to add it to your selection.", // New
             'add_related_tooltip_prefix': "Add related term", // New
             'error_search_failed': "Search logic error.", 'error_min_chars': "Please enter at least 2 characters to search.", 'error_no_results': "No matching terms found.", 'add_tooltip_prefix': "Click to add", 'remove_tooltip_prefix': "Remove",
             'loading_wait': "Processing data, please wait...", // Changed wording slightly
             'loading_error': "Error loading or processing HPO data.",
             'loading_success': "HPO data loaded successfully.",
             'loading_initial': 'Loading HPO data, please wait...'
          },
        'de': {
             'title': "HPO Phänotyp-Auswahl", 'search_heading': "Phänotypen suchen", 'search_placeholder': "Phänotyp eingeben (z.B. Großwuchs)", 'search_button': "Suchen", 'results_placeholder': "Suchergebnisse werden hier angezeigt.", 'selected_heading': "Ausgewählte Begriffe", 'selected_placeholder': "Noch keine Begriffe ausgewählt.", 'download_button': "Liste herunterladen (CSV)",
             'related_heading': "Verwandte Begriffe", // New
             'related_placeholder': "Begriffe auswählen, um verwandte anzuzeigen.", // New
             'related_info': "Klicken Sie auf einen verwandten Begriff, um ihn zur Auswahl hinzuzufügen.", // New
             'add_related_tooltip_prefix': "Verwandten Begriff hinzufügen", // New
             'error_search_failed': "Fehler in der Suchlogik.", 'error_min_chars': "Bitte mindestens 2 Zeichen für die Suche eingeben.", 'error_no_results': "Keine passenden Begriffe gefunden.", 'add_tooltip_prefix': "Klicken zum Hinzufügen von", 'remove_tooltip_prefix': "Entfernen",
             'loading_wait': "Daten werden verarbeitet, bitte warten...",
             'loading_error': "Fehler beim Laden oder Verarbeiten der HPO-Daten.",
             'loading_success': "HPO-Daten erfolgreich geladen.",
             'loading_initial': 'HPO-Daten werden geladen, bitte warten...'
         },
        'pt': {
             'title': "Seletor de Fenótipos HPO", 'search_heading': "Pesquisar Fenótipos", 'search_placeholder': "Introduza o fenótipo (ex: estatura alta)", 'search_button': "Pesquisar", 'results_placeholder': "Resultados da pesquisa aparecerão aqui.", 'selected_heading': "Termos Selecionados", 'selected_placeholder': "Nenhum termo selecionado ainda.", 'download_button': "Descarregar Lista (CSV)",
             'related_heading': "Termos Relacionados", // New
             'related_placeholder': "Selecione termos para ver os relacionados.", // New
             'related_info': "Clique num termo relacionado para adicioná-lo à sua seleção.", // New
             'add_related_tooltip_prefix': "Adicionar termo relacionado", // New
             'error_search_failed': "Erro na lógica de pesquisa.", 'error_min_chars': "Por favor, introduza pelo menos 2 caracteres para pesquisar.", 'error_no_results': "Nenhum termo correspondente encontrado.", 'add_tooltip_prefix': "Clicar para adicionar", 'remove_tooltip_prefix': "Remover",
             'loading_wait': "A processar dados, por favor aguarde...",
             'loading_error': "Erro ao carregar ou processar os dados HPO.",
             'loading_success': "Dados HPO carregados com sucesso.",
             'loading_initial': 'A carregar dados HPO, por favor aguarde...'
          }
        // Add more languages here
    };

    // --- DOM Elements ---
    const loadingArea = document.getElementById('loading-area');
    const loadingMessageDiv = document.getElementById('loading-message');
    const mainContentDiv = document.getElementById('main-content');
    const langSelector = document.getElementById('lang-selector');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsArea = document.getElementById('results-area');
    const selectedList = document.getElementById('selected-list');
    const downloadButton = document.getElementById('download-button');
    const searchIndicator = document.getElementById('search-indicator');
    const relatedList = document.getElementById('related-list'); // New
    const relatedListContainer = document.getElementById('related-list-container'); // New

    // --- State ---
    let selectedTerms = [];
    let currentUiLang = langSelector.value || 'en';
    let hpoNodes = [];
    let hpoNodeMap = {}; // New: For quick lookup by ID
    let isDataLoaded = false;
    let lastSearchResults = []; // Keep track of last search for re-rendering on lang change

    // --- Constants ---
    const MAX_DISPLAY_RELATED_TERMS = 15; // Max related terms to show in the UI

    // --- Functions ---

    // processHpoData (Now creates a map for faster lookups)
    function processHpoData(processedNodes) {
        try {
            if (!Array.isArray(processedNodes)) {
                 throw new Error("Invalid pre-processed HPO data format (expected an array).");
            }
            hpoNodes = processedNodes;
            if (hpoNodes.length === 0) {
                throw new Error("No valid HPO nodes found in the pre-processed data.");
            }

            // Create a map for quick ID lookups
            hpoNodeMap = {};
            hpoNodes.forEach(node => {
                // Basic validation of node structure expected later
                if (node && node.id && node.lbl) {
                    hpoNodeMap[node.id] = node;
                } else {
                    console.warn("Skipping node during map creation due to missing id or lbl:", node);
                }
            });

            isDataLoaded = true;
            console.log(`Loaded ${hpoNodes.length} pre-processed HPO nodes. Map created with ${Object.keys(hpoNodeMap).length} entries.`);

            // Update UI
            loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_success || 'HPO data loaded successfully.';
            loadingMessageDiv.style.color = 'green';
            mainContentDiv.style.display = 'block';
            searchInput.disabled = false;
            searchButton.disabled = false;
            translateUI(currentUiLang); // Re-translate UI elements including new ones

        } catch (error) {
            console.error("Failed to process HPO data:", error);
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error processing data.'} (${error.message})`;
            loadingMessageDiv.style.color = 'red';
            isDataLoaded = false; hpoNodes = []; hpoNodeMap = {};
            mainContentDiv.style.display = 'none';
            searchInput.disabled = true; searchButton.disabled = true;
        }
    }

    // loadHpoDataFromServer (No changes needed here)
    async function loadHpoDataFromServer(url) {
        console.log(`Fetching HPO data from: ${url}`);
        loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_initial || 'Loading HPO data...';
        loadingMessageDiv.style.color = '#555';
        loadingArea.style.display = 'block';
        mainContentDiv.style.display = 'none';
        searchInput.disabled = true; searchButton.disabled = true;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
            }
            loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_wait || 'Processing data...'; // Update message
            const jsonData = await response.json();
            processHpoData(jsonData); // Process the fetched data

        } catch (error) {
            console.error("Failed to load or parse HPO data:", error);
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error loading HPO data.'} (${error.message})`;
            loadingMessageDiv.style.color = 'red';
            isDataLoaded = false; hpoNodes = []; hpoNodeMap = {};
            mainContentDiv.style.display = 'none';
            searchInput.disabled = true; searchButton.disabled = true;
        }
    }


    // translateUI (Updated to include new elements)
    function translateUI(lang) {
        const translations = uiStrings[lang] || uiStrings['en']; // Fallback to English
        document.title = translations['title'];
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) element.textContent = translations[key];
        });
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            if (translations[key]) element.placeholder = translations[key];
        });
        updatePlaceholders(lang); // Update placeholders including the new related list one
        if(isDataLoaded){
            renderSearchResults(lastSearchResults || []); // Update result tooltips
            renderSelectedList(); // Update selected list tooltips (calls updateRelatedTerms)
            // updateRelatedTerms(); // Update related list tooltips (now called from renderSelectedList)
        }
        // Update loading message if data isn't loaded yet
        if (!isDataLoaded) {
             loadingMessageDiv.textContent = translations['loading_initial'] || 'Loading HPO data, please wait...';
        }
    }

    // updatePlaceholders (Updated to include related list placeholder)
    function updatePlaceholders(lang) {
        const translations = uiStrings[lang] || uiStrings['en'];
         if (resultsArea.innerHTML.trim() === '' || resultsArea.querySelector('.placeholder-text')) {
             resultsArea.innerHTML = `<p class="placeholder-text" data-translate="results_placeholder">${translations['results_placeholder']}</p>`;
         }
         if (selectedList.innerHTML.trim() === '' || selectedList.querySelector('.placeholder-text')) {
             selectedList.innerHTML = `<li class="placeholder-text" data-translate="selected_placeholder">${translations['selected_placeholder']}</li>`;
         }
         // Add placeholder for related list
         if (relatedList.innerHTML.trim() === '' || relatedList.querySelector('.placeholder-text')) {
             relatedList.innerHTML = `<li class="placeholder-text" data-translate="related_placeholder">${translations['related_placeholder']}</li>`;
         }
    }

    // performSearch (No changes needed)
    function performSearch() {
        if (!isDataLoaded) return;
        const query = searchInput.value.trim().toLowerCase();
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        resultsArea.innerHTML = ''; searchIndicator.style.visibility = 'visible';
        lastSearchResults = []; // Reset last search results

        if (query.length < 2) {
            resultsArea.innerHTML = `<p class="placeholder-text">${translations['error_min_chars']}</p>`;
            searchIndicator.style.visibility = 'hidden'; return;
        }

        const results = []; const max_results = 50;
        try {
            // Use hpoNodeMap for potentially faster lookups if needed, but iterating hpoNodes is fine here
            for (const node of hpoNodes) {
                let matchFound = false;
                if (node.lbl && node.lbl.toLowerCase().includes(query)) { matchFound = true; }
                if (!matchFound && node.definition && node.definition.toLowerCase().includes(query)) { matchFound = true; }
                if (!matchFound && node.synonyms && Array.isArray(node.synonyms)) {
                    for (const syn of node.synonyms) {
                        if (syn && syn.toLowerCase().includes(query)) { matchFound = true; break; }
                    }
                }
                if (matchFound) {
                    results.push({ id: node.id, name: node.lbl });
                    if (results.length >= max_results) break;
                }
            }
            lastSearchResults = results; // Store results for potential re-render on lang change
            renderSearchResults(results);
        } catch (error) {
             console.error("Search error:", error);
             resultsArea.innerHTML = `<p class="placeholder-text" style="color: red;">${translations['error_search_failed']}</p>`;
             lastSearchResults = []; // Clear on error
        } finally {
             searchIndicator.style.visibility = 'hidden';
        }
    }

    // renderSearchResults (No fundamental changes, just ensure consistency)
    function renderSearchResults(results) {
        resultsArea.innerHTML = '';
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        if (results.length === 0 && searchInput.value.trim().length >= 2) {
            resultsArea.innerHTML = `<p class="placeholder-text">${translations['error_no_results']}</p>`;
        } else if (results.length === 0) {
             updatePlaceholders(currentUiLang); // Show default placeholder if input is empty
        } else {
            results.forEach(term => {
                const item = document.createElement('div'); item.classList.add('result-item');
                item.textContent = `${term.name} (${term.id})`;
                item.dataset.id = term.id; item.dataset.name = term.name;
                item.setAttribute('title', `${translations['add_tooltip_prefix']} ${term.name}`);
                item.addEventListener('click', handleSelectTerm);
                resultsArea.appendChild(item);
            });
        }
    }

    // handleSelectTerm (No changes needed)
    function handleSelectTerm(event) {
        const target = event.currentTarget;
        const termId = target.dataset.id;
        const termName = target.dataset.name;
        // Prevent adding if already selected
        if (!selectedTerms.some(term => term.id === termId)) {
            selectedTerms.push({ id: termId, name: termName });
            renderSelectedList(); // This will now also trigger updateRelatedTerms
        } else {
            console.log(`${termName} (${termId}) is already selected.`);
        }
    }

    // renderSelectedList (Now calls updateRelatedTerms at the end)
    function renderSelectedList() {
        selectedList.innerHTML = '';
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        if (selectedTerms.length === 0) {
            selectedList.innerHTML = `<li class="placeholder-text" data-translate="selected_placeholder">${translations['selected_placeholder']}</li>`;
            downloadButton.disabled = true;
            updateRelatedTerms(); // Update related terms (will show placeholder)
            return;
        }
        downloadButton.disabled = false;
        selectedTerms.forEach(term => {
            const listItem = document.createElement('li');
            const textSpan = document.createElement('span');
            textSpan.textContent = `${term.name} (${term.id})`;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X'; removeBtn.classList.add('remove-btn');
            removeBtn.dataset.id = term.id;
            removeBtn.setAttribute('title', `${translations['remove_tooltip_prefix']} ${term.name}`);
            removeBtn.addEventListener('click', handleRemoveTerm);
            listItem.appendChild(textSpan); listItem.appendChild(removeBtn);
            selectedList.appendChild(listItem);
        });
        updateRelatedTerms(); // Update related terms whenever the selection changes
    }

    // handleRemoveTerm (No changes needed)
    function handleRemoveTerm(event) {
        const termIdToRemove = event.target.dataset.id;
        selectedTerms = selectedTerms.filter(term => term.id !== termIdToRemove);
        renderSelectedList(); // Re-render selected list (will also update related)
    }

    // --- New Functions for Related Terms ---

    // updateRelatedTerms: Finds and displays terms related to the current selection
    function updateRelatedTerms() {
        if (!isDataLoaded) return; // Don't run if data isn't ready

        relatedList.innerHTML = ''; // Clear current related terms
        const translations = uiStrings[currentUiLang] || uiStrings['en'];

        if (selectedTerms.length === 0) {
            relatedList.innerHTML = `<li class="placeholder-text" data-translate="related_placeholder">${translations['related_placeholder']}</li>`;
            return;
        }

        let relatedCandidates = {}; // Use object to store candidates { id: { id, name, score } }
        const selectedIds = new Set(selectedTerms.map(term => term.id)); // Set for quick lookup

        // Collect related terms from all selected terms
        selectedTerms.forEach(selectedTerm => {
            const nodeData = hpoNodeMap[selectedTerm.id];
            if (nodeData && nodeData.similar_terms && Array.isArray(nodeData.similar_terms)) {
                nodeData.similar_terms.forEach(similar => {
                    // Only consider if NOT already selected
                    if (!selectedIds.has(similar.id)) {
                        const existingCandidate = relatedCandidates[similar.id];
                        if (existingCandidate) {
                            // Update score if the new score is higher
                            existingCandidate.score = Math.max(existingCandidate.score, similar.score);
                        } else {
                            // Add new candidate if we have its data in the map
                            const relatedNodeData = hpoNodeMap[similar.id];
                            if (relatedNodeData) {
                                relatedCandidates[similar.id] = {
                                    id: similar.id,
                                    name: relatedNodeData.lbl, // Get label from map
                                    score: similar.score
                                };
                            } else {
                                // console.warn(`Data for related term ${similar.id} not found in hpoNodeMap.`);
                            }
                        }
                    }
                });
            }
        });

        // Convert candidates object to array, sort by score, and take top N
        const sortedRelated = Object.values(relatedCandidates)
                                    .sort((a, b) => b.score - a.score) // Sort descending by score
                                    .slice(0, MAX_DISPLAY_RELATED_TERMS);

        // Render the sorted related terms
        renderRelatedList(sortedRelated);
    }

    // renderRelatedList: Renders the list of related terms in the UI
    function renderRelatedList(relatedTerms) {
        relatedList.innerHTML = ''; // Clear previous content
        const translations = uiStrings[currentUiLang] || uiStrings['en'];

        if (relatedTerms.length === 0) {
            // Show a different message if terms were selected but no related found above threshold/not selected
             if (selectedTerms.length > 0) {
                  relatedList.innerHTML = `<li class="placeholder-text">${translations['error_no_results']}</li>`; // Or a specific "no related terms found" message
             } else {
                  relatedList.innerHTML = `<li class="placeholder-text" data-translate="related_placeholder">${translations['related_placeholder']}</li>`;
             }
            return;
        }

        relatedTerms.forEach(term => {
            const listItem = document.createElement('li');
            listItem.classList.add('related-item');
            listItem.dataset.id = term.id;
            listItem.dataset.name = term.name; // Store name for adding
            listItem.setAttribute('title', `${translations['add_related_tooltip_prefix']} ${term.name} (Score: ${term.score.toFixed(3)})`);

            // Content of the list item
            const textSpan = document.createElement('span');
            textSpan.textContent = `${term.name} (${term.id})`;
            const scoreSpan = document.createElement('span');
            scoreSpan.classList.add('score');
            scoreSpan.textContent = `(${term.score.toFixed(3)})`; // Display score

            listItem.appendChild(textSpan);
            listItem.appendChild(scoreSpan);

            listItem.addEventListener('click', handleAddRelatedTerm);
            relatedList.appendChild(listItem);
        });
    }

    // handleAddRelatedTerm: Adds a clicked related term to the main selection
    function handleAddRelatedTerm(event) {
        const target = event.currentTarget;
        const termId = target.dataset.id;
        const termName = target.dataset.name;

        // Check if it's already selected (shouldn't be, due to filtering in updateRelatedTerms, but double-check)
        if (!selectedTerms.some(term => term.id === termId)) {
            selectedTerms.push({ id: termId, name: termName });
            renderSelectedList(); // Re-render selected list, which will trigger related list update
        } else {
            console.log(`${termName} (${termId}) is already selected.`);
            // Optional: visually indicate it's already selected if clicked again?
        }
    }


    // downloadCSV (No changes needed)
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

    // handleLanguageChange (No changes needed, translateUI handles the rest)
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
    updatePlaceholders(currentUiLang); // Ensure all placeholders are set correctly initially
    loadHpoDataFromServer('hpo_data.json'); // Start loading data from the server

}); // End DOMContentLoaded
