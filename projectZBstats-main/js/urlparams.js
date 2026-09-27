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
        if (job || traits.length) {
            const jobInput = document.querySelector(`input[type="radio"][data-id="${job}"]`);
            if (jobInput) jobInput.checked = true;
            
            document.querySelectorAll('input[type="checkbox"]').forEach(input => {
                if (traits.includes(input.dataset.id)) {
                    input.checked = true;
                }
            });
        }
    } catch (e) {
        console.warn('loadStateFromUrl failed', e);
    }
}