function getSelectedJobId() {
    var jobInput = document.querySelector('input[type="radio"]:checked');
    return jobInput ? jobInput.dataset.id : null;
}
function getSelectedTraitIds() {
    return Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(i => i.dataset.id)
        .filter(Boolean);
}

function serializeStateToUrl() {
    try {
        var params = new URLSearchParams();
        var job = getSelectedJobId();
        var traits = getSelectedTraitIds();

        if (typeof currentMode !== 'undefined' && currentMode === 'soto') params.set('mode', 'soto');
        if (job) params.set('job', job);
        if (traits.length) params.set('traits', traits.join(','));

        var newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        history.replaceState(null, '', newUrl);
    } catch (e) {
        console.warn('serializeStateToUrl failed', e);
    }
}

// vanilla(speeddemon) / SOTO(SpeedDemon) 처럼 대소문자·표기가 다른 id 도 같은 항목으로 복원
function urlKey(v) {
    return String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function loadStateFromUrl() {
    try {
        var params = new URLSearchParams(window.location.search);
        var job = params.get('job');
        var traits = params.get('traits') ? params.get('traits').split(',') : [];
        if (job || traits.length) {
            const jobKey = urlKey(job);
            if (job) {
                const jobInput = Array.from(document.querySelectorAll('input[type="radio"]'))
                    .find(i => i.dataset.id === job) ||
                    Array.from(document.querySelectorAll('input[type="radio"]'))
                    .find(i => urlKey(i.dataset.id) === jobKey);
                if (jobInput) jobInput.checked = true;
            }

            const traitKeys = new Set(traits.map(urlKey));
            document.querySelectorAll('input[type="checkbox"]').forEach(input => {
                if (traits.includes(input.dataset.id) || traitKeys.has(urlKey(input.dataset.id))) {
                    input.checked = true;
                }
            });
        }
    } catch (e) {
        console.warn('loadStateFromUrl failed', e);
    }
}
