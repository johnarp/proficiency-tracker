// views.js
// Handles loading HTML partials into #content and initializing view-specific scripts.

const DEFAULT_VIEW = 'views/heroes.html';

// Maps each view to its init function name (defined in the view's script)
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

// Track already-loaded scripts to avoid duplicate injection
const loadedScripts = new Set();

/**
 * Dynamically inject a <script> tag and resolve when loaded.
 * No-ops if the script has already been loaded.
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(src)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => { loadedScripts.add(src); resolve(); };
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

        // Update active nav state
        document.querySelectorAll('nav a[data-view]').forEach(a => {
            a.classList.toggle('active', a.dataset.view === viewPath);
        });

        // Load view script if mapped, then call its init function
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

// Boot
document.addEventListener('DOMContentLoaded', () => {
    // Restore saved prefs and hero ranks before anything renders
    if (typeof loadFromStorage === 'function') loadFromStorage();

    // Wire up nav links
    document.querySelectorAll('nav a[data-view]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            loadView(a.dataset.view);
        });
    });

    // Load default view on page load
    loadView(DEFAULT_VIEW);
});