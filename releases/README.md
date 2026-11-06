# 릴리스 노트

버전마다 무엇을 왜 바꿨는지 적는 곳입니다. `build.mjs`의 `VERSION`을 올려 main에 머지하면 `.github/workflows/release.yml`이 GitHub 릴리스를 만듭니다.

- 노트는 `releases/<VERSION>.md`에 둡니다(예: `releases/v0.39.md`). 첫 줄 `# v0.39 · 한 줄 요약`이 릴리스 제목, 나머지가 본문입니다.
- 이 파일이 없으면 그 머지를 만든 PR의 제목과 설명으로 릴리스를 만듭니다.
- 같은 버전의 릴리스가 이미 있으면 아무것도 하지 않습니다. 노트를 고치려면 GitHub의 릴리스 화면에서 고칩니다.
- 저장소를 Watch → Custom → Releases로 구독하면 새 릴리스가 나올 때 알림을 받습니다.
