const CACHE_KEY = "pz-build-cache";
const select = document.getElementById("build-list");
function saveCache(cache) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function loadCache() {
    const json = localStorage.getItem(CACHE_KEY);

    if (!json) return {};

    try {
        return JSON.parse(json);
    } catch (e) {
        console.error("Failed to load cache:", e);
        return {};
    }
}

function saveBuild(name, url) {
    const cache = loadCache();
    cache[name] = url;
    saveCache(cache);
}

function deleteBuild(name) {
    const cache = loadCache();
    delete cache[name];
    saveCache(cache);
}

function refreshBuildList() {
    const select = document.getElementById("build-list");
    select.innerHTML = `<option id="build-list_placeholder" value="">${tr[CURRENTLANG].build_list_placeholder}</option>`;
    const cache = loadCache();

    for (const [name, url] of Object.entries(cache)) {
        const option = document.createElement("option");
        option.value = url;
        option.textContent = name;
        select.appendChild(option);
    }
}

document.getElementById("load-btn").addEventListener("click", () => {
    const url = select.value;
    if (!url) return;
    location.href = url;
});

document.getElementById("del-btn").addEventListener("click", () => {
    const name = select.options[select.selectedIndex].text;
    if (!name) return;

    deleteBuild(name);
    refreshBuildList();
});