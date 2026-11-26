/* js/ui.js — 공통 조각(버튼·카드·이미지) · 앱바 */
/* ───────── 공통 조각 ───────── */
const btn = (label, a, cls = '') => `<button type="button" class="b ${cls}" data-a="${esc(a)}">${label}</button>`;     // label 은 코드에서 만든 문구만 (데이터 값은 esc 후 전달)
const chip = (label, on, a) => `<button type="button" class="c ${on ? 'on' : ''}" data-a="${esc(a)}">${on ? '✓ ' : ''}${esc(label)}</button>`;
const IMG_BASE = 'assets/Image/';            // 폴더 이름은 대소문자까지 실제와 같아야 함 (GitHub Pages 는 대소문자 구분)
const PHOTOS = {                              // 카테고리 → [폴더, 파일명 목록(확장자 포함)]  (이미지가 없는 카테고리는 플레이스홀더)
  '카페/디저트': ['Cafe', ['Cafe_Exterior_1.png', 'Cafe_Exterior_2.png', 'Cafe_Interior_1.png', 'Cafe_Interior_2.png', 'Cafe_Interior_3.png']],
  '음식점': ['restuarant', ['Restaurant_Detail_1.png', 'Restaurant_Exterior_1.png', 'Restaurant_Exterior_2.png', 'Restaurant_Interior_1.png',
    'Restaurant_Interior_2.png', 'Restaurant_Interior_3.jpg', 'Restaurant_Interior_4.png']],
  '뷰티/미용': ['beauty_cosmetology', ['Beauty_1.png', 'Beauty_2.png', 'Beauty_3.jpg', 'Cosmetology_1.png', 'Cosmetology_2.jpg', 'Cosmetology_3.png']],
  '쇼핑': ['shoping', ['Shopping_1.png', 'LineFriendsSquareMyeongdong_interior.jpg', 'Myeongdong_Flower_Shop_Exterior.jpg',
    'Myeongdong_Flower_Shop_Interior.jpg', 'Veronica_Flower_Shop_Interior.jpg']],
  '문화/여가': ['entertainment', ['Entertainment_1.png', 'Entertainment_2.png', 'Entertainment_3.png', 'Entertainment_4.jpg', 'Entertainment_5.jpg', 'Entertainment_6.jpg']] };
const photoOf = p => { const e = PHOTOS[p.category]; if (!e) return '';
  return `${IMG_BASE}${e[0]}/${e[1][Math.floor(((p.id * 2654435761) >>> 0) / 4294967296 * e[1].length)]}`; };
const thumb = (p, cls = '') => { const src = photoOf(p);   // 이미지가 없거나 불러오지 못하면 아래 흑백 플레이스홀더가 그대로 보임
  return `<div class="thumb ${cls}" aria-hidden="true"><span>${cls === 'h' ? '장소 이미지' : '이미지'}</span>${src ? `<img src="${src}" alt="" loading="lazy" onload="this.style.opacity=1" onerror="this.remove()">` : ''}</div>`; };
const img = (t, cls = '') => `<div class="img ${cls}"><span>${t}</span></div>`;
const fmtTime = t => new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
const dayDiff = t => { const a = new Date(t), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); return Math.round((b - a) / 864e5); };
const dirty = () => JSON.stringify(S.pdraft) !== JSON.stringify(S.prefs);
const empty = (t, s, b = '') => `<div class="dash"><p>${t}</p><p>${s}</p>${b}</div>`;
const moreBtn = (key, total) => total > pageOf(S.shown[key]) ? btn(`더 보기 (${total - pageOf(S.shown[key])}곳 남음)`, 'more:' + key, 'sm') : '';

function pcard(p, { mode = 'list', time = '' } = {}) {      // 장소 데이터는 모두 esc 해서 넣음
  const saved = S.saved.has(p.id);
  const top = mode === 'list' ? `<button type="button" class="s ${saved ? 'on' : ''}" data-a="save:${p.id}">${saved ? '저장됨' : '저장'}</button>` : '';
  const foot = mode === 'fav'
    ? `<div class="bt"><span>상세 보기 →</span><button type="button" class="b sm" data-a="save:${p.id}">저장 해제</button></div>`
    : mode === 'recent'
    ? `<div class="bt"><span>상세 보기 →</span><button type="button" class="b sm" data-a="place:${p.id}">상세 이동</button></div>` : '';
  return `<div class="card" data-a="place:${p.id}">${thumb(p)}<div class="bd">
    ${time ? `<div class="sub">${time}</div>` : ''}<div class="bt"><span class="nm">${esc(p.name)}</span>${top}</div>
    <div class="row meta"><span class="badge">${esc(p.category)}</span><span class="sub">${esc(p.type || '업태 정보 없음')}</span></div>
    <div class="sub">내 위치에서 ${distText(p)} · ${esc(p.area || '지역 정보 없음')} · ${esc(floorText(p))}</div>${cardNote(p)}${foot}</div></div>`;
}

const GEAR = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
const userBlock = seg => `
  <div class="bt"><div class="user">${img('')}<div class="g"><p class="h2">${esc(S.loginNick || '사용자')}님</p></div></div>
    <button type="button" class="b sm" data-a="go:11">${GEAR}설정</button></div>
  <div class="sg">${[['09', '즐겨찾기'], ['10', '최근 본 장소']].map(([k, l]) =>
    `<button type="button" class="${seg === k ? 'on' : ''}" data-a="seg:${k}">${l}</button>`).join('')}</div>`;

/* ───────── 앱바 ───────── */
const logo = `<button type="button" class="logo" data-a="go:04" aria-label="홈으로">PlaceON</button>`;
const auth = () => S.user
  ? `<button type="button" class="auth" data-a="logout">로그아웃</button>`
  : `<button type="button" class="auth on" data-a="login">로그인</button>`;
const mainBar = () => `${logo}<span class="t"></span>${auth()}`;           // 로고 + 로그인/로그아웃 (로그인 상태에 따라 변경)
const back = `<button type="button" data-a="back">뒤로</button>`;
const BAR = {
  '01': () => `${logo}<span class="t"></span><button type="button" class="auth" data-a="go:04">닫기</button>`,    // 소개 화면: 로그인 대신 닫기
  '02': () => `${logo}<span class="t"></span><button type="button" data-a="back" aria-label="닫기">X</button>`,
  '03': () => `${logo}<span class="t"></span>${back}`,
  '04': mainBar, '05': mainBar,
  '06': () => `${back}<span class="t">검색 조건 설정</span><button type="button" data-a="freset">초기화</button>`,
  '07': () => `${back}<span class="t">장소 상세</span>`,
  '09': mainBar, '10': mainBar
};
