# [project zomboid occupation and trait point calculator](https://amature0000.github.io/projectZBstats/)
이 프로젝트는 project zomboid의 특성 및 직업 포인트 계산기입니다.

# contribute
만약 잘못된 특성 이름, 특성 포인트, 특성 값 등의 오류를 발견했다면, [issue](https://github.com/amature0000/projectZBstats/issues)를 제출해 이 프로젝트에 기여할 수 있습니다.

# language support
Other languages are not supported, but you can change code slightly to support other languages.


### SOTO support
Added a B42 SOTO dataset and a Vanilla/SOTO mode switch. SOTO data is derived from the supplied SOTO 42.12 Lua files.

### SOTO 한국어 번역 갱신

SOTO 이름과 설명 CSV는 모드의 기본 한국어 UI 번역을 우선하여 생성한다. 버전별
폴더가 아니라 아래 기본 경로만 읽는다.

```text
SimpleOverhaulTraitsAndOccupations/media/lua/shared/Translate/KO/UI_KO.txt
```

`mods.zip`을 저장소 루트에 둔 뒤 실행한다.

```bash
python3 tools/generate_soto_translations.py mods.zip
```

스크립트는 `UI_trait_*`, `UI_trait_*desc`, `UI_prof_*`,
`UI_profdesc_*`를 SOTO 직업/특성 키와 정규화하여 매칭한다. `UI_KO.txt`에 없는
항목만 기존 SOTO CSV 값을 fallback으로 유지하며, 영어뿐인 값을 한국어로
취급하지 않는다.
