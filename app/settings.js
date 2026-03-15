// settings.js
// Handles localStorage persistence and the Settings view.
// Loaded early in index.html so all views can call loadFromStorage / saveToStorage / savePrefs.

const STORAGE_KEY = 'heroRanks';
const PREFS_KEY   = 'appPrefs';

// ─── Card Size ────────────────────────────────────────────────────────────────

/** Apply the current cardSize to the document via a CSS variable. */
function applyCardSize() {
    const sizes = { sm: '90px', md: '120px', lg: '160px' };
    document.documentElement.style.setProperty(
        '--hero-card-min-size',
        sizes[appSettings.cardSize] || '120px'
    );
}

// ─── Storage ──────────────────────────────────────────────────────────────────

/** Load hero ranks and preferences from localStorage. */
function loadFromStorage() {
    try {
        const ranks = localStorage.getItem(STORAGE_KEY);
        if (ranks) heroState.heroRanks = JSON.parse(ranks);
    } catch (e) { console.warn('Failed to load ranks:', e); }

    try {
        const prefs = localStorage.getItem(PREFS_KEY);
        if (prefs) {
            const p = JSON.parse(prefs);
            if (p.theme         !== undefined) appSettings.theme         = p.theme;
            if (p.rankColors    !== undefined) appSettings.rankColors    = p.rankColors;
            if (p.rankIcons     !== undefined) appSettings.rankIcons     = p.rankIcons;
            if (p.showHeroNames !== undefined) appSettings.showHeroNames = p.showHeroNames;
            if (p.cardSize      !== undefined) appSettings.cardSize      = p.cardSize;
        }
        document.documentElement.setAttribute('data-theme', appSettings.theme);
        applyCardSize();
    } catch (e) { console.warn('Failed to load prefs:', e); }
}

/** Save hero ranks to localStorage. */
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(heroState.heroRanks));
    } catch (e) { console.warn('Failed to save ranks:', e); }
}

/** Save all app preferences to localStorage. */
function savePrefs() {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({
            theme:         appSettings.theme,
            rankColors:    appSettings.rankColors,
            rankIcons:     appSettings.rankIcons,
            showHeroNames: appSettings.showHeroNames,
            cardSize:      appSettings.cardSize,
        }));
    } catch (e) { console.warn('Failed to save prefs:', e); }
}

// ─── Settings View ────────────────────────────────────────────────────────────

function initSettingsView() {
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importData);
    document.getElementById('btn-clear').addEventListener('click', clearData);
    loadMeta();
}

/** Fetch meta.json and render version + links in the About section. */
async function loadMeta() {
    const el = document.getElementById('meta-info');
    if (!el) return;
    try {
        const meta = await fetch('./app/meta.json').then(r => r.json());
        el.innerHTML = `
            <div class="meta-row">
                <span class="meta-label">Version</span>
                <span class="meta-value">${meta.version}</span>
            </div>
            <div class="meta-links">
                <a class="meta-link" href="${meta.repo}" target="_blank" rel="noopener noreferrer">Source Code</a>
                <a class="meta-link" href="${meta.issues}" target="_blank" rel="noopener noreferrer">Report Issue</a>
                <a class="meta-link" href="${meta.changelog}" target="_blank" rel="noopener noreferrer">Changelog</a>
            </div>
        `;
    } catch (e) {
        console.warn('Failed to load meta.json:', e);
    }
}

// ─── Import / Export / Clear ──────────────────────────────────────────────────

function exportData() {
    const payload = {
        heroRanks: heroState.heroRanks,
        prefs: {
            theme:         appSettings.theme,
            rankColors:    appSettings.rankColors,
            rankIcons:     appSettings.rankIcons,
            showHeroNames: appSettings.showHeroNames,
            cardSize:      appSettings.cardSize,
        },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'proficiency-tracker.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (data.heroRanks) heroState.heroRanks = data.heroRanks;
            if (data.prefs) {
                const p = data.prefs;
                if (p.theme         !== undefined) appSettings.theme         = p.theme;
                if (p.rankColors    !== undefined) appSettings.rankColors    = p.rankColors;
                if (p.rankIcons     !== undefined) appSettings.rankIcons     = p.rankIcons;
                if (p.showHeroNames !== undefined) appSettings.showHeroNames = p.showHeroNames;
                if (p.cardSize      !== undefined) appSettings.cardSize      = p.cardSize;
                document.documentElement.setAttribute('data-theme', appSettings.theme);
                applyCardSize();
            }
            saveToStorage();
            savePrefs();
            alert('Import successful.');
        } catch {
            alert('Invalid file.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function clearData() {
    if (!confirm('Clear all progress? This cannot be undone.')) return;
    heroState.heroRanks      = {};
    appSettings.theme        = '';
    appSettings.rankColors   = false;
    appSettings.rankIcons    = false;
    appSettings.showHeroNames = false;
    appSettings.cardSize     = 'md';
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFS_KEY);
    document.documentElement.setAttribute('data-theme', '');
    applyCardSize();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

window.applyCardSize   = applyCardSize;
window.initSettingsView = initSettingsView;
window.loadFromStorage  = loadFromStorage;
window.saveToStorage    = saveToStorage;
window.savePrefs        = savePrefs;