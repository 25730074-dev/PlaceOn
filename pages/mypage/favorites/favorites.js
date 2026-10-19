// 09 즐겨찾기 — 저장 목록·개수 · 카테고리 필터 · 저장 해제(전역 data-save 핸들러)
import { $, clone, fill, renderChips, renderEmpty } from '../../../js/core/ui.js';

let cat = '';                            // 선택 카테고리 (상세에 다녀와도 유지)

export default {
  html: new URL('./favorites.html', import.meta.url),

  mount(el, { store }) {
    draw(el, store);
    $('[data-slot=cats]', el).addEventListener('click', e => {
      const b = e.target.closest('[data-fav-cat]'); if (!b) return;
      cat = b.dataset.favCat; draw(el, store);
    });
  },
  refresh({ el, store }) { draw(el, store); }
};

function draw(el, store) {
  const all = [...store.saved].map(id => store.place(id));
  if (cat && !all.some(p => p.category === cat)) cat = '';
  const list = all.filter(p => !cat || p.category === cat);

  $('[data-slot=title]', el).textContent = `저장한 장소 ${all.length}개`;
  renderChips($('[data-slot=cats]', el), [['전체', ''], ...[...new Set(all.map(p => p.category))].map(c => [c, c])], v => cat === v, 'favCat');

  const box = $('[data-slot=list]', el);
  if (!all.length) return box.replaceChildren(clone('t-fav-empty'));          // 전체 저장 목록 없음
  if (!list.length) return renderEmpty(box, '이 카테고리에 저장한 장소가 없어요', '다른 카테고리를 선택해 보세요.');
  box.replaceChildren(...list.map(p => {
    const n = fill(clone('t-fav-card'), { name: p.name, meta: `${p.category} · ${p.area}`, tags: p.tags.join(' · ') });
    n.dataset.goPlace = p.id; $('[data-f=unsave]', n).dataset.save = p.id;
    return n;
  }));
}
