#!/usr/bin/env python3
"""SOTO 한국어 번역 매핑 생성기.

SOTO 모드의 Translate/KO/UI_KO.txt(UTF-16)를 직접 파싱해서
data/soto_i18n.csv 를 만든다. 사이트는 이 파일 하나만 SOTO 번역 원본으로 사용한다.

사용법:
  python3 tools/build_soto_i18n.py <UI_KO.txt 경로>
  (생략하면 mods 폴더 기본 경로를 찾는다)

우선순위
  특성 이름: 1) Vanilla 한국어  2) SOTO UI_KO  3) 기존 soto_translations_* CSV(한국어일 때만)  4) 원래 key
  설명     : 1) SOTO UI_KO     2) Vanilla 설명  3) 기존 soto_translations_desc.csv(한국어일 때만)  4) 빈 값
  직업 이름: 1) Vanilla 한국어  2) SOTO UI_KO  3) 기존 CSV  4) 원래 key
"""
import csv, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
DEFAULT_UI = "SimpleOverhaulTraitsAndOccupations/media/lua/shared/Translate/KO/UI_KO.txt"

def norm(s): return re.sub(r"[^a-z0-9]", "", str(s).lower())
def is_ko(s): return bool(re.search(r"[가-힣]", s or ""))
def rd(name): return list(csv.DictReader(open(os.path.join(DATA, name), encoding="utf-8-sig")))

# --- SOTO 내부 naming 이 UI_KO key 와 다른 경우(눈으로 확인한 것만 등록; 비슷하다고 자동 병합하지 않음) ---
# SOTO trait key(정규화) -> UI_KO 의 trait key(정규화) 후보
TRAIT_UI_ALIAS = {
    "optimist": ["optimistmood"], "depressive": ["depressivemood"],
    "dextrous": ["dexterous"],
    "smoker": ["sosmoker"], "hiker": ["sohiker"],
    "pronetoillness": ["pronetoillness2"], "gardener": ["gardener2"],
    "firstaid": ["firstaid2"], "gymnast": ["gymnast2"], "hemophobic": ["hemophobic2"],
    "breathingtech2": ["breathingtech"], "shooter": ["shooter2"],
}
# 이름이 아니라 "설명"에만 쓰는 alias (UI_KO 가 이름은 안 주고 Desc 만 주는 경우)
JOB_SUFFIXES = ["occ", "profession"]

def parse_ui(path):
    text = open(path, encoding="utf-16").read()   # BOM 포함 UTF-16
    out = {}
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("--"): continue
        m = re.match(r'([A-Za-z0-9_]+)\s*=\s*"(.*)"\s*,?\s*(--.*)?$', s)
        if m: out[m.group(1)] = m.group(2)
    return out

