function makeIconList(list, colorClass) {
    if (list.length === 0) return "";

    return list.map(icon => `
        <div class="flex flex-col items-center w-20">
            <img src="${icon.src}" class="w-12 h-12">
            <span class="text-xs text-center mt-1 ${colorClass}">
                ${icon.name}
            </span>
        </div>
    `).join("");
}

function renderPreview() {

    const preview = document.getElementById("preview-content");

    const jobHTML = window.currentJob
        ? `
        <div class="flex items-center gap-4">
            <img src="${window.currentJob.icon}" class="w-16 h-16">
            <div class="text-2xl font-bold">${window.currentJob.name}</div>
        </div>`
        : `<div class="text-gray-400">NA</div>`;

    const positiveIcons = window.currentResult.icons.filter(icon => icon.value < 0);
    const negativeIcons = window.currentResult.icons.filter(icon => icon.value > 0);
    const neutralIcons = window.currentResult.icons.filter(icon => icon.value === 0);

    const customStatsHTML = Object.entries(window.currentResult.customStats)
        .filter(([_, value]) => value !== 0)
        .map(([key, value]) => {
            const label = tr[CURRENTLANG][key] || key;

            return `
            <div class="grid grid-cols-[1fr_auto] items-center border rounded px-3 py-1">
                <span>${label}</span>
                <span class="font-bold text-green-600">${value > 0 ? "+" : ""}${value}</span>
            </div>
            `;
        })
        .join("");

    preview.innerHTML = `
        ${jobHTML}

        <div class="grid grid-cols-3 gap-4 text-center">

            <div class="border rounded p-3">
                <div class="font-bold">${tr[CURRENTLANG].strength}</div>
                <div class="text-2xl">
                    ${window.currentResult.strength}
                </div>
            </div>

            <div class="border rounded p-3">
                <div class="font-bold">${tr[CURRENTLANG].fitness}</div>
                <div class="text-2xl">
                    ${window.currentResult.fitness}
                </div>
            </div>

            <div class="border rounded p-3">
                <div class="font-bold">${tr[CURRENTLANG].sum}</div>
                <div class="text-2xl">
                    ${window.currentResult.sum}
                </div>
            </div>

        </div>
        <div class="grid grid-cols-3 gap-3">
            ${customStatsHTML}
        </div>

        <div>
            <div class="flex flex-wrap gap-4 mb-6">
                ${makeIconList(positiveIcons, "text-green-600")}
            </div>

            <div class="flex flex-wrap gap-4">
                ${makeIconList(negativeIcons, "text-red-600")}
            </div>

            <div class="flex flex-wrap gap-4">
                ${makeIconList(neutralIcons, "text-gray-600")}
            </div>
        </div>
    `;
}

async function download() {
    const node = document.getElementById("preview-content");

    try {
        await document.fonts.ready;
        const blob = await htmlToImage.toBlob(node, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: "#ffffff"
        });

        if (!blob) throw new Error("failed to create image blob.");

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `${window.currentJob?.name ?? "NA"}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);

        if (!window.ClipboardItem) {
            console.warn("faild to copy.");
            return;
        }

        await navigator.clipboard.write([
            new ClipboardItem({
                "image/png": blob
            })
        ]);
    } catch (err) {
        console.error(err);
        alert("failed to download.");
    }
}

document.getElementById("open-preview").addEventListener("click", () => {
    renderPreview();

    document
        .getElementById("preview-modal")
        .classList.remove("hidden");

    document
        .getElementById("preview-modal")
        .classList.add("flex");

});

document.getElementById("close-preview").addEventListener("click", () => {
    document
        .getElementById("preview-modal")
        .classList.add("hidden");

    document
        .getElementById("preview-modal")
        .classList.remove("flex");

});

document.getElementById("save-preview").addEventListener("click", () => {
    const buildName = document.getElementById("build-name").value;
    if (!buildName) {
        alert("failed to save: no build name.");
        return;
    }

    const url = window.location.href;
    saveBuild(buildName, url);
    refreshBuildList();
});

document.getElementById("download-preview").addEventListener("click", download);
