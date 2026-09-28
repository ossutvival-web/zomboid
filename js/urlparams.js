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

        if (typeof currentMode !== "undefined" && currentMode === "soto") {
            params.set("mode", "soto");
        }
        if (job) params.set('job', job);
        if (traits.length) params.set('traits', traits.join(','));

        var newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        history.replaceState(null, '', newUrl);
    } catch (e) {
        console.warn('serializeStateToUrl failed', e);
    }
}

function loadStateFromUrl() {
    try {
        var params = new URLSearchParams(window.location.search);
        var job = params.get('job');
        var traits = params.get('traits') ? params.get('traits').split(',') : [];
        var normalizedJob = typeof normalizeKey === "function" ? normalizeKey(job) : job;
        var normalizedTraits = traits.map(function (trait) {
            return typeof normalizeKey === "function" ? normalizeKey(trait) : trait;
        });
        if (job || traits.length) {
            const jobInput = Array.from(document.querySelectorAll('input[type="radio"][data-id]'))
                .find(function (input) {
                    var id = typeof normalizeKey === "function" ? normalizeKey(input.dataset.id) : input.dataset.id;
                    return id === normalizedJob;
                });
            if (jobInput) jobInput.checked = true;
            
            document.querySelectorAll('input[type="checkbox"]').forEach(input => {
                var id = typeof normalizeKey === "function" ? normalizeKey(input.dataset.id) : input.dataset.id;
                if (normalizedTraits.includes(id)) {
                    input.checked = true;
                }
            });
        }
    } catch (e) {
        console.warn('loadStateFromUrl failed', e);
    }
}
