// heroes.js
// Logic for the heroes view: data fetching, filtering, sorting, rank/level selection.
// All HTML structure lives in views/heroes.html.
// Called by views.js via initHeroesView().
// heroState is declared in state.js and already available.

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function initHeroesView() {
    const [heroes, ranks] = await Promise.all([
        fetch('./app/heroes.json').then(r => r.json()),
        fetch('./app/ranks.json').then(r => r.json()),
    ]);

    heroState.heroes = heroes;
    heroState.ranks  = [...ranks].sort((a, b) => a.rank - b.rank);

    if (typeof loadFromStorage === 'function') loadFromStorage();
    if (typeof applyCardSize   === 'function') applyCardSize();

    populateRankOptions();
    bindControls();
    bindModal();
    renderGrid();
}

window.initHeroesView = initHeroesView;

// ─── Setup ────────────────────────────────────────────────────────────────────

function populateRankOptions() {
    const select = document.getElementById('modal-rank-select');
    select.innerHTML = '';
    heroState.ranks.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.rank;
        opt.textContent = r.title;
        select.appendChild(opt);
    });
}

function populateLevelOptions(rankIndex) {
    const select   = document.getElementById('modal-level-select');
    const rankData = heroState.ranks.find(r => r.rank === rankIndex);
    select.innerHTML = '';
    for (let lvl = rankData.minLevel; lvl <= rankData.maxLevel; lvl++) {
        const opt = document.createElement('option');
        opt.value = lvl;
        opt.textContent = `Level ${lvl}`;
        select.appendChild(opt);
    }
}

function bindControls() {
    const roleSelect = document.getElementById('ctrl-role');
    const sortSelect = document.getElementById('ctrl-sort');
    const sizeSelect = document.getElementById('ctrl-size');

    roleSelect.value = heroState.filter.role;
    sortSelect.value = `${heroState.sort.by}-${heroState.sort.dir}`;
    sizeSelect.value = appSettings.cardSize || 'md';

    roleSelect.addEventListener('change', e => {
        heroState.filter.role = e.target.value;
        renderGrid();
    });

    sortSelect.addEventListener('change', e => {
        const [by, dir] = e.target.value.split('-');
        heroState.sort = { by, dir };
        renderGrid();
    });

    sizeSelect.addEventListener('change', e => {
        appSettings.cardSize = e.target.value;
        if (typeof applyCardSize === 'function') applyCardSize();
        if (typeof savePrefs     === 'function') savePrefs();
    });
}

function bindModal() {
    const modal = document.getElementById('hero-modal');
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
    });
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

function renderGrid() {
    const grid = document.getElementById('heroes-grid');
    grid.innerHTML = '';

    getVisibleHeroes().forEach(hero => {
        const savedRank = heroState.heroRanks[hero.name]?.rank ?? 0;
        const rankData  = heroState.ranks.find(r => r.rank === savedRank);

        /*
         * DOM structure:
         *
         * .hero-card-outer      — grid item, position:relative, NO clip-path
         *   .hero-card-wrap     — clip-path + hover yellow border
         *     .hero-card        — clip-path + image + name overlay
         *   .hero-card-rank-icon — absolutely positioned on outer, so it is
         *                          never clipped by clip-path on wrap or card
         */
        const outer = document.createElement('div');
        outer.className = 'hero-card-outer';
        outer.setAttribute('tabindex', '0');
        outer.setAttribute('aria-label', `${hero.name}, ${getRoles(hero).join(' / ')}, ${rankData?.title ?? 'Agent'}`);

        const wrap = document.createElement('div');
        wrap.className = 'hero-card-wrap';

        const card = document.createElement('div');
        card.className = 'hero-card';

        if (appSettings.rankColors && rankData?.color) {
            card.style.background = rankData.color;
        }

        const img = document.createElement('img');
        img.className = 'hero-card-portrait';
        img.src     = hero.image;
        img.alt     = hero.name;
        img.loading = 'lazy';
        card.appendChild(img);

        if (appSettings.showHeroNames) {
            const nameWrap = document.createElement('div');
            nameWrap.className = 'hero-card-name';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = hero.name;
            nameWrap.appendChild(nameSpan);
            card.appendChild(nameWrap);
        }

        wrap.appendChild(card);
        outer.appendChild(wrap);

        // Icon is a child of outer — outside any clip-path, never clipped
        if (appSettings.rankIcons && rankData?.icon) {
            const icon = document.createElement('img');
            icon.className = 'hero-card-rank-icon';
            icon.src = rankData.icon;
            icon.alt = rankData.title;
            outer.appendChild(icon);
        }

        const openFn = () => openModal(hero);
        outer.addEventListener('click', openFn);
        outer.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFn(); }
        });

        grid.appendChild(outer);
    });
}

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

    const savedRank  = saved?.rank  ?? 0;
    const savedLevel = saved?.level ?? 1;

    rankSelect.value = savedRank;
    populateLevelOptions(savedRank);
    levelSelect.value = savedLevel;

    rankSelect.onchange = () => {
        const rankIndex = parseInt(rankSelect.value, 10);
        populateLevelOptions(rankIndex);
        const rankData = heroState.ranks.find(r => r.rank === rankIndex);
        levelSelect.value = rankData.minLevel;
        saveHeroRank(hero.name, rankIndex, rankData.minLevel);
    };

    levelSelect.onchange = () => {
        const rankIndex = parseInt(rankSelect.value, 10);
        const level     = parseInt(levelSelect.value, 10);
        saveHeroRank(hero.name, rankIndex, level);
    };

    modal.style.display = 'flex';
    document.getElementById('modal-close').focus();
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

function getRoles(hero) {
    return Array.isArray(hero.role) ? hero.role : [hero.role];
}