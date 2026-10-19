// 08~10 마이페이지 공통 셸 — 사용자 정보 · 로그아웃 · 내부 탭(취향 설정 / 즐겨찾기 / 최근 본 장소)
// 각 탭은 하위 폴더(prefs / favorites / recent)의 html·css·js 로 분리되어 있습니다.
import { $, toast } from '../../js/core/ui.js';
import { loadHtml, loadCss } from '../../js/core/loader.js';

const SECTIONS = {
  prefs:     () => import('./prefs/prefs.js'),
  favorites: () => import('./favorites/favorites.js'),
  recent:    () => import('./recent/recent.js')
};
const TABS = [['prefs', '취향 설정'], ['favorites', '즐겨찾기'], ['recent', '최근 본 장소']];
let section = null;                       // 현재 열려 있는 탭 모듈

export default {
  html: new URL('./mypage.html', import.meta.url),
  css: new URL('./mypage.css', import.meta.url),
  tab: 'mypage',
  auth: true,
  bar: () => ({ title: '마이페이지' }),

  async mount(el, ctx) {
    const { store, params, signal } = ctx;
    const key = SECTIONS[params.section] ? params.section : 'prefs';
    $('[data-slot=email]', el).textContent = store.user.email;

    $('[data-slot=tabs]', el).replaceChildren(...TABS.map(([k, label]) =>
      Object.assign(document.createElement('button'), { textContent: label, className: k === key ? 'on' : '' , onclick: () => go(k, key) })));

    $('[data-act=logout]', el).addEventListener('click', () => {
      store.user = null; toast('로그아웃했어요.'); location.hash = '#/intro';
    }, { signal });

    const mod = (await SECTIONS[key]()).default;
    const [html] = await Promise.all([loadHtml(mod.html), mod.css ? loadCss(mod.css) : null]);
    if (signal.aborted) return;
    const slot = $('[data-slot=section]', el);
    slot.innerHTML = html;
    section = mod;
    await mod.mount(slot, ctx);
  },

  refresh(ctx) { section?.refresh?.(ctx); }
};

function go(next, cur) {
  if (next === cur) return;
  if (section?.isDirty?.() && !confirm('저장하지 않은 수정 내용이 있어요. 이동할까요?')) return;
  section?.discard?.();
  location.hash = '#/mypage/' + next;
}
