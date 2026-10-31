/* main.js — Larisa Burgan / Designed Realty static site.
   Classic script (no modules) so it runs under file://.
   Navigation, mobile toggle, active-section indication, and image-error
   fallbacks for the statically authored images. */

/* ===========================================================================
   Shared image-error helper + smooth-scroll navigation
   ---------------------------------------------------------------------------
   Top-level declarations (classic script, no modules) so the DOMContentLoaded
   bootstrap can call initNavigation() and wire handleImageError onto the
   statically authored images. Nothing is invoked on load here.
   Requirements: 1.5, 1.7, 2.3, 8.2, 8.3, 10.2
   =========================================================================== */

/* handleImageError(img) — the shared image onerror handler.

   Robust whether invoked as an event handler (`img.onerror = handleImageError`
   / addEventListener) or called directly (`handleImageError(img)`).

   Logo / headshot / footer logos (no fallback image): HIDE the broken image
   (`display: none`) so the descriptive alt text represents it and the
   surrounding content (name, business, headline, CTA, etc.) stays intact
   (Req 1.7, 2.3). The handler detaches itself so it cannot loop. */
function handleImageError(eventOrImg) {
  // Resolve the <img> whether called as an event handler or directly.
  var img;
  if (eventOrImg && eventOrImg.tagName === "IMG") {
    img = eventOrImg;                       // called directly with the element
  } else if (eventOrImg && eventOrImg.target) {
    img = eventOrImg.target;                // called as an event handler
  } else if (this && this.tagName === "IMG") {
    img = this;                             // called via onerror = handleImageError
  }
  if (!img) {
    return;
  }

  // Hide the broken image; alt text remains (Req 1.7, 2.3).
  img.style.display = "none";

  // Detach so this handler cannot fire again for this element (no loop).
  img.onerror = null;
  img.removeEventListener("error", handleImageError);
}

/* initNavigation() — single delegated smooth-scroll handler (Req 1.5, 8.2, 8.3).

   Attaches ONE `click` listener on the document that intercepts clicks on any
   in-page anchor `a[href^="#"]` (the nav links and the hero CTA).

   - Resolves the target id from the anchor's href (the part after '#').
   - A bare "#" (empty target) is ignored gracefully.
   - If the target element does NOT exist: preventDefault() and do nothing, so
     the viewport is left unchanged (Req 8.3).
   - If it exists: preventDefault() and scrollIntoView({ behavior, block:'start' }),
     using 'auto' when the user prefers reduced motion and 'smooth' otherwise. */
function initNavigation() {
  document.addEventListener("click", function (event) {
    // Find the nearest ancestor anchor of the click target.
    var anchor = event.target ? event.target.closest("a[href^='#']") : null;
    if (!anchor) {
      return;
    }

    var href = anchor.getAttribute("href") || "";
    var targetId = href.slice(href.indexOf("#") + 1);

    // Ignore a bare "#" (empty target) gracefully.
    if (targetId === "") {
      return;
    }

    var target = document.getElementById(targetId);

    // Missing target → prevent default and leave the viewport unchanged (Req 8.3).
    if (!target) {
      event.preventDefault();
      return;
    }

    // Existing target → smooth (or reduced-motion instant) scroll (Req 1.5, 8.2).
    event.preventDefault();

    var prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  });
}


/* ===========================================================================
   Mobile nav toggle + active-section indication
   ---------------------------------------------------------------------------
   Requirements: 8.4, 8.5, 10.3
   =========================================================================== */

/* initMobileNav() — wires the mobile menu toggle (Req 8.4, 10.3).

   The open/closed state is driven purely by CSS off a single hook: the class
   `is-open` on `#primary-nav`. JS only needs to toggle that class and keep the
   toggle button's `aria-expanded` in sync ("true" when open, "false" when
   closed).

   Behavior:
   - Missing `.nav-toggle` or `#primary-nav` → return safely (no-op).
   - Clicking the toggle flips `is-open` on `#primary-nav` and syncs
     `aria-expanded` on the button (Req 8.4, 10.3).
   - Selecting a nav link inside `#primary-nav` collapses the menu. */
function initMobileNav() {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  // If either the button or the nav region is missing, do nothing.
  if (!toggle || !nav) {
    return;
  }

  // Reflect the current open state onto the button's aria-expanded.
  var syncExpanded = function () {
    toggle.setAttribute("aria-expanded", nav.classList.contains("is-open") ? "true" : "false");
  };

  // Collapse the menu (used on link select).
  var closeMenu = function () {
    if (nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      syncExpanded();
    }
  };

  // Toggle open/closed on button click and keep aria-expanded in sync.
  toggle.addEventListener("click", function () {
    nav.classList.toggle("is-open");
    syncExpanded();
  });

  // Selecting any nav link collapses the mobile menu (Req 8.4).
  nav.addEventListener("click", function (event) {
    var link = event.target ? event.target.closest("a") : null;
    if (link && nav.contains(link)) {
      closeMenu();
    }
  });
}

