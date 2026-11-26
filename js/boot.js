/* js/boot.js — JSON(data/)을 먼저 불러온 뒤 JS를 순서대로 로드 (전역 변수 공유하는 일반 스크립트) */
const V = '10';                              // 파일을 고친 뒤 브라우저 캐시를 갱신하려면 이 값만 올리세요 (index.html 의 ?v= 도 같이)
const JS = ['data', 'store', 'reco', 'ui', 'pages', 'render', 'home', 'actions', 'settings', 'main'];
const SUPABASE_SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js';   // config.json 에 supabase 키가 있을 때만 로드
const loadJS = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.body.append(s); });
(async () => {
  const get = u => fetch(u + '?v=' + V).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
  [window.APP_CONFIG, window.APP_STORES, window.APP_TAGS] = await Promise.all(['config', 'stores', 'place_tags'].map(n => get('data/' + n + '.json')));
  const sb = window.APP_CONFIG.supabase || {};
  if (sb.url && sb.anonKey) await loadJS(SUPABASE_SDK).catch(() => { throw new Error('Supabase SDK — 인터넷 연결을 확인하세요'); });
  for (const f of JS) await loadJS('js/' + f + '.js?v=' + V);
})().catch(e => { document.getElementById('content').textContent = '파일을 불러오지 못했어요 (' + (e.message || e.target?.src) + '). file:// 가 아닌 localhost 또는 Pages 주소로 열어주세요.'; });
