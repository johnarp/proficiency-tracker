// state.js
// Shared app settings, accessible by all views.

const appSettings = {
    theme:      '',       // current data-theme value, '' = default
    rankColors: false,

    // All available themes. Add new ones here.
    themes: [
        { label: 'Default', value: '' },
        { label: 'Dark',    value: 'dark' },
    ],
};