/* initActiveSection() — active-section indication via IntersectionObserver
   (Req 8.5).

   Watches the sections that have a matching nav link (#about, #services,
   #contact) and marks the corresponding `#primary-nav .nav-list a` link with
   `.is-active` for the section currently in view, removing it from the others
   so EXACTLY ONE link is active at a time.

   - Feature-detects IntersectionObserver; if unavailable, no-ops gracefully.
   - Builds a map from section id → nav link, then observes each section.
   - On each intersection change, picks the entry that is intersecting and most
     prominently in view (largest intersectionRatio) as the "current" section. */
function initActiveSection() {
  // Feature-detect: no-op gracefully where IntersectionObserver is unavailable.
  if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
    return;
  }

  var nav = document.getElementById("primary-nav");
  if (!nav) {
    return;
  }

  var links = nav.querySelectorAll(".nav-list a[href^='#']");
  if (!links.length) {
    return;
  }

  // Map: section id -> nav link, and collect the observed section elements.
  var linkById = {};
  var sections = [];
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var href = link.getAttribute("href") || "";
    var id = href.slice(href.indexOf("#") + 1);
    if (id === "") {
      continue;
    }
    var section = document.getElementById(id);
    if (section) {
      linkById[id] = link;
      sections.push(section);
    }
  }

  if (!sections.length) {
    return;
  }

  // Track the latest intersection ratio per observed section id.
  var ratios = {};

  var setActive = function (activeId) {
    for (var id in linkById) {
      if (Object.prototype.hasOwnProperty.call(linkById, id)) {
        if (id === activeId) {
          linkById[id].classList.add("is-active");
        } else {
          linkById[id].classList.remove("is-active");
        }
      }
    }
  };

  var observer = new IntersectionObserver(function (entries) {
    // Update the recorded ratios for the sections that changed.
    for (var e = 0; e < entries.length; e++) {
      var entry = entries[e];
      var entryId = entry.target.id;
      ratios[entryId] = entry.isIntersecting ? entry.intersectionRatio : 0;
    }

    // Pick the most prominently visible section as the current one so exactly
    // one link is active at a time (Req 8.5).
    var bestId = null;
    var bestRatio = 0;
    for (var id in ratios) {
      if (Object.prototype.hasOwnProperty.call(ratios, id)) {
        if (ratios[id] > bestRatio) {
          bestRatio = ratios[id];
          bestId = id;
        }
      }
    }

    // Only update when something is actually in view; otherwise keep the last
    // active link (avoids clearing all links between sections).
    if (bestId) {
      setActive(bestId);
    }
  }, {
    // Bias the observation band toward the upper-middle of the viewport so the
    // section the reader is looking at counts as "current", and use graduated
    // thresholds so partial visibility still reports a usable ratio.
    root: null,
    rootMargin: "-40% 0px -50% 0px",
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
  });

  for (var s = 0; s < sections.length; s++) {
    observer.observe(sections[s]);
  }
}


/* ===========================================================================
   Single init / DOMContentLoaded bootstrap
   ---------------------------------------------------------------------------
   Wires every behavior together from ONE entry point so no code is orphaned
   (classic script, no modules; file://-safe). The <script defer> tag runs
   after HTML parsing in browsers, but we still guard on document.readyState so
   init() works whether the script executes before or after DOMContentLoaded.
   Requirements: 8.1, 11.2, 11.4
   =========================================================================== */

/* init() — the single bootstrap.
   1. Wires the statically authored images (logo/headshot/footer logos) to the
      shared handleImageError → hide-on-error, revealing the descriptive alt
      text (Req 1.7, 2.3).
   2. Initializes navigation, the mobile nav toggle, and active-section
      indication. */
function init() {
  // 1. Wire the STATIC images to hide-on-error via the shared helper. These
  //    also carry an inline onerror="this.style.display='none'" as a first line
  //    of defense; wiring handleImageError here is the canonical behavior and
  //    is idempotent/harmless (the helper detaches itself, so no error loop).
  var staticImages = document.querySelectorAll(
    ".brand-logo, .hero-logo, .headshot, .footer-logo"
  );
  for (var i = 0; i < staticImages.length; i++) {
    staticImages[i].addEventListener("error", function () {
      handleImageError(this);
    });
  }

  // 2. Initialize the interactive behaviors (Req 8.1–8.5).
  initNavigation();
  initMobileNav();
  initActiveSection();
}

/* Run init() once the DOM is ready. With <script defer> the document is
   normally already parsed, but the readyState guard makes this correct whether
   the script runs before or after DOMContentLoaded. */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
