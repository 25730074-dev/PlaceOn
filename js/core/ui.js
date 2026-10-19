// DOM 헬퍼 · 공용 컴포넌트 렌더러
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const toggleIn = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

// <template id> 복제
export const clone = id => document.getElementById(id).content.firstElementChild.cloneNode(true);

// [data-f=키] 요소에 텍스트 채우기
export function fill(node, data) {
  for (const [k, v] of Object.entries(data)) {
    const t = node.matches(`[data-f=${k}]`) ? node : node.querySelector(`[data-f=${k}]`);
    if (t) t.textContent = v;
  }
  return node;
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('.phone').append(t);
  setTimeout(() => t.remove(), 1800);
}

// 칩 렌더링: items=[[라벨,값],...], key → data-<key>=값
export function renderChips(box, items, isOn, key) {
  box.replaceChildren(...items.map(([label, value]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (isOn(value) ? ' on' : '');
    b.textContent = label; b.dataset[key] = value;
    return b;
  }));
}

export function renderEmpty(box, title, sub) {
  box.replaceChildren(fill(clone('t-empty'), { title, sub }));
}

// 장소 카드 (홈 · 검색 공용)
export function placeCard(store, p, sub) {
  const n = clone('t-place-card');
  n.dataset.goPlace = p.id;
  fill(n, { name: p.name, meta: `${p.category} · ${sub}`, tags: p.tags.join(' · ') });
  const s = $('[data-f=save]', n);
  s.dataset.save = p.id;
  s.classList.toggle('on', store.saved.has(p.id));
  return n;
}

export const fmtTime = t => new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
export function dayDiff(t) {
  const a = new Date(t), b = new Date();
  a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 864e5);
}
