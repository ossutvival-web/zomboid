// ===== 상수 정의 =====
const CONSTANTS = {
    IGNORE_KEYS: ['value', 'str', 'fit', 'displayName', 'iconsrc', 'banned', 'id'],
    DEFAULT_STATS: { strength: 5, fitness: 5 },
    STAT_LIMIT: 10
};

// ===== 전역 변수 =====
const positiveDiv = document.getElementById('positive-items');
const negativeDiv = document.getElementById('negative-items');
const jobsDiv = document.getElementById('jobs');
const resultPanel = document.getElementById("result-panel");
const CURRENTLANG = 'ko';

let all_jobs = [];
let all_traits = [];
let soto_jobs = [];
let soto_traits = [];
let soto_tr_jobs = { ko: {}, en: {} };
let soto_tr_traits = { ko: {}, en: {} };
let soto_descriptions = { ko: {}, en: {} };
let currentMode = "vanilla";
let tr = { ko: {}, en: {} };
let tr_jobs = { ko: {}, en: {} };
let tr_traits = { ko: {}, en: {} };
let descriptions = { ko: {}, en: {} };

let extraStats = {};
let selectedIcons = [];


async function loadCSV(path) {
    return new Promise((resolve, reject) => {
        Papa.parse(path, {
            download: true,
            header: true,
            complete: resolve,
            error: reject
        });
    });
}

async function loadData() {
    const [trResult, trJobResult, trTraitResult, descResult, jobsResult, traitsResult, sotoJobsResult, sotoTraitsResult, sotoJobTrResult, sotoTraitTrResult, sotoDescResult] = await Promise.all([
        loadCSV("data/translations.csv"),
        loadCSV("data/translations_jobs.csv"),
        loadCSV("data/translations_traits.csv"),
        loadCSV("data/translations_desc.csv"),
        loadCSV("data/jobs.csv"),
        loadCSV("data/traits.csv"),
        loadCSV("data/soto_jobs.csv"),
        loadCSV("data/soto_traits.csv"),
        loadCSV("data/soto_translations_jobs.csv"),
        loadCSV("data/soto_translations_traits.csv"),
        loadCSV("data/soto_translations_desc.csv")
    ]);

    trResult.data.forEach(row => {
        const key = (row.key || "").trim();
        if (!tr.ko[key]) tr.ko[key] = (row.ko || "").trim();
        if (!tr.en[key]) tr.en[key] = (row.en || "").trim();
    });

    trJobResult.data.forEach(row => {
        const key = (row.key || "").trim();
        if (!tr_jobs.ko[key]) tr_jobs.ko[key] = (row.ko || "").trim();
        if (!tr_jobs.en[key]) tr_jobs.en[key] = (row.en || "").trim();
    });

    trTraitResult.data.forEach(row => {
        const key = (row.key || "").trim();
        if (!tr_traits.ko[key]) tr_traits.ko[key] = (row.ko || "").trim();
        if (!tr_traits.en[key]) tr_traits.en[key] = (row.en || "").trim();
    });

    descResult.data.forEach(row => {
        const key = (row.key || "").trim();
        if (row.ko) descriptions.ko[key] = row.ko.trim();
        if (row.en) descriptions.en[key] = row.en.trim();
    });

    all_jobs = jobsResult.data;
    all_traits = traitsResult.data;
    soto_jobs = sotoJobsResult.data;
    soto_traits = sotoTraitsResult.data;
    sotoJobTrResult.data.forEach(row => {
        const key=(row.key||"").trim(); if(key){ soto_tr_jobs.ko[key]=(row.ko||"").trim(); soto_tr_jobs.en[key]=(row.en||"").trim(); }
    });
    sotoTraitTrResult.data.forEach(row => {
        const key=(row.key||"").trim(); if(key){ soto_tr_traits.ko[key]=(row.ko||"").trim(); soto_tr_traits.en[key]=(row.en||"").trim(); }
    });
    sotoDescResult.data.forEach(row => {
        const key=(row.key||"").trim(); if(key){ soto_descriptions.ko[key]=(row.ko||"").trim(); soto_descriptions.en[key]=(row.en||"").trim(); }
    });
    document.getElementById("mode-vanilla")?.addEventListener("click", () => setMode("vanilla"));
    document.getElementById("mode-soto")?.addEventListener("click", () => setMode("soto"));
    renderUI();
}


// ===== 통계 파싱 =====
function parseStats(statsStr = "") {
    const stats = {};
    statsStr.split(";").forEach(pair => {
        const [key, value] = pair.split(":");
        if (key) stats[key] = parseInt(value) || 0;
    });
    return stats;
}

// ===== 데이터셋에서 불필요한 키 필터링 =====
function filterStats(dataset) {
    const customStats = {};
    Object.entries(dataset).forEach(([key, value]) => {
        if (!CONSTANTS.IGNORE_KEYS.includes(key)) {
            customStats[key] = parseInt(value) || 0;
        }
    });
    return customStats;
}

