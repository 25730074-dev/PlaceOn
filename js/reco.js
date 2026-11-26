/* js/reco.js — 취향 매칭 점수 · 추천 근거 / 실패 가능성 / 동선 추천 */
const radiusText = v => v < 1000 ? v + 'm' : v / 1000 + 'km';
const priceLabel = v => { const o = D.prices.find(x => x[0] === v); return o ? `${o[1]} (${o[2]})` : ''; };
const distLabel = v => (D.distances.find(x => x[0] === v) || [0, '상관없음'])[1];
const personal = () => S.user && S.settings.consent.personal;            // 취향 정보 이용에 동의한 로그인 사용자만 맞춤 추천
const wa = s => /[가-힣]$/.test(s) && (s.charCodeAt(s.length - 1) - 44032) % 28 ? '과' : '와';   // 와/과
const quote = a => a.map(t => `'${t}'`).join(', ');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function matchOf(p) {
  const pr = S.prefs, q = pinPos(p), d = q ? dist(ME, q) : null;
  return { cat: pr.cats.includes(p.category), price: pr.prices.includes(p.price), d,
    near: pr.dist > 0 && d !== null && d <= pr.dist,
    tags: Object.entries(pr.tags).map(([g, sel]) => [g, (p.tags[g] || []).filter(t => sel.includes(t))]).filter(([, a]) => a.length) };
}
/* ───────── 추천 점수 = 취향 + 거리 + 저장 기반 − 주의 감점 (각 0~1, 가중치는 data/config.json 의 reco) ───────── */
const RC = D.reco;
const weights = () => RC.weights.filter(w => S.saved.size >= w.minSaved).at(-1);           // 저장이 많을수록 실제 행동(저장 기반)을 더 믿음
const meDist = p => { const q = pinPos(p); return q ? dist(ME, q) : Infinity; };
const feats = p => [`c:${p.category}`, ...Object.entries(p.tags).flatMap(([g, a]) => a.map(t => `t:${g}|${t}`))];   // 카테고리 + (그룹|태그)
function tasteScore(p) {                     // 설문 취향: 카테고리 · 태그 일치 비율 · 가격대 (설정한 항목만 반영)
  const pr = S.prefs, m = matchOf(p), T = RC.taste, sel = Object.values(pr.tags).flat().length;
  const parts = [[pr.cats.length, T.cat, m.cat ? 1 : 0],
    [sel, T.tags, sel ? m.tags.reduce((n, [, a]) => n + a.length, 0) / sel : 0],
    [pr.prices.length, T.price, m.price ? 1 : 0]].filter(x => x[0]);
  const w = parts.reduce((n, x) => n + x[1], 0);
  return w ? parts.reduce((n, x) => n + x[1] * x[2], 0) / w : 0;
}
const distScore = p => Math.max(0, 1 - meDist(p) / (S.user ? S.prefs.radius : 1000));   // 가까울수록 1, 검색 반경 끝에서 0
let PROF = { key: null };
function behaviorProfile() {                 // 저장(1점)·최근 본 장소(0.3점, 오래될수록 감소)를 카테고리·태그별로 합산
  const key = [...S.saved].join() + '|' + S.history.map(h => h.id + ':' + h.at).join();
  if (PROF.key === key) return PROF;
  const B = RC.behavior, m = new Map(), add = (p, w) => { if (p && w) feats(p).forEach(f => m.set(f, (m.get(f) || 0) + w)); };
  S.saved.forEach(id => add(place(id), B.saved));
  S.history.forEach(h => add(place(h.id), B.viewed * 0.5 ** ((Date.now() - h.at) / 864e5 / B.halfLifeDays)));
  const vals = pre => [...m].filter(([k]) => k.startsWith(pre)).map(([, v]) => v).sort((a, b) => b - a);
  return PROF = { key, m, catMax: vals('c:')[0] || 0, tagVals: vals('t:') };
}
function behaviorScore(p) {                  // 내가 저장·조회한 장소들과 카테고리·태그가 얼마나 비슷한지
  const P = behaviorProfile(); if (!P.m.size) return 0;
  const own = feats(p).filter(f => f.startsWith('t:')), top = P.tagVals.slice(0, own.length).reduce((n, v) => n + v, 0);
  const cat = P.catMax ? (P.m.get('c:' + p.category) || 0) / P.catMax : 0;
  const tag = top ? own.reduce((n, f) => n + (P.m.get(f) || 0), 0) / top : 0;
  return (cat + tag) / 2;
}
const riskPenalty = p => Math.min(RC.riskMax, risksOf(p).length * RC.riskEach);
const scoreOf = p => { if (!personal()) return 0; const w = weights();
  return w.taste * tasteScore(p) + w.dist * distScore(p) + w.behav * behaviorScore(p) - riskPenalty(p); };
