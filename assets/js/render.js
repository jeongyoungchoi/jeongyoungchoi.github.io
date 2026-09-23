(function () {
    var DATA_BASE = "/assets/data/";
    var lang = document.documentElement.lang || "en";

    function fetchJSON(name) {
        return fetch(DATA_BASE + name).then(function (res) { return res.json(); });
    }

    function el(tag, className, html) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (html !== undefined) node.innerHTML = html;
        return node;
    }

    function renderEducation(container, education, schools) {
        education.forEach(function (entry) {
            var school = schools[entry.school_id];
            var degree = (entry.degree && entry.degree[lang]) || "";
            var field = entry.field && entry.field[lang] ? " " + entry.field[lang] : "";

            var card = el("div", "education-card");
            var main = el("div", "education-card-main");
            main.appendChild(el("div", "education-card-main-logo", '<img src="/assets/images/icons/' + school.image + '"/>'));
            main.appendChild(el("p", null,
                "<b>" + school.name[lang] + "</b><br>" +
                entry.start_year + " - " + entry.end_year + "<br>" +
                degree + field
            ));
            card.appendChild(main);

            var details = el("div", "education-card-details");
            if (entry.details && entry.details[lang]) {
                details.appendChild(el("p", null, entry.details[lang]));
            }
            if (entry.thesis) {
                var label = lang === "ko" ? "학위논문:" : "Thesis:";
                details.appendChild(el("p", null, label + " " + entry.thesis));
            }
            card.appendChild(details);
            container.appendChild(card);
        });
    }

    function renderExperience(container, experience, schools) {
        experience.forEach(function (entry) {
            var company = schools[entry.company_id];

            var card = el("div", "experience-card");
            var main = el("div", "experience-card-main");
            main.appendChild(el("div", "experience-card-main-logo", '<img src="/assets/images/icons/' + company.image + '"/>'));
            main.appendChild(el("p", null,
                "<b>" + company.name[lang] + "</b><br>" +
                entry.start_year + " - " + entry.end_year + "<br>" +
                entry.position[lang]
            ));
            card.appendChild(main);

            var details = el("div", "experience-card-details", (entry.details && entry.details[lang]) || "");
            card.appendChild(details);
            container.appendChild(card);
        });
    }

    function authorHTML(authorName, authors, showOrcid) {
        var author = authors[authorName] || { name: authorName };
        var html = authorName === "Jeong Young Choi" ? "<strong>" + author.name + "</strong>" : author.name;
        if (showOrcid && author.orcid) {
            html += ' <a href="https://orcid.org/' + author.orcid + '" target="_blank" rel="noopener" class="orcid-link">' +
                '<img src="/assets/images/icons/ORCID-iD_icon-vector.svg" alt="ORCID logo" class="orcid-icon"/></a>';
        }
        return html;
    }

    function publicationCard(item, authors) {
        var card = el("div", "publication-card");
        card.id = "research-item-" + item.index;

        if (item.thumbnail) {
            var readLabel = lang === "ko" ? "논문 읽기" : "Read paper";
            var dlLabel = lang === "ko" ? "논문 받기" : "Download paper";
            card.appendChild(el("div", "abstract-graphic",
                '<img src="' + item.thumbnail + '" alt="Publication ' + item.index + ' Thumbnail">' +
                '<div class="overlay-read-paper">' + readLabel + '</div>' +
                '<div class="overlay-download-paper">' + dlLabel + '</div>'
            ));
        }

        var content = el("div", "publication-content");
        var heading = el("h3", null, item.title);
        if (item.url) {
            var link = el("a", null);
            link.href = item.url;
            link.target = "_blank";
            link.rel = "noopener";
            link.appendChild(heading);
            content.appendChild(link);
        } else {
            content.appendChild(heading);
        }

        var authorsHTML = item.authors.map(function (a) {
            return authorHTML(a, authors, item.type === "Journal");
        }).join(", ");
        content.appendChild(el("p", null, authorsHTML));

        if (item.type === "Journal") {
            content.appendChild(el("p", null,
                "<em>" + item.journal + "</em>, vol. " + item.volume + ": no. " + item.number +
                ", pp. " + item.pages + ", " + item.publisher + ", " + item.year + "."
            ));
        } else if (item.type === "Dissertation") {
            content.appendChild(el("p", null, item.detail[lang]));
        }

        var tags = el("div", "publication-tags-container");
        tags.appendChild(el("div", "publication-tag", item.type));
        (item.keywords || []).forEach(function (keyword) {
            tags.appendChild(el("div", "publication-tag", keyword));
        });
        if (item.pdf) {
            var pdfLink = el("a", "download-pdf", '<img src="/assets/images/icons/PDF_icon.svg" alt="PDF logo"/>');
            pdfLink.href = item.pdf;
            pdfLink.setAttribute("download", item.title + ".pdf");
            pdfLink.target = "_blank";
            tags.appendChild(pdfLink);
        }
        content.appendChild(tags);

        card.appendChild(content);
        return card;
    }

    function renderPublications(container, research, authors, featuredOnly) {
        research.forEach(function (item) {
            if (featuredOnly && !item.featured) return;
            container.appendChild(publicationCard(item, authors));
        });
    }

    async function init() {
        var eduContainer = document.getElementById("education-list");
        var expContainer = document.getElementById("experience-list");
        var pubContainer = document.getElementById("publications-list");
        var featuredContainer = document.getElementById("featured-list");

        if (eduContainer || expContainer) {
            var schools = await fetchJSON("schools.json");
            if (eduContainer) {
                renderEducation(eduContainer, await fetchJSON("education.json"), schools);
                if (window.Reveal) window.Reveal.watch(eduContainer.querySelectorAll(".education-card"));
            }
            if (expContainer) {
                renderExperience(expContainer, await fetchJSON("experience.json"), schools);
                if (window.Reveal) window.Reveal.watch(expContainer.querySelectorAll(".experience-card"));
            }
        }

        if (pubContainer || featuredContainer) {
            var authors = await fetchJSON("authors.json");
            var research = await fetchJSON("research.json");
            if (pubContainer) {
                renderPublications(pubContainer, research, authors, false);
                if (window.Reveal) window.Reveal.watch(pubContainer.querySelectorAll(".publication-card"));
            }
            if (featuredContainer) {
                renderPublications(featuredContainer, research, authors, true);
                if (window.Reveal) window.Reveal.watch(featuredContainer.querySelectorAll(".publication-card"));
            }
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
