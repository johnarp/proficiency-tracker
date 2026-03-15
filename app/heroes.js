// heroes.js
// Logic for the heroes view: data fetching, filtering, sorting, rank/level selection.
// All HTML structure lives in views/heroes.html.
// Called by views.js via initHeroesView().

// In-memory state — no localStorage yet
const heroState = {
    heroes:    [],   // full list from heroes.json
    ranks:     [],   // full list from ranks.json, sorted by rank value
    // { "Hero Name": { rank: 0, level: 1 } } — level is the actual level number (1-54)
    heroRanks: {},
    filter: { role: 'all' },
    sort:   { by: 'name', dir: 'asc' },
};

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function initHeroesView() {
    const [heroes, ranks] = await Promise.all([
        fetch('./app/heroes.json').then(r => r.json()),
        fetch('./app/ranks.json').then(r => r.json()),
    ]);

    heroState.heroes = heroes;
    heroState.ranks  = [...ranks].sort((a, b) => a.rank - b.rank);

    // Load saved progress if settings.js is available
    if (typeof loadFromStorage === 'function') loadFromStorage();

    populateRankOptions();
    bindControls();
    bindModal();
    renderGrid();
}

window.initHeroesView = initHeroesView;

// ─── Setup ────────────────────────────────────────────────────────────────────

/** Populate the rank <select> from heroState.ranks. */
function populateRankOptions() {
    const select = document.getElementById('modal-rank-select');
    select.innerHTML = '';

    heroState.ranks.forEach(r => {
        const option = document.createElement('option');
        option.value = r.rank;
        option.textContent = r.title;
        select.appendChild(option);
    });
}

/**
 * Populate the level <select> with levels for the given rank index.
 */
function populateLevelOptions(rankIndex) {
    const select   = document.getElementById('modal-level-select');
    const rankData = heroState.ranks.find(r => r.rank === rankIndex);
    select.innerHTML = '';

    for (let lvl = rankData.minLevel; lvl <= rankData.maxLevel; lvl++) {
        const option = document.createElement('option');
        option.value = lvl;
        option.textContent = `Level ${lvl}`;
        select.appendChild(option);
    }
}

/** Wire up the controls bar, restoring current state. */
function bindControls() {
    const roleSelect = document.getElementById('ctrl-role');
    const sortSelect = document.getElementById('ctrl-sort');

    roleSelect.value = heroState.filter.role;
    sortSelect.value = `${heroState.sort.by}-${heroState.sort.dir}`;

    roleSelect.addEventListener('change', e => {
        heroState.filter.role = e.target.value;
        renderGrid();
    });

    sortSelect.addEventListener('change', e => {
        const [by, dir] = e.target.value.split('-');
        heroState.sort = { by, dir };
        renderGrid();
    });
}

/** Wire up modal close button and backdrop click. */
function bindModal() {
    const modal = document.getElementById('hero-modal');
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

function renderGrid() {
    const grid = document.getElementById('heroes-grid');
    grid.innerHTML = '';

    getVisibleHeroes().forEach(hero => {
        const card = document.createElement('div');
        const img  = document.createElement('img');

        img.src     = hero.image;
        img.alt     = hero.name;
        img.loading = 'lazy';

        card.className = 'hero-card';

        // Apply rank color if the setting is enabled
        if (appSettings.rankColors) {
            const savedRank = heroState.heroRanks[hero.name]?.rank ?? 0;
            const rankData  = heroState.ranks.find(r => r.rank === savedRank);
            if (rankData?.color) card.style.background = rankData.color;
        }

        card.appendChild(img);
        card.addEventListener('click', () => openModal(hero));
        grid.appendChild(card);
    });
}

/** Returns heroes filtered by role and sorted per current state. */
function getVisibleHeroes() {
    let list = heroState.heroes.slice();

    if (heroState.filter.role !== 'all') {
        list = list.filter(h =>
            getRoles(h).some(r => r.toLowerCase() === heroState.filter.role.toLowerCase())
        );
    }

    list.sort((a, b) => {
        if (heroState.sort.by === 'name') {
            const cmp = a.name.localeCompare(b.name);
            return heroState.sort.dir === 'asc' ? cmp : -cmp;
        }
        if (heroState.sort.by === 'rank') {
            // Sort by actual level number — heroes default to level 1 (Agent) if unset
            const la = heroState.heroRanks[a.name]?.level ?? 1;
            const lb = heroState.heroRanks[b.name]?.level ?? 1;
            return heroState.sort.dir === 'asc' ? la - lb : lb - la;
        }
        return 0;
    });

    return list;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openModal(hero) {
    const modal       = document.getElementById('hero-modal');
    const rankSelect  = document.getElementById('modal-rank-select');
    const levelSelect = document.getElementById('modal-level-select');
    const saved       = heroState.heroRanks[hero.name];

    document.getElementById('modal-hero-name').textContent = hero.name;

    // Restore saved rank and level, or default to Agent level 1
    const savedRank  = saved?.rank  ?? 0;
    const savedLevel = saved?.level ?? 1;

    rankSelect.value = savedRank;
    populateLevelOptions(savedRank);
    levelSelect.value = savedLevel;

    // When rank changes: repopulate levels and default to that rank's first level
    rankSelect.onchange = () => {
        const rankIndex = parseInt(rankSelect.value, 10);
        populateLevelOptions(rankIndex);
        const rankData = heroState.ranks.find(r => r.rank === rankIndex);
        levelSelect.value = rankData.minLevel;
        saveHeroRank(hero.name, rankIndex, rankData.minLevel);
    };

    // When level changes: just save
    levelSelect.onchange = () => {
        const rankIndex = parseInt(rankSelect.value, 10);
        const level     = parseInt(levelSelect.value, 10);
        saveHeroRank(hero.name, rankIndex, level);
    };

    modal.style.display = 'flex';
}

function saveHeroRank(heroName, rankIndex, level) {
    heroState.heroRanks[heroName] = { rank: rankIndex, level };
    if (typeof saveToStorage === 'function') saveToStorage();
}

function closeModal() {
    document.getElementById('hero-modal').style.display = 'none';
    renderGrid();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Always returns an array of roles, handles both string and array values. */
function getRoles(hero) {
    return Array.isArray(hero.role) ? hero.role : [hero.role];
}