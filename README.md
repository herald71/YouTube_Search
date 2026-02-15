# 🎬 YouTube Search Pro

> **유튜브 동영상 검색 & 엑셀 저장 도구**  
> YouTube Data API v3를 활용하여 동영상을 검색하고, 결과를 엑셀 파일로 다운로드할 수 있는 웹 애플리케이션입니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔍 **키워드 검색** | 검색어를 입력하여 관련 유튜브 동영상을 검색합니다 |
| 📺 **채널별 검색** | 특정 채널 ID로 해당 채널의 동영상만 필터링합니다 |
| 📅 **날짜 범위 지정** | 시작/종료 날짜를 설정하여 기간별 검색이 가능합니다 |
| 📊 **통계 대시보드** | 총 동영상 수, 총 조회수, 총 댓글수, 평균 조회수를 한눈에 보여줍니다 |
| 📥 **엑셀 다운로드** | 검색 결과를 `.xlsx` 엑셀 파일로 바로 다운로드할 수 있습니다 |
| 🖼️ **썸네일 미리보기** | 검색 결과 테이블에서 동영상 썸네일을 확인할 수 있습니다 |

---

## 🛠️ 기술 스택

- **HTML5** — 시맨틱 마크업 구조
- **CSS3** — 다크 테마, 글래스모피즘, 반응형 디자인
- **Vanilla JavaScript** — 프레임워크 없이 순수 JS로 구현
- **YouTube Data API v3** — 동영상 검색 및 상세 정보 조회
- **SheetJS (xlsx)** — 엑셀 파일 생성 및 다운로드

---

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/herald71/YouTube_Search.git
cd YouTube_Search
```

### 2. API 키 설정

프로젝트 루트에 `config.js` 파일을 생성하고 YouTube Data API 키를 입력합니다:

```javascript
const CONFIG = {
    YOUTUBE_API_KEY: '여기에_API_키를_입력하세요'
};
```

> ⚠️ **주의:** `config.js` 파일은 `.gitignore`에 포함되어 있으므로 GitHub에 업로드되지 않습니다. API 키를 안전하게 관리하세요!

### 3. YouTube Data API 키 발급 방법

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다
2. 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다
3. **API 및 서비스** > **라이브러리**에서 `YouTube Data API v3`를 검색하여 활성화합니다
4. **API 및 서비스** > **사용자 인증 정보**에서 **API 키**를 생성합니다
5. 생성된 키를 `config.js`에 붙여넣습니다

### 4. 실행

별도의 빌드 과정 없이 `index.html` 파일을 브라우저에서 열면 바로 사용할 수 있습니다.

```bash
# 방법 1: 직접 열기
start index.html

# 방법 2: Live Server 사용 (VS Code 확장)
# VS Code에서 index.html을 열고 우클릭 > "Open with Live Server"
```

---

## 📁 프로젝트 구조

```
YouTube_Search/
├── index.html      # 메인 HTML 페이지 (검색 폼, 결과 테이블, 통계 카드)
├── style.css       # 스타일시트 (다크 테마, 글래스모피즘, 애니메이션)
├── app.js          # 애플리케이션 로직 (API 호출, 데이터 처리, 엑셀 변환)
├── config.js       # API 키 설정 파일 (Git에서 제외됨)
├── .gitignore      # Git 추적 제외 파일 목록
└── README.md       # 프로젝트 설명 문서
```

---

## 📸 사용 방법

1. **검색 조건 입력** — 검색어 또는 채널 ID를 입력합니다 (하나 이상 필수)
2. **날짜 설정 (선택)** — 시작/종료 날짜로 검색 기간을 지정합니다
3. **검색 시작** — 🔍 버튼을 클릭하면 최대 200개의 동영상을 수집합니다
4. **결과 확인** — 통계 대시보드와 상세 테이블에서 결과를 확인합니다
5. **엑셀 다운로드** — 📥 버튼을 클릭하여 `.xlsx` 파일로 저장합니다

---

## 📋 엑셀 출력 항목

| 컬럼명 | 설명 |
|--------|------|
| Index | 순번 |
| Title | 동영상 제목 |
| Channel Title | 채널명 |
| Channel ID | 채널 고유 ID |
| Duration | 재생 시간 (HH:MM:SS) |
| Views | 조회수 |
| Comments | 댓글수 |
| URL | 동영상 링크 |
| Thumbnail URL | 썸네일 이미지 URL |
| Tags | 태그 목록 |
| Published Date | 업로드 날짜 |

---

## 📝 라이선스

이 프로젝트는 자유롭게 사용, 수정, 배포할 수 있습니다.

---

<p align="center">
  Made with ❤️ using YouTube Data API v3
</p>
