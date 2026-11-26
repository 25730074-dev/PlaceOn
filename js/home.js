/* js/home.js — 홈: 지도 · 바텀시트 · 지오코딩 */
/* ───────── 홈: 카카오 지도 + 바텀시트 ───────── */
const PEEK = 120, MAP = { c: null, lv: null }, OV = new Map();
let sheetIdx = 0, HOME = {}, POOL = [], KMAP = null, geoRun = false, ME = D.map.me.slice(), meOv = null, geoWatch = null, geoLive = false;
const GEO = LS.get('geo', null) || (() => { try { return JSON.parse(localStorage.getItem('geo2') || '{}'); } catch { return {}; } })();   // { id: [lat, lng] | null } — 지오코딩 캐시 (예전 키 geo2 에서 이어받음)
const saveGeo = () => { LS.set('geo', GEO); try { localStorage.removeItem('geo2'); } catch {} };
const onHome = () => !!$('#kmap');           // 지금 홈 화면인지 (다른 화면에서 홈 DOM 을 건드리지 않도록)
const locText = () => geoLive ? '현재 위치 기준' : `기본 위치(${S.area}) 기준`;
const pinPos = p => GEO[p.id] || null;
const NEAR_N = 10, PIN_N = 30;              // 바텀시트 목록은 상위 10곳, 지도 핀은 상위 30곳 (같은 순위에서 잘라 씀)
const dist = ([la, lo], [la2, lo2]) => { const r = x => x * Math.PI / 180,
  a = Math.sin(r(la2 - la) / 2) ** 2 + Math.cos(r(la)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a)); };
