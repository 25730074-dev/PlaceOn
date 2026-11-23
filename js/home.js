/* js/home.js — 홈: 지도 · 바텀시트 · 지오코딩 */
/* ───────── 홈: 지도(드래그·휠·핀치 줌) + 바텀시트 ───────── */
const PEEK = 120, MAP = { c: null, lv: null }, OV = new Map();
let sheetIdx = 0, HOME = {}, POOL = [], lastSig = '', vtm = 0, KMAP = null, geoRun = false, ME = D.map.me.slice(), meOv = null, geoWatch = null;
const GEO = (() => { try { return JSON.parse(localStorage.getItem('geo2') || '{}'); } catch { return {}; } })();   // { id: [lat, lng] | null } — 지오코딩 캐시
const saveGeo = () => { try { localStorage.setItem('geo2', JSON.stringify(GEO)); } catch {} };
const pinPos = p => GEO[p.id] || null;
let ranked = ME;                            // 마지막으로 순위를 매긴 내 위치
const NEAR_N = 10;
const dist = ([la, lo], [la2, lo2]) => { const r = x => x * Math.PI / 180,
  a = Math.sin(r(la2 - la) / 2) ** 2 + Math.cos(r(la)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a)); };
const distText = p => { const q = pinPos(p); if (!q) return '정보 없음'; const m = Math.round(dist(ME, q) / 10) * 10;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`; };
const viewRect = (m = 0) => { const b = KMAP.getBounds(), s = b.getSouthWest(), n = b.getNorthEast(),
  py = (n.getLat() - s.getLat()) * (m ? .2 : 0), px = (n.getLng() - s.getLng()) * (m ? .2 : 0);
  return [s.getLat() - py, s.getLng() - px, n.getLat() + py, n.getLng() + px]; };
const inView = (pos, v) => pos && pos[0] >= v[0] && pos[0] <= v[2] && pos[1] >= v[1] && pos[1] <= v[3];

const PIN = p => `<button type="button" class="pin" data-a="place:${p.id}" aria-label="${p.name}"><small>${p.name}</small><svg width="22" height="30" viewBox="0 0 24 32" aria-hidden="true"><path class="pin-fill" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z"/><circle class="pin-dot" cx="12" cy="12" r="4.5"/></svg></button>`;
function clearPins() { OV.forEach(o => o.setMap(null)); OV.clear(); }
function drawPins() {                       // 화면 안(+여유)에 들어온 장소만 오버레이로 표시
  if (!KMAP) return;
  const want = POOL.filter(o => inView(o.pos, viewRect(1))), ids = new Set(want.map(o => o.p.id));
  OV.forEach((o, id) => { if (!ids.has(id)) { o.setMap(null); OV.delete(id); } });
  want.forEach(({ p, pos }) => { if (!OV.has(p.id)) OV.set(p.id, new kakao.maps.CustomOverlay({
    map: KMAP, position: new kakao.maps.LatLng(...pos), xAnchor: .5, yAnchor: 1, clickable: true, content: PIN(p) })); });
}
function watchMe() {                       // 실제 위치 추적 (HTTPS/localhost + 위치 권한 필요)
  if (geoWatch !== null || !navigator.geolocation) return;
  let first = true;
  geoWatch = navigator.geolocation.watchPosition(pos => {
    ME = [pos.coords.latitude, pos.coords.longitude];
    const ll = new kakao.maps.LatLng(...ME);
    if (meOv) meOv.setPosition(ll);
    if (first) { first = false; if (KMAP) KMAP.setCenter(ll); homeDraw(); }   // 첫 수신 때만 지도 이동
    else if (dist(ME, ranked) > 30) homeDraw();                              // 30m 이상 움직이면 다시 정렬
  }, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
}
function geocodeAll() {                     // 주소 → 좌표 (최초 1회, 결과는 localStorage 캐시)
  geoRun = true;
  const gc = new kakao.maps.services.Geocoder(), todo = STORES.filter(s => !(s.id in GEO) && (s.address || s.jibun));
  let i = 0;
  const next = () => {
    if (i >= todo.length) { saveGeo(); if ($('#kmap')) homeDraw(); return; }
    const s = todo[i++], q = (s.address || s.jibun).replace(/\s*\(.*\)/, '').split(',')[0];
    gc.addressSearch(q, (r, st) => {
      GEO[s.id] = st === kakao.maps.services.Status.OK ? [+r[0].y, +r[0].x] : null;
      if (i % 20 === 0) { saveGeo(); if ($('#kmap')) homeDraw(); }
      setTimeout(next, 30);
    });
  };
  next();
}
function scheduleView() {                   // 이동이 멈추면(0.2초) 시트 목록을 지도 영역 기준으로 다시 로드
  clearTimeout(vtm); vtm = setTimeout(() => drawView(), 200);
}
function drawView(force) {
  const lst = $('#hlist'); if (!lst) return;
  const items = POOL.map(o => o.p);       // POOL은 이미 거리순
  const sig = items.map(p => p.id).join(','), changed = sig !== lastSig; lastSig = sig;
  const stat = `내 위치 기준 가까운 ${items.length}곳`;
  if (!changed && !force) { $('#hstat').textContent = stat; return; }
  if (changed && !force) S.shown.home = 1;
  const st = lst.scrollTop;
  $('#hcount').textContent = `${S.nearCat || '전체'} · 가까운 순 ${items.length}곳`;
  lst.innerHTML = items.length ? items.slice(0, pageOf(S.shown.home)).map(p => pcard(p)).join('') + moreBtn('home', items.length)
    : empty('가까운 장소를 찾지 못했어요', '주소 좌표를 불러오는 중이거나 이 카테고리에 장소가 없어요.');
  lst.scrollTop = changed && !force ? 0 : st;
  $('#hstat').textContent = stat;
}
const drawPop = () => { $('#popchips').innerHTML = [['전체', ''], ...CATS.map(c => [c, c])].map(([l, v]) => chip(l, S.popCat === v, 'hfpick:' + v)).join(''); };
function homeDraw() {                       // 칩·취향·추천 풀이 바뀔 때 (지도 위치는 유지)
  ranked = ME.slice();
  POOL = recommend().map(p => ({ p, pos: pinPos(p) }));
  $('#hfbtn').textContent = `필터 · ${S.nearCat || '전체'}`;
  $('#hprefs').textContent = '내 위치에서 가까운 순서로 보여드려요';
  clearPins(); drawPins();
  lastSig = ''; drawView(true);
}
function initHome() {
  const box = $('.homemap'), sheet = $('.sheet'), home = $('.home'), drag = $('.drag');
  const R = () => box.getBoundingClientRect();
  KMAP = null; OV.clear();
  if (typeof kakao === 'undefined') $('#kmap').textContent = '카카오 지도 SDK를 불러오지 못했어요. 앱키·도메인 등록을 확인하세요.';
  else kakao.maps.load(() => {
    const me = new kakao.maps.LatLng(...ME);
    const map = new kakao.maps.Map($('#kmap'), { center: MAP.c || me, level: MAP.lv ?? D.map.level });
    meOv = new kakao.maps.CustomOverlay({ map, position: me, content: '<div class="me"><small>내 위치</small></div>' });
    kakao.maps.event.addListener(map, 'idle', () => { MAP.c = map.getCenter(); MAP.lv = map.getLevel(); drawPins(); scheduleView(); });
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
