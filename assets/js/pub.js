function renderPublications(items) {
const container = document.getElementById('publications-list');
container.innerHTML = ''; // Clear previous content

items.forEach(item => {
    // Create the main item div
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('publication-card'); // For CSS styling if needed

    const authorsHTML = item.authors.map(author => {
        if (author === "Jeong Young Choi") {
            return `<b>${author}</b>`;
        } else {
            return author;
        }
    }).join(', ');
    // Create inner HTML structure with divs
    itemDiv.innerHTML = `
    <img src="/images/publication-${item.index}.png" alt="Publication ${item.index} Thumbnail">
    <div class="publication-content">
    <h3 id="publication-title">${item.title}</h3>
    <p>${authorsHTML}</p>
    <p>Published in <i>${item.journal}</i> (${item.year})</p>
    <div class="publication-tags-container">
        <div class="publication-tag">${item.type}</div>
        ${item.keywords.map(keyword => `<div class="publication-tag">${keyword}</div>`).join(' ')}
    </div>
    <div class="publication-link">
        <a target="_blank" href="${item.url}">Read Paper</a>
    </div>
    </div>`;
    // Append this item div to the container
    container.appendChild(itemDiv);
});
}

// Example usage with fetch:
fetch('/assets/data/publications.json')
    .then(response => response.json())
    .then(data => {
    renderPublications(data);
});