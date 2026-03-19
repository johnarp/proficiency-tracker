// customize.js
// Logic for the Customize view: theme picker and display toggles.
// Theme buttons live in customize.html with data-theme attributes.
// To add a theme: add a button in the HTML and a CSS block. That's it.
// Called by views.js via initCustomizeView().

function initCustomizeView() {
    bindThemePicker();
    bindToggle('setting-rank-colors', 'rankColors');
    bindToggle('setting-rank-icons',  'rankIcons');
    bindToggle('setting-hero-names',  'showHeroNames');
    bindToggle('setting-hero-level',  'showHeroLevel');
}

/** Set the active class on whichever button matches the current theme. */
function updateActiveTheme() {
    document.querySelectorAll('button[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === appSettings.theme);
    });
}

/** Wire all [data-theme] buttons in the view. */
function bindThemePicker() {
    updateActiveTheme();
    document.querySelectorAll('button[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
            appSettings.theme = btn.dataset.theme;
            document.documentElement.setAttribute('data-theme', btn.dataset.theme);
            updateActiveTheme();
            if (typeof savePrefs === 'function') savePrefs();
        });
    });
}

/** Wire a toggle button to a boolean key on appSettings. */
function bindToggle(btnId, settingKey) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle('active', !!appSettings[settingKey]);
    btn.addEventListener('click', () => {
        appSettings[settingKey] = !appSettings[settingKey];
        btn.classList.toggle('active', appSettings[settingKey]);
        if (typeof savePrefs === 'function') savePrefs();
    });
}

window.initCustomizeView = initCustomizeView;