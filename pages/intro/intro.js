// 01 서비스 소개 — 정적 안내 + 로그인/회원가입 진입
import { $, clone, fill } from '../../js/core/ui.js';

export default {
  html: new URL('./intro.html', import.meta.url),
  css: new URL('./intro.css', import.meta.url),
  tab: null,
  hideHomeBar: true,
  bar: () => ({ brand: true, right: '<button class="link close" data-nav="#/home" aria-label="닫기">✕</button>' }),

  mount(el, { store }) {
    $('[data-slot=features]', el).replaceChildren(...store.db.intro.map(f => fill(clone('t-feature'), f)));
  }
};
