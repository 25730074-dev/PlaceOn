/* js/settings.js — 설정 메뉴 · 취향 편집/설문 · 사용자 정보 · 테마 · 약관 · 이용 동의 · 회원 탈퇴 */
const newUinfo = () => ({ nick: '', pw0: '', pw1: '', pw2: '', err: {}, ok: '' });
const newDel = () => ({ pw: '', ok: false, err: '' });
const MENU = [['12', '사용자 정보 설정', '닉네임·비밀번호 변경'], ['13', '테마 설정', '앱 색상 변경'],
  ['08', '취향 설정', '선호 카테고리·태그·가격대·거리·검색 반경'], ['14', '이용 약관', '서비스 이용약관·개인정보 처리'],
  ['15', '이용 동의 설정', '위치·취향 정보·마케팅 수신'], ['16', '회원 탈퇴', '계정과 저장된 데이터 삭제']];
const fld = (label, path, val, type = 'text', err = '') =>
  `<p class="lbl">${label}</p><div><input data-in="${path}" type="${type}" value="${esc(val)}" autocomplete="off"></div>${err ? `<p class="err">! ${err}</p>` : ''}`;
const sw = (on, a, label) => `<button type="button" class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-a="${a}"><i></i></button>`;
const prefsForm = d => `
  <p class="lbl">선호 카테고리 · 복수 선택</p>
  <div class="row">${CATS.map(c => chip(c, d.cats.includes(c), 'pcat:' + c)).join('')}</div>
  <p class="lbl">선호 태그 · 복수 선택</p>
  ${Object.entries(D.tagGroups).map(([g, tags]) => `<p class="sub">${g}</p><div class="row">${tags.map(t => chip(t, (d.tags[g] || []).includes(t), `ptag:${g}|${t}`)).join('')}</div>`).join('')}
  <p class="lbl">선호 가격대 · 복수 선택</p>
  <div class="row">${D.prices.map(([v, l, s]) => chip(`${l} · ${s}`, d.prices.includes(v), 'pprice:' + v)).join('')}</div>
  <p class="lbl">선호 거리</p>
  <div class="row">${D.distances.map(([v, l]) => chip(l, d.dist === v, 'pdist:' + v)).join('')}</div>
  <p class="lbl">검색 반경</p><p class="sub">홈의 주변 추천에서 이 거리 안의 장소만 보여줘요.</p>
  <div class="row">${D.radii.map(v => chip(radiusText(v), d.radius === v, 'pradius:' + v)).join('')}</div>`;
const savePrefs = () => { S.prefs = structuredClone(S.pdraft); S.nearCat = ''; persist(); };
const TERMS = [['서비스 이용약관', ['제1조 (목적) 이 약관은 PlaceON이 제공하는 주변 장소 추천 서비스의 이용 조건을 정합니다.',
    '제2조 (서비스) 위치와 취향을 바탕으로 장소를 추천하고, 즐겨찾기와 최근 본 장소를 제공합니다.',
    '제3조 (이용자 의무) 타인의 정보를 도용하거나 서비스 운영을 방해해서는 안 됩니다.',
    '제4조 (책임) 추천 결과는 참고용이며, 영업 여부·혼잡도는 실제와 다를 수 있습니다.']],
  ['개인정보 수집·이용', ['수집 항목: 닉네임, 비밀번호(해시), 취향 설정, 즐겨찾기, 최근 본 장소, 설정 값',
    '이용 목적: 계정 인증, 맞춤 추천, 저장 장소 관리',
    DB.remote ? '보관 위치: PlaceON 서버 (Supabase). 다른 기기에서도 같은 계정으로 이용할 수 있습니다.' : '보관 위치: 이 기기의 브라우저 저장소 (서버로 전송하지 않음)',
    '보관 기간: 회원 탈퇴 시 즉시 삭제']],
  ['위치정보 이용', ['내 위치는 가까운 장소 추천과 거리 계산에만 사용하며 저장하지 않습니다.', '설정 > 이용 동의 설정에서 언제든 끌 수 있습니다.']]];
const joined = () => new Date(S.createdAt || Date.now()).toLocaleDateString('ko-KR');
const tryPw = async pw => { try { return await DB.checkPw(pw); } catch { return false; } };   // 현재 비밀번호 확인 (네트워크 오류는 불일치로 처리)

