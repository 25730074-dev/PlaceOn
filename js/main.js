/* js/main.js — 입력 · 폼 제출 · 초기화 */
/* ───────── 입력 · 폼 제출 ───────── */
const setPath = (p, v) => { const k = p.split('.'); k.reduce((o, key, j) => j === k.length - 1 ? (o[key] = v) : o[key], S); };
const syncForm = f => f.querySelectorAll('[data-in]').forEach(i => setPath(i.dataset.in, i.value));   // 자동완성처럼 input 이벤트 없이 채워진 값도 반영
document.addEventListener('input', e => {
  const p = e.target.dataset.in; if (!p) return;
  const k = p.split('.'); setPath(p, e.target.value);
  if (k[0] === 'signup') { if (S.signup.state !== 'busy') S.signup.state = 'idle'; paintSignup(); }
});
const FORM = {
  login() {
    const L = S.login; if (L.busy) return;
    L.err = {};
    if (!S.loginNick.trim()) L.err.nick = '닉네임을 입력해 주세요.';
    if (!L.pw) L.err.pw = '비밀번호를 입력해 주세요.';
    if (L.err.nick || L.err.pw) return render();
    L.busy = true; render();
    setTimeout(() => {
      L.busy = false; L.pw = ''; S.user = true; loadAccount();
      const to = S.after || '04', pend = S.pending; S.after = null; S.pending = null;
      if (pend) S.saved.add(pend);
      nav(to); flash(pend ? '로그인했어요. 즐겨찾기에 저장했어요.' : '로그인했어요. 저장한 취향을 불러왔어요.');
    }, 700);
  },
  signup() {
    const g = S.signup;
    if (g.state === 'busy') return;
    const miss = signupMissing(g);
    if (miss.length) { const n = $('[data-err=fail]'); if (n) n.textContent = '! 남은 항목: ' + miss.join(' · '); flash('남은 항목: ' + miss.join(' · ')); return; }
    g.state = 'busy'; paintSignup();
    setTimeout(() => {
      if (g.nick.toLowerCase().startsWith('fail')) { g.state = 'fail'; paintSignup(); return; }      // 실패 시연: 닉네임이 fail 로 시작
      g.state = 'idle'; S.loginNick = g.nick; S.acct = { saved: new Set(), history: [], prefs: emptyPrefs() }; nav('02'); flash('계정을 만들었어요. 로그인해 주세요.');
    }, 800);
  },
  search() {
    if (!S.search.query.trim()) { S.err = '검색어를 입력해 주세요.'; return render(); }
    S.err = ''; S.shown.search = 1; render();
  }
};
document.addEventListener('submit', e => e.preventDefault());          // 브라우저 기본 제출은 쓰지 않음
document.addEventListener('keydown', e => {                             // Enter 로 제출 (한글 조합 중 Enter 는 무시)
  if (e.key !== 'Enter' || e.isComposing || !e.target.matches || !e.target.matches('input')) return;
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault(); syncForm(f); FORM[f.dataset.form]?.();
});
document.addEventListener('change', e => { const f = e.target.closest && e.target.closest('form[data-form]'); if (f) { syncForm(f); if (S.screen === '03') paintSignup(); } });

init(); render(true);