const orderText = () => personal() ? '취향·거리 맞춤순' : '가까운 순';
function diversify(list, n) {                // 같은 카테고리가 몰리지 않게: 직전 window곳과 카테고리가 같으면 점수를 penalty만큼 깎고 다시 비교
  const { window: k, penalty } = RC.diversity, pool = list.slice(), out = [];
  while (pool.length && out.length < n) {
    const recent = out.slice(-k).map(o => o.p.category);
    let bi = 0, bv = -Infinity;
    pool.forEach((o, i) => { const v = o.s * (recent.includes(o.p.category) ? 1 - penalty : 1); if (v > bv) { bv = v; bi = i; } });
    out.push(pool.splice(bi, 1)[0]);
  }
  return out;
}
function savedLike(p) {                      // 저장한 장소 중 이 장소와 가장 비슷한 곳 (추천 근거용)
  const own = new Set(feats(p)); let best = null;
  S.saved.forEach(id => { const s = place(id); if (!s || s.id === p.id) return;
    const shared = feats(s).filter(f => f.startsWith('t:') && own.has(f)).map(f => f.split('|')[1]).filter(t => t !== '보통');
    const n = shared.length + (s.category === p.category ? 1 : 0);
    if (shared.length && n >= 2 && (!best || n > best.n)) best = { s, shared, n }; });
  return best;
}

function reasonsOf(p) {                      // 추천 근거
  if (!personal()) return [];
  const m = matchOf(p), out = [];
  if (m.cat) out.push(`선호 카테고리 '${p.category}'${wa(p.category)} 일치`);
  m.tags.forEach(([g, a]) => out.push(`선호 태그 ${quote(a)}${wa(a.at(-1))} 일치 (${g})`));
  if (m.price) out.push(`선호 가격대 '${priceLabel(p.price)}'${wa(priceLabel(p.price))} 일치`);
  if (m.near) out.push(`선호 거리(${distLabel(S.prefs.dist)}) 이내 · 내 위치에서 ${distText(p)}`);
  const like = weights().behav ? savedLike(p) : null;         // 저장 기반 점수가 실제로 반영될 때만 표시
  if (like) out.push(`저장한 '${like.s.name}'${wa(like.s.name)} 비슷해요 (${quote(like.shared.slice(0, 2))})`);
  return out;
}
function risksOf(p) {                        // 실패 가능성
  const out = [], T = p.tags, pr = S.prefs, c = (T['혼잡도'] || [])[0];
  if (c === '혼잡함') out.push(`${p.peak || '피크 시간'}에 혼잡할 가능성이 높아요.`);
  else if (c === '보통' && p.peak) out.push(`${p.peak}에는 다소 붐빌 수 있어요.`);
  if (p.floors.length === 1 && p.floors[0] === '지하') out.push('지하 매장이라 찾아가기 어려울 수 있어요.');
  if (!personal()) return out;
  const goals = T['이용 목적'] || [], mood = (T['분위기'] || [])[0];
  (pr.tags['이용 목적'] || []).filter(g => goals.length && !goals.includes(g)).forEach(g =>
    out.push(`${mood ? `분위기는 '${mood}'이지만 ` : ''}'${g}' 목적에는 적합하지 않을 수 있어요.`));
  Object.entries(pr.tags).forEach(([g, sel]) => {
    if (g === '이용 목적' || g === '시설' || !sel.length) return;
    const have = T[g] || [];
    if (have.length && !have.some(t => sel.includes(t))) out.push(`선호하는 ${g} ${quote(sel.slice(0, 2))}${wa(sel[Math.min(1, sel.length - 1)])} 달리 ${quote(have.slice(0, 2))} 쪽이에요.`);
  });
  const fac = (pr.tags['시설'] || []).filter(t => T['시설'] && !T['시설'].includes(t));
  if (fac.length) out.push(`선호 시설 ${quote(fac)} 정보가 없어요.`);
  if (pr.prices.length && p.price > Math.max(...pr.prices)) out.push(`선호 가격대보다 높은 편이에요 (${priceLabel(p.price)}).`);
  const q = pinPos(p); if (pr.dist > 0 && q && dist(ME, q) > pr.dist) out.push(`선호 거리(${distLabel(pr.dist)})보다 멀어요 (${distText(p)}).`);
  return out;
}
const NEXT = { '카페/디저트': ['음식점'], '음식점': ['카페/디저트'], '뷰티/미용': ['카페/디저트', '음식점'], '쇼핑': ['카페/디저트', '음식점'],
  '문화/여가': ['음식점', '카페/디저트'], '편의점': ['카페/디저트'], '슈퍼/마트': ['카페/디저트'], '기타 서비스': ['카페/디저트'] };
