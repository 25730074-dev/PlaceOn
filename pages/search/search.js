// 05 장소 검색 결과 — 통합 검색 · 모드 전환(키워드/지명·장소명) · 필터 개수 · 결과 없음
import { $, renderChips, renderEmpty, placeCard } from '../../js/core/ui.js';
import { searchPlaces, filterCount } from '../../js/core/places.js';

export default {
  html: new URL('./search.html', import.meta.url),
  css: new URL('./search.css', import.meta.url),
  tab: 'search',
  bar: () => ({ title: '장소 검색' }),

  mount(el, ctx) {
    const { store } = ctx, input = $('[name=q]', el), err = $('[data-slot=err]', el);
    input.value = store.search.query;
    draw(el, store);

    $('form', el).addEventListener('submit', e => {          // 공백 입력은 검색하지 않고 안내
      e.preventDefault();
      if (!input.value.trim()) { err.textContent = '검색어를 입력해 주세요.'; return; }
      err.textContent = ''; store.search.query = input.value; draw(el, store);
    });
    $('[data-act=clear]', el).addEventListener('click', () => {
      input.value = ''; store.search.query = ''; draw(el, store); input.focus();
    });
    $('[data-slot=modes]', el).addEventListener('click', e => {
      const b = e.target.closest('[data-mode]'); if (!b) return;
      store.search.mode = b.dataset.mode;
      if (input.value.trim()) store.search.query = input.value;
      draw(el, store);
    });
  },

  refresh({ el, store }) { draw(el, store); }
};

function draw(el, store) {
  const { search, applied } = store, area = search.mode === 'area';
  renderChips($('[data-slot=modes]', el), [['키워드', 'keyword'], ['지명·장소명', 'area']], v => search.mode === v, 'mode');

  $('[data-slot=note]', el).textContent =
    `${area ? '지명·장소명' : '키워드'} ‘${search.query}’ 검색 결과\n` +
    (area ? `‘${search.query}’ 지역 기준으로 장소를 추천합니다.` : '현재 위치 주변에서 조건에 맞는 장소를 추천합니다.');

  const res = searchPlaces(store);
  $('[data-slot=count]', el).textContent = `추천 결과 ${res.length}개`;
  $('[data-slot=filterBtn]', el).textContent = `필터 · ${filterCount(applied)}`;

  const box = $('[data-slot=list]', el);
  if (res.length) box.replaceChildren(...res.map(p => placeCard(store, p, area ? `${p.area} 기준` : `현재 위치 주변 ${p.dist}`)));
  else renderEmpty(box, '조건에 맞는 결과가 없어요', '조건을 줄이거나 검색어를 바꿔 보세요.');
}
