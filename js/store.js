/* js/store.js — 계정 · 사용자별 데이터 저장 · 테마 적용
   저장소(DB)는 두 가지 중 하나를 자동 선택:
   - SUPABASE : data/config.json 의 supabase.url · anonKey 가 있으면 서버에 저장 (여러 기기에서 같은 계정 사용)
   - LOCAL    : 없으면 이 브라우저(localStorage)에 저장 (시연용)
   계정 객체 형식(두 저장소 공통): { key, nick, createdAt, data: { saved, history, prefs, settings } } */
const LS = {
  get: (k, d) => { try { const v = localStorage.getItem('placeon:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('placeon:' + k, JSON.stringify(v)); return true; } catch { return false; } },   // 저장 실패(용량 초과·차단) 시 false
  del: k => { try { localStorage.removeItem('placeon:' + k); } catch {} }
};
const SES = {                                // 로그인 상태(LOCAL): 탭을 닫으면 사라짐
  get: () => { try { return sessionStorage.getItem('placeon:session'); } catch { return null; } },
  set: v => { try { sessionStorage.setItem('placeon:session', v); } catch {} },
  del: () => { try { sessionStorage.removeItem('placeon:session'); } catch {} }
};
const uKey = nick => nick.trim().toLowerCase();
const emptyPrefs = () => ({ cats: [], tags: {}, prices: [], dist: 0, radius: 1000 });
const defaultSettings = () => ({ theme: 0, consent: { location: true, personal: true, marketing: false } });
const emptyData = () => ({ saved: [], history: [], prefs: emptyPrefs(), settings: defaultSettings() });
const snapshot = () => ({ saved: [...S.saved], history: S.history.slice(0, 30), prefs: S.prefs, settings: S.settings });   // 화면 상태 → 저장할 데이터
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/* ───────── LOCAL: 이 브라우저에만 저장 (비밀번호는 salt + SHA-256 해시. 프론트 저장소라 실제 보안은 아님) ───────── */
const LOCAL = (() => {
  const accounts = () => LS.get('accounts', {});
  const userData = key => LS.get('data:' + key, null);
  const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(8)));
  async function hashPw(salt, pw) {
    const s = salt + ':' + pw;
    if (window.crypto?.subtle) return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
    let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;     // https/localhost 가 아닐 때의 대체 (약함)
    return 'x' + h.toString(16);
  }
  const acct = key => { const a = accounts()[key]; return a ? { key, nick: a.nick, createdAt: a.createdAt, data: userData(key) || emptyData() } : null; };
  const check = async (key, pw) => { const a = accounts()[key]; return !!a && a.hash === await hashPw(a.salt, pw); };
  return {
    remote: false,
    async signup(nick, pw) {                 // → { acct } 또는 { err: 'dup' | 'storage' }
      const acc = accounts(), key = uKey(nick);
      if (acc[key]) return { err: 'dup' };
      const salt = newSalt();
      acc[key] = { nick, salt, hash: await hashPw(salt, pw), createdAt: Date.now() };
      if (!LS.set('data:' + key, emptyData()) || !LS.set('accounts', acc)) { LS.del('data:' + key); return { err: 'storage' }; }
      SES.set(key); return { acct: acct(key) };
    },
    async login(nick, pw) { const key = uKey(nick); if (!(await check(key, pw))) return null; SES.set(key); return acct(key); },
    async restore() { const k = SES.get(); return k ? acct(k) : null; },
    checkPw: pw => check(S.userKey, pw),
    async setPw(pw) { const acc = accounts(), a = acc[S.userKey]; a.salt = newSalt(); a.hash = await hashPw(a.salt, pw); LS.set('accounts', acc); },
    async rename(nick) {                     // → { key } 또는 { err: 'dup' }. 키가 바뀌면 데이터도 이동
      const acc = accounts(), old = S.userKey, key = uKey(nick);
      if (key !== old && acc[key]) return { err: 'dup' };
      LS.set('data:' + old, snapshot());
      acc[key] = { ...acc[old], nick }; if (key !== old) { delete acc[old]; LS.set('data:' + key, userData(old)); LS.del('data:' + old); }
      LS.set('accounts', acc); SES.set(key);
      return { key };
    },
    async remove() { const acc = accounts(); delete acc[S.userKey]; LS.set('accounts', acc); LS.del('data:' + S.userKey); },
    save(d) { LS.set('data:' + S.userKey, d); },
    async flush() {},
    async logout() { SES.del(); },
    async seed() {                           // 계정이 하나도 없을 때만 시연용 계정 생성 (데모 / Demo1234!)
      if (Object.keys(accounts()).length) return;
      const r = await this.signup('데모', 'Demo1234!'); SES.del(); if (r.err) return;
      const cafes = STORES.filter(s => s.category === '카페/디저트').slice(0, 2), food = STORES.find(s => s.category === '음식점'), now = Date.now();
      LS.set('data:' + r.acct.key, { saved: [cafes[0].id, cafes[1].id, food.id], history: [{ id: cafes[0].id, at: now }, { id: food.id, at: now - 2 * 3600e3 }],
        prefs: { cats: ['카페/디저트', '음식점'], tags: { '분위기': ['조용함'], '이용 목적': ['카공'], '시설': ['콘센트 있음', 'Wi-Fi 있음'] }, prices: [1, 2], dist: 700, radius: 1000 },
        settings: defaultSettings() });
    }
  };
})();

/* ───────── SUPABASE: 서버에 저장 (설정 방법: supabase/README.md) ─────────
   - 비밀번호는 Supabase 인증이 관리 (앱은 해시도 보관하지 않음)
   - 닉네임 로그인: 가입 때 만든 내부용 이메일을 login_email() 로 찾아 로그인
   - 사용자 데이터는 profiles.data(jsonb) 한 칸에 저장, 변경 후 0.5초 모아서 전송 */
function SUPABASE(url, anonKey) {
  url = url.trim().replace(/\/+(rest|auth)\/v1\/?.*$/, '').replace(/\/+$/, '');   // 'API URL'(…/rest/v1/)을 넣어도 프로젝트 주소만 사용
  const sb = window.supabase.createClient(url, anonKey.trim(), {
    auth: { storage: window.sessionStorage, storageKey: 'placeon:sb-session', persistSession: true, autoRefreshToken: true }   // 탭을 닫으면 로그아웃 (LOCAL 과 같게)
  });
  const newEmail = () => toHex(crypto.getRandomValues(new Uint8Array(16))) + '@users.placeon.app';
  let timer = 0, pending = null, lastSent = '', warned = false;
  async function load() {                    // 로그인한 사용자의 프로필 → 계정 객체
    const { data: { user } } = await sb.auth.getUser(); if (!user) return null;
    const { data: p, error } = await sb.from('profiles').select('id, nick, created_at, data').eq('id', user.id).single();
    if (error || !p) return null;
    const data = { ...emptyData(), ...p.data }; lastSent = JSON.stringify(data);
    return { key: p.id, nick: p.nick, createdAt: Date.parse(p.created_at), data };
  }
  async function signIn(email, pw) { const { error } = await sb.auth.signInWithPassword({ email, password: pw }); return !error; }
  async function push() {                    // 모아 둔 변경을 서버로 (내용이 같으면 보내지 않음)
    clearTimeout(timer); timer = 0;
    const d = pending; pending = null; if (!d || !S.userKey) return;
    const j = JSON.stringify(d); if (j === lastSent) return;
    const { error } = await sb.from('profiles').update({ data: d, updated_at: new Date().toISOString() }).eq('id', S.userKey);
    if (!error) { lastSent = j; warned = false; return; }
    pending = pending || d;                  // 실패하면 다음 변경 때 다시 시도
    if (!warned) { warned = true; flash('서버에 저장하지 못했어요. 인터넷 연결을 확인해 주세요.'); }
  }
  return {
    remote: true,
    async signup(nick, pw) {
      const { data: taken, error: e1 } = await sb.rpc('nick_taken', { p_nick: nick });
      if (e1) return { err: 'server', msg: e1.message };
      if (taken) return { err: 'dup' };
      const { data, error } = await sb.auth.signUp({ email: newEmail(), password: pw, options: { data: { nick } } });
      if (error) return /database error/i.test(error.message) ? { err: 'dup' }                 // 동시에 같은 닉네임으로 가입하면 DB 제약에서 막힘
        : /disabled/i.test(error.message) ? { err: 'provider' }                                 // Supabase 의 Email 로그인 방식이 꺼져 있음
        : { err: 'server', msg: error.message };
      if (!data.session) return { err: 'confirm' };                                                                      // Supabase 의 이메일 확인이 켜져 있음
      const acct = await load(); return acct ? { acct } : { err: 'server', msg: '프로필을 불러오지 못했어요.' };
    },
    async login(nick, pw) {
      const { data: email } = await sb.rpc('login_email', { p_nick: nick });
      return email && await signIn(email, pw) ? load() : null;
    },
    async restore() { const { data: { session } } = await sb.auth.getSession(); return session ? load() : null; },
    async checkPw(pw) { const { data: { user } } = await sb.auth.getUser(); return !!user && signIn(user.email, pw); },
    async setPw(pw) { const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error; },
    async rename(nick) {
      await push();
      const { error } = await sb.from('profiles').update({ nick, updated_at: new Date().toISOString() }).eq('id', S.userKey);
      return !error ? { key: S.userKey } : error.code === '23505' ? { err: 'dup' } : { err: 'server', msg: error.message };
    },
    async remove() { clearTimeout(timer); pending = null; const { error } = await sb.rpc('delete_me'); if (error) throw error; await sb.auth.signOut(); },
    save(d) { pending = d; clearTimeout(timer); timer = setTimeout(push, 500); },
    flush: push,
    async logout() { await push(); await sb.auth.signOut(); lastSent = ''; },
    async seed() {}                          // 서버 모드에는 시연 계정을 자동으로 만들지 않음 (회원가입으로 직접 생성)
  };
}
const SB = D.supabase || {};
const DB = window.supabase && SB.url && SB.anonKey ? SUPABASE(SB.url, SB.anonKey) : LOCAL;
addEventListener('pagehide', () => DB.flush());   // 탭을 닫기 직전 남은 변경 전송 시도

/* ───────── 화면 상태(S) ↔ 계정 ───────── */
function loginAs(acct) {                     // 계정 데이터를 화면 상태(S)로 불러옴
  const d = acct.data || {}, ds = defaultSettings();
  const prefs = { ...emptyPrefs(), ...d.prefs }, settings = { ...ds, ...d.settings, consent: { ...ds.consent, ...d.settings?.consent } };
  Object.assign(S, { user: true, userKey: acct.key, loginNick: acct.nick, createdAt: acct.createdAt,
    saved: new Set((d.saved || []).filter(id => place(id))), history: (d.history || []).filter(h => place(h.id)),   // stores.json 에서 사라진 장소는 제외
    prefs, pdraft: structuredClone(prefs), settings });
  applyTheme(settings.theme);
  if (!settings.consent.location) stopWatch();   // 위치 정보 이용에 동의하지 않은 계정이면 위치 추적 중지
}
function persist() {                         // 화면 상태 → 저장소 (render 때마다 호출. SUPABASE 는 0.5초 모아서 전송)
  if (S.user) DB.save(snapshot());
}
async function signOut(save = true) {
  if (save) persist();
  await DB.logout(); stopWatch();
  Object.assign(S, { user: false, userKey: '', loginNick: '', createdAt: 0, saved: new Set(), history: [], prefs: emptyPrefs(), pdraft: emptyPrefs(),
    settings: defaultSettings(), nearCat: '', favCat: '', after: null, pending: null });   // 로그인 후 돌아갈 화면·저장 대기도 초기화
  applyTheme(0);
}
function applyTheme(i) {                     // 테마색 → CSS 변수 (파생색 포함)
  const hex = (D.themes[i] || D.themes[0])[1], n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255,
    mix = c => Math.round(c + (255 - c) * .88), st = document.documentElement.style;
  st.setProperty('--theme', hex); st.setProperty('--pin', hex);
  st.setProperty('--theme-a20', `rgba(${r},${g},${b},.2)`); st.setProperty('--theme-soft', `rgb(${mix(r)},${mix(g)},${mix(b)})`);
}
