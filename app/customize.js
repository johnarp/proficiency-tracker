// customize.js
// Logic for the customize view.
// All HTML structure lives in views/customize.html.
// Called by views.js via initCustomizeView().

function initCustomizeView() {
    const rankColorsToggle = document.getElementById('setting-rank-colors');

    // Restore current setting state
    rankColorsToggle.checked = appSettings.rankColors;

    rankColorsToggle.addEventListener('change', () => {
        appSettings.rankColors = rankColorsToggle.checked;
    });
}

window.initCustomizeView = initCustomizeView;