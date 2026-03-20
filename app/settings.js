// settings.js
// Handles localStorage persistence and the Settings view (export, import, clear,
// profile, credits). Loaded early in index.html so all views can call
// loadFromStorage / saveToStorage / savePrefs.

const STORAGE_KEY = 'heroRanks';
const PREFS_KEY   = 'appPrefs';

// ─── Card Size ────────────────────────────────────────────────────────────────

/** Apply the current cardSize to the document via CSS variables and a data attribute. */
function applyCardSize() {
    const sizes = { sm: '90px', md: '120px', lg: '160px' };
    document.documentElement.style.setProperty(
        '--hero-card-min-size',
        sizes[appSettings.cardSize] || '120px'
    );
    // Used by CSS to scale hero name text.
    document.documentElement.setAttribute('data-card-size', appSettings.cardSize || 'md');
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
            if (p.showHeroLevel !== undefined) appSettings.showHeroLevel = p.showHeroLevel;
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
            showHeroLevel: appSettings.showHeroLevel,
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
    document.getElementById('btn-profile').addEventListener('click', openProfileModal);
    document.getElementById('btn-credits').addEventListener('click', openCreditsModal);
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
                <a class="meta-link" href="${meta.repo}"      target="_blank" rel="noopener noreferrer">Source Code</a>
                <a class="meta-link" href="${meta.issues}"    target="_blank" rel="noopener noreferrer">Report Issue</a>
                <a class="meta-link" href="${meta.changelog}" target="_blank" rel="noopener noreferrer">Changelog</a>
            </div>
        `;
    } catch (e) {
        console.warn('Failed to load meta.json:', e);
    }
}

// ─── Profile Modal ────────────────────────────────────────────────────────────

/** Open the Profile modal — shows rank distribution and saved preferences. */
async function openProfileModal() {
    // Use already-loaded heroes, or fetch them if the Heroes view hasn't been visited.
    let heroes = heroState.heroes;
    if (!heroes.length) {
        try {
            heroes = await fetch('./app/heroes.json').then(r => r.json());
        } catch {
            heroes = [];
        }
    }

    // Use already-loaded ranks, or fetch them if the Heroes view hasn't been visited.
    let ranks = heroState.ranks;
    if (!ranks.length) {
        try {
            ranks = await fetch('./app/ranks.json').then(r => r.json());
            ranks = [...ranks].sort((a, b) => a.rank - b.rank);
        } catch {
            ranks = [];
        }
    }

    // Every hero defaults to Agent (rank 0) / Level 1 if never explicitly set.
    const counts = Object.fromEntries(ranks.map(r => [r.rank, 0]));
    heroes.forEach(hero => {
        const rank = heroState.heroRanks[hero.name]?.rank ?? 0;
        if (counts[rank] !== undefined) counts[rank]++;
    });
    const totalHeroes = heroes.length || 1;

    const wrap = document.createElement('div');
    wrap.className = 'profile-content';

    // ── Rank Distribution ──────────────────────────────────────────────────────
    const distLabel = document.createElement('p');
    distLabel.className = 'modal-section-label';
    distLabel.textContent = 'Rank Distribution';
    wrap.appendChild(distLabel);

    if (totalHeroes === 0) return;

    // Render highest-first.
    [...ranks].reverse().forEach(r => {
        const count = counts[r.rank] || 0;
        if (count === 0) return;

            const row = document.createElement('div');
            row.className = 'profile-rank-row';

            if (r.icon) {
                const icon = document.createElement('img');
                icon.src = r.icon;
                icon.alt = r.title;
                icon.className = 'profile-rank-icon';
                row.appendChild(icon);
            }

            const label = document.createElement('span');
            label.className = 'profile-rank-label';
            label.textContent = r.title;
            row.appendChild(label);

            const barWrap = document.createElement('div');
            barWrap.className = 'profile-rank-bar-wrap';
            const bar = document.createElement('div');
            bar.className = 'profile-rank-bar';
            // Animate in after insertion.
            bar.style.width = '0';
            barWrap.appendChild(bar);
            row.appendChild(barWrap);

            const countEl = document.createElement('span');
            countEl.className = 'profile-rank-count';
            countEl.textContent = count;
            row.appendChild(countEl);

            wrap.appendChild(row);

            // Defer width so CSS transition plays.
            requestAnimationFrame(() => {
                bar.style.width = `${(count / totalHeroes) * 100}%`;
            });
        });

    // ── Preferences Summary ────────────────────────────────────────────────────
    const prefsLabel = document.createElement('p');
    prefsLabel.className = 'modal-section-label';
    prefsLabel.style.marginTop = '24px';
    prefsLabel.textContent = 'Preferences';
    wrap.appendChild(prefsLabel);

    const SIZE_LABELS = { sm: 'Small', md: 'Medium', lg: 'Large' };
    const prefs = [
        { label: 'Theme',       value: appSettings.theme     ? appSettings.theme.charAt(0).toUpperCase() + appSettings.theme.slice(1) : 'Default' },
        { label: 'Card Size',   value: SIZE_LABELS[appSettings.cardSize] || 'Medium' },
        { label: 'Rank Colors', value: appSettings.rankColors    ? 'On' : 'Off' },
        { label: 'Rank Icons',  value: appSettings.rankIcons     ? 'On' : 'Off' },
        { label: 'Hero Names',  value: appSettings.showHeroNames ? 'On' : 'Off' },
        { label: 'Hero Levels', value: appSettings.showHeroLevel ? 'On' : 'Off' },
    ];

    prefs.forEach(({ label, value }) => {
        const row = document.createElement('div');
        row.className = 'meta-row';
        const labelEl = document.createElement('span');
        labelEl.className = 'meta-label';
        labelEl.textContent = label;
        const valueEl = document.createElement('span');
        valueEl.className = 'meta-value';
        valueEl.textContent = value;
        row.appendChild(labelEl);
        row.appendChild(valueEl);
        wrap.appendChild(row);
    });

    showModal({
        tag:        'Summary',
        title:      'Profile',
        content:    wrap,
        closeLabel: 'Close',
    });
}

// ─── Credits Modal ────────────────────────────────────────────────────────────

/** Open the Credits modal — renders credits.json. */
async function openCreditsModal() {
    let credits = [];
    try {
        credits = await fetch('./app/credits.json').then(r => r.json());
    } catch (e) {
        console.warn('Failed to load credits.json:', e);
    }

    const wrap = document.createElement('div');
    wrap.className = 'credits-content';

    credits.forEach(c => {
        const item = document.createElement('div');
        item.className = 'credit-item';

        const titleLink = document.createElement('a');
        titleLink.className = 'credit-title';
        titleLink.href      = c.url;
        titleLink.target    = '_blank';
        titleLink.rel       = 'noopener noreferrer';
        titleLink.textContent = c.title;
        item.appendChild(titleLink);

        const author = document.createElement('span');
        author.className  = 'credit-author';
        author.textContent = c.author;
        item.appendChild(author);

        if (c.uses && c.uses.length) {
            const uses = document.createElement('span');
            uses.className  = 'credit-uses';
            uses.textContent = c.uses.join(' · ');
            item.appendChild(uses);
        }

        wrap.appendChild(item);
    });

    showModal({
        tag:        'Attribution',
        title:      'Credits',
        content:    wrap,
        closeLabel: 'Close',
    });
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
            showHeroLevel: appSettings.showHeroLevel,
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
                if (p.showHeroLevel !== undefined) appSettings.showHeroLevel = p.showHeroLevel;
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
    heroState.heroRanks       = {};
    appSettings.theme         = '';
    appSettings.rankColors    = false;
    appSettings.rankIcons     = false;
    appSettings.showHeroNames = false;
    appSettings.showHeroLevel = false;
    appSettings.cardSize      = 'md';
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem('announcement_seen');
    document.documentElement.setAttribute('data-theme', '');
    applyCardSize();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

window.applyCardSize    = applyCardSize;
window.initSettingsView = initSettingsView;
window.loadFromStorage  = loadFromStorage;
window.saveToStorage    = saveToStorage;
window.savePrefs        = savePrefs;