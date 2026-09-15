/* main.js — Larisa Burgan / Designed Realty static site.
   Classic script (no modules) so it runs under file://.
   Listings rendering, navigation, mobile toggle, active-section indication,
   and image-error fallbacks are implemented in later tasks. */

/* ===========================================================================
   Task 7.2 — Featured Listings data + rendering
   ---------------------------------------------------------------------------
   Top-level declarations (classic script, no modules) so the DOMContentLoaded
   bootstrap in Task 12.3 can call renderListings(...). Nothing is invoked on
   load here.
   Requirements: 3.1, 3.2, 3.5, 3.6
   Design: Components and Interfaces (renderListings, formatPrice); Data Models
   =========================================================================== */

/* Local fallback image that always resolves under file:// (Req 3.5, 10.2). */
var PLACEHOLDER_PROPERTY_IMAGE = "images/placeholder-property.svg";

/* Documented listing data structure — the single source of truth for listing
   content (Design → Data Models → Listing).
   Each object: { photo, price, beds, baths, address }
     photo   : string  relative image path (or "" to force the SVG fallback)
     price   : number  USD, 10000.00 – 99999999.00; formatted for display
     beds    : number  whole number 0–20
     baths   : number  0–20 in 0.5 increments
     address : string  single-line street address, up to 120 chars
   All entries are Placeholder_Content, so each card carries a "Sample" badge. */
var SAMPLE_LISTINGS = [
  { photo: "images/placeholder-property.svg", price: 1250000, beds: 3, baths: 2.5, address: "123 Example Ave, Kirkland, WA 98033" },
  { photo: "images/placeholder-property.svg", price: 875000,  beds: 2, baths: 2,   address: "456 Sample St, Bellevue, WA 98004" },
  { photo: "images/placeholder-property.svg", price: 2100000, beds: 4, baths: 3.5, address: "789 Demo Ln, Redmond, WA 98052" }
];

/* formatPrice(value) — pure function (Req 3.2, 3.6).
   Returns a USD-formatted string for a valid finite number; returns exactly
   "Price on request" for missing / non-numeric / NaN / non-finite values. */
function formatPrice(value) {
  if (typeof value !== "number" || !isFinite(value)) {
    return "Price on request";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

/* isMissing(value) — treats null, undefined, and empty/whitespace-only strings
   as missing so per-field placeholders kick in (Req 3.6). */
function isMissingValue(value) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string" && value.trim() === "") {
    return true;
  }
  return false;
}

/* clampAlt(text, max) — keep generated alt text within the accessible length
   bound (Req 10.1: 1–125 chars). If text is longer than max, truncate and end
   with a single-character ellipsis so the result stays <= max and non-empty. */
function clampAlt(text, max) {
  var s = String(text);
  if (s.length <= max) {
    return s;
  }
  return s.slice(0, max - 1) + "\u2026"; // trailing ellipsis, total length === max
}

/* renderListings(container, listings) — builds property cards (Req 3.1, 3.2, 3.5, 3.6).
   - Guards against a null container.
   - Defaults to SAMPLE_LISTINGS when no array is supplied.
   - Renders between 3 and 6 cards; clamps to the first 6 when there are more (Req 3.1).
   - Applies per-field placeholders and always renders the remaining fields (Req 3.6).
   - Adds a per-card "Sample" badge because all data is Placeholder_Content (Req 3.4).
   - Wires an image-load fallback on each photo (Req 3.5). Task 12.1 provides the
     shared handleImageError helper and Task 12.3 wires the full bootstrap; the
     minimal inline listener below swaps to the placeholder SVG and detaches
     itself (via { once: true }) to avoid an error loop until then.
   Uses safe DOM construction (createElement/textContent) rather than innerHTML
   with interpolated data. */
