create table if not exists public.question_guidance (
  subject text not null references public.subjects(code) on delete cascade,
  qkey text not null,
  question text not null,
  answer text not null check (char_length(answer) between 1 and 4000),
  demo text not null default '' check (char_length(demo) <= 4000),
  tips text not null default '' check (char_length(tips) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (subject, qkey)
);

alter table public.question_guidance enable row level security;
revoke all on public.question_guidance from public, anon, authenticated;

drop function if exists public.search_questions(text, text, integer, text, text, integer, integer);

create function public.search_questions(
  p_q text default null, p_subject text default null, p_level integer default null,
  p_proctor text default null, p_sort text default 'asked',
  p_limit integer default 20, p_offset integer default 0
) returns table (
  id bigint, body text, subject text, level smallint, proctors text[], proctor_count integer,
  set_id bigint, times_asked integer, asked_on date, votes integer, voted boolean, total bigint,
  answer text, demo text, tips text
)
language plpgsql security definer set search_path = '' as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 30);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_q text := nullif(private.clean(p_q, 100), '');
  u uuid := auth.uid();
begin
  if v_offset > 1500 then raise exception 'refine your search' using errcode = '22023'; end if;
  perform private.touch(v_limit);
  return query
  with g as (
    select min(q.id) as id, min(private.qclean(q.body)) as body, q.subject,
           min(q.level) as level, (array_agg(distinct p.code order by p.code))[1:3] as proctors,
           count(distinct q.proctor_id)::int as proctor_count, sum(q.times_asked)::int as times_asked,
           max(q.asked_on) as asked_on, lower(private.qclean(q.body)) as qkey
    from public.questions q join public.proctors p on p.id = q.proctor_id
    where (v_q is null or q.body ilike '%' || private.like_escape(v_q) || '%')
      and (p_subject is null or q.subject = p_subject)
      and (p_level is null or q.level = p_level)
      and (p_proctor is null or lower(p.code) = lower(p_proctor))
      and char_length(private.qclean(q.body)) > 1
    group by lower(private.qclean(q.body)), q.subject
  ), v as (
    select qv.subject, qv.qkey, count(*)::int as n, bool_or(qv.user_id = u) as mine
    from public.question_votes qv
    where p_subject is null or qv.subject = p_subject
    group by qv.subject, qv.qkey
  )
  select g.id, g.body, g.subject, g.level, g.proctors, g.proctor_count, null::bigint,
         g.times_asked, g.asked_on, coalesce(v.n, 0), coalesce(v.mine, false), count(*) over (),
         gu.answer, gu.demo, gu.tips
  from g
  left join v on v.subject = g.subject and v.qkey = g.qkey
  left join public.question_guidance gu on gu.subject = g.subject and gu.qkey = g.qkey
  order by (case when p_sort = 'votes' then coalesce(v.n, 0) end) desc nulls last,
           (case when p_sort in ('asked', 'votes') then g.times_asked end) desc nulls last,
           (case when p_sort = 'recent' then g.asked_on end) desc nulls last, g.id desc
  limit v_limit offset v_offset;
end $$;

revoke all on function public.search_questions(text, text, integer, text, text, integer, integer) from public, anon;
grant execute on function public.search_questions(text, text, integer, text, text, integer, integer) to authenticated;
