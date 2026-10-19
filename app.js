(function () {
  'use strict';

  /* ---------- 더미 데이터 ---------- */
  var PLACES = [
    { id: 1, name: '온기 로스터스', cat: '카페', mood: '조용함', price: '~1만원', min: 4, dist: 240, open: '09:00', close: '22:00', addr: '관악구 봉천로 12', desc: '원두를 직접 볶는 조용한 로스터리 카페', x: 30, y: 38 },
    { id: 2, name: '모퉁이 식당', cat: '음식점', mood: '활기참', price: '1~2만원', min: 6, dist: 380, open: '11:00', close: '21:00', addr: '관악구 관악로 45', desc: '점심 백반이 인기인 동네 식당', x: 58, y: 28 },
    { id: 3, name: '작은 갤러리 봄', cat: '문화시설', mood: '조용함', price: '~1만원', min: 10, dist: 720, open: '10:00', close: '18:00', addr: '관악구 남부순환로 8', desc: '소규모 전시를 여는 독립 갤러리', x: 72, y: 62 },
    { id: 4, name: '봉천 칼국수', cat: '음식점', mood: '조용함', price: '~1만원', min: 8, dist: 560, open: '10:30', close: '20:30', addr: '관악구 봉천로 77', desc: '직접 뽑은 면을 쓰는 칼국수 집', x: 20, y: 70 },
    { id: 5, name: '낙성대 산책로', cat: '공원', mood: '조용함', price: '~1만원', min: 14, dist: 1100, open: '00:00', close: '24:00', addr: '관악구 낙성대로', desc: '천변을 따라 걷기 좋은 산책로', x: 84, y: 24 },
    { id: 6, name: '책방 다온', cat: '문화시설', mood: '감성적', price: '~1만원', min: 12, dist: 900, open: '12:00', close: '20:00', addr: '관악구 은천로 21', desc: '독립 출판물을 파는 작은 책방', x: 48, y: 82 },
    { id: 7, name: '라운지 하루', cat: '카페', mood: '감성적', price: '1~2만원', min: 19, dist: 1400, open: '10:00', close: '24:00', addr: '관악구 봉천로 120', desc: '늦게까지 여는 넓은 라운지 카페', x: 92, y: 52 },
    { id: 8, name: '골목 포차', cat: '술집', mood: '활기참', price: '2만원~', min: 24, dist: 1800, open: '17:00', close: '02:00', addr: '관악구 은천로 33', desc: '단체석이 많은 포차', x: 8, y: 20 }
  ];
  var CATS = ['카페', '음식점', '문화시설', '공원', '술집'];
  var MOODS = ['조용함', '활기참', '감성적'];
  var PRICES = ['~1만원', '1~2만원', '2만원~'];

  /* ---------- 상태 ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('pf_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('pf_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var S = {
    logged: false,
    area: '봉천동',
    prefs: store.get('prefs', { cat: [], mood: [], price: [], walk: null }),
    fav: store.get('fav', []),
    hist: store.get('hist', []),
    tokens: null, q: '', sort: 'dist', more: false,
    authTab: 'up', authErr: '', returnTo: '#home', draft: null
  };

  var $ = function (s) { return document.querySelector(s); };
  var byId = function (id) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === +id) return PLACES[i]; return null; };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };

  /* ---------- 공통 조각 ---------- */
  function img(h, label) { return '<div class="img" style="height:' + h + 'px"><span>' + (label || 'IMG') + '</span></div>'; }
  function kv(rows) { return rows.map(function (r) { return '<div class="kv"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join(''); }
  function subbar(t) { return '<div class="subbar"><button data-act="back" aria-label="돌아가기">←</button><span>' + t + '</span></div>'; }
  function chip(label, on, act, v) { return '<button class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-v="' + esc(v) + '">' + label + '</button>'; }
  function empty(title, sub, btn) { return '<div class="empty"><div class="nm">' + title + '</div><div class="sb">' + sub + '</div>' + (btn || '') + '</div>'; }
  function skeleton() { return '<div class="sec">' + img(130) + '</div><div class="pad"><div class="skel" style="width:60%"></div><div class="skel"></div><div class="skel" style="width:80%"></div><div class="skel"></div></div><div class="sb" style="text-align:center">불러오는 중…</div>'; }

  function card(p, idx) {
    var on = S.fav.indexOf(p.id) > -1;
    return '<div class="cd" id="c-' + p.id + '" data-go="#detail/' + p.id + '">' + img(64) +
      '<div class="bd"><div class="rw"><span class="nm">' + (idx ? '<b class="pn">' + idx + '</b>' : '') + p.name + '</span>' +
      '<button class="star' + (on ? ' on' : '') + '" data-act="fav" data-id="' + p.id + '" aria-label="즐겨찾기">' + (on ? '★' : '☆') + '</button></div>' +
      '<div class="sb">' + S.area + ' · 도보 ' + p.min + '분</div>' +
      '<div class="bgs"><span>' + p.cat + '</span><span>' + p.mood + '</span><span>' + p.dist + 'm</span></div></div></div>';
  }

  function mapHTML(pins, label) {
    var h = '<div class="map"><svg viewBox="0 0 340 150" preserveAspectRatio="xMidYMid slice" aria-label="지도 자리"><rect width="340" height="150" class="mb"/>' +
      '<g class="blk"><rect x="10" y="10" width="70" height="40"/><rect x="95" y="10" width="90" height="40"/><rect x="200" y="10" width="60" height="40"/><rect x="275" y="10" width="55" height="40"/><rect x="10" y="65" width="70" height="30"/><rect x="200" y="65" width="60" height="30"/><rect x="275" y="65" width="55" height="30"/><rect x="10" y="110" width="70" height="30"/><rect x="95" y="110" width="90" height="30"/><rect x="200" y="110" width="130" height="30"/></g>' +
      '<g class="rd"><path d="M0 57H340M0 102H340M87 0V150M192 0V150M267 0V150"/><path d="M0 140L340 20" class="thin"/></g>' +
      '<circle cx="140" cy="80" r="26" class="halo"/><circle cx="140" cy="80" r="7" class="pin"/></svg>';
    (pins || []).forEach(function (p, i) {
      h += '<button class="mp" data-act="pin" data-id="' + p.id + '" style="left:' + p.x + '%;top:' + p.y + '%" aria-label="' + (i + 1) + '번 ' + p.name + '">' + (i + 1) + '</button>';
    });
    if (label) h += '<span class="mlab" style="left:47%;top:28%">현재 위치</span>';
    return h + '<button class="btn g mbtn" data-act="toast" data-msg="현재 위치로 지도를 이동합니다">내 위치</button></div>';
  }

  /* ---------- 검색 필터 ---------- */
  function tokLabel(t) {
    if (t.indexOf('walk:') === 0) return '도보 ' + t.slice(5) + '분 내';
    return t.slice(t.indexOf(':') + 1);
  }
  function applyFilter(tokens, q) {
    var pick = function (k) { return tokens.filter(function (x) { return x.indexOf(k + ':') === 0; }).map(function (x) { return x.slice(k.length + 1); }); };
    var cats = pick('cat'), moods = pick('mood'), prices = pick('price'), walk = pick('walk')[0];
    return PLACES.filter(function (p) {
      return (!cats.length || cats.indexOf(p.cat) > -1) && (!moods.length || moods.indexOf(p.mood) > -1) &&
        (!prices.length || prices.indexOf(p.price) > -1) && (!walk || p.min <= +walk) &&
        (!q || (p.name + p.cat + p.mood + p.addr).indexOf(q) > -1);
    });
  }
  function score(p) {
    var s = 0, pr = S.prefs;
    if (pr.cat.indexOf(p.cat) > -1) s += 2;
    if (pr.mood.indexOf(p.mood) > -1) s += 1;
    if (pr.price.indexOf(p.price) > -1) s += 1;
    return s;
  }
  function sorted(list, mode) {
    return list.slice().sort(function (a, b) { return mode === 'match' ? (score(b) - score(a) || a.dist - b.dist) : a.dist - b.dist; });
  }
  function initTokens() {
    var t = [], pr = S.prefs;
    pr.cat.forEach(function (c) { t.push('cat:' + c); });
    if (pr.walk) t.push('walk:' + pr.walk);
    S.tokens = t;
  }
  function toggleToken(t) {
    var i = S.tokens.indexOf(t);
    if (i > -1) { S.tokens.splice(i, 1); return; }
    if (t.indexOf('walk:') === 0) S.tokens = S.tokens.filter(function (x) { return x.indexOf('walk:') !== 0; });
    S.tokens.push(t);
  }

  /* ---------- 화면 ---------- */
  function vLanding() {
    return '<div class="land">' + img(130, 'LOGO').replace('class="img"', 'class="img big"') +
      '<h1 class="ttl">지금 있는 곳 근처,<br>내 취향에 맞는 장소만</h1>' +
      '<button class="btn d w" data-act="start">시작하기</button></div>';
  }

  function vAuth(arg) {
    var up = S.authTab === 'up';
    var msg = arg === 'error' ? '이메일 형식이 올바르지 않습니다. 비밀번호가 일치하지 않습니다.' : S.authErr;
    return '<div class="tabs"><button class="' + (up ? 'on' : '') + '" data-act="authTab" data-v="up">회원가입</button><button class="' + (!up ? 'on' : '') + '" data-act="authTab" data-v="in">로그인</button></div>' +
      '<div class="pad"><input type="email" id="em" placeholder="이메일" autocomplete="email"><input type="password" id="pw" placeholder="비밀번호 (4자 이상)">' +
      (up ? '<input type="password" id="pw2" placeholder="비밀번호 확인">' : '') +
      (msg ? '<p class="err" role="alert">' + msg + '</p>' : '') +
      '<button class="btn d w" data-act="submitAuth">' + (up ? '가입하고 취향 설정하기' : '로그인') + '</button>' +
      '<p class="sb" style="margin-top:12px;text-align:center">' + (up ? '이미 계정이 있나요? 위 로그인 탭을 누르세요' : '계정이 없나요? 위 회원가입 탭을 누르세요') + '</p></div>';
  }

  function recs() {
    return sorted(PLACES, 'match').sort(function (a, b) { return score(b) - score(a) || a.dist - b.dist; }).slice(0, 3);
  }
  function vHome(arg) {
    var bar = '<div class="sec"><div class="rw"><div><div class="lbl">현재 위치</div><div class="nm">' + esc(S.area) + '</div></div><button class="btn" data-go="#home/denied">위치 변경</button></div></div>';
    if (arg === 'loading') return bar + skeleton();
    if (arg === 'denied') {
      return bar + '<div class="sec">' + empty('위치 권한이 꺼져 있어요', '지명을 직접 입력하면 그 지역 기준으로 추천해요', '<input type="text" id="area" placeholder="예: 서울대입구, 낙성대" style="margin:4px 0 0"><button class="btn d" data-act="setArea">이 지역으로 확인</button>').replace('margin:14px 16px', 'margin:0') + '</div>';
    }
    var list = recs();
    return bar + '<div class="sec">' + mapHTML(null, true) + '</div>' +
      '<div class="cap"><span>내 주변 추천</span><span>' + (S.prefs.cat.length ? '취향 + 거리순' : '거리순') + '</span></div>' +
      '<div class="list">' + list.map(function (p) { return card(p); }).join('') + '</div>' +
      (S.prefs.cat.length ? '' : '<div class="cap" style="margin-top:4px">취향을 설정하면 추천이 더 정확해져요 (로그인 후 마이 → 취향 설정)</div>');
  }

  function vSearch(arg) {
    var head = '<div class="sec"><div class="rw" style="gap:6px"><input type="text" id="q" placeholder="장소명, 키워드 또는 지명 검색" value="' + esc(S.q) + '" style="margin:0"><button class="btn d" data-act="search">검색</button></div></div>';
    if (arg === 'loading') return head + skeleton();
    if (arg === 'error') {
      return head + empty('장소 정보를 불러오지 못했습니다', '네트워크 상태를 확인한 뒤 다시 시도해 주세요', '<button class="btn g" data-go="#search">다시 시도</button>');
    }
    if (!S.tokens) initTokens();
    var forced = arg === 'empty';
    var tokens = forced ? ['cat:카페', 'walk:10', 'price:2만원~'] : S.tokens;
    var q = forced ? '' : S.q;
    var list = sorted(applyFilter(tokens, q), S.sort);
    var n = tokens.length + (q ? 1 : 0);

    var basic = chip('카페', tokens.indexOf('cat:카페') > -1, 'tok', 'cat:카페') + chip('음식점', tokens.indexOf('cat:음식점') > -1, 'tok', 'cat:음식점') +
      chip('문화시설', tokens.indexOf('cat:문화시설') > -1, 'tok', 'cat:문화시설') + chip('도보 10분 내', tokens.indexOf('walk:10') > -1, 'tok', 'walk:10') +
      '<button class="chip more" data-act="more">' + (S.more ? '접기' : '조건 더보기') + '</button>';
    var more = '';
    if (S.more) {
      more = '<div class="chips" style="margin-top:8px">' + chip('공원', tokens.indexOf('cat:공원') > -1, 'tok', 'cat:공원') + chip('술집', tokens.indexOf('cat:술집') > -1, 'tok', 'cat:술집') + chip('도보 20분 내', tokens.indexOf('walk:20') > -1, 'tok', 'walk:20') + '</div>' +
        '<div class="chips" style="margin-top:8px">' + MOODS.map(function (m) { return chip(m, tokens.indexOf('mood:' + m) > -1, 'tok', 'mood:' + m); }).join('') + '</div>' +
        '<div class="chips" style="margin-top:8px">' + PRICES.map(function (m) { return chip(m, tokens.indexOf('price:' + m) > -1, 'tok', 'price:' + m); }).join('') + '</div>';
    }
    var filters = '<div class="sec"><div class="chips">' + basic + '</div>' + more + '</div>';
    var summary = '<div class="sec"><div class="rw"><span class="sb">조건 ' + n + '개 적용 · <b class="ink">' + list.length + '곳</b></span><button class="btn" data-act="clearAll">전체 해제</button></div></div>';

    if (!list.length) {
      var last = tokens[tokens.length - 1];
      var rest = last ? applyFilter(tokens.slice(0, -1), q).length : 0;
      var body = last
        ? empty('조건에 맞는 장소가 없습니다', '“' + tokLabel(last) + '” 조건을 해제하면 ' + rest + '곳을 볼 수 있습니다', '<button class="btn g" data-act="clearLast">' + tokLabel(last) + ' 해제</button>')
        : empty('검색어와 일치하는 장소가 없습니다', '다른 키워드나 지명으로 검색해 보세요', '<button class="btn g" data-act="clearQ">검색어 지우기</button>');
      return head + filters + summary + body;
    }
    var sortRow = '<div class="sec"><div class="rw"><span class="sb">정렬</span><span style="display:flex;gap:6px">' +
      '<button class="chip' + (S.sort === 'dist' ? ' on' : '') + '" data-act="sort" data-v="dist">가까운 순</button>' +
      '<button class="chip' + (S.sort === 'match' ? ' on' : '') + '" data-act="sort" data-v="match">취향 일치순</button></span></div></div>';
    return head + filters + summary + '<div class="sec">' + mapHTML(list, false) + '</div>' + sortRow +
      '<div class="list">' + list.map(function (p, i) { return card(p, i + 1); }).join('') + '</div>';
  }

  function vDetail(id) {
    var p = byId(id);
    if (!p) return empty('장소를 찾을 수 없습니다', '목록에서 다시 선택해 주세요', '<button class="btn g" data-go="#search">장소 검색</button>');
    var saved = S.fav.indexOf(p.id) > -1;
    return subbar(p.name) + '<div class="sec">' + img(150) + '</div>' +
      '<div class="sec"><div class="rw"><span class="nm lg">' + p.name + '</span><span class="bgs" style="margin:0"><span>' + p.cat + '</span></span></div>' +
      kv([['거리', p.dist + 'm · 도보 ' + p.min + '분'], ['영업시간', p.open + ' – ' + p.close], ['분위기', p.mood], ['가격대', p.price]]) + '</div>' +
      '<div class="sec nb">' + kv([['주소', p.addr], ['길찾기', '<button class="btn sm" data-act="toast" data-msg="외부 지도 앱 연결 자리">외부 지도 열기</button>']]) + '<p class="sb" style="margin:10px 0 0">' + p.desc + '</p></div>' +
      '<div class="savebar"><button class="btn w ' + (saved ? 'd' : 'g') + '" data-act="fav" data-id="' + p.id + '">' + (saved ? '★ 저장됨' : '☆ 즐겨찾기에 저장') + '</button></div>';
  }

  function vMy(arg) {
    var tab = arg === 'hist' ? 'hist' : (arg === 'prefs' ? 'prefs' : 'fav');
    var tabs = '<div class="tabs"><a class="' + (tab === 'fav' ? 'on' : '') + '" href="#my">즐겨찾기 ' + S.fav.length + '</a><a class="' + (tab === 'hist' ? 'on' : '') + '" href="#my/hist">최근 본 장소</a><a class="' + (tab === 'prefs' ? 'on' : '') + '" href="#my/prefs">취향 설정</a></div>';
    if (!S.logged) return tabs + empty('로그인이 필요합니다', '로그인하면 즐겨찾기와 최근 본 장소, 취향을 저장할 수 있어요', '<button class="btn d" data-go="#auth">로그인 · 회원가입</button>');
    if (tab === 'fav') {
      var l = S.fav.map(byId).filter(Boolean);
      return tabs + (l.length ? '<div class="list">' + l.map(function (p) { return card(p); }).join('') + '</div>' : empty('저장한 장소가 없습니다', '마음에 드는 곳을 저장하면 여기에서 다시 볼 수 있습니다', '<button class="btn g" data-go="#search">장소 둘러보기</button>'));
    }
    if (tab === 'hist') {
      var h = S.hist.map(function (x) { return byId(x.id); }).filter(Boolean);
      return tabs + (h.length ? '<div class="list">' + h.map(function (p) { return card(p); }).join('') + '</div>' : empty('최근 확인한 장소가 없습니다', '장소 상세를 열어보면 여기에 기록돼요', '<button class="btn g" data-go="#search">장소 둘러보기</button>'));
    }
    var pr = S.prefs, j = function (a) { return a.length ? a.join(', ') : '미설정'; };
    return tabs + '<div class="pad">' + kv([['카테고리', j(pr.cat)], ['분위기', j(pr.mood)], ['가격대', j(pr.price)], ['이동 거리', pr.walk ? '도보 ' + pr.walk + '분' : '미설정']]) +
      '<button class="btn d w" style="margin-top:14px" data-go="#prefs">취향 수정하기</button></div>';
  }

  function vPrefs() {
    if (!S.draft) S.draft = JSON.parse(JSON.stringify(S.prefs));
    var d = S.draft, has = function (a, v) { return a.indexOf(v) > -1; };
    return subbar('취향 설정') +
      '<div class="sec"><div class="lbl" style="margin-bottom:8px">관심 카테고리 (복수 선택)</div><div class="chips">' + CATS.map(function (c) { return chip(c, has(d.cat, c), 'pref', 'cat|' + c); }).join('') + '</div></div>' +
      '<div class="sec"><div class="lbl" style="margin-bottom:8px">분위기</div><div class="chips">' + MOODS.map(function (c) { return chip(c, has(d.mood, c), 'pref', 'mood|' + c); }).join('') + '</div>' +
      '<div class="lbl" style="margin:14px 0 8px">가격대</div><div class="chips">' + PRICES.map(function (c) { return chip(c, has(d.price, c), 'pref', 'price|' + c); }).join('') + '</div>' +
      '<div class="lbl" style="margin:14px 0 8px">이동 가능 거리</div><div class="chips">' + chip('도보 10분', d.walk === 10, 'pref', 'walk|10') + chip('도보 20분', d.walk === 20, 'pref', 'walk|20') + '</div></div>' +
      '<div class="savebar"><button class="btn d w" data-act="savePrefs">취향 저장</button></div>';
  }

  /* ---------- 렌더 / 라우터 ---------- */
  var ICONS = {
    '홈': '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/></svg>',
    '검색': '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
    '마이': '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
  };
  var lastRoute = '';

  function cur() { var h = (location.hash || '#landing').slice(1).split('/'); return { name: h[0] || 'landing', arg: h[1] }; }

  function render() {
    var r = cur(), view = $('#view'), keep = (lastRoute === location.hash) ? view.scrollTop : 0;
    lastRoute = location.hash;
    if (r.name === 'prefs' && !S.logged) { S.returnTo = '#prefs'; location.replace('#auth'); return; }
    if (r.name === 'detail' && S.logged && byId(r.arg) && !(S.hist[0] && S.hist[0].id === +r.arg)) {
      S.hist = S.hist.filter(function (x) { return x.id !== +r.arg; });
      S.hist.unshift({ id: +r.arg, at: new Date().toISOString() });
      S.hist = S.hist.slice(0, 20); store.set('hist', S.hist);
    }
    if (r.name !== 'prefs') S.draft = null;

    var html;
    switch (r.name) {
      case 'auth': html = vAuth(r.arg); break;
      case 'home': html = vHome(r.arg); break;
      case 'search': html = vSearch(r.arg); break;
      case 'detail': html = vDetail(r.arg); break;
      case 'my': html = vMy(r.arg); break;
      case 'prefs': html = vPrefs(); break;
      default: html = vLanding();
    }
    view.innerHTML = html;
    view.scrollTop = keep;
    $('#top').hidden = view.scrollTop < 240;

    var showHd = true, noNav = (r.name === 'landing' || r.name === 'auth' || !html);
    var right = '';
    if (!(r.name === 'landing' || r.name === 'auth')) {
      right = '<span class="hr"><a class="ib" href="#search" aria-label="검색">' + ICONS['검색'] + '</a>' +
        (S.logged ? '<button class="btn" data-act="logout">로그아웃</button>' : '<button class="btn" data-go="#auth">로그인</button>') + '</span>';
    }
    $('#hd').hidden = !showHd;
    $('#hd').innerHTML = '<a class="brand" href="' + (r.name === 'landing' ? '#landing' : '#home') + '">장소찾기</a>' + right;

    var active = (r.name === 'home') ? '홈' : (r.name === 'search' || r.name === 'detail') ? '검색' : (r.name === 'my' || r.name === 'prefs') ? '마이' : '';
    var tabHref = { '홈': '#home', '검색': '#search', '마이': '#my' };
    $('#bn').hidden = noNav || r.name === 'landing';
    $('#bn').innerHTML = ['홈', '검색', '마이'].map(function (t) { return '<a href="' + tabHref[t] + '" class="' + (t === active ? 'on' : '') + '">' + ICONS[t] + '<span>' + t + '</span></a>'; }).join('');
  }

  var toastTimer;
  function toast(msg, link) {
    var t = $('#toast');
    t.innerHTML = '<span>' + msg + '</span>' + (link ? '<a href="' + link[1] + '">' + link[0] + '</a>' : '');
    t.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  /* ---------- 동작 ---------- */
  function act(el) {
    var a = el.getAttribute('data-act'), v = el.getAttribute('data-v'), id = el.getAttribute('data-id');
    switch (a) {
      case 'start': location.hash = S.logged ? '#home' : '#auth'; break;
      case 'back': if (history.length > 1) history.back(); else location.hash = '#home'; break;
      case 'top': $('#view').scrollTo({ top: 0, behavior: 'smooth' }); break;
      case 'toast': toast(el.getAttribute('data-msg')); break;
      case 'authTab': S.authTab = v; S.authErr = ''; render(); break;
      case 'submitAuth': submitAuth(); break;
      case 'logout': S.logged = false; toast('로그아웃했습니다'); location.hash = '#landing'; break;
      case 'toggleLogin': S.logged = !S.logged; render(); break;
      case 'setArea': var a2 = $('#area').value.trim(); if (a2) S.area = a2; location.hash = '#home'; break;
      case 'search': S.q = $('#q').value.trim(); if (!S.tokens) initTokens(); render(); break;
      case 'clearQ': S.q = ''; render(); break;
      case 'tok': if (!S.tokens) initTokens(); toggleToken(v); render(); break;
      case 'more': S.more = !S.more; render(); break;
      case 'clearAll': S.tokens = []; S.q = ''; render(); break;
      case 'clearLast': S.tokens.pop(); render(); break;
      case 'sort': S.sort = v; render(); break;
      case 'pin':
        document.querySelectorAll('.cd.sel').forEach(function (n) { n.classList.remove('sel'); });
        var c = document.getElementById('c-' + id);
        if (c) { c.classList.add('sel'); c.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        break;
      case 'fav': toggleFav(+id); break;
      case 'pref': togglePref(v); break;
      case 'savePrefs':
        if (!S.draft.cat.length) { toast('관심 카테고리를 1개 이상 선택해 주세요'); break; }
        S.prefs = S.draft; store.set('prefs', S.prefs); S.tokens = null; S.draft = null;
        toast('취향을 저장했습니다');
        var go = S.returnTo && S.returnTo !== '#prefs' ? S.returnTo : '#home'; S.returnTo = '#home'; location.hash = go; break;
    }
  }
  function toggleFav(id) {
    if (!S.logged) { S.returnTo = location.hash; toast('로그인이 필요합니다'); setTimeout(function () { location.hash = '#auth'; }, 500); return; }
    var i = S.fav.indexOf(id);
    if (i > -1) { S.fav.splice(i, 1); toast('즐겨찾기에서 해제했습니다'); }
    else { S.fav.push(id); toast('장소를 즐겨찾기에 저장했습니다', ['보기', '#my']); }
    store.set('fav', S.fav); render();
  }
  function togglePref(v) {
    var p = v.split('|'), k = p[0], val = p[1], d = S.draft;
    if (k === 'walk') { d.walk = d.walk === +val ? null : +val; }
    else if (k === 'price') { d.price = d.price[0] === val ? [] : [val]; }
    else { var i = d[k].indexOf(val); if (i > -1) d[k].splice(i, 1); else d[k].push(val); }
    render();
  }
  function submitAuth() {
    var em = $('#em').value.trim(), pw = $('#pw').value, pw2 = $('#pw2') ? $('#pw2').value : pw, up = S.authTab === 'up';
    if (!/^\S+@\S+\.\S+$/.test(em)) S.authErr = '이메일 형식이 올바르지 않습니다. 예: name@example.com';
    else if (pw.length < 4) S.authErr = '비밀번호는 4자 이상 입력해 주세요';
    else if (up && pw !== pw2) S.authErr = '비밀번호가 일치하지 않습니다';
    else S.authErr = '';
    if (S.authErr) { render(); return; }
    S.logged = true;
    if (up) { location.hash = '#prefs'; }
    else { var go = S.returnTo || '#home'; S.returnTo = '#home'; location.hash = go === '#auth' ? '#home' : go; }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a) { e.preventDefault(); act(a); return; }
    var g = e.target.closest('[data-go]');
    if (g) { location.hash = g.getAttribute('data-go'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'q') { e.preventDefault(); act(document.querySelector('[data-act="search"]')); }
  });
  $('#view').addEventListener('scroll', function () { $('#top').hidden = this.scrollTop < 240; });
  window.addEventListener('hashchange', function () { render(); $('#view').scrollTop = 0; });
  if (!location.hash) location.replace('#landing');
  render();
})();