function nextPlaces(p) {                     // 동선 추천: 이 장소 다음에 갈 만한 근처 장소 (최대 2곳)
  const pos = pinPos(p), lim = personal() && S.prefs.dist ? S.prefs.dist : 500, cats = NEXT[p.category] || [];
  const all = STORES.filter(s => s.id !== p.id && cats.includes(s.category)).map(s => { const q = pinPos(s); return { s, d: pos && q ? dist(pos, q) : null }; });
  let near = all.filter(o => o.d !== null && o.d <= lim);
  if (!near.length) near = all.filter(o => o.d === null && o.s.area === p.area);       // 좌표를 아직 모르면 같은 행정동
  const rank = (a, b) => scoreOf(b.s) - scoreOf(a.s) || (a.d ?? 0) - (b.d ?? 0), by = c => near.filter(o => o.s.category === c).sort(rank);
  return cats.length === 1 ? by(cats[0]).slice(0, 2) : cats.map(c => by(c)[0]).filter(Boolean);
}
function explain(p) {
  let reasons = reasonsOf(p);
  if (!reasons.length) reasons = [!S.user ? '로그인하고 취향을 설정하면 일치하는 선호 조건을 알려드려요.'
    : !personal() ? '취향 정보 이용에 동의하면 선호 조건과 일치하는 이유를 알려드려요.'
    : `설정한 취향과 직접 일치하는 항목은 없어요.${pinPos(p) ? ` 내 위치에서 ${distText(p)}로 가까워서 추천했어요.` : ''}`];
  return { reasons, risks: risksOf(p), next: nextPlaces(p) };
}
const li = a => `<ul class="ex">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;      // 문장에 장소명·태그가 들어가므로 항상 esc
function explainHtml(p) {
  const e = explain(p), walk = d => d === null ? '' : ` · 도보 ${Math.max(1, Math.round(d / 70))}분 (${Math.round(d / 10) * 10}m)`;
  return `<hr><p class="h2">추천 설명</p>
    <div class="box"><p class="lbl">추천 근거</p>${li(e.reasons)}</div>
    <div class="box"><p class="lbl">실패 가능성</p>${e.risks.length ? li(e.risks) : '<p class="sub">눈에 띄는 주의사항은 없어요.</p>'}</div>
    <div class="box"><p class="lbl">동선 추천</p>${e.next.length ? `<p class="sub">이 장소 다음에 이어서 가기 좋은 근처 장소예요.</p>` + e.next.map(({ s, d }) =>
      `<button type="button" class="rt" data-a="place:${s.id}"><span class="nm">${esc(s.name)}</span><span class="sub">${esc(s.category)}${walk(d)}</span></button>`).join('')
      : '<p class="sub">근처에서 이어서 갈 만한 장소를 찾지 못했어요.</p>'}</div>`;
}
function tagsHtml(p) {
  const sel = personal() ? new Set(Object.values(S.prefs.tags).flat()) : new Set(), all = Object.values(p.tags).flat();
  return !p.price && !all.length ? '' : `<p class="lbl">태그 · 가격대</p><div class="row">${p.price ? `<span class="badge">${esc(priceLabel(p.price))}</span>` : ''}${all.map(t => `<span class="badge ${sel.has(t) ? '' : 'tag'}">${esc(t)}</span>`).join('')}</div>`;
}
function cardNote(p) {                       // 카드에는 근거·주의 한 줄씩만
  if (!personal()) return '';
  const r = reasonsOf(p)[0], k = risksOf(p)[0];
  return r || k ? `<div class="note">${r ? `<div class="sub">✓ ${esc(r)}</div>` : ''}${k ? `<div class="sub warn">! ${esc(k)}</div>` : ''}</div>` : '';
}
