#!/usr/bin/env python3
"""Generate the site's SOTO Korean CSVs from the mod's base UI_KO.txt."""

from __future__ import annotations

import argparse
import csv
import re
import sys
import zipfile
from pathlib import Path

UI_KO_SUFFIX = (
    "SimpleOverhaulTraitsAndOccupations/media/lua/shared/Translate/KO/UI_KO.txt"
)
ASSIGNMENT = re.compile(
    r'^\s*([A-Za-z0-9_]+)\s*=\s*"((?:\\.|[^"\\])*)"\s*,?\s*(?:--.*)?$'
)
KOREAN = re.compile(r"[가-힣]")


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def decode_lua_string(value: str) -> str:
    replacements = {
        r"\\": "\\",
        r"\"": '"',
        r"\n": "<br>",
        r"\r": "",
        r"\t": " ",
    }
    return re.sub(
        r"\\(?:\\|\"|n|r|t)",
        lambda match: replacements.get(match.group(0), match.group(0)),
        value,
    )


def read_ui_ko(source: Path) -> str:
    if source.is_file() and zipfile.is_zipfile(source):
        with zipfile.ZipFile(source) as archive:
            matches = [
                name
                for name in archive.namelist()
                if name.replace("\\", "/").endswith(UI_KO_SUFFIX)
            ]
            if len(matches) != 1:
                raise RuntimeError(
                    f"기본 경로의 UI_KO.txt를 하나만 찾을 수 있어야 합니다: {matches}"
                )
            return archive.read(matches[0]).decode("utf-8-sig")

    expected = source / UI_KO_SUFFIX
    if expected.is_file():
        return expected.read_text(encoding="utf-8-sig")

    matches = [
        path
        for path in source.rglob("UI_KO.txt")
        if path.as_posix().endswith(UI_KO_SUFFIX)
    ]
    if len(matches) != 1:
        raise RuntimeError(
            f"기본 경로의 UI_KO.txt를 하나만 찾을 수 있어야 합니다: {matches}"
        )
    return matches[0].read_text(encoding="utf-8-sig")


def parse_assignments(text: str) -> dict[str, str]:
    translations: dict[str, str] = {}
    for line_number, line in enumerate(text.splitlines(), start=1):
        match = ASSIGNMENT.match(line)
        if not match:
            continue
        key, raw_value = match.groups()
        value = decode_lua_string(raw_value).strip()
        if KOREAN.search(value):
            translations[key] = value

    if not translations:
        raise RuntimeError("UI_KO.txt에서 한국어 UI 번역을 찾지 못했습니다.")
    return translations


def build_indexes(
    translations: dict[str, str],
) -> tuple[dict[str, str], dict[str, str], dict[str, str], dict[str, str]]:
    trait_names: dict[str, str] = {}
    trait_descriptions: dict[str, str] = {}
    job_names: dict[str, str] = {}
    job_descriptions: dict[str, str] = {}

    for key, value in translations.items():
        lowered = key.lower()
        if lowered.startswith("ui_trait_"):
            item = key[len("UI_trait_") :]
            destination = trait_descriptions if item.lower().endswith("desc") else trait_names
            if item.lower().endswith("desc"):
                item = item[:-4]
            destination[normalize(item)] = value
        elif lowered.startswith("ui_profdesc_"):
            item = key[len("UI_profdesc_") :]
            job_descriptions[normalize(item)] = value
        elif lowered.startswith("ui_prof_"):
            item = key[len("UI_prof_") :]
            destination = job_descriptions if item.lower().endswith("desc") else job_names
            if item.lower().endswith("desc"):
                item = item[:-4]
            destination[normalize(item)] = value

    return trait_names, trait_descriptions, job_names, job_descriptions


def read_data_keys(path: Path) -> list[str]:
    with path.open(encoding="utf-8-sig", newline="") as source:
        return [
            row["항목"].strip()
            for row in csv.DictReader(source)
            if row.get("항목", "").strip()
        ]


def read_fallback(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8-sig", newline="") as source:
        return {
            row["key"].strip(): row
            for row in csv.DictReader(source)
            if row.get("key", "").strip()
        }


def write_names(
    path: Path, keys: list[str], ui_values: dict[str, str]
) -> tuple[int, list[str]]:
    fallback = read_fallback(path)
    matched = 0
    missing: list[str] = []
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=["key", "ko", "en"])
        writer.writeheader()
        for key in keys:
            source_value = ui_values.get(normalize(key), "")
            if source_value:
                matched += 1
            else:
                missing.append(key)
            previous = fallback.get(key, {})
            writer.writerow(
                {
                    "key": key,
                    "ko": source_value or previous.get("ko", ""),
                    "en": previous.get("en", ""),
                }
            )
    return matched, missing


def write_descriptions(
    path: Path,
    trait_keys: list[str],
    job_keys: list[str],
    trait_values: dict[str, str],
    job_values: dict[str, str],
) -> tuple[int, list[str]]:
    fallback = read_fallback(path)
    matched = 0
    missing: list[str] = []
    with path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=["key", "ko", "en"])
        writer.writeheader()
        for key, values in [
            *((key, trait_values) for key in trait_keys),
            *((key, job_values) for key in job_keys),
        ]:
            source_value = values.get(normalize(key), "")
            if source_value:
                matched += 1
            else:
                missing.append(key)
            previous = fallback.get(key, {})
            writer.writerow(
                {
                    "key": key,
                    "ko": source_value or previous.get("ko", ""),
                    "en": previous.get("en", ""),
                }
            )
    return matched, missing


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "source",
        type=Path,
        help="mods.zip 또는 압축을 푼 모드 상위 폴더",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data"),
        help="사이트 CSV 폴더 (기본값: data)",
    )
    args = parser.parse_args()

    translations = parse_assignments(read_ui_ko(args.source))
    trait_names, trait_descriptions, job_names, job_descriptions = build_indexes(
        translations
    )
    trait_keys = read_data_keys(args.data_dir / "soto_traits.csv")
    job_keys = read_data_keys(args.data_dir / "soto_jobs.csv")

    results = {
        "직업 이름": write_names(
            args.data_dir / "soto_translations_jobs.csv", job_keys, job_names
        ),
        "특성 이름": write_names(
            args.data_dir / "soto_translations_traits.csv", trait_keys, trait_names
        ),
        "설명": write_descriptions(
            args.data_dir / "soto_translations_desc.csv",
            trait_keys,
            job_keys,
            trait_descriptions,
            job_descriptions,
        ),
    }

    for label, (matched, missing) in results.items():
        print(f"{label}: UI_KO {matched}개 매칭, fallback {len(missing)}개")
        if missing:
            print("  " + ", ".join(missing), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
