// 페이지별 HTML / CSS 로더 (HTML 은 캐시, CSS 는 페이지 이동 시 제거)
const htmlCache = new Map();
const links = new Map();

export function loadHtml(url) {
  const key = String(url);
  if (!htmlCache.has(key)) {
    htmlCache.set(key, fetch(key).then(r => {
      if (!r.ok) throw new Error(`${key} ${r.status}`);
      return r.text();
    }));
  }
  return htmlCache.get(key);
}

export function loadCss(url) {
  const href = String(url);
  if (links.has(href)) return Promise.resolve();
  return new Promise(resolve => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = l.onerror = () => resolve();
    setTimeout(resolve, 800);            // 로드 이벤트가 오지 않아도 화면이 멈추지 않도록
    document.head.append(l);
    links.set(href, l);
  });
}

export function unloadPageCss() {
  links.forEach(l => l.remove());
  links.clear();
}
