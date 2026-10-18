이미지 오류 원인: 기존 .gitattributes가 PNG를 Git LFS로 추적하여 GitHub Pages에서 이미지 대신 LFS 포인터가 제공될 수 있습니다.

수정: .gitattributes에서 이미지 확장자의 LFS 규칙을 제거했습니다.

Git 명령으로 기존 저장소에 반영할 경우:
git add .gitattributes
git rm --cached -r icons
git add icons
git commit -m "Fix images served as Git LFS pointers"
git push

주의: git add icons 후 git show :icons/Profession_nojob.png | head 명령 결과가 version https://git-lfs... 로 시작하면 아직 잘못된 것입니다.

GitHub 웹에서 업로드할 경우 icons 폴더의 이미지가 실제 PNG로 등록되어야 합니다. GitHub Pages 설정의 배포 원본도 확인하세요.
