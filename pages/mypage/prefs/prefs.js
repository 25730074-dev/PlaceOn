// 08 취향 설정 — 선호 카테고리 · 세부 조건 · 추가 입력. 저장하면 홈 추천의 기본 조건이 됩니다.
import { $, renderChips, toggleIn, toast } from '../../../js/core/ui.js';

let draft = null, base = null;           // 저장 전 임시값 / 마지막 저장값

export default {
  html: new URL('./prefs.html', import.meta.url),

  isDirty: () => !!draft && JSON.stringify(draft) !== JSON.stringify(base),
  discard: () => { draft = null; },

  mount(el, { store }) {
    if (!draft) { base = structuredClone(store.prefs); draft = structuredClone(base); }
    const input = $('[name=extra]', el);
    input.value = draft.extra;
    draw(el, store);

    input.addEventListener('input', () => draft.extra = input.value);
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-pcat],[data-pcond],[data-act=save]');
      if (!t) return;
      if (t.dataset.pcat) draft.cats = toggleIn(draft.cats, t.dataset.pcat);
      else if (t.dataset.pcond) draft.conds = toggleIn(draft.conds, t.dataset.pcond);
      else {
        store.prefs = structuredClone(draft); base = structuredClone(draft); store.nearbyCat = '';
        toast('취향을 저장했어요.'); return;
      }
      draw(el, store);
    });
  }
};

function draw(el, { db }) {
  renderChips($('[data-slot=cats]', el), db.categories.map(c => [c, c]), v => draft.cats.includes(v), 'pcat');
  renderChips($('[data-slot=conds]', el), db.conditions.map(c => [c, c]), v => draft.conds.includes(v), 'pcond');
}
