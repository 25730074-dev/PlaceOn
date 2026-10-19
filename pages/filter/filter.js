// 06 검색 필터 설정 — 임시값(draft)을 편집하고 '적용'할 때만 검색 조건(appliedFilters)에 반영
import { $, renderChips, toggleIn, toast } from '../../js/core/ui.js';
import { searchPlaces } from '../../js/core/places.js';

let draft;

export default {
  html: new URL('./filter.html', import.meta.url),
  css: new URL('./filter.css', import.meta.url),
  tab: null,
  bar: () => ({ title: '검색 조건 설정', back: '#/search', right: '<button class="link" data-act="reset">초기화</button>' }),

  mount(el, { store, bar, signal }) {
    draft = { ...structuredClone(store.applied), mode: store.search.mode };   // 뒤로 가면 이전 조건 유지
    draw(el, store);

    bar.addEventListener('click', e => {                                       // 초기화: 선택값을 기본값으로
      if (!e.target.closest('[data-act=reset]')) return;
      draft = { ...store.defaultFilters(), mode: draft.mode }; draw(el, store);
    }, { signal });

    el.addEventListener('click', e => {
      const t = e.target.closest('[data-mode],[data-radius],[data-fcat],[data-fcond],[data-act=apply]');
      if (!t) return;
      const d = t.dataset;
      if (d.mode) draft.mode = d.mode;
      else if (d.radius) draft.radiusKm = +d.radius;
      else if (d.fcat) draft.category = draft.category === d.fcat ? '' : d.fcat;
      else if (d.fcond) draft.conditions = toggleIn(draft.conditions, d.fcond);
      else if (d.act === 'apply') return apply(store);
      draw(el, store);
    }, { signal });
  }
};

function draw(el, store) {
  const { db } = store;
  $('[data-slot=m-keyword]', el).textContent = `${draft.mode === 'keyword' ? '◉' : '○'} 키워드 · ${store.search.query}`;
  $('[data-slot=m-area]', el).textContent = `${draft.mode === 'area' ? '◉' : '○'} 지명·장소명 · ${store.area}`;
  el.querySelectorAll('.mode').forEach(c => c.classList.toggle('on', c.dataset.mode === draft.mode));
  renderChips($('[data-slot=radius]', el), db.radiusOptions.map(k => [k + ' km', k]), v => draft.radiusKm === v, 'radius');
  renderChips($('[data-slot=cats]', el), db.categories.map(c => [c, c]), v => draft.category === v, 'fcat');
  renderChips($('[data-slot=conds]', el), db.conditions.map(c => [c, c]), v => draft.conditions.includes(v), 'fcond');
}

function apply(store) {
  const { mode, ...filters } = draft;
  store.applied = filters; store.search.mode = mode;
  toast(searchPlaces(store).length ? '조건을 적용했어요.' : '결과가 없어요. 조건을 줄여 보세요.');
  location.hash = '#/search';
}
