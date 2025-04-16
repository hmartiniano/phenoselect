document.addEventListener('DOMContentLoaded', () => {
    // --- UI Translation Strings ---
    const uiStrings = {
        'en': {
             'title': "HPO Phenotype Selector", 'search_heading': "Search Phenotypes", 'search_placeholder': "Enter phenotype (e.g., tall stature)", 'search_button': "Search", 'results_placeholder': "Search results will appear here.", 'selected_heading': "Selected Terms", 'selected_placeholder': "No terms selected yet.", 'download_button': "Download List (CSV)", 'error_search_failed': "Search logic error.", 'error_min_chars': "Please enter at least 2 characters to search.", 'error_no_results': "No matching terms found.", 'add_tooltip_prefix': "Click to add", 'remove_tooltip_prefix': "Remove",
             'loading_wait': "Processing file, please wait...",
             'loading_error': "Error reading or parsing file. Ensure it's valid HPO JSON.",
             'loading_success': "HPO data loaded successfully.",
             'prompt_load': 'Please select the hp.json or hp-intl.json file you downloaded.'
          },
        'de': {
             'title': "HPO Phänotyp-Auswahl", 'search_heading': "Phänotypen suchen", 'search_placeholder': "Phänotyp eingeben (z.B. Großwuchs)", 'search_button': "Suchen", 'results_placeholder': "Suchergebnisse werden hier angezeigt.", 'selected_heading': "Ausgewählte Begriffe", 'selected_placeholder': "Noch keine Begriffe ausgewählt.", 'download_button': "Liste herunterladen (CSV)", 'error_search_failed': "Fehler in der Suchlogik.", 'error_min_chars': "Bitte mindestens 2 Zeichen für die Suche eingeben.", 'error_no_results': "Keine passenden Begriffe gefunden.", 'add_tooltip_prefix': "Klicken zum Hinzufügen von", 'remove_tooltip_prefix': "Entfernen",
             'loading_wait': "Datei wird verarbeitet, bitte warten...",
             'loading_error': "Fehler beim Lesen oder Parsen der Datei. Ist es valides HPO-JSON?",
             'loading_success': "HPO-Daten erfolgreich geladen.",
             'prompt_load': 'Bitte die heruntergeladene hp.json oder hp-intl.json auswählen.'
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
             'loading_error': "Erro ao ler ou processar o ficheiro. Verifique se é um HPO JSON válido.",
             'loading_success': "Dados HPO carregados com sucesso.",
             'prompt_load': 'Por favor, selecione o ficheiro hp.json ou hp-intl.json que descarregou.'
          }
        // Add more languages here
    };

    // --- DOM Elements (Same as before) ---
    const configArea = document.getElementById('config-area');
    const hpoFileInput = document.getElementById('hpo-file-input');
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

    // processHpoData (Same as before - parses nodes)
    function processHpoData(jsonData) {
        try {
            if (!jsonData || !jsonData.graphs || !Array.isArray(jsonData.graphs) || jsonData.graphs.length === 0 || !Array.isArray(jsonData.graphs[0].nodes)) {
                 throw new Error("Invalid HPO JSON structure.");
            }
            hpoNodes = jsonData.graphs[0].nodes.filter(node => node.id && node.lbl && !node.meta?.obsolete);
            if (hpoNodes.length === 0) {
                throw new Error("No valid HPO nodes found.");
            }
            isDataLoaded = true;
            console.log(`Parsed ${hpoNodes.length} non-obsolete HPO nodes.`);
            loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_success || 'HPO data loaded successfully.';
            loadingMessageDiv.style.color = 'green';
            mainContentDiv.style.display = 'block';
            searchInput.disabled = false; searchButton.disabled = false;
            translateUI(currentUiLang);
        } catch (error) {
            console.error("Failed to process HPO JSON:", error);
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error processing file.'} (${error.message})`;
            loadingMessageDiv.style.color = 'red';
            isDataLoaded = false; hpoNodes = []; mainContentDiv.style.display = 'none';
        }
    }

    // handleFileSelect (Same as before - reads file)
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
             loadingMessageDiv.textContent = uiStrings[currentUiLang]?.prompt_load || 'Please select the HPO JSON file.';
             loadingMessageDiv.style.color = '#555'; return;
        }
        console.log(`File selected: ${file.name}`);
        isDataLoaded = false; hpoNodes = []; mainContentDiv.style.display = 'none';
        searchInput.disabled = true; searchButton.disabled = true;
        loadingMessageDiv.textContent = uiStrings[currentUiLang]?.loading_wait || 'Processing file...';
        loadingMessageDiv.style.color = '#555';
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                processHpoData(jsonData);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error parsing file.'} (Invalid JSON?)`;
                loadingMessageDiv.style.color = 'red';
                isDataLoaded = false; hpoNodes = []; mainContentDiv.style.display = 'none';
            }
        };
        reader.onerror = function(e) {
            console.error("Error reading file:", e);
            loadingMessageDiv.textContent = `${uiStrings[currentUiLang]?.loading_error || 'Error reading file.'} (${reader.error})`;
            loadingMessageDiv.style.color = 'red';
            isDataLoaded = false; hpoNodes = []; mainContentDiv.style.display = 'none';
        };
        reader.readAsText(file);
    }

    // translateUI (Same logic, uses uiStrings)
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
            for (const node of hpoNodes) {
                let matchFound = false;
                if (node.lbl && node.lbl.toLowerCase().includes(query)) { matchFound = true; }
                if (!matchFound && node.meta?.definition?.val && node.meta.definition.val.toLowerCase().includes(query)) { matchFound = true; }
                if (!matchFound && node.meta?.synonyms && Array.isArray(node.meta.synonyms)) {
                    for (const syn of node.meta.synonyms) {
                        if (syn.val && syn.val.toLowerCase().includes(query)) { matchFound = true; break; }
                    }
                }
                if (matchFound) {
                    // IMPORTANT: Still using node.lbl as the display name
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

    // --- Event Listeners (Same as before) ---
    hpoFileInput.addEventListener('change', handleFileSelect);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') performSearch(); });
    downloadButton.addEventListener('click', downloadCSV);
    langSelector.addEventListener('change', handleLanguageChange);

    // --- Initial Setup ---
    translateUI(currentUiLang); // Translate the initial UI

}); // End DOMContentLoaded