Object.assign(BAR, {
  '08': () => `${back}<span class="t">취향 설정</span>`, '11': () => `${back}<span class="t">설정</span>`,
  '12': () => `${back}<span class="t">사용자 정보 설정</span>`, '13': () => `${back}<span class="t">테마 설정</span>`,
  '14': () => `${back}<span class="t">이용 약관</span>`, '15': () => `${back}<span class="t">이용 동의 설정</span>`,
  '16': () => `${back}<span class="t">회원 탈퇴</span>`,
  '17': () => `${logo}<span class="t"></span><button type="button" class="auth" data-a="skip">건너뛰기</button>`
});
Object.assign(BODY, {
  '08': () => `<p class="h1">취향 설정</p><p class="sub">선택한 취향은 장소 추천 근거와 정렬에 사용돼요.</p>
    ${S.settings.consent.personal ? '' : '<div class="box"><p class="err">취향 정보 이용에 동의하지 않아 추천에는 반영되지 않아요. (설정 > 이용 동의 설정)</p></div>'}
    ${prefsForm(S.pdraft)}
    <p class="sub">${dirty() ? '※ 저장하지 않은 수정이 있어요' : ''}</p>
    ${btn('수정한 취향 저장', 'psave', 'p')}`,
  '11': () => `<p class="h1">설정</p><p class="sub">계정과 추천 방식을 관리하세요.</p>
    <div class="menu">${MENU.map(([to, t, s]) => `<button type="button" class="mi ${to === '16' ? 'danger' : ''}" data-a="go:${to}"><span><b>${t}</b><small>${s}</small></span><i aria-hidden="true">›</i></button>`).join('')}</div>`,
  '12': () => { const U = S.uinfo; return `
    <p class="h1">사용자 정보 설정</p>
    <div class="box"><div class="kv"><span>닉네임</span><span>${esc(S.loginNick)}</span><span>가입일</span><span>${joined()}</span></div></div>
    <p class="h2">닉네임 변경</p>
    ${fld('새 닉네임', 'uinfo.nick', U.nick, 'text', U.err.nick)}
    ${btn('닉네임 변경', 'unick')}
    <hr><p class="h2">비밀번호 변경</p>
    ${fld('현재 비밀번호', 'uinfo.pw0', U.pw0, 'password', U.err.pw0)}
    ${fld('새 비밀번호', 'uinfo.pw1', U.pw1, 'password', U.err.pw1)}
    <p class="sub">8~20자 · 대문자·숫자·특수문자 포함</p>
    ${fld('새 비밀번호 확인', 'uinfo.pw2', U.pw2, 'password', U.err.pw2)}
    ${btn('비밀번호 변경', 'upw', 'p')}
    ${U.ok ? `<p class="sub">✓ ${U.ok}</p>` : ''}`; },
  '13': () => `<p class="h1">테마 설정</p><p class="sub">앱 전체 색상을 바꿔요. 계정에 저장돼요.</p>
    <div class="swatches">${D.themes.map(([n, c], i) => `<button type="button" class="swatch ${S.settings.theme === i ? 'on' : ''}" data-a="theme:${i}" aria-label="${n}"><i style="background:${c}">${S.settings.theme === i ? '✓' : ''}</i><span>${n}</span></button>`).join('')}</div>
    <div class="box"><p class="lbl">미리보기</p><div class="row"><span class="badge">배지</span><span class="c on">✓ 칩</span><span class="b p sm">버튼</span></div></div>`,
  '14': () => `<p class="h1">이용 약관</p><p class="sub">목업용 예시 문구예요.</p>
    ${TERMS.map(([t, rows]) => `<div class="box"><p class="lbl">${t}</p>${li(rows)}</div>`).join('')}`,
  '15': () => { const c = S.settings.consent; return `<p class="h1">이용 동의 설정</p><p class="sub">동의 항목은 언제든 바꿀 수 있어요.</p>
    <div class="box"><div class="bt"><span><b>서비스 이용약관 (필수)</b></span><button type="button" class="b sm" data-a="view">보기</button></div>
      <div class="bt"><span><b>개인정보 수집·이용 (필수)</b></span><button type="button" class="b sm" data-a="view">보기</button></div>
      <p class="sub">필수 동의를 철회하려면 회원 탈퇴를 진행해 주세요.</p></div>
    ${[['location', '위치 정보 이용', '내 위치 기준 주변 추천·거리 계산에 사용해요.'], ['personal', '취향 정보 이용', '설정한 취향을 추천 근거·정렬에 사용해요.'],
       ['marketing', '마케팅 정보 수신 (선택)', '이벤트와 추천 소식을 받아요.']].map(([k, t, s]) =>
      `<div class="box bt"><span><b>${t}</b><br><span class="sub">${s}</span></span>${sw(c[k], 'consent:' + k, t)}</div>`).join('')}`; },
  '16': () => { const X = S.del; return `<p class="h1">회원 탈퇴</p><p class="sub">탈퇴하면 아래 데이터가 모두 삭제되고 복구할 수 없어요.</p>
    <div class="box">${li(['취향 설정 (선호 카테고리·태그·가격대·거리·검색 반경)', '즐겨찾기와 최근 본 장소', '테마·이용 동의 설정', '계정 정보 (닉네임·비밀번호)'])}</div>
    ${fld('비밀번호 확인', 'del.pw', X.pw, 'password', X.err)}
    <button type="button" class="ckb" data-a="delchk"><span class="ck">${X.ok ? '✓' : ''}</span><span>위 내용을 확인했고 탈퇴에 동의합니다</span></button>
    ${btn('회원 탈퇴', 'delete', 'danger')}`; },
  '17': () => `<p class="h1">취향 설문</p><p class="sub">가입을 환영해요! 취향을 알려주시면 맞춤 추천을 해드려요. 설정 > 취향 설정에서 언제든 바꿀 수 있어요.</p>
    ${prefsForm(S.pdraft)}
    ${btn('저장하고 시작하기', 'psurvey', 'p')}${btn('나중에 할게요', 'skip', 'sm')}`
});
Object.assign(ACT, {
  pcat(a) { S.pdraft.cats = toggle(S.pdraft.cats, a); render(); },
  ptag(a) { const [g, t] = a.split('|'), d = S.pdraft; d.tags[g] = toggle(d.tags[g] || [], t); if (!d.tags[g].length) delete d.tags[g]; render(); },
  pprice(a) { S.pdraft.prices = toggle(S.pdraft.prices, +a).sort(); render(); },
  pdist(a) { S.pdraft.dist = +a; render(); },
  pradius(a) { S.pdraft.radius = +a; render(); },
  psave() { savePrefs(); flash('취향을 저장했어요.'); render(); },
  psurvey() { savePrefs(); nav('04'); flash('취향을 저장했어요. 맞춤 추천을 시작해요.'); },
  skip() { S.pdraft = structuredClone(S.prefs); nav('04'); },          // 설문에서 고르다 만 내용은 버림 (취향 설정에 미저장 초안으로 남지 않게)
  theme(a) { S.settings.theme = +a; applyTheme(+a); persist(); render(); },
  consent(k) {
    const c = S.settings.consent; c[k] = !c[k];
    if (k === 'location') {
      if (!c[k]) stopWatch();
      else watchMe();
    }
    persist(); render();
  },
  async unick() {
    syncForm($('#content')); const U = S.uinfo; U.err = {}; U.ok = '';
    const h = nickHint(U.nick);
    if (!h.ok) U.err.nick = h.text;
    else {
      let r; try { r = await DB.rename(U.nick); } catch (e) { r = { err: 'server', msg: e.message }; }
      if (r.err) U.err.nick = r.err === 'dup' ? '이미 사용 중인 닉네임이에요.' : '서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
      else { S.userKey = r.key; S.loginNick = U.nick.trim(); U.ok = '닉네임을 변경했어요.'; U.nick = ''; }
    }
    render();
  },
  async upw() {
    syncForm($('#content')); const U = S.uinfo; U.err = {}; U.ok = '';
    if (!U.pw0 || !(await tryPw(U.pw0))) U.err.pw0 = '현재 비밀번호가 올바르지 않아요.';
    const h = pwHint(U.pw1); if (!h.ok) U.err.pw1 = h.text;
    if (U.pw1 !== U.pw2) U.err.pw2 = '새 비밀번호가 일치하지 않아요.';
    if (!Object.keys(U.err).length) {
      try { await DB.setPw(U.pw1); Object.assign(U, newUinfo(), { ok: '비밀번호를 변경했어요.' }); }
      catch { U.err.pw1 = '서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'; }
    }
    else if (U.err.pw0) U.pw0 = '';                                     // 틀린 현재 비밀번호는 화면에 남기지 않음
    render();
  },
  delchk() { S.del.ok = !S.del.ok; render(); },
  async delete() {
    syncForm($('#content')); const X = S.del; X.err = '';
    if (!X.pw) X.err = '비밀번호를 입력해 주세요.';
    else if (!X.ok) X.err = '탈퇴 동의에 체크해 주세요.';
    else if (!(await tryPw(X.pw))) { X.err = '비밀번호가 올바르지 않아요.'; X.pw = ''; }
    if (!X.err) try { await DB.remove(); } catch { X.err = '서버에서 계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'; }
    if (X.err) return render();
    await signOut(false); nav('01'); flash('탈퇴가 완료됐어요. 저장된 데이터를 모두 삭제했어요.');
  }
});
