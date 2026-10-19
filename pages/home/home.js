// 04 홈 — 전체 화면 지도(드래그·휠·핀치 줌) + 위로 밀어 올리는 취향 맞춤 추천 시트
import { $, clone, fill, renderChips, renderEmpty, placeCard } from '../../js/core/ui.js';
import { recommend } from '../../js/core/places.js';

const PEEK = 170;                       // 시트 접힌 높이(px)
const view = { x: null, y: null, k: null };   // 지도 상태: 다른 화면에 다녀와도 유지
let sheetIdx = 0;                        // 0 접힘 · 1 절반 · 2 거의 전체

export default {
  html: new URL('./home.html', import.meta.url),
  css: new URL('./home.css', import.meta.url),
  tab: 'home',
  full: true,
  bar: () => ({ brand: true, right: '<button class="link" data-nav="#/intro" aria-label="서비스 소개">ⓘ</button><button class="link" data-act="loc">위치 변경</button>' }),

  mount(el, ctx) {
    const { store, signal } = ctx;
    drawArea(el, store); drawChips(el, store); drawList(el, store);
    initMap(el, store);
    initSheet(el);

    ctx.bar.addEventListener('click', e => {                 // 위치 변경
      if (!e.target.closest('[data-act=loc]')) return;
      const a = prompt('현재 위치 지역을 입력하세요', store.area);
      if (a && a.trim()) { store.area = a.trim(); drawArea(el, store); }
    }, { signal });

    $('[data-slot=cats]', el).addEventListener('click', e => {   // 카테고리 칩
      const b = e.target.closest('[data-near-cat]');
      if (!b) return;
      store.nearbyCat = b.dataset.nearCat;
      drawChips(el, store); drawList(el, store);
    });
  },

  refresh({ el, store }) { drawList(el, store); }              // 즐겨찾기 토글 시 리스트만 갱신
};

/* ── 그리기 ── */
function drawArea(el, store) { $('[data-slot=area]', el).textContent = store.area; }

function drawChips(el, store) {
  const items = [['전체', ''], ...store.prefs.cats.map(c => [c, c])];
  renderChips($('[data-slot=cats]', el), items, v => store.nearbyCat === v, 'nearCat');
}

function drawList(el, store) {
  const list = recommend(store);
  $('[data-slot=count]', el).textContent = `${list.length}곳`;
  $('[data-slot=prefs]', el).textContent = [...store.prefs.cats, ...store.prefs.conds].join(' · ') || '저장한 취향이 없어요';

  $('[data-slot=pins]', el).replaceChildren(...list.map(p => {
    const n = clone('t-pin');
    n.dataset.goPlace = p.id;
    n.style.left = p.pos[0] + 'px'; n.style.top = p.pos[1] + 'px';
    n.setAttribute('aria-label', p.name);
    return fill(n, { name: p.name });
  }));

  const box = $('[data-slot=list]', el);
  if (list.length) box.replaceChildren(...list.map(p => placeCard(store, p, `${p.dist} · ${p.walk}`)));
  else renderEmpty(box, '조건에 맞는 장소가 없어요', '취향 설정을 바꿔 보세요.');
}

/* ── 지도: 팬 · 줌 ── */
function initMap(el, store) {
  const cfg = store.db.map, M = view;
  const box = $('.homemap', el), world = $('#world', el), sheet = $('.sheet', el), home = $('.home', el);
  const R = () => box.getBoundingClientRect();
  const apply = () => { world.style.transform = `translate(${M.x}px,${M.y}px) scale(${M.k})`; world.style.setProperty('--k', M.k); };
  const center = () => { const r = R(); M.k = cfg.zoom; M.x = r.width / 2 - cfg.me[0] * M.k; M.y = (r.height - PEEK) / 2 + 20 - cfg.me[1] * M.k; };
  const zoomAt = (cx, cy, nk) => {
    nk = Math.min(cfg.maxZoom, Math.max(cfg.minZoom, nk));
    const f = nk / M.k; M.x = cx - (cx - M.x) * f; M.y = cy - (cy - M.y) * f; M.k = nk; apply();
  };
  const anim = fn => { world.style.transition = 'transform .3s ease'; fn(); setTimeout(() => world.style.transition = '', 320); };
  if (M.x === null) center();
  apply();

  const pts = new Map(); let last = 0;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('.pin')) return;
    box.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    world.style.transition = ''; if (pts.size === 2) last = dist();
  });
  box.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    const px = p[0], py = p[1]; p[0] = e.clientX; p[1] = e.clientY;
    if (pts.size === 2) {                                   // 핀치 줌
      const [a, b] = [...pts.values()], r = R(), d = dist();
      zoomAt((a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top, M.k * d / last); last = d;
    } else { M.x += p[0] - px; M.y += p[1] - py; apply(); }   // 드래그 이동
  });
  ['pointerup', 'pointercancel'].forEach(t => box.addEventListener(t, e => pts.delete(e.pointerId)));
  box.addEventListener('wheel', e => {                      // 휠 줌
    e.preventDefault(); const r = R();
    zoomAt(e.clientX - r.left, e.clientY - r.top, M.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });

  const mid = () => [R().width / 2, (R().height - sheet.offsetHeight) / 2];
  $('[data-z=in]', home).onclick = () => anim(() => zoomAt(...mid(), M.k * 1.4));
  $('[data-z=out]', home).onclick = () => anim(() => zoomAt(...mid(), M.k / 1.4));
  $('[data-z=me]', home).onclick = () => anim(() => { center(); apply(); });
}

/* ── 바텀시트: 드래그로 3단계 스냅, 손잡이 탭으로 단계 전환 ── */
function initSheet(el) {
  const home = $('.home', el), sheet = $('.sheet', el), drag = $('.drag', el), box = $('.homemap', el);
  const snaps = () => { const h = box.getBoundingClientRect().height; return [PEEK, Math.round(h * .5), h - 60]; };
  const setH = (h, anim) => {
    sheet.style.transition = anim ? 'height .25s ease' : 'none';
    sheet.style.height = h + 'px';
    home.style.setProperty('--sh', h + 'px');
    home.classList.toggle('max', h > snaps()[2] - 20);
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
  drag.addEventListener('pointerup', end);
  drag.addEventListener('pointercancel', end);
}
