// 10 최근 본 장소 — 오늘 / 어제 / 이전 으로 묶어 최신순 표시. 카드 클릭 시 상세 재진입(전역 data-go-place)
import { $, clone, fill, renderEmpty, fmtTime, dayDiff } from '../../../js/core/ui.js';

export default {
  html: new URL('./recent.html', import.meta.url),

  mount(el, { store }) {
    const box = $('[data-slot=list]', el);
    const items = [...store.history].sort((a, b) => b.at - a.at);
    if (!items.length) return renderEmpty(box, '아직 본 장소가 없어요', '장소를 탐색하면 여기에 기록돼요.');

    const groups = [['오늘', h => dayDiff(h.at) === 0], ['어제', h => dayDiff(h.at) === 1], ['이전', h => dayDiff(h.at) > 1]];
    box.replaceChildren(...groups.flatMap(([title, test]) => {
      const rows = items.filter(test);
      if (!rows.length) return [];
      const g = fill(clone('t-recent-group'), { title });
      rows.forEach(h => {
        const p = store.place(h.id);
        const n = fill(clone('t-recent-card'), {
          time: h === items[0] && dayDiff(h.at) === 0 ? '방금 확인' : fmtTime(h.at),
          name: p.name, meta: `${p.category} · ${p.area}`, tags: p.tags.join(' · ')
        });
        n.dataset.goPlace = p.id;
        g.append(n);
      });
      return [g];
    }));
  }
};
