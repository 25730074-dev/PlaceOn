/* js/actions.js — 회원가입 검증 · 액션 */
/* ───────── 회원가입 검증 (입력 중에는 부분 갱신) ───────── */
function paintSignup() {
  const g = S.signup, m = !!g.pw && g.pw === g.pw2;
  const hint = (k, h) => { const n = $(`[data-hint=${k}]`); if (n) n.textContent = hintText(h); };
  const set = (k, v) => { const n = $(`[data-err=${k}]`); if (n) n.textContent = v ? '! ' + v : ''; };
  hint('nick', nickHint(g.nick)); hint('pw', pwHint(g.pw));
  set('pw2', g.pw2 && !m ? '비밀번호가 일치하지 않아요.' : '');
  set('fail', g.state === 'fail' ? '계정을 만들지 못했어요. 입력과 동의는 그대로 유지돼요. 다시 시도해 주세요.' : '');
  const b = $('#sbtn');
  b.textContent = { idle: '동의하고 계정 만들기', busy: '계정을 만드는 중…', fail: '다시 시도' }[g.state];
  const miss = signupMissing(g);
  $('[data-hint=need]').textContent = miss.length ? '남은 항목: ' + miss.join(' · ') : '✓ 모든 항목을 확인했어요';
  b.disabled = g.state === 'busy'; b.classList.toggle('off', miss.length > 0 && g.state !== 'fail');
}

/* ───────── 액션 ───────── */
const emptyPrefs = () => ({ cats: [], types: [], extra: '' });
function loadAccount() {                    // 로그인: 계정의 저장·기록·취향을 불러옴
  const a = S.acct;
  S.saved = new Set(a.saved); S.history = a.history.map(h => ({ ...h })); S.prefs = structuredClone(a.prefs); S.pdraft = structuredClone(a.prefs);
}
function stashAccount() {                   // 로그아웃: 계정 데이터를 보관하고 화면에서는 모두 비움
  S.acct = { saved: new Set(S.saved), history: S.history.map(h => ({ ...h })), prefs: structuredClone(S.prefs) };
  S.saved = new Set(); S.history = []; S.prefs = emptyPrefs(); S.pdraft = emptyPrefs(); S.nearCat = ''; S.favCat = '';
}
function needLogin(pendingId) {             // 비로그인 상태에서 개인화 기능 → 로그인으로 이동, 끝나면 돌아옴
  S.after = S.screen; S.pending = pendingId ?? null;
  nav('02'); flash('로그인이 필요해요.');
}
const ACT = {
  go: a => nav(a),
  submit(a) { const f = $(`form[data-form="${a}"]`); if (f) syncForm(f); FORM[a]?.(); },
  back() { if (S.screen === '02') { S.after = null; S.pending = null; } nav({ '02': '01', '03': '01', '06': '05', '07': S.from }[S.screen]); },
  tab(a) {
    if (a === 'home') return nav('04');
    if (a === 'search') return nav('05');
    if (!S.user) { S.after = '08'; S.pending = null; return nav('02'); }
    nav('08');
  },
  seg: a => nav(a),
  place(a) {
    S.placeId = +a; S.from = S.screen;
    if (S.user) S.history = [{ id: +a, at: Date.now() }, ...S.history.filter(h => h.id !== +a)];   // 비로그인은 기록하지 않음
    nav('07');
  },
  save(a) {
    a = +a;
    if (!S.user) return needLogin(a);
    const on = !S.saved.has(a);
    on ? S.saved.add(a) : S.saved.delete(a);
    flash(on ? '즐겨찾기에 저장했어요.' : '저장을 해제했어요.');
    S.screen === '04' ? homeDraw() : render();
  },
  more(a) { S.shown[a]++; a === 'home' ? homeDraw() : render(); },
  hfopen() { S.popCat = S.nearCat; drawPop(); $('#pop').hidden = false; },
  hfpick(a) { S.popCat = a; drawPop(); },
  hfclose() { $('#pop').hidden = true; },
  hfapply() { S.nearCat = S.popCat; S.shown.home = 1; $('#pop').hidden = true; homeDraw(); },
  zin: () => HOME.zin(), zout: () => HOME.zout(), zme: () => HOME.zme(),
  login() { S.after = S.screen === '01' ? '04' : S.screen; S.pending = null; nav('02'); },
  mode(a) { S.search.mode = a; S.shown.search = 1; render(); },
  clearq() { S.search.query = ''; S.err = ''; render(); },
  filter() { S.draft = { ...structuredClone(S.applied), mode: S.search.mode }; nav('06'); },
  fmode(a) { S.draft.mode = a; render(); },
  farea(a) { S.draft.area = a; render(); },
  fcat(a) { S.draft.category = S.draft.category === a ? '' : a; S.draft.types = S.draft.types.filter(t => (TYPES[S.draft.category] || []).includes(t)); render(); },
  ftype(a) { S.draft.types = toggle(S.draft.types, a); render(); },
  ffloor(a) { S.draft.floors = toggle(S.draft.floors, a); render(); },
  freset() { S.draft = { ...noFilter(), mode: S.draft.mode }; render(); },
  fapply() {
    const { mode, ...f } = S.draft;
    S.applied = f; S.search.mode = mode; S.draft = null; S.shown.search = 1; nav('05');
    flash(searchStores().length ? '조건을 적용했어요.' : '결과가 없어요. 조건을 줄여 보세요.');
  },
  pw() { S.login.show = !S.login.show; render(); },
  chk(a) {
    S.signup[a] = !S.signup[a]; if (S.signup.state !== 'busy') S.signup.state = 'idle';
    const b = $(`[data-a="chk:${a}"] .ck`); if (b) b.textContent = S.signup[a] ? '✓' : '';
    paintSignup();
  },
  view() { flash('약관 내용은 목업에서 제공하지 않아요.'); },
  pcat(a) {
    const d = S.pdraft; d.cats = toggle(d.cats, a);
    d.types = d.types.filter(t => d.cats.some(c => (TYPES[c] || []).includes(t)));     // 해제한 카테고리의 업종은 함께 해제
    render();
  },
  ptype(a) { S.pdraft.types = toggle(S.pdraft.types, a); render(); },
  psave() { S.prefs = structuredClone(S.pdraft); S.nearCat = ''; S.shown.home = 1; flash('취향을 저장했어요.'); render(); },
  favcat(a) { S.favCat = a; render(); },
  logout() {
    if (S.screen === '08' && dirty() && !confirm('저장하지 않은 수정 내용이 있어요. 이동할까요?')) return;
    stashAccount(); S.user = false; flash('로그아웃했어요.'); nav('01');
  }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const i = el.dataset.a.indexOf(':'), a = i < 0 ? el.dataset.a : el.dataset.a.slice(0, i), arg = i < 0 ? '' : el.dataset.a.slice(i + 1);
  ACT[a]?.(arg);
});
