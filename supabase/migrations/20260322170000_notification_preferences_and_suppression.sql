-- Notification preferences and suppression support
-- Created: 2026-03-22

alter table public.notification_events
drop constraint if exists notification_events_status_check;

alter table public.notification_events
add constraint notification_events_status_check
check (status in ('pending', 'sent', 'failed', 'read', 'suppressed'));

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  channel text not null check (channel in ('in-app', 'email')),
  event_type text not null default '*',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or email is not null)
);

create unique index if not exists notification_preferences_user_unique_idx
on public.notification_preferences (user_id, channel, event_type)
where user_id is not null;

create unique index if not exists notification_preferences_email_unique_idx
on public.notification_preferences (lower(email), channel, event_type)
where user_id is null and email is not null;

drop trigger if exists set_updated_at_notification_preferences on public.notification_preferences;
create trigger set_updated_at_notification_preferences
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_select_self on public.notification_preferences;
create policy notification_preferences_select_self
on public.notification_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists notification_preferences_modify_self on public.notification_preferences;
create policy notification_preferences_modify_self
on public.notification_preferences
for all
to authenticated
using (
  user_id = auth.uid()
  or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  user_id = auth.uid()
  or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create or replace function public.notification_channel_enabled(
  p_channel text,
  p_event_type text,
  p_recipient_user_id uuid default null,
  p_recipient_email text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with candidates as (
    select np.enabled, 1 as priority
    from public.notification_preferences np
    where np.channel = p_channel
      and np.event_type = p_event_type
      and (
        (p_recipient_user_id is not null and np.user_id = p_recipient_user_id)
        or (p_recipient_user_id is null and p_recipient_email is not null and lower(np.email) = lower(p_recipient_email))
      )
    union all
    select np.enabled, 2 as priority
    from public.notification_preferences np
    where np.channel = p_channel
      and np.event_type = '*'
      and (
        (p_recipient_user_id is not null and np.user_id = p_recipient_user_id)
        or (p_recipient_user_id is null and p_recipient_email is not null and lower(np.email) = lower(p_recipient_email))
      )
  )
  select coalesce((select c.enabled from candidates c order by c.priority asc limit 1), true)
$$;

create or replace function public.sync_user_notification_from_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.channel <> 'in-app' then
    return new;
  end if;

  if not public.notification_channel_enabled(
    'in-app',
    new.event_type,
    new.recipient_user_id,
    new.recipient_email
  ) then
    return new;
  end if;

  insert into public.user_notifications (
    event_id,
    recipient_user_id,
    recipient_email,
    state
  )
  values (
    new.id,
    new.recipient_user_id,
    lower(nullif(btrim(coalesce(new.recipient_email, '')), '')),
    case when new.status = 'read' then 'read' else 'unread' end
  )
  on conflict do nothing;

  return new;
end;
$$;
