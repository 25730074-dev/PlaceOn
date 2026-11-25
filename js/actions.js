/* js/actions.js — 회원가입 검증 · 액션 */
/* ───────── 회원가입 검증 (입력 중에는 부분 갱신) ───────── */
function paintSignup() {
  const g = S.signup, m = !!g.pw && g.pw === g.pw2;
  const hint = (k, h) => { const n = $(`[data-hint=${k}]`); if (n) n.textContent = hintText(h); };
  const set = (k, v) => { const n = $(`[data-err=${k}]`); if (n) n.textContent = v ? '! ' + v : ''; };
  hint('nick', nickHint(g.nick)); hint('pw', pwHint(g.pw));
  set('pw2', g.pw2 && !m ? '비밀번호가 일치하지 않아요.' : '');
  set('fail', g.state === 'fail' ? (g.msg || '계정을 만들지 못했어요. 입력과 동의는 그대로 유지돼요. 다시 시도해 주세요.') : '');
  const b = $('#sbtn');
  b.textContent = { idle: '동의하고 계정 만들기', busy: '계정을 만드는 중…', fail: '다시 시도' }[g.state];
  const miss = signupMissing(g);
  $('[data-hint=need]').textContent = miss.length ? '남은 항목: ' + miss.join(' · ') : '✓ 모든 항목을 확인했어요';
  b.disabled = g.state === 'busy'; b.classList.toggle('off', miss.length > 0 && g.state !== 'fail');
}

/* ───────── 액션 ───────── */
function needLogin(pendingId) {             // 비로그인 상태에서 개인화 기능 → 로그인으로 이동, 끝나면 돌아옴
  S.after = S.screen; S.pending = pendingId ?? null;
  nav('02'); flash('로그인이 필요해요.');
}
const ACT = {
  go: a => nav(a),
  submit(a) { const f = $(`form[data-form="${a}"]`); if (f) syncForm(f); FORM[a]?.(); },
  back() { if (S.screen === '02') { S.after = null; S.pending = null; } nav({ '02': '01', '03': '01', '06': '05', '07': S.from, '08': '11', '11': '09', '12': '11', '13': '11', '14': S.termsFrom, '15': '11', '16': '11' }[S.screen]); },
  tab(a) {
    if (a === 'home') return nav('04');
    if (a === 'search') return nav('05');
    if (!S.user) { S.after = '09'; S.pending = null; return nav('02'); }
    nav('09');
  },
  seg: a => nav(a),
  place(a) {
    S.placeId = +a; if (S.screen !== '07') S.from = S.screen;      // 상세 → 동선 추천 장소로 이동해도 뒤로 가면 원래 목록으로
    if (S.user) S.history = [{ id: +a, at: Date.now() }, ...S.history.filter(h => h.id !== +a)];   // 비로그인은 기록하지 않음
    nav('07');
  },
  save(a) {
    a = +a;
    if (!S.user) return needLogin(a);
    const on = !S.saved.has(a);
    on ? S.saved.add(a) : S.saved.delete(a); persist();
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
  view() { S.termsFrom = S.screen; nav('14'); },
  favcat(a) { S.favCat = a; render(); },
  logout() {
    if (S.screen === '08' && dirty() && !confirm('저장하지 않은 수정 내용이 있어요. 이동할까요?')) return;
    signOut(); flash('로그아웃했어요.'); nav('01');
  }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const i = el.dataset.a.indexOf(':'), a = i < 0 ? el.dataset.a : el.dataset.a.slice(0, i), arg = i < 0 ? '' : el.dataset.a.slice(i + 1);
  ACT[a]?.(arg);
});
