/* js/boot.js — JSON(data/)을 먼저 불러온 뒤 JS를 순서대로 로드 (전역 변수 공유하는 일반 스크립트) */
const V = '1';                              // 파일을 고친 뒤 브라우저 캐시를 갱신하려면 이 값만 올리세요 (css 링크의 ?v= 도 같이)
const JS = ['data', 'ui', 'pages', 'render', 'home', 'actions', 'main'];
const loadJS = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src + '?v=' + V; s.onload = ok; s.onerror = no; document.body.append(s); });
(async () => {
  const get = u => fetch(u + '?v=' + V).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
  [window.APP_CONFIG, window.APP_STORES] = await Promise.all([get('data/config.json'), get('data/stores.json')]);
  for (const f of JS) await loadJS('js/' + f + '.js');
})().catch(e => { document.getElementById('content').textContent = '파일을 불러오지 못했어요 (' + (e.message || e.target?.src) + '). file:// 가 아닌 localhost 또는 Pages 주소로 열어주세요.'; });
