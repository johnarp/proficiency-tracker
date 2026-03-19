// state.js
// Shared app state and settings — loaded first in index.html.
// Everything else can safely reference appSettings and heroState.

const appSettings = {
    theme:         '',
    rankColors:    false,
    rankIcons:     false,
    showHeroNames: false,
    showHeroLevel: false,
    cardSize:      'md',

    // Each theme: { label, value, type }
    // type: 'color' (default) | 'image'
    // Image themes can set a CSS background-image on <html> via data-theme.
    themes: [
        { label: 'Default', value: '',     type: 'color' },
        { label: 'Dark',    value: 'dark', type: 'color' },
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