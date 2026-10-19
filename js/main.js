import { store } from './core/store.js';
import { render } from './core/router.js';
import { bindGlobalActions } from './core/actions.js';

async function boot() {
  try {
    const [db, tpl] = await Promise.all([
      fetch('data/db.json').then(r => r.json()),
      fetch('components/templates.html').then(r => r.text())
    ]);
    document.body.insertAdjacentHTML('beforeend', tpl);
    store.init(db);
  } catch (err) {
    console.error(err);
    document.getElementById('content').innerHTML =
      '<div class="empty"><b>데이터를 불러오지 못했어요</b>파일을 직접 열지 말고 로컬 서버로 실행해 주세요.<br>예: python -m http.server</div>';
    return;
  }
  bindGlobalActions();
  window.addEventListener('hashchange', () => render());
  render();
}
boot();
