-- PlaceON · Supabase 설정
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 하세요. (여러 번 실행해도 안전)
--
-- 구조
--   auth.users        : Supabase 가 관리하는 로그인 계정 (비밀번호는 Supabase 가 bcrypt 로 저장)
--   public.profiles   : 닉네임 + 사용자 데이터(즐겨찾기·최근 본 장소·취향·설정) 1인 1행
-- 앱은 닉네임으로 로그인하지만 Supabase 인증에는 이메일이 필요해서,
-- 가입할 때 앱이 무작위 내부용 이메일(예: 3f2a…@users.placeon.app)을 만들어 씁니다. 실제로 메일은 보내지 않습니다.

-- 1) 프로필 테이블 ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nick        text not null check (nick ~ '^[가-힣A-Za-z0-9]{2,12}$'),          -- 앱의 닉네임 규칙과 같음
  nick_key    text generated always as (lower(btrim(nick))) stored unique,     -- 대소문자 구분 없이 중복 금지
  login_email text not null unique,                                            -- 내부용 로그인 이메일
  data        jsonb not null default '{}'::jsonb,                              -- { saved, history, prefs, settings }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) 행 단위 보안: 로그인한 본인 행만 읽고 고칠 수 있음 --------------------------------
alter table public.profiles enable row level security;
drop policy if exists "profiles: own select" on public.profiles;
drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 앱에서 직접 바꿀 수 있는 칸은 닉네임·데이터·수정 시각뿐 (id·로그인 이메일은 변경 불가, 행 추가·삭제는 아래 함수로만)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nick, data, updated_at) on public.profiles to authenticated;

-- 3) 가입하면 프로필 행을 자동으로 만듦 (닉네임 중복·규칙 위반이면 가입 자체가 실패) ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nick, login_email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nick', ''), new.email);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) 앱에서 부르는 함수 ---------------------------------------------------------
-- 닉네임 사용 여부 (가입 전 확인)
create or replace function public.nick_taken(p_nick text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where nick_key = lower(btrim(p_nick)));
$$;

-- 닉네임 → 내부용 로그인 이메일 (닉네임 로그인용. 비밀번호가 맞아야 로그인됨)
create or replace function public.login_email(p_nick text)
returns text language sql stable security definer set search_path = '' as $$
  select login_email from public.profiles where nick_key = lower(btrim(p_nick));
$$;

-- 회원 탈퇴: 본인 계정 삭제 (프로필은 on delete cascade 로 함께 삭제)
create or replace function public.delete_me()
returns void language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.nick_taken(text), public.login_email(text), public.delete_me() from public;
revoke execute on function public.delete_me() from anon;                      -- Supabase 기본 권한으로 anon 에도 열려 있으므로 명시적으로 막음
grant execute on function public.nick_taken(text), public.login_email(text) to anon, authenticated;
grant execute on function public.delete_me() to authenticated;