function renderListings(container, listings) {
  if (!container) {
    return;
  }

  var data = Array.isArray(listings) ? listings : SAMPLE_LISTINGS;

  // Clamp to a maximum of 6 cards (Req 3.1).
  if (data.length > 6) {
    data = data.slice(0, 6);
  }

  // Clear the container before (re)rendering.
  container.textContent = "";

  for (var i = 0; i < data.length; i++) {
    var listing = data[i] || {};

    var card = document.createElement("article");
    card.className = "property-card";

    // --- Media (photo) with error fallback ---
    var media = document.createElement("div");
    media.className = "card-media";

    var img = document.createElement("img");
    img.className = "card-photo";
    var hasAddress = !isMissingValue(listing.address);
    var photoSrc = isMissingValue(listing.photo) ? PLACEHOLDER_PROPERTY_IMAGE : listing.photo;
    img.src = photoSrc;
    // Alt text (Req 10.1): descriptive, non-empty, and clamped to <=125 chars.
    // An address may be up to 120 chars (Data Models → Listing), which with the
    // "Sample listing at " prefix (18 chars) could reach 138 chars and breach the
    // 125-char limit — so cap the composed alt at 125, ending with an ellipsis.
    img.alt = hasAddress
      ? clampAlt("Sample listing at " + listing.address, 125)
      : "Sample property listing photo";

    // Minimal inline fallback until Task 12.1's shared handleImageError exists:
    // on load error, swap to the local placeholder SVG. { once: true } detaches
    // the listener so a second failure cannot loop.
    img.addEventListener("error", function () {
      if (this.src.indexOf(PLACEHOLDER_PROPERTY_IMAGE) === -1) {
        this.src = PLACEHOLDER_PROPERTY_IMAGE;
      }
    }, { once: true });

    media.appendChild(img);
    card.appendChild(media);

    // --- Per-card "Sample" badge (Req 3.4) ---
    var badge = document.createElement("span");
    badge.className = "card-sample-badge";
    badge.textContent = "Sample";
    card.appendChild(badge);

    // --- Price (Req 3.2, 3.6) ---
    var price = document.createElement("p");
    price.className = "card-price";
    price.textContent = formatPrice(listing.price);
    card.appendChild(price);

    // --- Specs: beds / baths (Req 3.6) ---
    var bedsText = isMissingValue(listing.beds) ? "— bd" : listing.beds + " bd";
    var bathsText = isMissingValue(listing.baths) ? "— ba" : listing.baths + " ba";
    var specs = document.createElement("p");
    specs.className = "card-specs";
    specs.textContent = bedsText + " · " + bathsText;
    card.appendChild(specs);

    // --- Address (Req 3.6) ---
    var address = document.createElement("p");
    address.className = "card-address";
    address.textContent = hasAddress ? listing.address : "Address available on request";
    card.appendChild(address);

    container.appendChild(card);
  }
}


/* ===========================================================================
   Task 12.1 — Shared image-error helper + smooth-scroll navigation
   ---------------------------------------------------------------------------
   Top-level declarations (classic script, no modules) so the DOMContentLoaded
   bootstrap in Task 12.3 can call initNavigation() and wire handleImageError
   onto the statically authored images. Nothing is invoked on load here.
   Requirements: 1.5, 1.7, 2.3, 3.5, 8.2, 8.3, 10.2
   Design: Interaction / JavaScript Behavior; Components and Interfaces
           (handleImageError, initNavigation)
   =========================================================================== */

/* handleImageError(img, fallbackSrc) — the shared image onerror handler.

   Robust whether invoked as an event handler (`img.onerror = handleImageError`
   / addEventListener) or called directly (`handleImageError(img, src)`).

   Two behaviors, selected by whether a meaningful fallbackSrc is supplied:

   - Logo / headshot (no fallback image): when fallbackSrc is missing
     (undefined / null / empty / whitespace), HIDE the broken image
     (`display: none`) so the descriptive alt text represents it and the
     surrounding content (name, business, headline, CTA, etc.) stays intact
     (Req 1.7, 2.3).

   - Property photos (fallbackSrc provided, e.g. PLACEHOLDER_PROPERTY_IMAGE):
     swap `img.src` to the fallback, then DETACH the handler so a second
     failure (e.g. the fallback itself missing) cannot loop (Req 3.5, 10.2).
     Guarded so it never re-swaps when the fallback is already showing. */
function handleImageError(eventOrImg, fallbackSrc) {
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

  // Detach so this handler cannot fire again for this element (no loop).
  var detach = function () {
    img.onerror = null;
    img.removeEventListener("error", handleImageError);
  };

  var hasFallback =
    typeof fallbackSrc === "string" && fallbackSrc.trim() !== "";

  if (!hasFallback) {
    // Logo / headshot style: hide the broken image; alt text remains (Req 1.7, 2.3).
    img.style.display = "none";
    detach();
    return;
  }

  // Property photo style: swap to the fallback once, then detach (Req 3.5, 10.2).
  // Guard against re-swapping when the fallback is already the current source.
  if (img.src.indexOf(fallbackSrc) === -1) {
    img.src = fallbackSrc;
  }
  detach();
}

