/* ============================================================
   OWASP API SECURITY TOP 10 VISUALISED — Interactive Script
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Disclosure Banner ---
  window.dismissBanner = () => {
    const banner = document.getElementById('disclosureBanner');
    banner.classList.add('dismissed');
    localStorage.setItem('owasp-api-disclosure-dismissed', 'true');
  };

  if (localStorage.getItem('owasp-api-disclosure-dismissed') === 'true') {
    document.getElementById('disclosureBanner').classList.add('dismissed');
  }

  // --- Theme Toggle (auto / light / dark) ---
  (function initThemeToggle() {
    const STORAGE_KEY = 'owasp-api-theme';
    const toggle = document.getElementById('themeToggle');
    const icon = toggle.querySelector('.theme-toggle-icon');
    const ICON_IDS = { auto: 'icon-desktop', light: 'icon-sun', dark: 'icon-moon' };
    const NEXT = { auto: 'light', light: 'dark', dark: 'auto' };
    const LABELS = {
      auto: 'Theme: Auto (matches system). Activate to switch to light theme.',
      light: 'Theme: Light. Activate to switch to dark theme.',
      dark: 'Theme: Dark. Activate to switch to auto (matches system).'
    };

    function currentMode() {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'auto';
    }

    function applyMode(mode) {
      if (mode === 'auto') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem(STORAGE_KEY, mode);
      }
      icon.querySelector('use').setAttribute('href', `#${ICON_IDS[mode]}`);
      toggle.setAttribute('aria-label', LABELS[mode]);
      toggle.title = LABELS[mode];
    }

    applyMode(currentMode());

    toggle.addEventListener('click', () => {
      applyMode(NEXT[currentMode()]);
    });
  })();

  // --- Step Navigation ---
  const vulnSections = document.querySelectorAll('.vuln-section:not(.wip-section)');

  function setActiveTab(step, tab) {
    const viewName = tab.dataset.view;
    step.querySelectorAll('.view-tab').forEach(t => {
      const isActive = t === tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.tabIndex = isActive ? 0 : -1;
    });
    step.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.view === viewName);
    });
  }

  vulnSections.forEach(section => {
    const vulnId = section.id;
    const stepContainer = section.querySelector('.step-container');
    const steps = stepContainer.querySelectorAll('.step');
    const stepDots = section.querySelectorAll('.step-dot');
    const stepNav = section.querySelector('.step-nav');
    const prevBtn = stepNav.querySelector('.prev');
    const nextBtn = stepNav.querySelector('.next');
    const indicator = stepNav.querySelector('.step-indicator');
    const totalSteps = steps.length;
    let currentStep = 1;

    function goToStep(n) {
      if (n < 1 || n > totalSteps) return;
      currentStep = n;

      // Update steps
      steps.forEach(s => s.classList.remove('active'));
      steps[currentStep - 1].classList.add('active');

      // Update dots
      stepDots.forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i + 1 === currentStep) dot.classList.add('active');
        else if (i + 1 < currentStep) dot.classList.add('completed');
      });

      // Update nav
      prevBtn.disabled = currentStep === 1;
      nextBtn.disabled = currentStep === totalSteps;
      indicator.textContent = `Step ${currentStep} of ${totalSteps}`;

      // Reset view tabs to first active view in new step
      const activeStep = steps[currentStep - 1];
      const tabs = activeStep.querySelectorAll('.view-tab');
      if (tabs.length > 0) setActiveTab(activeStep, tabs[0]);
    }

    // Dot clicks
    stepDots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToStep(parseInt(dot.dataset.step));
      });
    });

    // Prev / Next buttons
    prevBtn.addEventListener('click', () => goToStep(currentStep - 1));
    nextBtn.addEventListener('click', () => goToStep(currentStep + 1));

    // Keyboard nav within section — ignore text-editing controls, which
    // handle their own arrow keys natively. Widgets with their own arrow-key
    // semantics (e.g. the tablist below) are responsible for calling
    // stopPropagation() themselves when they act, so this listener doesn't
    // need to know about them.
    section.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowRight') goToStep(currentStep + 1);
      if (e.key === 'ArrowLeft') goToStep(currentStep - 1);
    });
  });

  // --- View Tab Switching ---
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.view-tab');
    if (!tab) return;

    const step = tab.closest('.step');
    setActiveTab(step, tab);
  });

  // Roving-tabindex arrow-key navigation within a tablist (ARIA APG pattern).
  // Registered on the capture phase so it always runs before any bubble-phase
  // listener on an ancestor (e.g. each section's step-nav listener above),
  // regardless of DOM nesting — then stops propagation once it actually acts,
  // so that listener never sees a key this one already handled.
  document.addEventListener('keydown', (e) => {
    const currentTab = e.target.closest('.view-tab');
    if (!currentTab) return;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;

    const tabs = Array.from(currentTab.closest('.view-tabs').querySelectorAll('.view-tab'));
    const currentIndex = tabs.indexOf(currentTab);
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;

    e.preventDefault();
    e.stopPropagation();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.closest('.step'), nextTab);
    nextTab.focus();
  }, true);

  // --- Sticky Nav Scroll Offset ---
  // Exposes .vuln-nav's real rendered height as --nav-offset so scroll-margin-top
  // (styles.css, .vuln-section) can push scroll targets down by that much — honored
  // by both scrollIntoView() below and native #aNN anchor navigation.
  (function initNavOffset() {
    const navBar = document.querySelector('.vuln-nav');
    if (!navBar) return;
    const setNavOffset = () => {
      document.documentElement.style.setProperty('--nav-offset', `${navBar.getBoundingClientRect().height}px`);
    };
    setNavOffset();
    window.addEventListener('resize', setNavOffset);
  })();

  // --- Sticky Nav Active State ---
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.vuln-section');

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(item => {
          item.classList.toggle('active', item.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // --- Smooth Scroll for Nav ---
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(item.getAttribute('href'));
      if (target) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  // --- Scroll Focus Fade ---
  // Desktop-only visual aid: dims the hero/intro as the user scrolls past
  // them, dims the sticky nav until it's actually reached, and dims each
  // vuln-section the further its center sits from the viewport's center —
  // so whichever section dominates the viewport reads as the focal point.
  // Distances are computed in viewport pixels (not % of element height) so
  // it self-normalizes across sections of very different heights.
  (function initScrollFade() {
    const fadeFloor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll-fade-floor')) || 0.45;
    const heroEls = [document.querySelector('.site-header'), document.querySelector('.about-section')].filter(Boolean);
    const nav = document.querySelector('.vuln-nav');
    const fadeSections = Array.from(document.querySelectorAll('.vuln-section:not(.wip-section)'));
    const allEls = [...heroEls, nav, ...fadeSections].filter(Boolean);

    const mqDesktop = window.matchMedia('(min-width: 769px)');
    const mqReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let enabled = false;
    let ticking = false;

    function update() {
      ticking = false;
      if (!enabled) return;
      const viewportHeight = window.innerHeight;
      const fadeDistance = viewportHeight * 0.6;
      const viewportCenter = viewportHeight / 2;
      const crossfadeDistance = viewportHeight;

      // Batch every layout read (getBoundingClientRect) before any write
      // (style.opacity) — interleaving them forces a synchronous layout
      // recalc per element instead of once per frame.
      const groupBottom = heroEls.length
        ? Math.max(...heroEls.map(el => el.getBoundingClientRect().bottom))
        : null;
      const navTop = nav ? nav.getBoundingClientRect().top : null;
      const sectionRects = fadeSections.map(section => section.getBoundingClientRect());

      if (groupBottom !== null) {
        // Fade the header and about-section as one unit, keyed off whichever
        // sits lowest (normally .about-section) — otherwise the shorter
        // header would dim out before the section beneath it does.
        const progress = Math.min(Math.max(groupBottom / fadeDistance, 0), 1);
        const opacity = fadeFloor + (1 - fadeFloor) * progress;
        heroEls.forEach(el => { el.style.opacity = opacity; });
      }

      if (nav) {
        const progress = Math.min(Math.max(1 - navTop / fadeDistance, 0), 1);
        nav.style.opacity = fadeFloor + (1 - fadeFloor) * progress;
      }

      fadeSections.forEach((section, i) => {
        const rect = sectionRects[i];
        const sectionCenter = rect.top + rect.height / 2;
        const progress = Math.min(Math.abs(sectionCenter - viewportCenter) / crossfadeDistance, 1);
        section.style.opacity = 1 - (1 - fadeFloor) * progress;
      });
    }

    function onScrollOrResize() {
      if (!enabled || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    function enable() {
      if (enabled) return;
      enabled = true;
      allEls.forEach(el => el.classList.add('scroll-fade'));
      update();
      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize);
    }

    function disable() {
      if (!enabled) return;
      enabled = false;
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      allEls.forEach(el => {
        el.style.opacity = '';
        el.classList.remove('scroll-fade');
      });
    }

    function evaluate() {
      if (mqDesktop.matches && !mqReducedMotion.matches) enable();
      else disable();
    }

    mqDesktop.addEventListener('change', evaluate);
    mqReducedMotion.addEventListener('change', evaluate);
    evaluate();
  })();

  // --- Jargon Glossary ---
  // Each entry's `match` strings are matched case-insensitively, whole-word,
  // wherever they appear in prose (code/terminal blocks are left untouched
  // so simulated attack output still reads like real output).
  const GLOSSARY_TERMS = [
    { match: ['SSRF', 'Server-Side Request Forgery', 'Server Side Request Forgery'], text: 'Server-Side Request Forgery — tricking a server into making a request to a URL the attacker chooses, reaching internal-only services (like cloud metadata endpoints) that trust requests coming from the server itself.' },
    { match: ['BOLA', 'Broken Object Level Authorization'], text: "Broken Object Level Authorization — an endpoint takes a raw object ID (an order, a user, an invoice) from the request and serves or modifies that record without checking whether the requester actually owns or is allowed to touch it. The API world's name for what's classically called IDOR." },
    { match: ['IDOR', 'Insecure Direct Object Reference'], text: 'Insecure Direct Object Reference — the older, more general name for BOLA: an object is referenced directly by its ID with no access check behind it.' },
    { match: ['BFLA', 'Broken Function Level Authorization'], text: "Broken Function Level Authorization — a lower-privilege user can call an endpoint meant only for admins or a different role, because the check exists in the UI (which button is shown) but not in the API itself." },
    { match: ['BOPLA', 'Broken Object Property Level Authorization'], text: "Broken Object Property Level Authorization — a request can read fields it shouldn't see (excessive data exposure) or write fields it shouldn't be able to set, like a user field or an internal flag (mass assignment). One root cause, two directions." },
    { match: ['mass assignment', 'Mass Assignment'], text: "Mass Assignment — binding an entire incoming request body straight onto a database model or object, so any field the client includes — even ones the UI never exposes, like role or isAdmin — gets written." },
    { match: ['CORS', 'Cross-Origin Resource Sharing'], text: "Cross-Origin Resource Sharing — a browser mechanism controlling which other websites may read a site's API responses. A wildcard (*) combined with credentials lets any website read authenticated responses." },
    { match: ['CWE', 'CWEs', 'Common Weakness Enumeration'], text: "Common Weakness Enumeration — a community-maintained catalog of common software weakness types (e.g. 'improper input validation'), used to classify vulnerability categories." },
    { match: ['CVE', 'CVEs', 'Common Vulnerabilities and Exposures'], text: 'Common Vulnerabilities and Exposures — a public, uniquely-numbered catalog entry (e.g. CVE-2016-3714) for a specific known vulnerability, used to reference it unambiguously across tools and reports.' },
    { match: ['PII', 'Personally Identifiable Information'], text: 'Personally Identifiable Information — any data that can identify a specific person (name, SSN, email, etc.). Exposing it is what triggers most data-breach laws and fines.' },
    { match: ['WAF', 'Web Application Firewall'], text: "Web Application Firewall — a filter in front of an API that blocks known attack patterns in incoming traffic. It's a safety net, not a substitute for fixing the underlying vulnerability — Capital One's WAF was itself the entry point in 2019." },
    { match: ['GDPR', 'General Data Protection Regulation'], text: "General Data Protection Regulation — the EU's data-protection law, allowing fines of up to €20M or 4% of global revenue for mishandling personal data." },
    { match: ['MFA', 'Multi-Factor Authentication'], text: "Multi-Factor Authentication — requiring more than just a password to log in (e.g. a code from an app or a hardware key), so a leaked password alone isn't enough to break in." },
    { match: ['IAM', 'Identity and Access Management'], text: 'Identity and Access Management — the system of policies controlling who (or what service, or what API credential) is allowed to do what, used for permissions on cloud accounts and infrastructure.' },
    { match: ['JWT', 'JSON Web Token'], text: 'JSON Web Token — a signed, self-contained token format commonly used to represent a logged-in session or an API credential. If the server fails to verify its signature properly, an attacker can forge one.' },
    { match: ['OAuth'], text: 'An authorization framework letting a user grant a third-party app limited access to their account on another service, without handing over their password — the "Log in with Google/Facebook" flow.' },
    { match: ['API gateway', 'API Gateway'], text: 'A single front door that routes, authenticates and rate-limits requests to a collection of backend APIs — the natural place to enforce consistent security controls across all of them.' },
    { match: ['rate limiting', 'rate limit', 'rate-limited'], text: 'Capping how many requests a single client (by account, API key or IP) can make in a given time window, so no one client can exhaust shared resources or brute-force a value at machine speed.' },
    { match: ['SSN', 'Social Security Number'], text: "Social Security Number — a US government-issued personal ID number. Combined with a name and email, it's one of the most valuable pieces of data for identity theft." },
    { match: ['DTO', 'DTOs', 'Data Transfer Object'], text: 'Data Transfer Object — a small, purpose-built object carrying only the fields a client actually needs, instead of a raw database row that may include sensitive columns.' },
    { match: ['UUIDs', 'UUID', 'Universally Unique Identifiers', 'Universally Unique Identifier'], text: 'Universally Unique Identifier — a long, effectively unpredictable ID (e.g. f47ac10b-58cc...), used instead of sequential numbers (1, 2, 3...) so IDs can’t be easily guessed or enumerated.' },
    { match: ['GCP', 'Google Cloud Platform'], text: "Google Cloud Platform — Google's cloud computing platform, an alternative to AWS or Azure." },
    { match: ['Amazon S3', 'S3', 'Simple Storage Service'], text: "Amazon S3 (Simple Storage Service) — AWS's object storage service, commonly used for backups, file uploads and static hosting. Misconfigured buckets are a frequent source of public data leaks." },
    { match: ['Amazon Web Services', 'AWS'], text: 'Amazon Web Services — the cloud computing platform operated by Amazon, offering services like S3 (storage) and EC2 (compute), each reachable from a server\'s internal metadata endpoint.' },
    { match: ['CI/CD', 'Continuous Integration/Continuous Deployment'], text: "Continuous Integration/Continuous Deployment — the automated pipeline that builds, tests and ships code changes. Because it has broad access to source and secrets, it's a high-value attack target." },
    { match: ['DoS', 'Denial of Service'], text: 'Denial of Service — an attack (or bug) that makes a system unavailable to legitimate users, by overwhelming it with traffic, requests, or triggering a crash or resource exhaustion.' },
    { match: ['OWASP', 'Open Web Application Security Project'], text: 'Open Web Application Security Project — a nonprofit foundation publishing free, community-driven resources on application security, including the API Security Top 10 list this site is based on.' },
    { match: ['allowlist'], text: 'A list of explicitly permitted values (domains, IPs, hostnames) — everything not on the list is denied by default. The opposite of a blocklist, which tries to deny known-bad values instead.' },
    { match: ['egress proxy'], text: 'A controlled gateway that all outbound (server-to-internet) requests must pass through, so they can be inspected, logged and restricted — a key defense against SSRF.' },
    { match: ['DNS rebinding', 'anti-rebinding', 'rebinding'], text: "A technique where a domain's DNS record is changed after a security check passes, pointing it at an internal/private IP so a later request reaches an internal service unexpectedly." },
    { match: ['enumeration', 'enumerate'], text: 'Systematically trying many possible values (IDs, usernames, order numbers) against a target to see which ones exist or return data — often scripted, as with sequential ID enumeration.' },
    { match: ['brute-force'], text: 'Repeatedly guessing credentials (passwords, tokens, OTP codes) by trying many possibilities in sequence until one works, rather than exploiting a specific flaw.' },
    { match: ['credential stuffing'], text: "Trying username/password pairs leaked from one breach against a completely different site, betting that people reuse passwords. Works purely on scale — no exploit needed." },
    { match: ['OpenAPI', 'Swagger'], text: 'A machine-readable specification format (OpenAPI, formerly called Swagger) describing every endpoint, parameter and response an API exposes — useful for developers, and just as useful for an attacker if left publicly reachable.' },
    { match: ['shadow API', 'zombie API'], text: 'A shadow API is one that exists and runs in production without being tracked in the official inventory (often spun up for a quick integration). A zombie API is an old, supposedly-retired version still reachable and often missing later security fixes.' },
    { match: ['deserialization'], text: 'Converting stored or transmitted data back into a live object in memory. Doing this on untrusted input — including a response from a third-party API — can let an attacker construct objects that execute code.' },
    { match: ['reverse proxy'], text: "A server that sits in front of one or more backend servers and forwards client requests to them, often adding caching, load balancing or TLS termination along the way." },
    { match: ['software supply chain', 'supply chain'], text: 'The full chain of vendors, tools and dependencies that produced a piece of software before it reached you — compromising any link (a build server, a signing key, a vendor\'s own vendor) can compromise everything downstream.' },
    { match: ['schema validation', 'JSON Schema'], text: "Checking incoming (or, just as importantly, incoming-from-a-partner) data against a strict, predefined structure — expected fields, types, formats — before trusting or storing any of it." }
  ];

  (function initGlossary() {
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const patterns = [];
    const lookup = new Map();
    GLOSSARY_TERMS.forEach((entry, i) => {
      entry.match.forEach(m => {
        patterns.push(m);
        lookup.set(m.toLowerCase(), i);
      });
    });
    patterns.sort((a, b) => b.length - a.length);
    const combined = new RegExp('\\b(' + patterns.map(escapeRegex).join('|') + ')\\b', 'gi');

    // Skip navigation/chrome and anything inside real code/terminal output —
    // wrapping simulated attack code would break its illusion and risks
    // matching literal syntax (e.g. JSON field names) instead of prose.
    const skipTags = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'BUTTON', 'A']);
    const skipSelector = '.site-header, .disclosure-banner, .vuln-nav, .site-footer, ' +
      '.code-header, .mock-devtools, .mock-browser, .db-header, .code-badge-fixed, .pipeline-diagram, .dep-node';

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let el = node.parentElement;
        while (el) {
          if (skipTags.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          if (el.matches(skipSelector)) return NodeFilter.FILTER_REJECT;
          el = el.parentElement;
        }
        return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      combined.lastIndex = 0;

      // Collect raw matches first, then merge adjacent matches of the same
      // term (e.g. "Server-Side Request Forgery (SSRF)") into a single span
      // instead of two separate underlined spans back-to-back.
      const rawMatches = [];
      let match;
      while ((match = combined.exec(text))) {
        const termIndex = lookup.get(match[0].toLowerCase());
        if (termIndex === undefined) continue;
        rawMatches.push({ start: match.index, end: match.index + match[0].length, termIndex });
      }
      if (!rawMatches.length) return;

      const merged = [];
      rawMatches.forEach(m => {
        const prev = merged[merged.length - 1];
        if (prev && prev.termIndex === m.termIndex && /^[\s(),—-]{0,4}$/.test(text.slice(prev.end, m.start))) {
          prev.end = m.end;
        } else {
          merged.push({ ...m });
        }
      });

      // If merging swallowed an opening "(" from the connector (e.g. "JWT
      // (JSON Web Token)"), pull in the matching ")" immediately after too,
      // otherwise the span text ends up missing its closing paren.
      merged.forEach(m => {
        const span = text.slice(m.start, m.end);
        const openParens = (span.match(/\(/g) || []).length;
        const closeParens = (span.match(/\)/g) || []).length;
        if (openParens > closeParens && text[m.end] === ')') {
          m.end += 1;
        }
      });

      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      merged.forEach(m => {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, m.start)));
        const span = document.createElement('span');
        span.className = 'jargon';
        span.tabIndex = 0;
        span.setAttribute('role', 'button');
        span.setAttribute('aria-expanded', 'false');
        span.setAttribute('aria-controls', 'jargon-popover');
        span.dataset.term = m.termIndex;
        span.textContent = text.slice(m.start, m.end);
        frag.appendChild(span);
        lastIndex = m.end;
      });
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      textNode.parentNode.replaceChild(frag, textNode);
    });

    // --- Popover ---
    const popover = document.createElement('div');
    popover.id = 'jargon-popover';
    popover.className = 'jargon-popover';
    // role="group" (not "tooltip") because this contains a focusable close
    // button — ARIA forbids focusable descendants inside role="tooltip".
    popover.setAttribute('role', 'group');
    popover.setAttribute('aria-hidden', 'true');
    popover.tabIndex = -1;
    popover.innerHTML =
      '<button class="jargon-popover-close" aria-label="Close definition">✕</button>' +
      '<span class="jargon-popover-term"></span>' +
      '<span class="jargon-popover-text"></span>';
    document.body.appendChild(popover);
    const popoverTerm = popover.querySelector('.jargon-popover-term');
    const popoverText = popover.querySelector('.jargon-popover-text');
    const popoverClose = popover.querySelector('.jargon-popover-close');
    popoverClose.tabIndex = -1;
    popoverClose.addEventListener('click', hidePopover);

    let activeSpan = null;
    let hoverTimer = null;

    function showPopover(span, moveFocus) {
      const entry = GLOSSARY_TERMS[Number(span.dataset.term)];
      if (!entry) return;
      if (activeSpan) {
        activeSpan.classList.remove('jargon-active');
        activeSpan.setAttribute('aria-expanded', 'false');
      }
      activeSpan = span;
      span.classList.add('jargon-active');
      span.setAttribute('aria-expanded', 'true');
      popoverTerm.textContent = span.textContent;
      popoverText.textContent = entry.text;
      // aria-label carries the full definition so a screen reader announces
      // it as soon as focus lands on the popover, without depending on
      // browse-mode traversal of the (non-focusable) term/text spans.
      popover.setAttribute('aria-label', `${span.textContent}: ${entry.text}`);
      popover.setAttribute('aria-hidden', 'false');
      popoverClose.tabIndex = 0;
      popover.classList.add('visible');

      const rect = span.getBoundingClientRect();
      const popRect = popover.getBoundingClientRect();
      let top = rect.bottom + 10;
      let arrow = 'top';
      if (top + popRect.height > window.innerHeight - 12) {
        top = rect.top - popRect.height - 10;
        arrow = 'bottom';
      }
      let left = rect.left + rect.width / 2 - popRect.width / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - popRect.width - 12));
      popover.style.top = `${Math.max(12, top)}px`;
      popover.style.left = `${left}px`;
      popover.dataset.arrow = arrow;
      const arrowLeft = Math.max(12, Math.min(rect.left + rect.width / 2 - left - 6, popRect.width - 24));
      popover.style.setProperty('--arrow-left', `${arrowLeft}px`);

      if (moveFocus) popover.focus();
    }

    function hidePopover() {
      const shouldRestoreFocus = popover.contains(document.activeElement);
      const trigger = activeSpan;
      popover.classList.remove('visible');
      popover.setAttribute('aria-hidden', 'true');
      popoverClose.tabIndex = -1;
      if (activeSpan) {
        activeSpan.classList.remove('jargon-active');
        activeSpan.setAttribute('aria-expanded', 'false');
      }
      activeSpan = null;
      if (shouldRestoreFocus && trigger) trigger.focus();
    }

    document.addEventListener('click', (e) => {
      const span = e.target.closest('.jargon');
      if (span) {
        e.stopPropagation();
        if (activeSpan === span && popover.classList.contains('visible')) hidePopover();
        else showPopover(span, false);
        return;
      }
      if (!e.target.closest('.jargon-popover')) hidePopover();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { hidePopover(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('jargon')) {
        e.preventDefault();
        showPopover(e.target, true);
      }
    });

    // Hover preview on precise pointers (desktop); touch devices rely on tap
    // (click, above). Tracked live via matchMedia (not a one-time check) so a
    // hybrid device that docks/undocks a mouse mid-session gets hover preview
    // attached or removed to match its current pointer capability.
    function onJargonMouseOver(e) {
      const span = e.target.closest('.jargon');
      if (!span) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => showPopover(span, false), 120);
    }
    function onJargonMouseOut(e) {
      const span = e.target.closest('.jargon');
      if (!span) return;
      const to = e.relatedTarget;
      if (to && to.closest && to.closest('.jargon-popover')) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(hidePopover, 200);
    }
    // Mirror of the above: also dismiss when the mouse leaves the popover
    // itself (reached by moving off the triggering .jargon span onto it)
    // into blank space, rather than back onto a .jargon span.
    function onPopoverMouseOut(e) {
      const to = e.relatedTarget;
      if (to && to.closest && (to.closest('.jargon-popover') || to.closest('.jargon'))) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(hidePopover, 200);
    }

    const mqFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let hoverListenersAttached = false;

    function syncHoverListeners() {
      if (mqFinePointer.matches && !hoverListenersAttached) {
        document.addEventListener('mouseover', onJargonMouseOver);
        document.addEventListener('mouseout', onJargonMouseOut);
        popover.addEventListener('mouseout', onPopoverMouseOut);
        hoverListenersAttached = true;
      } else if (!mqFinePointer.matches && hoverListenersAttached) {
        document.removeEventListener('mouseover', onJargonMouseOver);
        document.removeEventListener('mouseout', onJargonMouseOut);
        popover.removeEventListener('mouseout', onPopoverMouseOut);
        hoverListenersAttached = false;
      }
    }

    mqFinePointer.addEventListener('change', syncHoverListeners);
    syncHoverListeners();
  })();

});
