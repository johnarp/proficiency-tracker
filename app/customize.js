// customize.js
// Logic for the Customize view: theme picker and display toggles.
// Called by views.js via initCustomizeView().

function initCustomizeView() {
    buildThemePicker();
    bindToggle('setting-rank-colors', 'rankColors');
    bindToggle('setting-rank-icons',  'rankIcons');
    bindToggle('setting-hero-names',  'showHeroNames');
}

/** Build theme picker buttons from appSettings.themes. */
function buildThemePicker() {
    const picker = document.getElementById('theme-picker');
    picker.innerHTML = '';

    appSettings.themes.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'btn' + (appSettings.theme === t.value ? ' active' : '');
        btn.textContent = t.label;
        btn.addEventListener('click', () => {
            appSettings.theme = t.value;
            document.documentElement.setAttribute('data-theme', t.value);
            picker.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (typeof savePrefs === 'function') savePrefs();
        });
        picker.appendChild(btn);
    });
}

/**
 * Wire a toggle button to a boolean key on appSettings.
 * Sets the initial active state and saves on toggle.
 */
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