// ===== 옵션 생성 =====
function createOption(row, isJob) {
    const name = row["항목"];
    const modeNames = isJob ? soto_tr_jobs : soto_tr_traits;
    const displayName = (currentMode === "soto" ? modeNames[CURRENTLANG][name] : null) || (isJob ? tr_jobs[CURRENTLANG][name] : tr_traits[CURRENTLANG][name]) || name;
    const value = parseInt(row["값"]) || 0;
    const stats = parseStats(row.stats);
    const iconSrc = row.icon?.trim() || "default.png";
    const banned = row["금지항목"]?.trim() || "";

    const label = document.createElement("label");
    label.className = "flex items-center justify-between p-2 border rounded-lg cursor-pointer";

    const iconSize = isJob ? "w-16 h-16" : "w-6 h-6";
    const colorClass = !isJob ? (value >= 0 ? "text-red-600" : "text-green-600") : "";
    const displayValue = value >= 0 ? `+${value}` : value;
    const description = (currentMode === "soto" ? (soto_descriptions[CURRENTLANG][name] || "") : "") || descriptions[CURRENTLANG][name] || "";

    label.innerHTML = `
        <div class="flex items-center min-w-[150px]">
            <img src="${iconSrc}" class="${iconSize} mr-2">
            <span class="${colorClass}">${displayName} (${displayValue})</span>
        </div>
        <input
            type="${isJob ? "radio" : "checkbox"}"
            ${isJob ? 'name="job"' : ""}
            class="w-4 h-4">
    `;

    const input = label.querySelector("input");
    // 툴팁 설정: SOTO 직업/특성 모두 마우스를 올리면 설명 표시
    if (description) {
        label.dataset.title = description;
        const tooltip = document.getElementById('custom-tooltip');
        label.addEventListener('mouseenter', () => {
            tooltip.innerHTML = (label.dataset.title || '').replace(/<br\s*\/?>(?=.)/gi, '<br>');
            tooltip.style.display = 'block';
        });
        label.addEventListener('mousemove', (e) => {
            const pad = 15;
            const rect = tooltip.getBoundingClientRect();
            let x = e.clientX + pad;
            let y = e.clientY + pad;
            if (x + rect.width > window.innerWidth - 8) x = e.clientX - rect.width - pad;
            if (y + rect.height > window.innerHeight - 8) y = e.clientY - rect.height - pad;
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
        });
        label.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    }

    Object.entries(stats).forEach(([key, val]) => {
        input.dataset[key] = val;
    });
    input.dataset.banned = banned;
    input.dataset.displayName = displayName;
    input.dataset.iconsrc = iconSrc;
    input.dataset.value = value;
    input.dataset.id = name;

    input.addEventListener("change", () => {
        updateSum();
    });

    return { label, value };
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById("mode-vanilla")?.classList.toggle("bg-gray-800", mode === "vanilla");
    document.getElementById("mode-vanilla")?.classList.toggle("text-white", mode === "vanilla");
    document.getElementById("mode-soto")?.classList.toggle("bg-gray-800", mode === "soto");
    document.getElementById("mode-soto")?.classList.toggle("text-white", mode === "soto");
    renderUI();
}

// ===== UI 렌더링 =====
function renderUI() {
    jobsDiv.innerHTML = "";
    positiveDiv.innerHTML = "";
    negativeDiv.innerHTML = "";

    const jobs = currentMode === "soto" ? soto_jobs : all_jobs;
    const traits = currentMode === "soto" ? soto_traits : all_traits;

    jobs.forEach(row => {
        if (row["항목"]) {
            const option = createOption(row, true);
            jobsDiv.appendChild(option.label);
        }
    });

    traits.forEach(row => {
        if (row["항목"]) {
            const option = createOption(row, false);
            if (option.value >= 0)
                positiveDiv.appendChild(option.label);
            else
                negativeDiv.appendChild(option.label);
        }
    });
    
    document.getElementById("title_placeholder").innerText = tr[CURRENTLANG].title_placeholder;
    document.getElementById("job_placeholder").innerText = tr[CURRENTLANG].job_placeholder;
    document.getElementById("trait_placeholder").innerText = tr[CURRENTLANG].trait_placeholder;
    
    document.getElementById("load-btn").innerText = tr[CURRENTLANG].load;
    document.getElementById("del-btn").innerText = tr[CURRENTLANG].del;
    document.getElementById("rst-btn").innerText = tr[CURRENTLANG].reset;
    document.getElementById("bat-btn").innerText = tr[CURRENTLANG].bat;
    document.getElementById("open-preview").innerText = tr[CURRENTLANG].open_preview;

    document.getElementById("close-preview").innerText = tr[CURRENTLANG].close_preview;
    document.getElementById("save-preview").innerText = tr[CURRENTLANG].save_preview;
    document.getElementById("download-preview").innerText = tr[CURRENTLANG].download_preview;
    
    loadStateFromUrl();
    refreshBuildList();
    updateSum();
}

// ===== 특성 초기화 =====
function resetExtraStats() {
    Object.values(extraStats).forEach(div => div.remove());
    extraStats = {};
}

