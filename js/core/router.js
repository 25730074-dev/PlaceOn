// 해시 라우터: 페이지 모듈을 지연 로드하고 #content 영역만 교체
import { store } from './store.js';
import { loadHtml, loadCss, unloadPageCss } from './loader.js';
import { $ } from './ui.js';

const ROUTES = [
  ['/intro',            () => import('../../pages/intro/intro.js')],
  ['/login',            () => import('../../pages/login/login.js')],
  ['/signup',           () => import('../../pages/signup/signup.js')],
  ['/home',             () => import('../../pages/home/home.js')],
  ['/search',           () => import('../../pages/search/search.js')],
  ['/filter',           () => import('../../pages/filter/filter.js')],
  ['/detail/:id',       () => import('../../pages/detail/detail.js')],
  ['/mypage/:section',  () => import('../../pages/mypage/mypage.js')]
].map(([path, load]) => {
  const keys = [];
  const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  return { re, keys, load };
});

let ctrl = null, current = null, seq = 0;

function drawBar(c) {
  $('#appbar').innerHTML =
    (c.back ? `<button class="link back" data-nav="${c.back}" aria-label="뒤로">←</button>` : '') +
    (c.brand ? '<span class="brand">Place<i>ON</i></span><span class="grow"></span>' : `<h1>${c.title}</h1>`) +
    (c.right || '');
}
function drawTab(active) {
  const tab = $('#tabbar');
  tab.hidden = !active;
  if (active) tab.innerHTML = store.db.tabs
    .map(t => `<button class="${t.id === active ? 'on' : ''}" data-nav="${t.href}"><span>${t.icon}</span>${t.label}</button>`).join('');
}

export async function render({ refresh = false } = {}) {
  let path = location.hash.slice(1) || '/intro';
  if (path === '/mypage') path = '/mypage/prefs';

  let route = null, m = null;
  for (const r of ROUTES) { m = r.re.exec(path); if (m) { route = r; break; } }
  if (!route) { location.hash = '#/intro'; return; }

  const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
  const page = (await route.load()).default;
  if (page.auth && !store.user) { location.hash = '#/login'; return; }

  // 같은 페이지의 상태 갱신(저장 토글 등)은 page.refresh 가 있으면 부분 갱신
  if (refresh && current && current.page === page && page.refresh) { page.refresh(current.ctx); return; }

  const token = ++seq;
  const st = refresh ? $('#content').scrollTop : 0;
  ctrl?.abort(); ctrl = new AbortController();   // 이전 마운트의 이벤트 리스너 해제
  if (!refresh) unloadPageCss();

  const [html] = await Promise.all([loadHtml(page.html), page.css ? loadCss(page.css) : null]);
  if (token !== seq) return;

  const el = $('#content');
  const ctx = { store, params, el, bar: $('#appbar'), signal: ctrl.signal, refresh: () => render({ refresh: true }) };
  drawBar(page.bar ? page.bar(ctx) : {});
  drawTab(page.tab);
  $('.home-bar').hidden = !!page.hideHomeBar;
  el.className = page.full ? 'full' : '';
  el.innerHTML = html;
  el.scrollTop = st;
  current = { page, ctx };
  try { await page.mount(el, ctx); }
  catch (err) {
    console.error(err);
    el.innerHTML = '<div class="empty"><b>화면을 불러오지 못했어요</b>잠시 후 다시 시도해 주세요.</div>';
  }
}
