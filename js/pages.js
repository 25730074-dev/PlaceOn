/* js/pages.js — 화면 본문 템플릿 */
/* ───────── 화면 본문 ───────── */
const BODY = {
  '01': () => `
    <p class="h1">내 주변에서 찾는<br>나에게 맞는 장소</p>
    <p class="sub">취향과 위치를 바탕으로 카페, 음식점, 뷰티, 쇼핑 등 가고 싶은 장소를 찾아보세요.</p>
    ${img('주변 장소 추천 화면', 'h')}
    ${D.intro.map(([t, s]) => `<div class="box"><p>${t}</p><p>${s}</p></div>`).join('')}
    <hr>
    ${btn('로그인', 'go:02', 'p')}
    ${btn('회원가입', 'go:03')}
    <p>계정에 취향, 저장 장소와 조회 기록이 연결됩니다.</p>`,

  '02': () => { const L = S.login; return `
    <form class="stk" data-form="login" novalidate>
      <p class="h1">다시 만나 반가워요</p><p class="sub">로그인하고 저장한 취향과 장소를 이어서 확인하세요.</p>
      <p class="lbl">닉네임</p><div><input data-in="loginNick" placeholder="닉네임 입력" autocomplete="off" value="${S.loginNick}"></div>
      <p class="err">${L.err.nick ? '! ' + L.err.nick : ''}</p>
      <p class="lbl">비밀번호</p>
      <div class="pw"><input data-in="login.pw" type="${L.show ? 'text' : 'password'}" placeholder="비밀번호 입력" value="${L.pw}">
        <button type="button" class="eye" data-a="pw" aria-label="${L.show ? '비밀번호 숨기기' : '비밀번호 표시'}"><svg viewBox="0 0 24 24" aria-hidden="true">${L.show ? EYE.off : EYE.on}</svg></button></div>
      <p class="err">${L.err.pw ? '! ' + L.err.pw : ''}</p>
      <button type="button" class="b p" data-a="submit:login" ${L.busy ? 'disabled' : ''}>${L.busy ? '로그인 중…' : '로그인'}</button>
      <div class="box">인증이 완료되면 계정에 연결된 취향, 즐겨찾기와 최근 조회 기록을 불러옵니다.</div>
      <hr><p>아직 계정이 없으신가요?</p>
      ${btn('회원가입으로 이동', 'go:03')}
    </form>`; },

  '03': () => { const g = S.signup; return `
    <form class="stk" data-form="signup" novalidate>
      <p class="h1">나만의 장소 찾기 시작</p><p class="sub">닉네임과 비밀번호로 계정을 만드세요.</p>
      <p class="lbl">닉네임</p><div><input data-in="signup.nick" placeholder="닉네임 입력" autocomplete="off" value="${g.nick}"></div>
      <p class="sub" data-hint="nick">${hintText(nickHint(g.nick))}</p>
      <p class="lbl">비밀번호</p><div><input data-in="signup.pw" type="password" placeholder="비밀번호 입력" value="${g.pw}"></div>
      <p class="sub" data-hint="pw">${hintText(pwHint(g.pw))}</p>
      <p class="lbl">비밀번호 확인</p><div><input data-in="signup.pw2" type="password" placeholder="비밀번호 다시 입력" value="${g.pw2}"></div><p class="err" data-err="pw2"></p>
      <div class="bt"><button type="button" class="ckb" data-a="chk:terms"><span class="ck">${g.terms ? '✓' : ''}</span><span>[필수] 서비스 이용약관 동의</span></button><button type="button" class="b sm" data-a="view">보기</button></div>
      <div class="bt"><button type="button" class="ckb" data-a="chk:priv"><span class="ck">${g.priv ? '✓' : ''}</span><span>[필수] 개인정보 수집·이용 동의</span></button><button type="button" class="b sm" data-a="view">보기</button></div>
      <p class="err" data-err="fail"></p>
      <p class="sub" data-hint="need"></p>
      <button type="button" class="b p" id="sbtn" data-a="submit:signup">동의하고 계정 만들기</button>
      <div class="box">가입 완료 시 계정을 생성하고 사용자 데이터를 저장합니다. 로그인 후 취향과 장소 기록이 이 계정에 연결됩니다.</div>
      ${btn('이미 계정이 있다면 로그인으로 이동 →', 'go:02', 'sm')}
    </form>`; },

  '04': () => `<div class="home">
    <div class="homemap"><div id="kmap" style="width:100%;height:100%"></div></div>
    <div class="maptop"><span class="pill">현재 위치 ${S.area} 기준</span><button type="button" class="b sm" id="hfbtn" data-a="hfopen"></button><div class="dash" id="hstat"></div></div>
    <div class="ctrl"><button type="button" data-a="zin" aria-label="확대">+</button><button type="button" data-a="zout" aria-label="축소">−</button><button type="button" data-a="zme" aria-label="내 위치"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button></div>
    <section class="sheet">
      <div class="drag"><div class="grab"><i></i></div>
        <div class="sheet-head"><p class="h2">주변 추천</p><p class="sub" id="hcount"></p><p class="sub" id="hprefs"></p></div></div>
      <div class="sheet-list" id="hlist"></div>
    </section>
    <div class="pop" id="pop" hidden><div class="popbg" data-a="hfclose"></div>
      <div class="popbox"><p class="h2">카테고리 필터</p><div class="row" id="popchips"></div>
        <div class="bt"><button type="button" class="b sm" data-a="hfclose">닫기</button><button type="button" class="b p sm" data-a="hfapply">적용</button></div></div></div></div>`,

  '05': () => {
    const { query, mode } = S.search, area = mode === 'area', res = searchStores();
    return `
    <form data-form="search"><div class="bt"><div style="flex:1"><input data-in="search.query" placeholder="키워드, 지명 또는 장소명" value="${query}"></div>
      <button type="button" data-a="clearq">지우기</button></div></form>
    <p class="err">${S.err ? '! ' + S.err : ''}</p>
    <div class="row">${chip('키워드', !area, 'mode:keyword')}${chip('지명·장소명', area, 'mode:area')}</div>
    <div class="box"><p>${area ? '지명·장소명' : '키워드'} ‘${query}’ 검색 결과</p>
      <p>${area ? `‘${query}’ 지역 기준으로 장소를 추천합니다.` : '업소명·카테고리·업태에서 조건에 맞는 장소를 추천합니다.'}</p></div>
    <div class="bt"><p class="h2">추천 결과 ${res.length}개</p>${btn(`필터 · ${fcount(S.applied)}`, 'filter', 'sm')}</div>
    ${res.length ? res.slice(0, pageOf(S.shown.search)).map(p => pcard(p)).join('') + moreBtn('search', res.length) :
      empty('조건에 맞는 결과가 없어요', '조건을 줄이거나 검색어를 바꿔 보세요.')}
    <div class="box"><p>지명·장소명 검색으로 전환하면</p><p>‘명동’ → 명동 기준 추천</p><p>장소명 → 해당 장소가 속한 지역 기준 추천</p><p>결과 예시: 르뱅헤어 · 명동 기준</p></div>`; },

  '06': () => {
    const d = S.draft, q = S.search.query, types = TYPES[d.category] || [];
    return `
    <p class="lbl">추천 기준</p>
    <div class="box ${d.mode === 'keyword' ? 'sel' : ''}" data-a="fmode:keyword"><p>${d.mode === 'keyword' ? '(●)' : '( )'} 키워드 · ${q}</p><p>업소명·카테고리·업태 기준으로 추천</p></div>
    <div class="box ${d.mode === 'area' ? 'sel' : ''}" data-a="fmode:area"><p>${d.mode === 'area' ? '(●)' : '( )'} 지명·장소명 · ${S.area}</p><p>입력한 지역 또는 장소의 지역 기준으로 추천</p></div>
    <hr>
    <p class="lbl">지역 (행정동)</p>
    <div class="row">${[['전체', ''], ...TOP_AREAS.map(a => [a, a]), ['그 외', '__other']].map(([l, v]) => chip(l, d.area === v, 'farea:' + v)).join('')}</div>
    <p class="lbl">장소 카테고리</p>
    <div class="row">${CATS.map(c => chip(c, d.category === c, 'fcat:' + c)).join('')}</div>
    <p class="lbl">세부 업종 · 복수 선택</p>
    ${types.length ? `<div class="row">${types.map(t => chip(t, d.types.includes(t), 'ftype:' + t)).join('')}</div>` : empty('카테고리를 선택하면', '세부 업종을 고를 수 있어요.')}
    <p class="lbl">층 · 복수 선택</p>
    <div class="row">${FLOORS.map(f => chip(f, d.floors.includes(f), 'ffloor:' + f)).join('')}</div>
    <div class="box">이번 검색에 적용됩니다. 내 취향 설정은 변경하지 않습니다.</div>
    ${btn('선택한 조건 적용', 'fapply', 'p')}`; },

  '07': () => { const p = place(S.placeId), saved = S.saved.has(p.id), none = '정보 없음'; return `
    ${thumb(p, 'h')}
    <p class="h1">${p.name}</p><p class="sub">${p.category} · ${p.type || '업태 정보 없음'}</p>
    <div class="row">${[p.area, ...p.floors].filter(Boolean).map(t => `<span class="box" style="padding:3px 10px">${t}</span>`).join('')}</div>
    <hr>
    <p class="lbl">장소 정보</p><div class="kv"><span>도로명</span><span>${p.address || none}</span><span>지번</span><span>${p.jibun || none}</span><span>지역</span><span>${p.area || none}</span><span>위치</span><span>${floorText(p)}</span></div>
    <div class="detailmap" id="dmap" role="img" aria-label="장소 위치 지도">지도를 불러오는 중…</div>
    ${btn(saved ? '✓ 즐겨찾기 저장됨 · 해제' : '즐겨찾기에 저장', 'save:' + p.id)}`; },

  '08': () => {
    const d = S.pdraft, types = d.cats.flatMap(c => TYPES[c] || []);
    return `${userBlock('08')}
    <p class="h1">나의 취향 설정</p><p class="sub">저장된 취향을 불러왔어요. 선택하거나 수정해 주세요.</p>
    <p class="lbl">선호 카테고리 · 복수 선택</p>
    <div class="row">${CATS.map(c => chip(c, d.cats.includes(c), 'pcat:' + c)).join('')}</div>
    <p class="lbl">세부 업종 · 복수 선택</p>
    ${types.length ? `<div class="row">${types.map(t => chip(t, d.types.includes(t), 'ptype:' + t)).join('')}</div>` : empty('선호 카테고리를 선택하면', '세부 업종을 고를 수 있어요.')}
    <p class="lbl">추가 선호 조건</p>
    <div><input data-in="pdraft.extra" placeholder="예: 창가 좌석이 있는 곳" value="${d.extra}"></div>
    <p>${dirty() ? '※ 저장하지 않은 수정이 있어요' : ''}</p>
    ${btn('수정한 취향 저장', 'psave', 'p')}
    <div class="box">저장한 취향은 내 계정에 연결되며, 주변 장소 추천 시 기본 조건으로 사용됩니다.</div>`; },

  '09': () => {
    const all = [...S.saved].map(place), cats = [...new Set(all.map(p => p.category))];
    if (S.favCat && !cats.includes(S.favCat)) S.favCat = '';
    const list = all.filter(p => !S.favCat || p.category === S.favCat);
    return `${userBlock('09')}
    <p class="h1">저장한 장소 ${all.length}개</p><p class="sub">다시 가고 싶은 장소를 한곳에서 확인하세요.</p>
    <div class="row">${[['전체', ''], ...cats.map(c => [c, c])].map(([l, v]) => chip(l, S.favCat === v, 'favcat:' + v)).join('')}</div>
    ${!all.length ? empty('저장한 장소가 없어요', '주변 장소를 둘러보고 마음에 드는 곳을 저장해 보세요.', btn('장소 탐색하기', 'go:04', 'sm'))
      : !list.length ? empty('이 카테고리에 저장한 장소가 없어요', '다른 카테고리를 선택해 보세요.')
      : list.map(p => pcard(p, { mode: 'fav' })).join('')}
    <p>장소를 누르면 상세로 이동합니다. 저장 해제한 장소는 이 목록에서 제외됩니다.</p>`; },

  '10': () => {
    const items = [...S.history].sort((a, b) => b.at - a.at);
    const groups = [['오늘', d => d === 0], ['어제', d => d === 1], ['이전', d => d > 1]];
    const body = !items.length ? empty('아직 본 장소가 없어요', '장소를 탐색하면 여기에 기록돼요.')
      : groups.map(([t, f]) => {
        const rows = items.filter(h => f(dayDiff(h.at)));
        return rows.length ? `<p class="lbl">${t}</p>` + rows.map(h => pcard(place(h.id), {
          mode: 'recent', time: h === items[0] && dayDiff(h.at) === 0 ? '방금 확인' : fmtTime(h.at)
        })).join('') : '';
      }).join('');
    return `${userBlock('10')}<p class="h1">최근 본 장소</p><p class="sub">상세 정보를 확인한 순서대로 표시됩니다.</p>${body}`; }
};
