// customize.js

function initCustomizeView() {
    buildThemePicker();

    const rankColorsBtn = document.getElementById('setting-rank-colors');
    rankColorsBtn.classList.toggle('active', appSettings.rankColors);

    rankColorsBtn.addEventListener('click', () => {
        appSettings.rankColors = !appSettings.rankColors;
        rankColorsBtn.classList.toggle('active', appSettings.rankColors);
        if (typeof savePrefs === 'function') savePrefs();
    });
}

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

window.initCustomizeView = initCustomizeView;