// heroes.js
// Logic for the heroes view: data fetching, filtering, sorting, rank selection.
// All HTML structure lives in views/heroes.html.
// Called by views.js via initHeroesView().

// In-memory state — no localStorage yet
const heroState = {
    heroes:    [],   // full list from heroes.json
    heroRanks: {},   // { "Hero Name": rankValue } — persists across view reloads in-session
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

    populateRankOptions(ranks);
    bindControls();
    bindModal();
    renderGrid();
}

window.initHeroesView = initHeroesView;

// ─── Setup ────────────────────────────────────────────────────────────────────

/** Populate the rank <select> in the modal from ranks.json data. */
function populateRankOptions(ranks) {
    const select = document.getElementById('modal-rank-select');
    const sorted = [...ranks].sort((a, b) => a.rank - b.rank);

    sorted.forEach(r => {
        const option = document.createElement('option');
        option.value = r.rank;
        option.textContent = r.title;
        select.appendChild(option);
    });
}

/** Wire up the controls bar, restoring current state. */
function bindControls() {
    const roleSelect = document.getElementById('ctrl-role');
    const sortSelect = document.getElementById('ctrl-sort');

    // Restore state (in case user navigated away and back)
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

/** Wire up the modal close button and backdrop click. */
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
            // Unranked heroes default to 0 (Agent) for sorting
            const ra = heroState.heroRanks[a.name] ?? 0;
            const rb = heroState.heroRanks[b.name] ?? 0;
            return heroState.sort.dir === 'asc' ? ra - rb : rb - ra;
        }
        return 0;
    });

    return list;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openModal(hero) {
    const modal  = document.getElementById('hero-modal');
    const select = document.getElementById('modal-rank-select');
    const saved  = heroState.heroRanks[hero.name];

    document.getElementById('modal-hero-name').textContent = hero.name;
    select.value = saved !== undefined ? saved : 0;

    select.onchange = () => {
        if (select.value === '') {
            delete heroState.heroRanks[hero.name];
        } else {
            heroState.heroRanks[hero.name] = parseInt(select.value, 10);
        }
    };

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('hero-modal').style.display = 'none';
    renderGrid(); // Refresh so rank-based sorting reflects changes
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Always returns an array of roles, handles both string and array values. */
function getRoles(hero) {
    return Array.isArray(hero.role) ? hero.role : [hero.role];
}