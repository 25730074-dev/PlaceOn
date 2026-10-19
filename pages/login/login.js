// 02 로그인 — 입력 검증 · 비밀번호 표시 전환 · 중복 제출 방지 (목업: 형식만 맞으면 통과)
import { $, $$, toast } from '../../js/core/ui.js';
import { isEmail } from '../../js/core/validators.js';

export default {
  html: new URL('./login.html', import.meta.url),
  css: new URL('./login.css', import.meta.url),
  tab: null,
  bar: () => ({ title: '로그인', back: '#/intro' }),

  mount(el, { store, signal }) {
    const f = $('form', el), { email, pw } = f.elements, btn = $('[type=submit]', f);
    let busy = false;
    email.value = store.loginEmail;                        // 회원가입 직후 이메일 유지
    email.addEventListener('input', () => store.loginEmail = email.value);

    $('[data-act=toggle]', f).addEventListener('click', e => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      e.currentTarget.textContent = show ? '숨김' : '표시';
    });

    f.addEventListener('submit', e => {
      e.preventDefault();
      if (busy) return;
      const err = {};
      if (!email.value) err.email = '이메일을 입력해 주세요.';
      else if (!isEmail(email.value)) err.email = '이메일 형식을 확인해 주세요.';
      if (!pw.value) err.pw = '비밀번호를 입력해 주세요.';
      $$('[data-err]', f).forEach(n => n.textContent = err[n.dataset.err] || '');
      if (Object.keys(err).length) return;

      busy = true; f.classList.add('busy'); btn.disabled = true; btn.textContent = '로그인 중…';
      setTimeout(() => {
        if (signal.aborted) return;
        store.user = { email: email.value, userId: 'u1' };
        toast('로그인했어요. 저장한 취향을 불러왔어요.');
        location.hash = '#/home';
      }, 700);
    });
  }
};
