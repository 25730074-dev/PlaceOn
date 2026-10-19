// 07 장소 상세 — 기본·주소·운영·시설 정보 · 길찾기 · 즐겨찾기 · 최근 본 장소 기록
import { $, renderEmpty } from '../../js/core/ui.js';

export default {
  html: new URL('./detail.html', import.meta.url),
  css: new URL('./detail.css', import.meta.url),
  tab: 'search',
  bar: () => ({ title: '장소 상세', back: '__back' }),

  mount(el, { store, params, signal }) {
    const p = store.place(params.id);
    if (!p) return renderEmpty(el, '장소를 찾을 수 없어요', '목록으로 돌아가 다시 선택해 주세요.');
    store.recordView(p.id);

    const set = (k, v) => $(`[data-slot=${k}]`, el).textContent = v;
    set('name', p.name); set('meta', `${p.category} · 현재 위치 주변 ${p.dist}`); set('desc', p.desc);
    set('address', p.address); set('hours', p.hours); set('facilities', p.facilities);
    $('[data-slot=tags]', el).replaceChildren(...p.tags.map(t => Object.assign(document.createElement('span'), { className: 'badge', textContent: t })));

    const save = $('[data-slot=save]', el);                    // 클릭은 전역 data-save 핸들러가 처리
    save.dataset.save = p.id;
    save.textContent = store.saved.has(p.id) ? '✓ 즐겨찾기 저장됨 · 해제' : '즐겨찾기에 저장';

    $('[data-act=route]', el).addEventListener('click', () => {
      window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(p.area + ' ' + p.name), '_blank', 'noopener');
    }, { signal });
  }
};
