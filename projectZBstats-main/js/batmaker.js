// let batmapper = {};

// Papa.parse("data/batmaker.csv", {
//     download: true,
//     header: true,
//     complete: (results) => {
//         results.data.forEach(row => {
//             if (row.key && row.value) {
//                 batmapper[row.key.trim()] = row.value.trim();
//             }
//         });
//     }
// });

function downloadBat() {
    const cache = loadCache();

    const lines = [];
    

    for (const [buildName, url] of Object.entries(cache)) {
        try {
            const parsedUrl = new URL(url, window.location.origin);
            const job = parsedUrl.searchParams.get("job") || "unemployed";
            const traits = parsedUrl.searchParams.get("traits");
            
            const traitList = traits ? traits.split(",").join(";") : "";
            const parsedName = buildName.replace(/[%!&|<>^]/g, "_");

            const value = `${parsedName}:${job};${traitList};`;

            lines.push(`SET "VALUE=${value}"`);

            lines.push(`echo %VALUE% >> saved_builds.txt`);
            lines.push("");
        } catch (e) {
            console.warn(`Failed to parse build URL: ${buildName}`, e);
        }
    }

    const batContent = [
        "@echo off",
        "chcp 65001 > nul",
        "cd /d \"%USERPROFILE%/Zomboid/Lua\"\n",
        "echo. > saved_builds.txt\n",
        ...lines
    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF", batContent],
        { type: "application/bat" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "apply_saved_builds.bat";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

document.getElementById("bat-btn").addEventListener("click", () => {
    downloadBat();
    alert("다운로드된 .bat 파일을 실행하면 빌드 목록들을 게임에 적용합니다. 게임에 저장된 빌드 목록은 초기화됩니다.");
});