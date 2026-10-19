// 전역 액션: 화면 이동(data-nav) · 장소 상세(data-go-place) · 즐겨찾기(data-save)
import { store } from './store.js';
import { toast } from './ui.js';
import { render } from './router.js';

export function bindGlobalActions() {
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-nav],[data-save],[data-go-place]');
    if (!t) return;
    const d = t.dataset;
    if (d.save) {
      const on = store.toggleSave(d.save);
      toast(on ? '즐겨찾기에 저장했어요.' : '저장을 해제했어요.');
      return render({ refresh: true });
    }
    if (d.goPlace) { location.hash = '#/detail/' + d.goPlace; return; }
    if (d.nav === '__back') { history.back(); return; }
    location.hash = d.nav;
  });
}
