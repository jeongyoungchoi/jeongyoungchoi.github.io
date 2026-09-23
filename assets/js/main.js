// Shared scroll-reveal helper. Cards are fully visible by default (CSS never
// hides them on its own); only once this runs do elements opt into the
// fade-in, so a slow/broken script never leaves content permanently
// invisible. render.js calls Reveal.watch() on cards it injects dynamically.
window.Reveal = (function () {
    var observer = null;

    function ensureObserver() {
        if (observer || !("IntersectionObserver" in window)) return observer;
        observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        return observer;
    }

    function watch(elements) {
        var obs = ensureObserver();
        elements.forEach(function (el) {
            el.classList.add("js-reveal");
            if (obs) obs.observe(el);
        });
    }

    return { watch: watch };
})();

document.addEventListener("DOMContentLoaded", function () {
    // --- Dark / light mode toggle ---
    // The sun/moon icon swap is handled entirely by CSS off the .light-mode /
    // .dark-mode class on <html>, so this just flips that class.
    var toggleBtn = document.getElementById("mode-toggle");
    if (toggleBtn) {
        toggleBtn.onclick = function () {
            var root = document.documentElement;
            var isDark = root.classList.contains("dark-mode");
            root.classList.remove(isDark ? "dark-mode" : "light-mode");
            root.classList.add(isDark ? "light-mode" : "dark-mode");
            localStorage.setItem("theme", isDark ? "light-mode" : "dark-mode");
            toggleBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
        };
    }

    // --- Language dropdown: opens only on click, closes on outside click,
    // Escape, or picking a language. No hover/focus-within triggers. ---
    var langDropdown = document.querySelector(".lang-dropdown");
    var langBtn = langDropdown ? langDropdown.querySelector(".lang-dropbtn") : null;
    if (langDropdown && langBtn) {
        langBtn.setAttribute("aria-haspopup", "true");
        langBtn.setAttribute("aria-expanded", "false");

        var closeLangDropdown = function () {
            langDropdown.classList.remove("open");
            langBtn.setAttribute("aria-expanded", "false");
        };

        langBtn.addEventListener("click", function (event) {
            event.stopPropagation();
            var isOpen = langDropdown.classList.toggle("open");
            langBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        document.addEventListener("click", function (event) {
            if (!langDropdown.contains(event.target)) closeLangDropdown();
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeLangDropdown();
        });

        langDropdown.querySelectorAll(".lang-dropdown-content a").forEach(function (link) {
            link.addEventListener("click", closeLangDropdown);
        });
    }

    // --- Sticky header shadow once the page scrolls ---
    var header = document.querySelector("header");
    if (header) {
        var setScrolled = function () {
            header.classList.toggle("is-scrolled", window.scrollY > 4);
        };
        setScrolled();
        window.addEventListener("scroll", setScrolled, { passive: true });

        var setHeaderHeight = function () {
            document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
        };
        setHeaderHeight();
        window.addEventListener("resize", setHeaderHeight);
    }

    // --- Highlight the nav link for the current page ---
    var navLinks = document.querySelectorAll("nav a[href]");
    navLinks.forEach(function (link) {
        var linkPath = link.getAttribute("href").replace(/\/$/, "");
        var currentPath = window.location.pathname.replace(/\/$/, "");
        if (linkPath && currentPath === linkPath) {
            link.classList.add("active");
        }
    });

    // --- Reveal static cards present at load (contact page) ---
    // Cards rendered dynamically by render.js call Reveal.watch() themselves
    // once they're injected.
    window.Reveal.watch(document.querySelectorAll(".contact-card"));
});
