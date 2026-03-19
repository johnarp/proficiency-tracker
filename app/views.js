// views.js
// Handles loading HTML partials into #content, initializing view-specific scripts,
// and providing the global showModal() utility used by all overlay dialogs.

const DEFAULT_VIEW = 'views/heroes.html';

// Maps each view path to its init function name (defined in the view's script).
const VIEW_INIT = {
    'views/heroes.html':    'initHeroesView',
    'views/customize.html': 'initCustomizeView',
    'views/settings.html':  'initSettingsView',
};

const VIEW_SCRIPTS = {
    'views/heroes.html':    './app/heroes.js',
    'views/customize.html': './app/customize.js',
    'views/settings.html':  './app/settings.js',
};

// Track already-loaded scripts to avoid duplicate injection.
// settings.js is already loaded globally via index.html — pre-register it.
const loadedScripts = new Set(['./app/settings.js']);

/**
 * Dynamically inject a <script> tag and resolve when loaded.
 * No-ops if the script has already been loaded.
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(src)) { resolve(); return; }
        const script = document.createElement('script');
        script.src = src;
        script.onload  = () => { loadedScripts.add(src); resolve(); };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

/**
 * Fetch an HTML partial and inject it into #content,
 * then load and call the view's init function if one is mapped.
 */
async function loadView(viewPath) {
    try {
        const res = await fetch(viewPath);
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${viewPath}`);

        document.getElementById('content').innerHTML = await res.text();

        // Update active nav state.
        document.querySelectorAll('nav a[data-view]').forEach(a => {
            a.classList.toggle('active', a.dataset.view === viewPath);
        });

        // Load view script if mapped, then call its init function.
        if (VIEW_SCRIPTS[viewPath]) {
            await loadScript(VIEW_SCRIPTS[viewPath]);
            const initFn = window[VIEW_INIT[viewPath]];
            if (typeof initFn === 'function') initFn();
        }
    } catch (err) {
        console.error('loadView error:', err);
        document.getElementById('content').innerHTML = '<p>Error loading view.</p>';
    }
}

// ─── Global Modal ─────────────────────────────────────────────────────────────

/**
 * Show the global app modal.
 *
 * @param {object}      opts
 * @param {string}      opts.tag          Small label rendered above the title (e.g. "PROFILE")
 * @param {string}      [opts.title]      Modal heading
 * @param {string}      [opts.image]      Optional image src shown below the header
 * @param {HTMLElement} opts.content      DOM node injected into the scrollable body area
 * @param {string}      [opts.closeLabel] Text for the close button (default: "Close")
 * @param {Function}    [opts.onClose]    Called after the modal is dismissed
 */
function showModal({ tag, title, image, content, closeLabel = 'Close', onClose } = {}) {
    const modal   = document.getElementById('app-modal');
    const tagEl   = document.getElementById('app-modal-tag');
    const titleEl = document.getElementById('app-modal-title');
    const imgWrap = document.getElementById('app-modal-image-wrap');
    const imgEl   = document.getElementById('app-modal-image');
    const bodyEl  = document.getElementById('app-modal-body');
    const closeEl = document.getElementById('app-modal-close');

    tagEl.textContent   = tag   || '';
    titleEl.textContent = title || '';
    closeEl.textContent = closeLabel;

    if (image) {
        imgEl.src             = image;
        imgWrap.style.display = '';
    } else {
        imgWrap.style.display = 'none';
    }

    bodyEl.innerHTML = '';
    if (content) bodyEl.appendChild(content);

    // Dismiss handler — cleans up event listener each time.
    let keyHandler;
    const dismiss = () => {
        modal.style.display = 'none';
        document.removeEventListener('keydown', keyHandler);
        if (typeof onClose === 'function') onClose();
    };

    keyHandler = e => { if (e.key === 'Escape') dismiss(); };

    closeEl.onclick = dismiss;
    document.getElementById('app-modal-overlay').onclick = dismiss;
    document.addEventListener('keydown', keyHandler);

    modal.style.display = 'flex';
    closeEl.focus();
}

window.showModal  = showModal;
window.loadScript = loadScript;

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Restore saved prefs and hero ranks before anything renders.
    if (typeof loadFromStorage === 'function') loadFromStorage();

    // Wire up nav links.
    document.querySelectorAll('nav a[data-view]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            loadView(a.dataset.view);
        });
    });

    // Load default view.
    loadView(DEFAULT_VIEW);

    // Load announcement script after the first view has rendered.
    setTimeout(() => loadScript('./app/announcement.js'), 600);
});