const distText = p => { const q = pinPos(p); if (!q) return '정보 없음'; const m = Math.round(dist(ME, q) / 10) * 10;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`; };
const viewRect = (m = 0) => { const b = KMAP.getBounds(), s = b.getSouthWest(), n = b.getNorthEast(),
  py = (n.getLat() - s.getLat()) * (m ? .2 : 0), px = (n.getLng() - s.getLng()) * (m ? .2 : 0);
  return [s.getLat() - py, s.getLng() - px, n.getLat() + py, n.getLng() + px]; };
const inView = (pos, v) => pos && pos[0] >= v[0] && pos[0] <= v[2] && pos[1] >= v[1] && pos[1] <= v[3];

const PIN = p => `<button type="button" class="pin" data-a="place:${p.id}" aria-label="${esc(p.name)}"><small>${esc(p.name)}</small><svg width="22" height="30" viewBox="0 0 24 32" aria-hidden="true"><path class="pin-fill" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z"/><circle class="pin-dot" cx="12" cy="12" r="4.5"/></svg></button>`;
function clearPins() { OV.forEach(o => o.setMap(null)); OV.clear(); }
function drawPins() {                       // 화면 안(+여유)에 들어온 장소만 오버레이로 표시
  if (!KMAP || !onHome()) return;
  const want = POOL.filter(o => inView(o.pos, viewRect(1))), ids = new Set(want.map(o => o.p.id));
  OV.forEach((o, id) => { if (!ids.has(id)) { o.setMap(null); OV.delete(id); } });
  want.forEach(({ p, pos }) => { if (!OV.has(p.id)) OV.set(p.id, new kakao.maps.CustomOverlay({
    map: KMAP, position: new kakao.maps.LatLng(...pos), xAnchor: .5, yAnchor: 1, clickable: true, content: PIN(p) })); });
}
function watchMe() {                       // 실제 위치 추적 (HTTPS/localhost + 위치 권한 필요)
  if (geoWatch !== null || !navigator.geolocation || (S.user && !S.settings.consent.location)) return;   // 위치 정보 이용 동의 필요
  let first = true;
  geoWatch = navigator.geolocation.watchPosition(pos => {
    ME = [pos.coords.latitude, pos.coords.longitude]; geoLive = true;
    if (!onHome()) return;                                                   // 다른 화면이면 위치만 갱신 (홈에 오면 그 위치로 다시 정렬)
    const ll = new kakao.maps.LatLng(...ME);
    if (meOv) meOv.setPosition(ll);
    $('#hloc').textContent = locText();
    if (first) { first = false; if (KMAP) KMAP.setCenter(ll); homeDraw(); }   // 첫 수신 때만 지도 이동
    else if (dist(ME, ranked) > 30) homeDraw();                              // 30m 이상 움직이면 다시 정렬
  }, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
}
function stopWatch() {                      // 위치 추적 중지 + 기본 위치로 (로그아웃 · 위치 동의 철회 · 동의 안 한 계정으로 로그인)
  if (geoWatch !== null) { navigator.geolocation.clearWatch(geoWatch); geoWatch = null; }
  ME = D.map.me.slice(); geoLive = false;
}
function geocodeAll() {                     // 주소 → 좌표 (도로명 → 실패 시 지번, 결과는 localStorage 캐시 / 실패한 곳은 다음 실행 때 다시 시도)
  geoRun = true;
  const todo = STORES.filter(s => !GEO[s.id] && (s.address || s.jibun));
  let i = 0;
  const next = () => {
    if (i >= todo.length) { saveGeo(); if (onHome()) homeDraw(); return; }
    const s = todo[i++];
    geocodeOne(s, r => {
      GEO[s.id] = r;
      if (i % 20 === 0) { saveGeo(); if (onHome()) homeDraw(); }
      setTimeout(next, 30);
    });
  };
  next();
}
function drawView() {                       // 바텀시트 목록: POOL(이미 정렬됨: 가까운 순 또는 취향·거리 맞춤순)의 상위 NEAR_N곳
  const lst = $('#hlist'); if (!lst) return;
  const items = POOL.slice(0, NEAR_N).map(o => o.p), st = lst.scrollTop;
  $('#hcount').textContent = `${S.nearCat || '전체'} · ${orderText()} ${items.length}곳`;
  lst.innerHTML = items.length ? items.map(p => pcard(p)).join('')
    : empty('가까운 장소를 찾지 못했어요', S.user ? `주소 좌표를 불러오는 중이거나 검색 반경(${radiusText(S.prefs.radius)}) 안에 장소가 없어요. 설정에서 반경을 넓혀 보세요.` : '주소 좌표를 불러오는 중이거나 이 카테고리에 장소가 없어요.');
  lst.scrollTop = st;
  $('#hstat').textContent = `내 위치 기준 ${personal() ? '맞춤 추천' : '가까운'} ${items.length}곳`;
}
const drawPop = () => { $('#popchips').innerHTML = [['전체', ''], ...CATS.map(c => [c, c])].map(([l, v]) => chip(l, S.popCat === v, 'hfpick:' + v)).join(''); };
let ranked = ME;                            // 마지막으로 순위를 매긴 내 위치
function homeDraw() {                       // 칩·취향·추천 풀이 바뀔 때 (지도 위치는 유지). 홈 화면이 아니면 아무것도 안 함
  if (!onHome()) return;
  ranked = ME.slice();
  POOL = recommend(PIN_N).map(p => ({ p, pos: pinPos(p) }));          // 핀용 30곳 (목록은 이 중 앞 10곳)
  $('#hfbtn').textContent = `필터 · ${S.nearCat || '전체'}`;
  $('#hprefs').textContent = S.user ? `검색 반경 ${radiusText(S.prefs.radius)} · ${orderText()}` : '내 위치에서 가까운 순서로 보여드려요';
  $('#hloc').textContent = locText();
  clearPins(); drawPins();
  drawView();
}
function initHome() {
  const box = $('.homemap'), sheet = $('.sheet'), home = $('.home'), drag = $('.drag');
  const R = () => box.getBoundingClientRect();
  KMAP = null; OV.clear();
  if (typeof kakao === 'undefined') $('#kmap').textContent = '카카오 지도 SDK를 불러오지 못했어요. 앱키·도메인 등록을 확인하세요.';
  else kakao.maps.load(() => {
    if (!onHome()) return;                  // SDK 로드 중에 다른 화면으로 이동했으면 중단
    const me = new kakao.maps.LatLng(...ME);
    const map = new kakao.maps.Map($('#kmap'), { center: MAP.c || me, level: MAP.lv ?? D.map.level });
    meOv = new kakao.maps.CustomOverlay({ map, position: me, content: '<div class="me"><small>내 위치</small></div>' });
    kakao.maps.event.addListener(map, 'idle', () => { MAP.c = map.getCenter(); MAP.lv = map.getLevel(); drawPins(); });
    HOME = { zin: () => map.setLevel(map.getLevel() - 1, { animate: true }), zout: () => map.setLevel(map.getLevel() + 1, { animate: true }), zme: () => map.panTo(new kakao.maps.LatLng(...ME)) };
    KMAP = map; homeDraw();
    if (!geoRun) geocodeAll();
    watchMe();
  });

  const snaps = () => [PEEK, Math.round(R().height * .5), R().height - 60];
  const setH = (h, a) => {
    sheet.style.transition = a ? 'height .25s ease' : 'none'; sheet.style.height = h + 'px';
    home.style.setProperty('--sh', h + 'px'); home.classList.toggle('max', h > snaps()[2] - 20);
  };
  setH(snaps()[sheetIdx]);
  let sy = 0, sh = 0, moved = false, id = null;
  drag.addEventListener('pointerdown', e => { drag.setPointerCapture(e.pointerId); id = e.pointerId; sy = e.clientY; sh = sheet.offsetHeight; moved = false; });
  drag.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const dy = e.clientY - sy; if (Math.abs(dy) > 4) moved = true;
    if (moved) setH(Math.min(snaps()[2], Math.max(PEEK, sh - dy)));
  });
  const end = e => {
    if (e.pointerId !== id) return; id = null;
    const s = snaps(), h = sheet.offsetHeight;
    sheetIdx = moved ? s.reduce((b, v, i) => Math.abs(v - h) < Math.abs(s[b] - h) ? i : b, 0) : (sheetIdx + 1) % 3;
    setH(s[sheetIdx], true);
  };
  drag.addEventListener('pointerup', end); drag.addEventListener('pointercancel', end);
}

