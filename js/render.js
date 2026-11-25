/* js/render.js — 렌더(탭·화면 전환) */
/* ───────── 렌더 ───────── */
const EYE = { on: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  off: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>' };
const TAB_ICON = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  mypage: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>' };
const TAB = { '04': 'home', '05': 'search', '07': 'search', '08': 'mypage', '09': 'mypage', '10': 'mypage',
  '11': 'mypage', '12': 'mypage', '13': 'mypage', '14': 'mypage', '15': 'mypage', '16': 'mypage' };
function render(top) {
  persist();                                 // 로그인 상태면 변경 내용을 계정 데이터(localStorage)에 저장
  const c = $('#content'), st = top ? 0 : c.scrollTop;
  $('#bar').innerHTML = BAR[S.screen]();
  c.className = S.screen === '04' ? 'full' : '';
  c.innerHTML = BODY[S.screen]();
  const t = TAB[S.screen], tabs = $('#tabs');
  tabs.hidden = !t;
  tabs.innerHTML = [['home', '홈'], ['search', '검색'], ['mypage', '마이페이지']]
    .map(([k, l]) => `<button type="button" class="${k === t ? 'on' : ''}" data-a="tab:${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICON[k]}</svg><span>${l}</span></button>`).join('');
  c.scrollTop = st;
  if (S.screen === '03') paintSignup();
  if (S.screen === '04') { initHome(); homeDraw(); }
  if (S.screen === '07') initDetailMap();
}
function flash(t) {
  document.querySelectorAll('.msg').forEach(m => m.remove());
  const m = Object.assign(document.createElement('div'), { className: 'msg', textContent: t });
  $('#phone').append(m); setTimeout(() => m.remove(), 1600);
}
function nav(to) {
  if (S.screen === '08' && to !== '08' && dirty()) {
    if (!confirm('저장하지 않은 수정 내용이 있어요. 이동할까요?')) return;
    S.pdraft = structuredClone(S.prefs);
  }
  if (to === '12') S.uinfo = newUinfo();
  if (to === '16') S.del = newDel();
  S.screen = to; S.err = ''; render(true);
}
