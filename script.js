document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsArea = document.getElementById('results-area');
    const selectedList = document.getElementById('selected-list');
    const downloadButton = document.getElementById('download-button');
    const searchIndicator = document.getElementById('search-indicator');
    const resultsPlaceholder = resultsArea.querySelector('.placeholder-text');
    const selectedPlaceholder = selectedList.querySelector('.placeholder-text');

    // --- State ---
    let selectedTerms = []; // Array to store {id: "HP:XXXX", name: "Term Name"}

    // --- Functions ---

    /**
     * Fetches search results from the backend API.
     */
    async function performSearch() {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            resultsArea.innerHTML = '<p class="placeholder-text">Please enter at least 2 characters to search.</p>';
            return;
        }

        // Show loading indicator
        searchIndicator.style.visibility = 'visible';
        resultsArea.innerHTML = ''; // Clear previous results immediately

        try {
            // Use template literal for cleaner URL construction
            const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const results = await response.json();
            renderSearchResults(results);
        } catch (error) {
            console.error("Search failed:", error);
            resultsArea.innerHTML = `<p class="placeholder-text" style="color: red;">Search failed. Please check the console or try again later.</p>`;
        } finally {
            // Hide loading indicator
             searchIndicator.style.visibility = 'hidden';
        }
    }

    /**
     * Renders the search results in the results area.
     * @param {Array} results - Array of {id, name} objects.
     */
    function renderSearchResults(results) {
        resultsArea.innerHTML = ''; // Clear previous content (including placeholders/errors)

        if (results.length === 0) {
            resultsArea.innerHTML = '<p class="placeholder-text">No matching terms found.</p>';
            return;
        }

        results.forEach(term => {
            const item = document.createElement('div');
            item.classList.add('result-item');
            item.textContent = `${term.name} (${term.id})`;
            item.dataset.id = term.id; // Store ID in data attribute
            item.dataset.name = term.name; // Store Name in data attribute
            item.setAttribute('title', `Click to add ${term.name}`); // Tooltip
            item.addEventListener('click', handleSelectTerm);
            resultsArea.appendChild(item);
        });
    }

    /**
     * Handles clicking on a search result item to select it.
     * @param {Event} event - The click event.
     */
    function handleSelectTerm(event) {
        const target = event.currentTarget; // Use currentTarget for the element listener is attached to
        const termId = target.dataset.id;
        const termName = target.dataset.name;

        // Check if already selected
        if (!selectedTerms.some(term => term.id === termId)) {
            selectedTerms.push({ id: termId, name: termName });
            renderSelectedList();
            // Optionally: give visual feedback like highlighting the added item briefly
        } else {
            // Optionally: provide feedback that term is already selected
            console.log(`${termName} (${termId}) is already selected.`);
            // Maybe flash the existing item in the selected list
        }
    }

    /**
     * Renders the list of selected terms.
     */
    function renderSelectedList() {
        selectedList.innerHTML = ''; // Clear current list

        if (selectedTerms.length === 0) {
             selectedList.appendChild(selectedPlaceholder.cloneNode(true)); // Add placeholder back
             downloadButton.disabled = true; // Disable download if list is empty
             return;
        }

        downloadButton.disabled = false; // Enable download if list has items

        selectedTerms.forEach(term => {
            const listItem = document.createElement('li');

            const textSpan = document.createElement('span');
            textSpan.textContent = `${term.name} (${term.id})`;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.classList.add('remove-btn');
            removeBtn.dataset.id = term.id; // Store ID for removal
            removeBtn.setAttribute('title', `Remove ${term.name}`);
            removeBtn.addEventListener('click', handleRemoveTerm);

            listItem.appendChild(textSpan);
            listItem.appendChild(removeBtn);
            selectedList.appendChild(listItem);
        });
    }

    /**
     * Handles clicking the remove button for a selected term.
     * @param {Event} event - The click event.
     */
    function handleRemoveTerm(event) {
        const termIdToRemove = event.target.dataset.id;
        selectedTerms = selectedTerms.filter(term => term.id !== termIdToRemove);
        renderSelectedList();
    }

    /**
     * Generates and triggers the download of the selected terms as a CSV file.
     */
    function downloadCSV() {
        if (selectedTerms.length === 0) return;

        // Add header row with explicit quotes for robustness
        let csvContent = `"HPO ID","Term Name"\n`;

        // Add data rows, ensuring names with commas are quoted (though unlikely for HPO names)
        selectedTerms.forEach(term => {
            // Simple check if name needs quotes (contains comma, quote, or newline)
            const safeName = /[",\n]/.test(term.name) ? `"${term.name.replace(/"/g, '""')}"` : term.name;
            csvContent += `"${term.id}",${safeName}\n`;
        });

        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        // Suggest a filename
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        link.setAttribute("download", `hpo_selection_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Clean up the link element
        URL.revokeObjectURL(url); // Free up memory
    }


    // --- Event Listeners ---
    searchButton.addEventListener('click', performSearch);
    // Allow searching by pressing Enter in the input field
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    downloadButton.addEventListener('click', downloadCSV);

    // --- Initial Render ---
    renderSelectedList(); // Render the initial empty state for the selected list

}); // End DOMContentLoaded