/* ───────── 상세: 장소 위치 지도 (마커 1개) ───────── */
function geocodeOne(p, done) {              // 도로명 → 실패 시 지번으로 재시도, 결과는 GEO 캐시에 저장
  const gc = new kakao.maps.services.Geocoder(), OK = kakao.maps.services.Status.OK,
    qs = [p.address.replace(/\s*\(.*\)/, '').split(',')[0], p.jibun.replace(/번지.*$/, '')].filter(Boolean);
  const go = i => i >= qs.length ? done(null) : gc.addressSearch(qs[i], (r, st) => st === OK ? done([+r[0].y, +r[0].x]) : go(i + 1));
  go(0);
}
function initDetailMap() {
  const el = $('#dmap'), p = place(S.placeId);
  if (!el) return;
  if (typeof kakao === 'undefined') { el.textContent = '지도를 불러오지 못했어요. 앱키·도메인 등록을 확인하세요.'; return; }
  kakao.maps.load(() => {
    const show = pos => {
      if (!$('#dmap')) return;              // 그 사이 다른 화면으로 이동했으면 중단
      if (!pos) { el.textContent = '이 장소의 위치를 찾지 못했어요.'; return; }
      el.textContent = '';
      const c = new kakao.maps.LatLng(...pos), map = new kakao.maps.Map(el, { center: c, level: 3 });
      new kakao.maps.Marker({ map, position: c });
      map.setZoomable(false);               // 페이지 스크롤과 휠 줌이 겹치지 않도록 + / − 버튼 사용
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
    };
    const pos = pinPos(p);
    pos ? show(pos) : geocodeOne(p, r => { GEO[p.id] = r; saveGeo(); show(r); });
  });
}
