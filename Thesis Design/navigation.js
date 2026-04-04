/**
 * ============================================================
 *  THESIS ARCHIVE — navigation.js
 *  Shared JS module — drop one <script src="../navigation.js">
 *  (or <script src="navigation.js">) at the bottom of every page.
 *
 *  Covers:
 *  1.  Page-transition fade (seamless navigation)
 *  2.  Active nav-item / nav-subitem highlighting (auto-detected)
 *  3.  Collapsible nav-groups (open if a child is active)
 *  4.  Theme toggle (persisted in localStorage)
 *  5.  Live clock + date
 *  6.  Notification panel toggle
 *  7.  Profile panel toggle (+ role profiles)
 *  8.  Global search bar (AI badge + keyboard shortcut)
 *  9.  Sidebar mobile toggle
 * 10.  Sign-out routing
 * 11.  Filter chips (active toggle)
 * 12.  Category "new" field reveal
 * 13.  File-drop upload zone
 * 14.  Notification badge clear on open
 * ============================================================
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     0. CONSTANTS & HELPERS
  ─────────────────────────────────────────────── */

  const HOMEPAGE = (function () {
    const path = window.location.pathname;
    if (path.includes('/Student/')) return '../thesis archive homepage.html';
    if (path.includes('/Faculty/')) return '../thesis archive homepage.html';
    if (path.includes('/VPAA/'))    return '../thesis archive homepage.html';
    return 'thesis archive homepage.html';
  })();

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

  function currentFile() {
    return window.location.pathname.split('/').pop() || '';
  }

  /* ──────────────────────────────────────────────
     1. PAGE-TRANSITION FADE
     Injects a global CSS rule + fades pages in/out
  ─────────────────────────────────────────────── */

  (function initTransitions() {
    // Inject transition styles once
    if (!$('#nav-transition-style')) {
      const style = document.createElement('style');
      style.id = 'nav-transition-style';
      style.textContent = `
        body { opacity: 0; transition: opacity 0.22s ease; }
        body.nav-ready { opacity: 1; }
        body.nav-leaving { opacity: 0; pointer-events: none; }
        .sidebar { transition: transform 0.3s ease; }
        .sidebar.mobile-hidden { transform: translateX(-100%); }
        .sidebar-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.35); z-index: 90;
          backdrop-filter: blur(2px);
        }
        .sidebar-overlay.visible { display: block; }
      `;
      document.head.appendChild(style);
    }

    // Fade in on load
    window.addEventListener('DOMContentLoaded', () => {
      requestAnimationFrame(() => document.body.classList.add('nav-ready'));
    });

    // Intercept all internal <a> clicks for smooth fade-out
    document.addEventListener('click', function (e) {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // Skip blanks, hashes, external, or JS-only links
      if (!href || href === '#' || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('javascript')) return;
      // Skip links that open in a new tab
      if (anchor.target === '_blank') return;

      e.preventDefault();
      document.body.classList.remove('nav-ready');
      document.body.classList.add('nav-leaving');

      setTimeout(() => { window.location.href = href; }, 220);
    });
  })();

  /* ──────────────────────────────────────────────
     2. ACTIVE NAV HIGHLIGHTING
     Matches current file to sidebar links
  ─────────────────────────────────────────────── */

  (function initActiveNav() {
    const file = currentFile().toLowerCase();

    // Top-level nav items
    $$('.nav-item[href]').forEach(link => {
      const linkFile = link.getAttribute('href').split('/').pop().toLowerCase();
      if (linkFile && linkFile === file) {
        link.classList.add('active');
      }
    });

    // Sub-items inside collapsible groups
    $$('.nav-subitem[href]').forEach(link => {
      const linkFile = link.getAttribute('href').split('/').pop().toLowerCase();
      if (linkFile && linkFile === file) {
        link.classList.add('active');
        // Auto-expand parent group
        const group = link.closest('.nav-group');
        if (group) group.classList.add('open');
      }
    });

    // Utility footer links (about, support, terms)
    $$('[data-utility-link]').forEach(link => {
      const linkFile = link.getAttribute('href').split('/').pop().toLowerCase();
      if (linkFile && linkFile === file) {
        link.classList.add('active');
      }
    });
  })();

  /* ──────────────────────────────────────────────
     3. COLLAPSIBLE NAV-GROUPS
     Toggle open/closed; supports multiple groups
  ─────────────────────────────────────────────── */

  (function initNavGroups() {
    $$('.nav-group-toggle').forEach(toggle => {
      // Remove any inline onclick to prevent double-fire
      toggle.removeAttribute('onclick');

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const group = this.closest('.nav-group');
        if (!group) return;
        group.classList.toggle('open');
      });
    });
  })();

  /* ──────────────────────────────────────────────
     4. THEME TOGGLE
     Persists choice in localStorage; syncs across tabs
  ─────────────────────────────────────────────── */

  (function initTheme() {
    const html = document.documentElement;
    const STORAGE_KEY = 'thesis-archive-theme';

    // Apply saved preference immediately (before paint)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) html.setAttribute('data-theme', saved);

    function applyTheme(theme) {
      html.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEY, theme);
    }

    // Wire up every theme-toggle button on the page
    function wireToggles() {
      $$('#themeToggle, [data-theme-toggle]').forEach(btn => {
        // Prevent double-binding
        if (btn._themeWired) return;
        btn._themeWired = true;
        btn.addEventListener('click', () => {
          const current = html.getAttribute('data-theme') || 'light';
          applyTheme(current === 'light' ? 'dark' : 'light');
        });
      });
    }

    // Sync theme across browser tabs
    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY && e.newValue) {
        html.setAttribute('data-theme', e.newValue);
      }
    });

    document.addEventListener('DOMContentLoaded', wireToggles);
    wireToggles(); // also run immediately in case DOM is ready
  })();

  /* ──────────────────────────────────────────────
     5. LIVE CLOCK + DATE
     Updates every 30 s; formats in PH locale
  ─────────────────────────────────────────────── */

  (function initClock() {
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN',
                    'JUL','AUG','SEP','OCT','NOV','DEC'];

    function tick() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const d = now.getDate();
      const dateStr = String(d).padStart(2, '0') + '-' +
                      MONTHS[now.getMonth()] + '-' + now.getFullYear();

      $$('#liveTime').forEach(el => { el.textContent = timeStr; });
      $$('#liveDate').forEach(el => { el.textContent = dateStr; });
    }

    document.addEventListener('DOMContentLoaded', () => {
      tick();
      setInterval(tick, 30000);
    });
  })();

  /* ──────────────────────────────────────────────
     6. NOTIFICATION PANEL
     Toggle open/close; clear badge on first open
  ─────────────────────────────────────────────── */

  (function initNotifPanel() {
    document.addEventListener('DOMContentLoaded', () => {
      const btn   = $('#notifBtn');
      const panel = $('#notifPanel');
      const dot   = btn && btn.querySelector('.notif-dot');
      if (!btn || !panel) return;

      let opened = false;

      btn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = panel.getAttribute('aria-hidden') === 'false';

        closeAllDropdowns();

        if (!isOpen) {
          panel.setAttribute('aria-hidden', 'false');
          panel.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');

          // Clear badge on first view
          if (!opened && dot) {
            dot.style.display = 'none';
            opened = true;
          }
        }
      });
    });
  })();

  /* ──────────────────────────────────────────────
     7. PROFILE PANEL & ROLE PROFILES
     Toggle open/close; populate from roleProfiles map
  ─────────────────────────────────────────────── */

  (function initProfilePanel() {
    document.addEventListener('DOMContentLoaded', () => {
      const trigger = $('#profileBtn');
      const panel   = $('#profilePanel');
      if (!trigger || !panel) return;

      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = panel.getAttribute('aria-hidden') === 'false';
        closeAllDropdowns();
        if (!isOpen) {
          panel.setAttribute('aria-hidden', 'false');
          panel.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      // keyboard: Enter/Space on profile trigger
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
      });

      // Populate dynamic profile fields from roleProfiles if defined
      const profiles = window.roleProfiles;
      if (profiles) {
        const role = detectRole();
        const p = profiles[role];
        if (p) applyProfile(p);
      }
    });

    function detectRole() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/faculty/')) return 'faculty';
      if (path.includes('/vpaa/'))    return 'vpaa';
      return 'student';
    }

    function applyProfile(p) {
      $$('[data-profile-initials]').forEach(el => { el.textContent = p.initials; });
      $$('[data-profile-name]').forEach(el => { el.textContent = p.name; });
      $$('[data-profile-role]').forEach(el => { el.textContent = p.role; });
      $$('[data-profile-role-long]').forEach(el => { el.textContent = p.roleLong || p.role; });
      if (p.avatarBg) {
        $$('[data-profile-initials]').forEach(el => {
          el.style.background = p.avatarBg;
        });
      }
    }
  })();

  /* ──────────────────────────────────────────────
     SHARED: close all dropdowns on outside click
  ─────────────────────────────────────────────── */

  function closeAllDropdowns() {
    $$('.dropdown-panel').forEach(panel => {
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('open');
    });
    $$('[aria-expanded]').forEach(el => el.setAttribute('aria-expanded', 'false'));
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.topbar-dropdown') &&
        !e.target.closest('.dropdown-panel')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllDropdowns();
  });

  /* ──────────────────────────────────────────────
     8. GLOBAL SEARCH BAR
     Focus shortcut (Ctrl/Cmd + K); clears on Escape
  ─────────────────────────────────────────────── */

  (function initSearch() {
    document.addEventListener('DOMContentLoaded', () => {
      const inputs = $$('.search-bar input');
      if (!inputs.length) return;

      document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          inputs[0].focus();
          inputs[0].select();
        }
        if (e.key === 'Escape' && document.activeElement === inputs[0]) {
          inputs[0].blur();
        }
      });

      // Live search: highlight active nav items whose text matches query
      inputs.forEach(input => {
        input.addEventListener('input', function () {
          const q = this.value.trim().toLowerCase();
          if (!q) return;
          // Simple highlight: scroll to first matching nav link text
          const match = $$('.nav-item, .nav-subitem').find(
            el => el.textContent.trim().toLowerCase().includes(q)
          );
          if (match) match.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      });
    });
  })();

  /* ──────────────────────────────────────────────
     9. SIDEBAR MOBILE TOGGLE
     Creates a hamburger button + overlay if missing
  ─────────────────────────────────────────────── */

  (function initMobileSidebar() {
    document.addEventListener('DOMContentLoaded', () => {
      const sidebar = $('.sidebar');
      const topbar  = $('.topbar');
      if (!sidebar || !topbar) return;

      // Create overlay
      let overlay = $('.sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.insertBefore(overlay, document.body.firstChild);
      }

      // Create hamburger if not present
      let hamburger = $('#sidebarToggle');
      if (!hamburger) {
        hamburger = document.createElement('button');
        hamburger.id = 'sidebarToggle';
        hamburger.setAttribute('aria-label', 'Toggle sidebar');
        hamburger.style.cssText = `
          display: none; align-items: center; justify-content: center;
          width: 36px; height: 36px; border: none; background: transparent;
          cursor: pointer; border-radius: 8px; color: var(--text-secondary);
          flex-shrink: 0;
        `;
        hamburger.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/></svg>`;
        topbar.insertBefore(hamburger, topbar.firstChild);
      }

      function openSidebar() {
        sidebar.classList.remove('mobile-hidden');
        overlay.classList.add('visible');
        hamburger.setAttribute('aria-expanded', 'true');
      }

      function closeSidebar() {
        sidebar.classList.add('mobile-hidden');
        overlay.classList.remove('visible');
        hamburger.setAttribute('aria-expanded', 'false');
      }

      // Show hamburger on small screens
      const mq = window.matchMedia('(max-width: 1024px)');
      function onResize() {
        hamburger.style.display = mq.matches ? 'flex' : 'none';
        if (!mq.matches) {
          sidebar.classList.remove('mobile-hidden');
          overlay.classList.remove('visible');
        }
      }
      mq.addEventListener('change', onResize);
      onResize();

      hamburger.addEventListener('click', () => {
        sidebar.classList.contains('mobile-hidden') ? openSidebar() : closeSidebar();
      });
      overlay.addEventListener('click', closeSidebar);
    });
  })();

  /* ──────────────────────────────────────────────
     10. SIGN-OUT ROUTING
     Wires all .signout links to the homepage
  ─────────────────────────────────────────────── */

  (function initSignOut() {
    document.addEventListener('DOMContentLoaded', () => {
      $$('.profile-action.signout').forEach(link => {
        // Only override if href is '#' or missing
        const href = link.getAttribute('href');
        if (!href || href === '#') {
          link.setAttribute('href', HOMEPAGE);
        }
      });
    });
  })();

  /* ──────────────────────────────────────────────
     11. FILTER CHIPS (toggle active)
     Works on any .chip group on any page
  ─────────────────────────────────────────────── */

  (function initFilterChips() {
    document.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      // Find sibling chips in the same .filter-chips container
      const container = chip.closest('.filter-chips');
      if (!container) return;
      $$('.chip', container).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  })();

  /* ──────────────────────────────────────────────
     12. "NEW CATEGORY" FIELD REVEAL
     Shows hidden input when "Other / New Category" selected
  ─────────────────────────────────────────────── */

  (function initNewCategoryField() {
    document.addEventListener('DOMContentLoaded', () => {
      const categorySelect = $('#category');
      const newField       = $('#newCategoryField');
      if (!categorySelect || !newField) return;

      categorySelect.addEventListener('change', function () {
        const show = this.value === 'other';
        newField.classList.toggle('hidden', !show);
        newField.style.display = show ? '' : 'none';
      });

      // Ensure initial state
      newField.style.display = 'none';
    });
  })();

  /* ──────────────────────────────────────────────
     13. FILE-DROP UPLOAD ZONE
     Drag-over highlight; drop → list filenames
  ─────────────────────────────────────────────── */

  (function initFileDrop() {
    document.addEventListener('DOMContentLoaded', () => {
      $$('.file-drop').forEach(zone => {
        zone.addEventListener('dragover', e => {
          e.preventDefault();
          zone.classList.add('drag-over');
          zone.style.borderColor = 'var(--maroon)';
          zone.style.background  = 'rgba(139,35,50,0.05)';
        });

        zone.addEventListener('dragleave', () => {
          zone.classList.remove('drag-over');
          zone.style.borderColor = '';
          zone.style.background  = '';
        });

        zone.addEventListener('drop', e => {
          e.preventDefault();
          zone.classList.remove('drag-over');
          zone.style.borderColor = '';
          zone.style.background  = '';

          const files = [...e.dataTransfer.files];
          if (!files.length) return;

          // Display filenames under the drop zone
          let list = zone.querySelector('.dropped-files');
          if (!list) {
            list = document.createElement('div');
            list.className = 'dropped-files';
            list.style.cssText = 'margin-top:10px;font-size:12px;color:var(--text-secondary);';
            zone.appendChild(list);
          }
          list.innerHTML = files.map(f =>
            `<div style="padding:3px 0;">📄 ${f.name} <span style="color:var(--text-tertiary)">(${(f.size/1024).toFixed(1)} KB)</span></div>`
          ).join('');
        });
      });
    });
  })();

  /* ──────────────────────────────────────────────
     14. NOTIFICATION BADGE CLEAR
     Already handled in section 6; no duplicate needed.
  ─────────────────────────────────────────────── */

  /* ──────────────────────────────────────────────
     15. REVIEW TABLE — "Review/View/Open" BUTTONS
     Navigates to the relevant detail page if exists
  ─────────────────────────────────────────────── */

  (function initTableActions() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-review');
      if (!btn) return;

      const row = btn.closest('tr');
      if (!row) return;

      const titleCell = row.querySelector('.rt-title');
      if (!titleCell) return;

      // Visual feedback — ripple effect
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    });
  })();

  /* ──────────────────────────────────────────────
     EXPOSE PUBLIC API (optional — for page scripts)
  ─────────────────────────────────────────────── */

  window.ThesisArchive = {
    closeAllDropdowns,
    currentFile,
    navigate(href) {
      document.body.classList.remove('nav-ready');
      document.body.classList.add('nav-leaving');
      setTimeout(() => { window.location.href = href; }, 220);
    }
  };

})();