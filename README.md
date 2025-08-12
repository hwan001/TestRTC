# TestRTC

## Deployment

### Dev: docker-compose
- local
```sh
git clone https://github.com/hwan001/TestRTC.git
docker compose up -d --build --force-recreate
```

### Prod: Container 배포 (GitOps)
- UI
    - GitHub UI에서 Release 생성
    - 과정: GitHub → “Create a new release” → 태그 생성(or 선택) → Publish
    - 새 태그를 만들면:
        - push.tags: 'v*' 트리거 → 실행
        - 동시에 release.published 트리거 → 실행
        - (중복 가능, concurrency로 한 번만 실행하게 방지 가능)
- CLI
```sh
# 1. 변경 사항 커밋
git add .
git commit -m "배포: v1.2.3"

# 2. 태그 생성 (기존 커밋에 태그)
git tag v1.2.3

# 3. 커밋과 태그 함께 푸시
git push origin main --tags
```