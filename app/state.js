// state.js
// Shared app state and settings — loaded first in index.html.
// Everything else can safely reference appSettings and heroState.

const appSettings = {
    theme:         '',
    rankColors:    false,
    rankIcons:     false,
    showHeroNames: false,
    cardSize:      'md',

    themes: [
        { label: 'Default', value: '' },
        { label: 'Dark',    value: 'dark' },
    ],
};

// Hero rank progress — populated by heroes.js, persisted by settings.js.
// Lives here so settings.js can read/write it before heroes.js is loaded.
const heroState = {
    heroes:    [],
    ranks:     [],
    heroRanks: {},
    filter: { role: 'all' },
    sort:   { by: 'name', dir: 'asc' },
};