def main():
    ui_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not ui_path:
        for base in (ROOT, os.path.dirname(ROOT), os.getcwd()):
            for dp, _, fs in os.walk(base):
                if dp.replace("\\", "/").endswith("shared/Translate/KO") and "UI_KO.txt" in fs and "_OLD" not in dp:
                    ui_path = os.path.join(dp, "UI_KO.txt"); break
            if ui_path: break
    ui = parse_ui(ui_path)
    print("UI_KO:", ui_path, len(ui), "entries")

    ui_trait_name, ui_trait_desc, ui_prof_name, ui_prof_desc = {}, {}, {}, {}
    for k, v in ui.items():
        m = re.match(r"UI_trait_(.+?)(desc\d?)?$", k, re.I) if k.startswith("UI_trait_") else None
        if m:
            (ui_trait_desc if m.group(2) else ui_trait_name)[norm(m.group(1))] = v
            continue
        m = re.match(r"UI_profdesc_(.+)$", k)
        if m: ui_prof_desc[norm(m.group(1))] = v; continue
        m = re.match(r"UI_prof_(.+)$", k)
        if m: ui_prof_name[norm(m.group(1))] = v
    # "UI_trait_xxxDesc2" 처럼 이름 규칙이 어긋난 desc 보정: 위 정규식이 desc 로 인식하므로 OK

    v_tr = {norm(r["key"]): r["ko"].strip() for r in rd("translations_traits.csv")}
    v_desc = {norm(r["key"]): r["ko"].strip() for r in rd("translations_desc.csv") if r["ko"].strip()}
    v_job = {norm(r["key"]): r["ko"].strip() for r in rd("translations_jobs.csv")}
    c_tr = {norm(r["key"]): r["ko"].strip() for r in rd("soto_translations_traits.csv")}
    c_job = {norm(r["key"]): r["ko"].strip() for r in rd("soto_translations_jobs.csv")}
    c_desc = {norm(r["key"]): r["ko"].strip() for r in rd("soto_translations_desc.csv")}

    soto_traits = [r["항목"].strip() for r in rd("soto_traits.csv") if r["항목"].strip()]
    soto_jobs = [r["항목"].strip() for r in rd("soto_jobs.csv") if r["항목"].strip()]
    trait_norms = {norm(k) for k in soto_traits}
    rows, report = [], {"name_src": {}, "desc_src": {}, "unresolved": [], "conflicts": []}

    def first(*cands):
        for src, val in cands:
            if val and is_ko(val): return val, src
        return "", ""

    def trait_ui(nk, table):
        for cand in [nk] + TRAIT_UI_ALIAS.get(nk, []):
            if cand in table: return table[cand]
        return ""

    for key in soto_traits:
        nk = norm(key)
        name, nsrc = first(("vanilla", v_tr.get(nk)), ("UI_KO", trait_ui(nk, ui_trait_name)), ("csv", c_tr.get(nk)))
        if not name: name, nsrc = key, "key(미번역)"; report["unresolved"].append(("trait-name", key))
        desc, dsrc = first(("UI_KO", trait_ui(nk, ui_trait_desc)), ("vanilla", v_desc.get(nk)), ("csv", c_desc.get(nk)))
        if desc.strip() == name.strip(): desc, dsrc = "", ""   # 이름을 그대로 복사한 가짜 설명 제거
        if v_tr.get(nk) and c_tr.get(nk) and v_tr[nk] != c_tr[nk]:
            report["conflicts"].append((key, "vanilla=" + v_tr[nk], "csv=" + c_tr[nk]))
        rows.append(["trait", key, name, nsrc, desc, dsrc])

    for key in soto_jobs:
        nk = norm(key)
        stems = [nk] + [nk[: -len(s)] for s in JOB_SUFFIXES if nk.endswith(s)]
        uname = next((ui_prof_name[s] for s in stems if s in ui_prof_name), "")
        udesc = next((ui_prof_desc[s] for s in stems if s in ui_prof_desc), "")
        name, nsrc = first(("vanilla", v_job.get(nk)), ("UI_KO", uname), ("csv", c_job.get(nk)))
        if not name: name, nsrc = key, "key(미번역)"; report["unresolved"].append(("job-name", key))
        # 직업 key 가 특성 key 와 같으면(mechanics 등) csv 설명은 특성 설명이므로 쓰지 않는다
        desc, dsrc = first(("UI_KO", udesc), ("csv", None if nk in trait_norms else c_desc.get(nk)))
        if desc.strip() == name.strip(): desc, dsrc = "", ""
        rows.append(["job", key, name, nsrc, desc, dsrc])

    out = os.path.join(DATA, "soto_i18n.csv")
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f); w.writerow(["type", "key", "name_ko", "name_src", "desc_ko", "desc_src"]); w.writerows(rows)
    print("wrote", out, len(rows), "rows")

    for r in rows:
        report["name_src"].setdefault((r[0], r[3]), 0); report["name_src"][(r[0], r[3])] += 1
        report["desc_src"].setdefault((r[0], r[5] or "(없음)"), 0); report["desc_src"][(r[0], r[5] or "(없음)")] += 1
    print("\n이름 출처:", dict(report["name_src"]))
    print("설명 출처:", dict(report["desc_src"]))
    print("\n미번역:", report["unresolved"])
    print("\nVanilla 이름 vs 기존 SOTO csv 이름이 다른 항목(Vanilla 채택):")
    for c in report["conflicts"]: print("  ", *c)
    used = set()
    for r in rows:
        pass
    print("\n설명이 비어 있는 SOTO 항목:", [r[1] for r in rows if not r[4]])

if __name__ == "__main__":
    main()
