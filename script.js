document.addEventListener('DOMContentLoaded', () => {
    // --- UI Translation Strings ---
    const uiStrings = {
        'en': {
             'title': "HPO Phenotype Selector", 'search_heading': "Search Phenotypes", 'search_placeholder': "Enter phenotype (e.g., tall stature)", 'search_button': "Search", 'results_placeholder': "Search results will appear here.", 'selected_heading': "Selected Terms", 'selected_placeholder': "No terms selected yet.", 'download_button': "Download List (CSV)", 'error_search_failed': "Search logic error.", 'error_min_chars': "Please enter at least 2 characters to search.", 'error_no_results': "No matching terms found.", 'add_tooltip_prefix': "Click to add", 'remove_tooltip_prefix': "Remove",
             'loading_wait': "Processing file, please wait...",
             'loading_error': "Error loading or processing HPO data.", // Generic error
             'loading_success': "HPO data loaded successfully.",
             'loading_initial': 'Loading HPO data, please wait...' // Initial loading message
          },
        'de': {
             'title': "HPO Phänotyp-Auswahl", 'search_heading': "Phänotypen suchen", 'search_placeholder': "Phänotyp eingeben (z.B. Großwuchs)", 'search_button': "Suchen", 'results_placeholder': "Suchergebnisse werden hier angezeigt.", 'selected_heading': "Ausgewählte Begriffe", 'selected_placeholder': "Noch keine Begriffe ausgewählt.", 'download_button': "Liste herunterladen (CSV)", 'error_search_failed': "Fehler in der Suchlogik.", 'error_min_chars': "Bitte mindestens 2 Zeichen für die Suche eingeben.", 'error_no_results': "Keine passenden Begriffe gefunden.", 'add_tooltip_prefix': "Klicken zum Hinzufügen von", 'remove_tooltip_prefix': "Entfernen",
             'loading_wait': "Daten werden geladen, bitte warten...", // Changed from file processing
             'loading_error': "Fehler beim Laden oder Verarbeiten der HPO-Daten.",
             'loading_success': "HPO-Daten erfolgreich geladen.",
             'loading_initial': 'HPO-Daten werden geladen, bitte warten...'
         },
        'pt': { // Added Portuguese translations
             'title': "Seletor de Fenótipos HPO",
             'search_heading': "Pesquisar Fenótipos",
             'search_placeholder': "Introduza o fenótipo (ex: estatura alta)",
             'search_button': "Pesquisar",
             'results_placeholder': "Resultados da pesquisa aparecerão aqui.",
             'selected_heading': "Termos Selecionados",
             'selected_placeholder': "Nenhum termo selecionado ainda.",
             'download_button': "Descarregar Lista (CSV)",
             'error_search_failed': "Erro na lógica de pesquisa.",
             'error_min_chars': "Por favor, introduza pelo menos 2 caracteres para pesquisar.",
             'error_no_results': "Nenhum termo correspondente encontrado.",
             'add_tooltip_prefix': "Clicar para adicionar",
             'remove_tooltip_prefix': "Remover",
             'loading_wait': "A processar o ficheiro, por favor aguarde...",
             'loading_error': "Erro ao carregar ou processar os dados HPO.", // Generic error
             'loading_success': "Dados HPO carregados com sucesso.",
             'loading_initial': 'A carregar dados HPO, por favor aguarde...' // Initial loading message
          }
        // Add more languages here
    };

    // --- DOM Elements ---
    const loadingArea = document.getElementById('loading-area'); // Changed from config-area
    const loadingMessageDiv = document.getElementById('loading-message');
    const mainContentDiv = document.getElementById('main-content');
    const langSelector = document.getElementById('lang-selector');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsArea = document.getElementById('results-area');
    const selectedList = document.getElementById('selected-list');
    const downloadButton = document.getElementById('download-button');
    const searchIndicator = document.getElementById('search-indicator');

    // --- State (Same as before) ---
    let selectedTerms = [];
    let currentUiLang = langSelector.value || 'en';
    let hpoNodes = [];
    let isDataLoaded = false;

    // --- Functions ---

    // processHpoData (Now expects the pre-processed list)
    function processHpoData(processedNodes) {
        try {
            if (!Array.isArray(processedNodes)) {
                 throw new Error("Invalid pre-processed HPO data format (expected an array).");
            }
            // Data is already filtered by the Python script
            hpoNodes = processedNodes;
            if (hpoNodes.length === 0) {
                throw new Error("No valid HPO nodes found in the pre-processed data.");
            }
            isDataLoaded = true;
            console.log(`Loaded ${hpoNodes.length} pre-processed HPO nodes.`);

            // Update UI: Show success, hide loading area, enable controls
            loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_success || 'HPO data loaded successfully.';
            loadingMessageDiv.style.color = 'green';
            // Optionally hide the loading area after success
            // loadingArea.style.display = 'none';
            mainContentDiv.style.display = 'block';
            searchInput.disabled = false;
            searchButton.disabled = false;
            translateUI(currentUiLang); // Re-translate in case language changed during load

        } catch (error) {
            console.error("Failed to process HPO data:", error);
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error processing data.'} (${error.message})`;
            loadingMessageDiv.style.color = 'red';
            isDataLoaded = false; hpoNodes = [];
            mainContentDiv.style.display = 'none'; // Keep main content hidden on error
            searchInput.disabled = true; searchButton.disabled = true;
        }
    }

    // Load HPO data from the server
    async function loadHpoDataFromServer(url) {
        console.log(`Fetching HPO data from: ${url}`);
        // Ensure loading message reflects the current state and language
        loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_initial || 'Loading HPO data...';
        loadingMessageDiv.style.color = '#555';
        loadingArea.style.display = 'block'; // Make sure loading area is visible
        mainContentDiv.style.display = 'none'; // Keep main content hidden
        searchInput.disabled = true; searchButton.disabled = true; // Keep controls disabled

        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Throw an error with HTTP status to be caught below
                throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
            }
            const jsonData = await response.json();
            processHpoData(jsonData); // Process the fetched data

        } catch (error) {
            console.error("Failed to load or parse HPO data:", error);
            // Display a user-friendly error message, including network issues
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error loading HPO data.'} (${error.message})`;
            loadingMessageDiv.style.color = 'red';
            isDataLoaded = false; hpoNodes = [];
            mainContentDiv.style.display = 'none'; // Ensure main content remains hidden
            searchInput.disabled = true; searchButton.disabled = true;
        }
    }


    // translateUI (Uses uiStrings, updates placeholders)
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
         updatePlaceholders(lang);
        if(isDataLoaded){
            renderSearchResults(lastSearchResults || []); // Update tooltips
            renderSelectedList(); // Update tooltips
        } else {
             // Make sure the initial prompt is also translated
             loadingMessageDiv.textContent = translations['prompt_load'] || 'Please select the HPO JSON file.';
        }
    }

    // updatePlaceholders (Same logic, uses uiStrings)
    function updatePlaceholders(lang) {
        const translations = uiStrings[lang] || uiStrings['en'];
         if (resultsArea.innerHTML.trim() === '' || resultsArea.querySelector('.placeholder-text')) {
             resultsArea.innerHTML = `<p class="placeholder-text" data-translate="results_placeholder">${translations['results_placeholder']}</p>`;
         }
         if (selectedList.innerHTML.trim() === '' || selectedList.querySelector('.placeholder-text')) {
             selectedList.innerHTML = `<li class="placeholder-text" data-translate="selected_placeholder">${translations['selected_placeholder']}</li>`;
         }
    }

    // performSearch (Same logic - searches all text fields)
    let lastSearchResults = [];
    function performSearch() {
        if (!isDataLoaded) return;
        const query = searchInput.value.trim().toLowerCase();
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        resultsArea.innerHTML = ''; searchIndicator.style.visibility = 'visible';
        lastSearchResults = [];

        if (query.length < 2) {
            resultsArea.innerHTML = `<p class="placeholder-text">${translations['error_min_chars']}</p>`;
            searchIndicator.style.visibility = 'hidden'; return;
        }

        const results = []; const max_results = 50;
        try {
            for (const node of hpoNodes) { // Iterate the pre-processed list
                let matchFound = false;
                // Access fields directly from the simplified node object
                if (node.lbl && node.lbl.toLowerCase().includes(query)) { matchFound = true; }
                // Check definition (now directly on node)
                if (!matchFound && node.definition && node.definition.toLowerCase().includes(query)) { matchFound = true; }
                // Check synonyms (now a simple array of strings)
                if (!matchFound && node.synonyms && Array.isArray(node.synonyms)) {
                    for (const syn of node.synonyms) {
                        if (syn && syn.toLowerCase().includes(query)) { matchFound = true; break; }
                    }
                }
                if (matchFound) {
                    // Use node.lbl for display name
                    results.push({ id: node.id, name: node.lbl });
                    if (results.length >= max_results) break;
                }
            }
            lastSearchResults = results; renderSearchResults(results);
        } catch (error) {
             console.error("Search error:", error);
             resultsArea.innerHTML = `<p class="placeholder-text" style="color: red;">${translations['error_search_failed']}</p>`;
             lastSearchResults = [];
        } finally {
             searchIndicator.style.visibility = 'hidden';
        }
    }

    // renderSearchResults (Uses node.lbl, translates tooltips)
    function renderSearchResults(results) {
        resultsArea.innerHTML = '';
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        if (results.length === 0 && searchInput.value.trim().length >= 2) {
            resultsArea.innerHTML = `<p class="placeholder-text">${translations['error_no_results']}</p>`;
        } else if (results.length === 0) {
             updatePlaceholders(currentUiLang);
        } else {
            results.forEach(term => {
                const item = document.createElement('div'); item.classList.add('result-item');
                item.textContent = `${term.name} (${term.id})`; // term.name is node.lbl
                item.dataset.id = term.id; item.dataset.name = term.name;
                item.setAttribute('title', `${translations['add_tooltip_prefix']} ${term.name}`);
                item.addEventListener('click', handleSelectTerm);
                resultsArea.appendChild(item);
            });
        }
    }

    // handleSelectTerm (Uses term.name which is node.lbl)
    function handleSelectTerm(event) {
        const target = event.currentTarget; const termId = target.dataset.id; const termName = target.dataset.name;
        if (!selectedTerms.some(term => term.id === termId)) {
            selectedTerms.push({ id: termId, name: termName }); // name is node.lbl
            renderSelectedList();
        } else { console.log(`${termName} (${termId}) is already selected.`); }
    }

    // renderSelectedList (Uses term.name which is node.lbl, translates tooltips)
    function renderSelectedList() {
        selectedList.innerHTML = '';
        const translations = uiStrings[currentUiLang] || uiStrings['en'];
        if (selectedTerms.length === 0) {
            selectedList.innerHTML = `<li class="placeholder-text" data-translate="selected_placeholder">${translations['selected_placeholder']}</li>`;
            downloadButton.disabled = true; return;
        }
        downloadButton.disabled = false;
        selectedTerms.forEach(term => {
            const listItem = document.createElement('li'); const textSpan = document.createElement('span');
            textSpan.textContent = `${term.name} (${term.id})`; // term.name is node.lbl
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X'; removeBtn.classList.add('remove-btn');
            removeBtn.dataset.id = term.id;
            removeBtn.setAttribute('title', `${translations['remove_tooltip_prefix']} ${term.name}`);
            removeBtn.addEventListener('click', handleRemoveTerm);
            listItem.appendChild(textSpan); listItem.appendChild(removeBtn);
            selectedList.appendChild(listItem);
        });
    }

    // handleRemoveTerm (Same logic)
    function handleRemoveTerm(event) {
        const termIdToRemove = event.target.dataset.id;
        selectedTerms = selectedTerms.filter(term => term.id !== termIdToRemove);
        renderSelectedList();
    }

    // downloadCSV (Same logic)
    function downloadCSV() {
        if (selectedTerms.length === 0) return;
        let csvContent = `"HPO ID","Term Name"\n`;
        selectedTerms.forEach(term => {
            const safeName = /[",\n]/.test(term.name) ? `"${term.name.replace(/"/g, '""')}"` : term.name; // name is node.lbl
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

    // handleLanguageChange (Same logic)
    function handleLanguageChange() {
        currentUiLang = langSelector.value;
        console.log("UI Language changed to:", currentUiLang);
        translateUI(currentUiLang);
    }

    // --- Event Listeners ---
    // Removed: hpoFileInput listener
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') performSearch(); });
    downloadButton.addEventListener('click', downloadCSV);
    langSelector.addEventListener('change', handleLanguageChange);

    // --- Initial Setup ---
    translateUI(currentUiLang); // Translate static elements initially
    loadHpoDataFromServer('hpo_data.json'); // Start loading data from the server

}); // End DOMContentLoaded
