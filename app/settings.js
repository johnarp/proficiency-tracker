// settings.js
// localStorage: hero ranks, theme, rankColors setting.
// Loaded early in index.html so all views can use loadFromStorage/saveToStorage.

const STORAGE_KEY = 'heroRanks';
const PREFS_KEY   = 'appPrefs';

/** Load everything from localStorage. */
function loadFromStorage() {
    try {
        const ranks = localStorage.getItem(STORAGE_KEY);
        if (ranks) heroState.heroRanks = JSON.parse(ranks);
    } catch (e) { console.warn('Failed to load ranks:', e); }

    try {
        const prefs = localStorage.getItem(PREFS_KEY);
        if (prefs) {
            const p = JSON.parse(prefs);
            if (p.theme      !== undefined) appSettings.theme      = p.theme;
            if (p.rankColors !== undefined) appSettings.rankColors = p.rankColors;
        }
        // Apply saved theme immediately
        document.documentElement.setAttribute('data-theme', appSettings.theme);
    } catch (e) { console.warn('Failed to load prefs:', e); }
}

/** Save hero ranks to localStorage. */
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(heroState.heroRanks));
    } catch (e) { console.warn('Failed to save ranks:', e); }
}

/** Save app preferences (theme, rankColors) to localStorage. */
function savePrefs() {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({
            theme:      appSettings.theme,
            rankColors: appSettings.rankColors,
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
}

function exportData() {
    const payload = {
        heroRanks: heroState.heroRanks,
        prefs: { theme: appSettings.theme, rankColors: appSettings.rankColors },
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
                if (data.prefs.theme      !== undefined) appSettings.theme      = data.prefs.theme;
                if (data.prefs.rankColors !== undefined) appSettings.rankColors = data.prefs.rankColors;
                document.documentElement.setAttribute('data-theme', appSettings.theme);
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
    heroState.heroRanks  = {};
    appSettings.theme      = '';
    appSettings.rankColors = false;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFS_KEY);
    document.documentElement.setAttribute('data-theme', '');
}

window.initSettingsView = initSettingsView;
window.loadFromStorage  = loadFromStorage;
window.saveToStorage    = saveToStorage;
window.savePrefs        = savePrefs;