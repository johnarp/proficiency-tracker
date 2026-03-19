// announcement.js
// Loaded once by views.js after the initial view renders.
// Reads meta.json for an optional { announcement } object.
// If the announcement's id has not been seen before, shows the global modal.
// Once dismissed, the id is stored in localStorage so it never appears again.

(async () => {
    let meta;
    try {
        const r = await fetch('./app/meta.json');
        meta = await r.json();
    } catch {
        return;
    }

    // Support both object { ... } and array [ { ... } ] formats.
    const raw = meta.announcement;
    const ann = Array.isArray(raw) ? raw[0] : raw;
    if (!ann || !ann.id) return;

    const SEEN_KEY = 'announcement_seen';
    if (localStorage.getItem(SEEN_KEY) === String(ann.id)) return;

    // Build body content — one <p> per line in ann.body.
    const textWrap = document.createElement('div');
    textWrap.className = 'modal-text';
    const lines = Array.isArray(ann.body) ? ann.body : [ann.body];
    lines.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        textWrap.appendChild(p);
    });

    if (typeof showModal === 'function') {
        showModal({
            tag:        ann.tag   || 'Announcement',
            title:      ann.title || undefined,
            image:      ann.image || undefined,
            content:    textWrap,
            closeLabel: 'Acknowledged',
            onClose:    () => localStorage.setItem(SEEN_KEY, String(ann.id)),
        });
    }
})();