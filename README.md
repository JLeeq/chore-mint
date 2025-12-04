# ChoreMint MVP

가족과 함께하는 할 일 관리 앱 (MVP 버전)

## 기술 스택

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend/Database**: Supabase (Auth, Database, Storage)
- **Routing**: react-router-dom
- **PWA**: vite-plugin-pwa (Service Worker, Offline Support)

## 프로젝트 구조

```
ver4/
├── web/                    # Vite React 앱
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.ts      # Supabase 클라이언트
│   │   ├── pages/
│   │   │   ├── App.tsx          # Google 로그인 페이지
│   │   │   ├── Dashboard.tsx   # 부모 대시보드 (가족 코드, 자녀 관리, 승인)
│   │   │   └── ChildUpload.tsx  # 자녀 사진 업로드 페이지
│   │   ├── main.tsx             # 라우팅 설정
│   │   └── index.css            # Tailwind CSS
│   ├── .env.local              # 환경 변수 (Supabase URL/Key)
│   └── package.json
└── supabase/
    └── sql/
        └── init.sql            # 데이터베이스 스키마, RLS, 트리거, RPC
```

## 주요 기능

1. **부모 로그인**: Google OAuth로 로그인 → 자동으로 가족 생성 및 가족 코드 표시
2. **자녀 추가**: 부모가 자녀를 닉네임 + PIN으로 추가
3. **사진 업로드**: 자녀가 PIN을 입력하고 사진을 업로드 → `status=pending` 제출 생성
4. **승인**: 부모가 제출물을 승인 → `status=approved` 및 자동으로 +10점 추가

## 설정 방법

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/sql/init.sql` 파일의 내용을 실행
3. Storage에서 `photos` 버킷이 생성되었는지 확인

### 2. 환경 변수 설정

`web/.env.local` 파일을 생성하고 다음을 입력:

```env
VITE_SUPABASE_URL="https://YOUR-PROJECT-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR-ANON-KEY"
```

Supabase 프로젝트 설정 → API에서 URL과 anon key를 복사하세요.

### 3. Google OAuth 설정

1. Supabase Dashboard → Authentication → Providers
2. Google 제공업체 활성화
3. Google Cloud Console에서 OAuth 클라이언트 생성
4. Client ID와 Client Secret을 Supabase에 입력

### 4. PWA 아이콘 생성 (선택사항)

PWA 아이콘을 생성하려면 `web/public/` 폴더에 다음 파일들을 추가하세요:
- `pwa-64x64.png`
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-icon-512x512.png`
- `apple-touch-icon.png` (180x180)

온라인 도구 사용: [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)

### 5. 의존성 설치 및 실행

```bash
cd web
npm install
npm run dev
```

### 6. PWA 빌드

```bash
npm run build
npm run preview  # 로컬에서 빌드된 앱 테스트
```

빌드 후 `dist/` 폴더에 Service Worker와 매니페스트가 자동 생성됩니다.

## 사용 방법

1. **부모**: `/` 경로에서 Google로 로그인 → 자동으로 가족 생성 및 가족 코드 표시
2. **자녀 추가**: 대시보드에서 닉네임과 PIN 입력 후 추가
3. **자녀**: `/upload` 경로에서 PIN 입력 후 사진 업로드
4. **승인**: 대시보드에서 승인 대기 목록을 확인하고 승인 버튼 클릭 → 자동으로 +10점 추가

## 데이터베이스 구조

- **families**: 가족 정보 (parent_id, family_code)
- **children**: 자녀 정보 (family_id, nickname, pin, points)
- **submissions**: 제출물 (child_id, family_id, photo_url, status)

## 주요 트리거 및 함수

- `ensure_family_exists()`: 부모 로그인 시 자동으로 가족 생성
- `update_child_points()`: 제출물 승인 시 자동으로 +10점 추가
- `generate_family_code()`: 고유한 6자리 가족 코드 생성

## PWA 기능

- **오프라인 지원**: Service Worker를 통한 오프라인 캐싱
- **홈 화면 추가**: 모바일에서 홈 화면에 추가 가능
- **앱처럼 사용**: Standalone 모드로 네이티브 앱처럼 동작
- **자동 업데이트**: 새 버전 자동 감지 및 업데이트
- **Supabase 캐싱**: 네트워크 우선 전략으로 API 응답 캐싱

