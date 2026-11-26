/* js/data.js — 공통 헬퍼 · 장소 데이터 정규화 · 추천/검색 로직 */
const D = window.APP_CONFIG;                 // data/config.json (boot.js가 먼저 불러옴)
const $ = s => document.querySelector(s);
const nickHint = v => {                      // 충족하지 못한 조건만 한 줄로
  const n = [...v].length, bad = [...v].filter(c => !/[가-힣A-Za-z0-9]/.test(c)).length, miss = [];
  if (n < 2 || n > 12) miss.push('2~12자');
  if (n === 0 || bad > 0) miss.push('한글·영문·숫자만');
  return miss.length ? { ok: false, text: miss.join(', ') } : { ok: true, text: '사용 가능한 닉네임이에요' };
};
const pwHint = v => {
  const miss = [], inc = [];
  if (v.length < 8) miss.push('8자 이상'); else if (v.length > 20) miss.push('20자 이하');
  if (!/[A-Z]/.test(v)) inc.push('대문자');
  if (!/[0-9]/.test(v)) inc.push('숫자');
  if (!/[^A-Za-z0-9\s]/.test(v)) inc.push('특수문자');
  if (inc.length) miss.push(inc.join('·') + ' 포함');
  if (/\s/.test(v)) miss.push('공백 제외');
  return miss.length ? { ok: false, text: miss.join(', ') } : { ok: true, text: '사용 가능한 비밀번호예요' };
};
const hintText = h => (h.ok ? '✓ ' : '') + h.text;
const signupMissing = g => [!nickHint(g.nick).ok && '닉네임', !pwHint(g.pw).ok && '비밀번호', !(g.pw && g.pw === g.pw2) && '비밀번호 확인', !(g.terms && g.priv) && '약관 동의'].filter(Boolean);
const toggle = (a, v) => a.includes(v) ? a.filter(x => x !== v) : [...a, v];
const countBy = (arr, f) => { const m = new Map(); arr.forEach(x => m.set(f(x), (m.get(f(x)) || 0) + 1)); return m; };
const byCount = m => [...m.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);

/* ───────── 장소 데이터: stores.json → 화면용 필드로 정규화 ───────── */
const FLOOR = { '지상': ['지상'], '지상2층이상': ['지상 2층 이상'], '지하': ['지하'], '지상+지하': ['지상', '지하'], '지하 및 지상': ['지상', '지하'] };
const STORES = window.APP_STORES.map(r => ({
  id: r.id, name: r['업소명'],
  address: (r['소재지 도로'] || '').trim(),
  jibun: (r['소재지 지번'] || '').replace(/\s{2,}/g, ' ').trim(),
  area: r['행정동명'] || '',
  category: r['카테고리'] || '미분류',
  type: r['업태명'] || '',
  floors: FLOOR[r['업소위치']] || [],
  ...(t => ({ tags: t['태그'] || {}, price: t['가격대'] || 0, peak: t['혼잡 시간'] || '' }))(window.APP_TAGS[r['업소명']] || {})   // data/place_tags.json (샘플 태그)
}));
const BY = Object.fromEntries(STORES.map(s => [s.id, s]));
const place = id => BY[id];
const CATS = byCount(countBy(STORES.filter(s => s.category !== '미분류'), s => s.category));      // 카테고리: 많은 순
const TYPES = Object.fromEntries(CATS.map(c => [c, byCount(countBy(STORES.filter(s => s.category === c && s.type), s => s.type))]));  // 카테고리별 업태
const TOP_AREAS = byCount(countBy(STORES.filter(s => s.area), s => s.area)).slice(0, 3);          // 지역 칩: 상위 3 + 그 외
const FLOORS = ['지상', '지상 2층 이상', '지하'];
const floorText = p => p.floors.join(' · ') || '층 정보 없음';
const fcount = f => (f.area ? 1 : 0) + (f.category ? 1 : 0) + f.types.length + f.floors.length;
const noFilter = () => ({ area: '', category: '', types: [], floors: [] });
const pageOf = n => n * D.pageSize;
let S;

function init() {
  const d = D.defaults;
  S = {
    screen: '01', user: false, userKey: '', createdAt: 0, err: '', loginNick: '', popCat: '',
    area: d.area, search: { ...d.search }, applied: noFilter(), draft: null, nearCat: '',
    prefs: emptyPrefs(), pdraft: emptyPrefs(), settings: defaultSettings(), favCat: '',
    saved: new Set(), history: [],                                   // 비로그인: 저장·기록·취향 없음 (로그인하면 store.js 가 계정 데이터를 불러옴)
    after: null, pending: null,
    shown: { search: 1 },
    placeId: null, from: '04', termsFrom: '03',
    login: { pw: '', show: false, busy: false, err: {} },
    signup: { nick: '', pw: '', pw2: '', terms: false, priv: false, state: 'idle', msg: '' },
    uinfo: newUinfo(), del: newDel()
  };
}

/* ───────── 추천·검색 로직 (취향 점수·추천 설명은 reco.js) ───────── */
function recommend(n = NEAR_N) {           // 홈: 상위 n곳 (필터 선택 시 해당 카테고리 안에서, 로그인하면 검색 반경 안에서)
  const R = S.user ? S.prefs.radius : 0;
  const near = STORES.filter(p => pinPos(p) && (!S.nearCat || p.category === S.nearCat))
    .map(p => ({ p, d: dist(ME, pinPos(p)) })).filter(o => !R || o.d <= R);
  if (!personal()) return near.sort((a, b) => a.d - b.d || a.p.id - b.p.id).slice(0, n).map(o => o.p);   // 비로그인·취향 동의 안 함: 가까운 순
  const scored = near.map(o => ({ ...o, s: scoreOf(o.p) - (S.saved.has(o.p.id) ? RC.savedPenalty : 0) }))     // 이미 저장한 곳은 조금 아래로
    .sort((a, b) => b.s - a.s || a.d - b.d);
  return diversify(scored, n).map(o => o.p);                                                             // 취향·거리 맞춤순 + 카테고리 섞기
}
function searchStores() {                  // 검색: 키워드(업소명·카테고리·업태) / 지명·장소명(행정동·주소·업소명) + 적용 필터
  const q = S.search.query.trim(), f = S.applied;
  if (!q) return [];
  const res = STORES.filter(p => {
    const hit = S.search.mode === 'keyword' ? [p.name, p.category, p.type].some(x => x.includes(q)) : [p.area, p.address, p.jibun, p.name].some(x => x.includes(q));
    const ar = !f.area || (f.area === '__other' ? !TOP_AREAS.includes(p.area) : p.area === f.area);
    return hit && ar && (!f.category || p.category === f.category) && (!f.types.length || f.types.includes(p.type)) && (!f.floors.length || f.floors.some(x => p.floors.includes(x)));
  });
  const near = (a, b) => (a === b ? 0 : a - b) || 0;                        // 좌표 없는 곳(Infinity)은 뒤로
  return res.map(p => [p, scoreOf(p), meDist(p)])                            // 맞춤 추천: 취향·거리 점수 높은 순(동점은 가까운 순) / 그 외: 가까운 순
    .sort((a, b) => b[1] - a[1] || near(a[2], b[2])).map(o => o[0]);
}
