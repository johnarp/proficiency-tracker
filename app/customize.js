// customize.js
// Logic for the customize view.
// All HTML structure lives in views/customize.html.

function initCustomizeView() {
    buildThemePicker();

    const rankColorsToggle = document.getElementById('setting-rank-colors');
    rankColorsToggle.checked = appSettings.rankColors;
    rankColorsToggle.addEventListener('change', () => {
        appSettings.rankColors = rankColorsToggle.checked;
    });
}

function buildThemePicker() {
    const picker = document.getElementById('theme-picker');
    picker.innerHTML = '';

    appSettings.themes.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'theme-btn' + (appSettings.theme === t.value ? ' active' : '');
        btn.textContent = t.label;
        btn.addEventListener('click', () => {
            appSettings.theme = t.value;
            document.documentElement.setAttribute('data-theme', t.value);
            picker.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        picker.appendChild(btn);
    });
}

window.initCustomizeView = initCustomizeView;