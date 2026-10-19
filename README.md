# PlaceON 모바일 웹 목업

순수 HTML5 · CSS3 · JavaScript(ES Modules)만 사용한 SPA 목업입니다. 외부 라이브러리가 없습니다.

## 실행

`fetch` 와 ES Module 을 쓰므로 `index.html` 을 더블클릭(file://)하면 동작하지 않습니다.

```bash
python -m http.server 8000     # 이후 http://localhost:8000 접속
```

**GitHub Pages**: 저장소 루트에 이 폴더의 내용을 올리고 Settings → Pages → Branch 를 지정하면 바로 동작합니다.

## 폴더 구조

```
index.html              앱 껍데기 (#appbar / <main id="content"> / #tabbar)
data/db.json            모든 데이터 (장소·카테고리·조건·소개 문구·초기값·지도 설정·탭)
components/templates.html   공용 HTML 조각(<template>)
css/                    base.css(토큰·레이아웃) · components.css(Button, Chip, Card …)
js/main.js              시작점: 데이터 로드 → 라우터 실행
js/core/                router · store · loader · ui · places(추천/검색 로직) · validators · actions
pages/<화면>/           화면마다 <화면>.html · .css · .js
  intro   01 서비스 소개         login  02 로그인        signup  03 회원가입
  home    04 홈(지도+추천 시트)   search 05 검색 결과      filter  06 검색 필터
  detail  07 장소 상세
  mypage  공통 셸 + prefs(08 취향) / favorites(09 즐겨찾기) / recent(10 최근 본 장소)
```

## 동작 방식

- 라우팅: `#/intro` `#/login` `#/signup` `#/home` `#/search` `#/filter` `#/detail/:id` `#/mypage/:section`
- 페이지 모듈 계약: `{ html, css, tab, bar(), mount(el, ctx), refresh?(ctx) }`
  → 라우터가 html/css 를 불러 `#content` 만 교체하고 `mount` 를 호출합니다.
- 전역 액션(`js/core/actions.js`): `data-nav`(이동) · `data-go-place`(상세) · `data-save`(즐겨찾기)

## 자주 하는 수정

| 하고 싶은 일 | 수정 위치 |
|---|---|
| 장소 추가·수정, 주소·운영시간·지도 핀 좌표(`pos`) | `data/db.json` → `places` |
| 카테고리·세부 조건·검색 반경 옵션 | `data/db.json` |
| 초기 취향·즐겨찾기·최근 본 장소 | `data/db.json` → `defaults` |
| 추천 점수 / 검색 규칙 | `js/core/places.js` |
| 색상·폰트 | `css/base.css` 의 `:root` |
| 특정 화면의 마크업/스타일/동작 | `pages/<화면>/` 의 html / css / js |

## 데모 팁

- 로그인: 형식이 맞는 이메일 + 아무 비밀번호
- 회원가입 실패 시연: 이메일을 `fail`로 시작하게 입력