/* initNavigation() — single delegated smooth-scroll handler (Req 1.5, 8.2, 8.3).

   Attaches ONE `click` listener on the document that intercepts clicks on any
   in-page anchor `a[href^="#"]` (the five nav links and the hero CTA).

   - Resolves the target id from the anchor's href (the part after '#').
   - A bare "#" (empty target) is ignored gracefully — no preventDefault beyond
     the missing-target no-op below, no scroll.
   - If the target element does NOT exist: preventDefault() and do nothing, so
     the viewport is left unchanged (Req 8.3).
   - If it exists: preventDefault() and scrollIntoView({ behavior, block:'start' }),
     using 'auto' when the user prefers reduced motion and 'smooth' otherwise.
     CSS `section[id] { scroll-margin-top: 64px }` keeps top alignment within
     ~5px (Req 8.2); native smooth scroll completes within ~1000ms for in-page
     distances (Req 1.5, 8.2).

   Active-section highlighting is intentionally NOT handled here — that is
   Task 12.2's initActiveSection(). */
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
   Task 12.2 — Mobile nav toggle + active-section indication
   ---------------------------------------------------------------------------
   Top-level declarations (classic script, no modules) so the DOMContentLoaded
   bootstrap in Task 12.3 can call initMobileNav() and initActiveSection().
   Nothing is invoked on load here.
   Requirements: 8.4, 8.5, 10.3
   Design: Interaction / JavaScript Behavior; Components and Interfaces
           (initMobileNav, initActiveSection)
   =========================================================================== */

/* initMobileNav() — wires the mobile menu toggle (Req 8.4, 10.3).

   The open/closed state is driven purely by CSS off a single hook: the class
   `is-open` on `#primary-nav`. Task 4.2 CSS reveals the mobile menu via
   `#primary-nav.is-open .nav-list`, so JS only needs to toggle that class and
   keep the toggle button's `aria-expanded` in sync ("true" when open, "false"
   when closed). Above the 768px breakpoint the `.nav-list` is always shown by
   CSS regardless of this class, so the toggle is effectively inert there.

   Behavior:
   - Missing `.nav-toggle` or `#primary-nav` → return safely (no-op).
   - Clicking the toggle flips `is-open` on `#primary-nav` and syncs
     `aria-expanded` on the button (Req 8.4, 10.3).
   - Selecting a nav link inside `#primary-nav` collapses the menu (removes
     `is-open`, sets `aria-expanded="false"`) so choosing a destination closes
     the mobile menu. */
function initMobileNav() {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  // If either the button or the nav region is missing, do nothing (Req: guard).
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

   Watches the sections that have a matching nav link (#about, #listings,
   #services, #testimonials, #contact) and marks the corresponding
   `#primary-nav .nav-list a` link with `.is-active` for the section currently
   in view, removing it from the others so EXACTLY ONE link is active at a time.

   - Feature-detects IntersectionObserver; if unavailable, no-ops gracefully so
     the page still works (and works under file:// where it is supported).
   - Builds a map from section id → nav link, then observes each section.
   - On each intersection change, picks the entry that is intersecting and most
     prominently in view (largest intersectionRatio) as the "current" section.
   - A rootMargin biased toward the upper portion of the viewport makes the
     section whose top has scrolled into the reading area count as current. */
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
   Task 12.3 — Single init / DOMContentLoaded bootstrap
   ---------------------------------------------------------------------------
   Wires every prior behavior together from ONE entry point so no code is
   orphaned (classic script, no modules; file://-safe). The <script defer>
   tag runs after HTML parsing in browsers, but we still guard on
   document.readyState so init() works whether the script executes before or
   after DOMContentLoaded.
   Requirements: 8.1, 11.2, 11.4
   Design: Components and Interfaces (single init / DOMContentLoaded bootstrap)
   =========================================================================== */

/* init() — the single bootstrap.
   1. (Re)renders the featured listings into the .listings-grid container.
   2. Wires the statically authored images (logo/headshot/footer logos) to the
      shared handleImageError with NO fallbackSrc → hide-on-error, revealing the
      descriptive alt text (Req 1.7, 2.3). Property photos (.card-photo) are
      intentionally excluded here: renderListings already gives them the
      placeholder-SVG swap, and hiding them would be the wrong behavior.
   3. Initializes navigation, the mobile nav toggle, and active-section
      indication. */
function init() {
  // 1. Render the featured listings (renderListings guards a null container).
  renderListings(document.querySelector(".listings-grid"), SAMPLE_LISTINGS);

  // 2. Wire the STATIC images to hide-on-error via the shared helper.
  //    These also carry an inline onerror="this.style.display='none'" as a
  //    first line of defense; wiring handleImageError here is the canonical
  //    behavior and is idempotent/harmless (the helper detaches itself, so no
  //    error loop). .card-photo is deliberately NOT included — those get the
  //    placeholder swap from renderListings.
  var staticImages = document.querySelectorAll(
    ".brand-logo, .hero-logo, .headshot, .footer-logo"
  );
  for (var i = 0; i < staticImages.length; i++) {
    staticImages[i].addEventListener("error", function () {
      // No fallbackSrc → handleImageError hides the broken image (Req 1.7, 2.3).
      handleImageError(this);
    });
  }

  // 3. Initialize the interactive behaviors (Req 8.1–8.5).
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
