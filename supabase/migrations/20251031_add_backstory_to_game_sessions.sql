alter table public.game_sessions
add column if not exists backstory text;

comment on column public.game_sessions.backstory is 'Optional character backstory, can be player-written or AI-generated';
