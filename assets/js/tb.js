// Scroll-driven exploded view of a coin cell (ko/tb.html).
// The rig SVG (assets/images/tb/coin_cell_rig.svg) holds one <g> per part layer
// with its assembled (data-a) and exploded (data-e) vertical offsets, both in
// the coordinates of generate_coin_cell_svgs.py. Scroll progress through
// #coin-cell interpolates between them; the viewBox follows the stack so the
// view zooms out as the cell comes apart.
//
// Scenes: each later section (e.g. graphs) can be added to SCENES below as
// { el: <section>, update: function (progress 0..1) {} } and is driven by the
// same scroll loop.
//
// URL hash: every <section id> directly inside <main> becomes the URL hash
// (e.g. #coin-cell, #electrochemistry-rt) while it fills the screen.
(function () {
    var RIG_URL = "/assets/images/tb/coin_cell_rig.svg";
    var MOBILE = 760;   // px; below this labels all sit on the right

    // Top-to-bottom order, matching ORDER in the generator.
    var LABELS = {
        upper_cell_can:          ["상부 셀 캔", "Upper cell can"],
        wave_washer:             ["스프링", "Spring"],
        spacer_disk:             ["스페이서", "Spacer"],
        lithium_metal_electrode: ["리튬 금속 전극", "Lithium metal electrode"],
        cell_gasket:             ["가스켓", "Cell gasket"],
        separator:               ["분리막", "Separator"],
        carbon_fiber_electrode:  ["양극", "Cathode"],
        lower_cell_can:          ["하부 셀 캔", "Lower cell can"]
    };

    var CAPTIONS = [
        [0.00, "조립된 코인 셀"],
        [0.12, "분해 중…"],
        [0.40, "코인 셀 구성 요소"]
    ];

    var SCENES = [];

    var root = document.documentElement;
    var stage = document.getElementById("tb-stage");
    var section = stage && stage.closest(".tb-scrolly");   // the #coin-cell section
    var hashSections = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));
    var currentHash = null;
    var leaders = document.getElementById("tb-leaders");
    var caption = document.getElementById("tb-caption");
    var header = document.querySelector("header");
    if (!section || !stage) return;

    var rig = null;
    var parts = [];     // one entry per component: { name, layers, a, e, y0, y1, r, label, line, dot }
    var maxR = 0;
    var ticking = false;
    var SVGNS = "http://www.w3.org/2000/svg";

    function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
    function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function range(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }

    function setHeaderVar() {
        if (header) root.style.setProperty("--tb-header", header.offsetHeight + "px");
    }

    function sectionProgress(el, pinned) {
        // 0 when the section's top reaches the bottom of the sticky header,
        // 1 when its bottom reaches the bottom of the screen (a pinned stage stops)
        var rect = el.getBoundingClientRect();
        var headerH = header ? header.offsetHeight : 0;
        var viewH = pinned ? pinned.offsetHeight : window.innerHeight - headerH;
        var travel = el.offsetHeight - viewH;
        return travel > 0 ? clamp((headerH - rect.top) / travel, 0, 1) : 0;
    }

    function build(svgText) {
        stage.insertAdjacentHTML("afterbegin", svgText);
        rig = stage.querySelector("#coin-cell-rig");

        var byName = {};
        rig.querySelectorAll("g[data-part]").forEach(function (g) {
            var name = g.getAttribute("data-part");
            if (!byName[name]) {
                byName[name] = {
                    name: name,
                    layers: [],
                    a: +g.getAttribute("data-a"),
                    e: +g.getAttribute("data-e"),
                    y0: +g.getAttribute("data-y0"),
                    y1: +g.getAttribute("data-y1"),
                    r: +g.getAttribute("data-r")
                };
                parts.push(byName[name]);
            }
            byName[name].layers.push(g);

            // Inner wrapper takes the hover scale (CSS) so it never fights the
            // scroll-driven translate on the outer group
            var inner = document.createElementNS(SVGNS, "g");
            inner.setAttribute("class", "tb-part-inner");
            while (g.firstChild) inner.appendChild(g.firstChild);
            g.appendChild(inner);
            var cy = (+g.getAttribute("data-y0") + +g.getAttribute("data-y1")) / 2;
            inner.style.setProperty("--cy", cy.toFixed(2) + "px");
        });
        parts.sort(function (p, q) { return p.e - q.e; });   // top part first

        parts.forEach(function (p, i) {
            maxR = Math.max(maxR, p.r);
            var text = LABELS[p.name] || [p.name, ""];
            var label = document.createElement("div");
            label.className = "tb-label";
            label.innerHTML = '<span class="tb-num">' + (i + 1) + '</span><span class="tb-name"></span><span class="tb-en"></span>';
            label.querySelector(".tb-name").textContent = text[0];
            label.querySelector(".tb-en").textContent = text[1];
            stage.appendChild(label);
            p.label = label;
            p.line = document.createElementNS(SVGNS, "line");
            p.dot = document.createElementNS(SVGNS, "circle");
            p.dot.setAttribute("r", "3");
            leaders.appendChild(p.line);
            leaders.appendChild(p.dot);

            // Hovering a part or its label enlarges the part (only once it is labelled)
            p.layers.concat([label]).forEach(function (el) {
                el.addEventListener("pointerenter", function () { setHover(p, true); });
                el.addEventListener("pointerleave", function () { setHover(p, false); });
            });
        });

        update();
    }

    function setHover(p, hover) {
        hover = hover && p.on;
        p.layers.forEach(function (g) { g.classList.toggle("is-hover", hover); });
        p.label.classList.toggle("is-hover", hover);
    }

    function updateHash() {
        // The section under a point a third of the way down the visible area wins
        var probe = (header ? header.offsetHeight : 0) + window.innerHeight * 0.3;
        var id = "";
        hashSections.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.top <= probe && rect.bottom > probe) id = el.id;
        });
        if (id === currentHash) return;
        currentHash = id;
        var url = location.pathname + location.search + (id ? "#" + id : "");
        history.replaceState(history.state, "", url);
    }

    function updateExplode(prog) {
        var W = stage.clientWidth, H = stage.clientHeight;
        var mobile = W < MOBILE;
        var e = easeInOut(range(prog, 0.08, 0.62));

        // Current offsets and the stack's vertical extent
        var top = Infinity, bottom = -Infinity;
        parts.forEach(function (p) {
            p.t = p.a + (p.e - p.a) * e;
            top = Math.min(top, p.t + p.y0);
            bottom = Math.max(bottom, p.t + p.y1);
        });
        var padTop = mobile ? 16 : 28;
        var padBottom = caption ? caption.offsetHeight + (mobile ? 24 : 36) : padTop;   // keep clear of the caption
        var bboxH = bottom - top;
        var cellW = 2 * maxR;
        var maxCellPx = mobile ? W * 0.5 : Math.min(W * 0.4, 440);
        var s = Math.min((H - padTop - padBottom) / bboxH, maxCellPx / cellW);
        // Cell centre in px: centred on desktop, pushed left on phones to leave room for labels
        var cx = mobile ? Math.max(12 + maxR * s, W * 0.3) : W / 2;
        var offY = padTop + (H - padTop - padBottom - bboxH * s) / 2;

        rig.setAttribute("viewBox", [(-cx / s), (top - offY / s), (W / s), (H / s)].map(function (v) { return v.toFixed(2); }).join(" "));
        leaders.setAttribute("viewBox", "0 0 " + W + " " + H);
        parts.forEach(function (p) {
            var tr = "translate(0," + p.t.toFixed(2) + ")";
            p.layers.forEach(function (g) { g.setAttribute("transform", tr); });
        });

        // Labels appear one after another, top part first, once the parts have separated
        parts.forEach(function (p, i) {
            var on = prog > 0.40 + i * 0.035;
            var left = !mobile && i % 2 === 1;
            var ay = offY + (p.t + (p.y0 + p.y1) / 2 - top) * s;
            var ax = cx + (left ? -p.r : p.r) * s;
            var gap = mobile ? 14 : 48;
            var lx = left ? ax - gap : ax + gap;

            p.line.setAttribute("x1", (ax + (left ? -4 : 4)).toFixed(1));
            p.line.setAttribute("y1", ay.toFixed(1));
            p.line.setAttribute("x2", lx.toFixed(1));
            p.line.setAttribute("y2", ay.toFixed(1));
            p.dot.setAttribute("cx", (ax + (left ? -4 : 4)).toFixed(1));
            p.dot.setAttribute("cy", ay.toFixed(1));

            var el = p.label;
            el.classList.toggle("side-left", left);
            el.style.maxWidth = (left ? lx - 8 : W - lx - 8) + "px";
            var w = el.offsetWidth, h = el.offsetHeight;
            var x = left ? lx - w : lx;
            el.style.transform = "translate(" + x.toFixed(1) + "px," + (ay - h / 2).toFixed(1) + "px)";
            if (p.on && !on) setHover(p, false);
            p.on = on;
            el.classList.toggle("is-on", on);
            p.line.classList.toggle("is-on", on);
            p.dot.classList.toggle("is-on", on);
        });

        if (caption) {
            var text = CAPTIONS[0][1];
            CAPTIONS.forEach(function (c) { if (prog >= c[0]) text = c[1]; });
            if (caption.textContent !== text) caption.textContent = text;
        }
    }

    function update() {
        ticking = false;
        if (rig) updateExplode(sectionProgress(section, stage));
        updateHash();
        SCENES.forEach(function (sc) { sc.update(sectionProgress(sc.el)); });
    }

    function requestUpdate() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }

    setHeaderVar();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", function () { setHeaderVar(); requestUpdate(); });

    fetch(RIG_URL)
        .then(function (res) {
            if (!res.ok) throw new Error(res.status);
            return res.text();
        })
        .then(build)
        .catch(function () {
            // e.g. opened from file:// (fetch needs a web server)
            stage.insertAdjacentHTML("afterbegin", '<p class="tb-fallback">애니메이션을 불러오지 못했습니다.</p>');
        });
})();