// ===== 결과 값 업데이트 =====
function updateResultDisplay(key, value, element) {
    element.classList.remove("text-red-600", "text-black-600", "text-green-600");

    if (key === "sum") {
        element.classList.add(value < 0 ? "text-red-600" : "text-green-600");
        element.innerText = `${tr[CURRENTLANG].sum} : ${value}`;
    } else {
        const isOutOfRange = value > CONSTANTS.STAT_LIMIT || value < 0;
        element.classList.add(isOutOfRange ? "text-red-600" : "text-black-600");
        element.innerText = `${tr[CURRENTLANG][key]} : ${value}/${CONSTANTS.STAT_LIMIT}`;
    }
}

// ===== 합계 계산 =====
function updateSum() {
    resetExtraStats();
    selectedIcons = [];

    let sum = 0;
    let strength = CONSTANTS.DEFAULT_STATS.strength;
    let fitness = CONSTANTS.DEFAULT_STATS.fitness;
    const statsTotal = {};
    const bannedTraits = new Set();
        
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        if (!input.checked) return;

        // 금지 특성 수집
        const banned = input.dataset.banned;
        if (banned) {
            banned.split(";").forEach(trait =>
                bannedTraits.add(trait.trim())
            );
        }

        // 아이콘 수집
        if(input.type == "radio") {
            window.currentJob = { name: input.dataset.displayName, icon: input.dataset.iconsrc };
        }
        if(input.type == "checkbox") {
            const { iconsrc, displayName } = input.dataset;
            if (iconsrc && displayName && !selectedIcons.some(icon => icon.src === iconsrc)) {
                selectedIcons.push({ src: iconsrc, name: displayName, value: parseInt(input.dataset.value) });
            }
        }

        // 기본 값 누적
        sum += parseInt(input.dataset.value) || 0;
        strength += parseInt(input.dataset.str) || 0;
        fitness += parseInt(input.dataset.fit) || 0;

        // 커스텀 통계 누적
        const customStats = filterStats(input.dataset);
        Object.entries(customStats).forEach(([key, value]) => {
            statsTotal[key] = (statsTotal[key] || 0) + value;
        });
    });

    // 결과 표시
    updateResultDisplay("sum", sum, document.getElementById("result-sum"));
    updateResultDisplay("strength", strength, document.getElementById("result-strength"));
    updateResultDisplay("fitness", fitness, document.getElementById("result-fitness"));

    // 동적 항목 표시
    Object.entries(statsTotal).forEach(([statName, value]) => {
        const label = tr[CURRENTLANG][statName] || statName;
        if (!extraStats[statName]) {
            const div = document.createElement('div');
            div.id = `result-${statName}`;
            div.className = `py-1 px-2 border rounded-xl bg-white shadow text-lg font-semibold text-center ${value === 0 ? "text-gray-500" : "text-green-600"}`;

            const iconContainer = document.getElementById('result-icons');
            if (iconContainer) {
                resultPanel.insertBefore(div, iconContainer);
            } else {
                resultPanel.appendChild(div);
            }
            extraStats[statName] = div;
        }
        extraStats[statName].innerText = value === 0 ? label : `${label} +${value}`;
    });
    disableButtons(bannedTraits);
    renderSelectedIcons();

    window.currentResult = {
        sum,
        strength,
        fitness,
        icons: [...selectedIcons],
        customStats: { ...statsTotal }
    };

    serializeStateToUrl();
}

// ===== 버튼 disable =====
function disableButtons(bannedTraits) {
    document.querySelectorAll('input[type="checkbox"]').forEach(input => {
        const id = input.dataset.id;

        if (bannedTraits.has(id)) {
            input.disabled = true;
            input.parentElement.classList.add("opacity-50");
            if (input.checked) {
                input.checked = false;
                updateSum();
            }
        } else {
            input.disabled = false;
            input.parentElement.classList.remove("opacity-50");
        }
    });
}

// ===== 아이콘 렌더링 =====
function renderSelectedIcons() {
    let iconContainer = document.getElementById("result-icons");
    if (!iconContainer) {
        iconContainer = document.createElement("div");
        iconContainer.id = "result-icons";
        iconContainer.className = "flex flex-wrap justify-center gap-2 p-2 border-t";
        resultPanel.appendChild(iconContainer);
    }

    iconContainer.innerHTML = "";
    selectedIcons.forEach(icon => {
        const img = document.createElement("img");
        img.src = icon.src;
        img.className = "w-6 h-6 rounded shadow";
        img.title = icon.name;
        iconContainer.appendChild(img);
    });
}

document.getElementById("rst-btn").addEventListener("click", () => {
    window.location.href = window.location.pathname;
});

// ===== 초기화 =====
loadData();

// ==========
// document.getElementById("lang-ko").addEventListener("click", () => {
//     currentLang = CONSTANTS.LANGUAGES.KO;
//     renderUI();
// });

// document.getElementById("lang-en").addEventListener("click", () => {
//     currentLang = CONSTANTS.LANGUAGES.EN;
//     renderUI();
// });
