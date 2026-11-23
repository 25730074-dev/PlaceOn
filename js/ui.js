/* js/ui.js — 공통 조각(버튼·카드·이미지) · 앱바 */
/* ───────── 공통 조각 ───────── */
const btn = (label, a, cls = '') => `<button type="button" class="b ${cls}" data-a="${a}">${label}</button>`;
const chip = (label, on, a) => `<button type="button" class="c ${on ? 'on' : ''}" data-a="${a}">${on ? '✓ ' : ''}${label}</button>`;
const IMG_BASE = 'assets/image/', seq = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}_${i + 1}`);
const PHOTOS = {                              // 카테고리 → [폴더, 파일명 목록]  (이미지가 없는 카테고리는 이모지로 대체)
  '카페/디저트': ['Cafe', [...seq('Cafe_Exterior', 2), ...seq('Cafe_Interior', 3)]],
  '음식점': ['restuarant', [...seq('Restaurant_Detail', 1), ...seq('Restaurant_Exterior', 2), ...seq('Restaurant_Interior', 4)]],
  '뷰티/미용': ['beauty_cosmetology', [...seq('Beauty', 3), ...seq('Cosmetology', 3)]],
  '쇼핑': ['shoping', seq('shoping', 1)],
  '문화/여가': ['entertainment', seq('Entertainment', 6)] };
const photoOf = p => { const e = PHOTOS[p.category]; if (!e) return '';
  return `${IMG_BASE}${e[0]}/${e[1][Math.floor(((p.id * 2654435761) >>> 0) / 4294967296 * e[1].length)]}.png`; };
const thumb = (p, cls = '') => { const src = photoOf(p);   // 이미지가 없거나 불러오지 못하면 아래 흑백 플레이스홀더가 그대로 보임
  return `<div class="thumb ${cls}" aria-hidden="true"><span>${cls === 'h' ? '장소 이미지' : '이미지'}</span>${src ? `<img src="${src}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`; };
const img = (t, cls = '') => `<div class="img ${cls}"><span>${t}</span></div>`;
const fmtTime = t => new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
const dayDiff = t => { const a = new Date(t), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); return Math.round((b - a) / 864e5); };
const dirty = () => JSON.stringify(S.pdraft) !== JSON.stringify(S.prefs);
const empty = (t, s, b = '') => `<div class="dash"><p>${t}</p><p>${s}</p>${b}</div>`;
const moreBtn = (key, total) => total > pageOf(S.shown[key]) ? btn(`더 보기 (${total - pageOf(S.shown[key])}곳 남음)`, 'more:' + key, 'sm') : '';

function pcard(p, { mode = 'list', time = '' } = {}) {
  const saved = S.saved.has(p.id);
  const top = mode === 'list' ? `<button type="button" class="s ${saved ? 'on' : ''}" data-a="save:${p.id}">${saved ? '저장됨' : '저장'}</button>` : '';
  const foot = mode === 'fav'
    ? `<div class="bt"><span>상세 보기 →</span><button type="button" class="b sm" data-a="save:${p.id}">저장 해제</button></div>`
    : mode === 'recent'
    ? `<div class="bt"><span>상세 보기 →</span><button type="button" class="b sm" data-a="place:${p.id}">상세 이동</button></div>` : '';
  return `<div class="card" data-a="place:${p.id}">${thumb(p)}<div class="bd">
    ${time ? `<div class="sub">${time}</div>` : ''}<div class="bt"><span class="nm">${p.name}</span>${top}</div>
    <div class="row meta"><span class="badge">${p.category}</span><span class="sub">${p.type || '업태 정보 없음'}</span></div>
    <div class="sub">내 위치에서 ${distText(p)} · ${p.area || '지역 정보 없음'} · ${floorText(p)}</div>${foot}</div></div>`;
}

const userBlock = seg => `
  <div class="bt"><div class="user">${img('')}<div class="g"><p class="h2">${S.loginNick || '사용자'}님</p></div></div>
    <button type="button" class="b sm" data-a="logout">로그아웃</button></div>
  <div class="sg">${[['08', '취향 설정'], ['09', '즐겨찾기'], ['10', '최근 본 장소']].map(([k, l]) =>
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
  '08': mainBar, '09': mainBar, '10': mainBar
};
