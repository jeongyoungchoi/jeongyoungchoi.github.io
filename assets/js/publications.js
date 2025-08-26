function renderPublications(items) {
const container = document.getElementById('publications-list');
container.innerHTML = ''; // Clear previous content

items.forEach(item => {
    // Create the main item div
    const itemLink = document.createElement('a');
    itemLink.classList.add('publication-card'); // For CSS styling
    itemLink.href = item.url;
    itemLink.target = "_blank";

    const authorsHTML = item.authors.map(author => {
        if (author === "Jeong Young Choi") {
            return `<b>${author}</b>`;
        } else {
            return author;
        }
    }).join(', ');

    // Create inner HTML structure with divs
    itemLink.innerHTML = `
    <div class="abstract-graphic">
        <img src="/assets/data/research/images/publication-${item.index}.png" alt="Publication ${item.index} Thumbnail">
        <div class="overlay">Read Paper</div>
    </div>
    <div class="publication-content">
        <h3 id="publication-title">${item.title}</h3>
        <p>${authorsHTML}</p>
        <p><i>${item.journal}</i>, vol. ${item.volume}: no. ${item.number}, pp. ${item.pages}, ${item.publisher}, ${item.year}.</p>
        <div class="publication-tags-container">
            <div class="publication-tag">${item.type}</div>
            ${item.keywords.map(keyword => `<div class="publication-tag">${keyword}</div>`).join(' ')}
        </div>
    </div>`;
    // Append this item div to the container
    container.appendChild(itemLink);
});
}

// Example usage with fetch:
fetch('/_data/publications.json')
    .then(response => response.json())
    .then(data => {
    renderPublications(data);
});