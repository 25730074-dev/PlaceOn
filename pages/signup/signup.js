// 03 회원가입 — 이메일·비밀번호 규칙 · 확인 일치 · 필수 약관 2개 → 버튼 활성화
// 버튼 상태: 비활성 / 활성 / 요청 중 / 실패(다시 시도). 이메일이 'fail'로 시작하면 실패 상태를 시연합니다.
import { $, $$, toast } from '../../js/core/ui.js';
import { isEmail, isPassword } from '../../js/core/validators.js';

export default {
  html: new URL('./signup.html', import.meta.url),
  tab: null,
  bar: () => ({ title: '회원가입', back: '#/intro' }),

  mount(el, { store, signal }) {
    const f = $('form', el), x = f.elements, btn = $('[type=submit]', f);
    let state = 'idle';                                    // idle | busy | fail

    const check = () => ({
      e: isEmail(x.email.value), p: isPassword(x.pw.value),
      m: !!x.pw.value && x.pw.value === x.pw2.value, t: x.terms.checked && x.priv.checked
    });
    const msg = { email: '이메일 형식을 확인해 주세요.', pw: '8자 이상, 영문과 숫자를 함께 입력해 주세요.', pw2: '비밀번호가 일치하지 않아요.' };

    function paint() {
      const v = check(), ok = v.e && v.p && v.m && v.t;
      const show = { email: x.email.value && !v.e, pw: x.pw.value && !v.p, pw2: x.pw2.value && !v.m };
      $$('[data-err]', f).forEach(n => {
        const k = n.dataset.err;
        n.textContent = k === 'fail' ? (state === 'fail' ? '계정을 만들지 못했어요. 입력과 동의는 그대로 유지돼요. 다시 시도해 주세요.' : '') : (show[k] ? msg[k] : '');
      });
      btn.textContent = { idle: '동의하고 계정 만들기', busy: '계정을 만드는 중…', fail: '다시 시도' }[state];
      btn.disabled = state === 'busy' || (state !== 'fail' && !ok);
    }

    const touch = () => { if (state !== 'busy') state = 'idle'; paint(); };
    f.addEventListener('input', touch);
    f.addEventListener('change', touch);
    $$('[data-act=terms]', f).forEach(b => b.addEventListener('click', () => toast('약관 내용은 목업에서 제공하지 않아요.')));

    f.addEventListener('submit', e => {
      e.preventDefault();
      const v = check();
      if (state === 'busy' || !(v.e && v.p && v.m && v.t)) return;
      state = 'busy'; paint();
      setTimeout(() => {
        if (signal.aborted) return;
        if (x.email.value.startsWith('fail')) { state = 'fail'; paint(); return; }
        store.loginEmail = x.email.value;
        toast('계정을 만들었어요. 로그인해 주세요.');
        location.hash = '#/login';
      }, 900);
    });
    paint();
  }
};
