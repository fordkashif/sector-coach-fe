-- Created: 2026-03-22

create or replace function public.enqueue_coach_invite_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name text;
  v_tenant_name text;
  v_inviter_email text;
  v_subject text;
  v_body text;
begin
  select t.name
  into v_tenant_name
  from public.tenants t
  where t.id = coalesce(new.tenant_id, old.tenant_id);

  if tg_op = 'INSERT' then
    select tm.name
    into v_team_name
    from public.teams tm
    where tm.id = new.team_id;

    v_subject := 'Your PaceLab invite is ready';
    v_body := case
      when v_team_name is null then format(
        'You have been invited to join %s in PaceLab as %s. Sign in with %s to continue.',
        coalesce(v_tenant_name, 'your organization'),
        coalesce(new.role, 'coach'),
        lower(new.email)
      )
      else format(
        'You have been invited to join %s in PaceLab as %s for team %s. Sign in with %s to continue.',
        coalesce(v_tenant_name, 'your organization'),
        coalesce(new.role, 'coach'),
        v_team_name,
        lower(new.email)
      )
    end;

    insert into public.notification_events (
      tenant_id,
      recipient_user_id,
      recipient_email,
      channel,
      event_type,
      subject,
      body,
      status,
      metadata
    )
    values (
      new.tenant_id,
      null,
      lower(new.email),
      'in-app',
      'coach_invite_created',
      v_subject,
      v_body,
      'pending',
      jsonb_build_object(
        'coach_invite_id', new.id::text,
        'team_id', new.team_id,
        'role', new.role
      )
    );

    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'accepted'
     and new.invited_by_user_id is not null then
    select tm.name
    into v_team_name
    from public.teams tm
    where tm.id = new.team_id;

    select lower(coalesce(au.email, ''))
    into v_inviter_email
    from auth.users au
    where au.id = new.invited_by_user_id;

    v_subject := 'Coach invite accepted';
    v_body := case
      when v_team_name is null then format(
        '%s accepted the %s invite for %s.',
        lower(new.email),
        coalesce(new.role, 'coach'),
        coalesce(v_tenant_name, 'your organization')
      )
      else format(
        '%s accepted the %s invite for team %s in %s.',
        lower(new.email),
        coalesce(new.role, 'coach'),
        v_team_name,
        coalesce(v_tenant_name, 'your organization')
      )
    end;

    insert into public.notification_events (
      tenant_id,
      recipient_user_id,
      recipient_email,
      channel,
      event_type,
      subject,
      body,
      status,
      metadata
    )
    values (
      new.tenant_id,
      new.invited_by_user_id,
      nullif(v_inviter_email, ''),
      'email',
      'coach_invite_accepted',
      v_subject,
      v_body,
      'pending',
      jsonb_build_object(
        'coach_invite_id', new.id::text,
        'team_id', new.team_id,
        'accepted_at', new.accepted_at
      )
    );

    insert into public.notification_events (
      tenant_id,
      recipient_user_id,
      recipient_email,
      channel,
      event_type,
      subject,
      body,
      status,
      metadata
    )
    values (
      new.tenant_id,
      new.invited_by_user_id,
      nullif(v_inviter_email, ''),
      'in-app',
      'coach_invite_accepted',
      v_subject,
      v_body,
      'pending',
      jsonb_build_object(
        'coach_invite_id', new.id::text,
        'team_id', new.team_id,
        'accepted_at', new.accepted_at
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists queue_coach_invite_notifications on public.coach_invites;
create trigger queue_coach_invite_notifications
after insert or update on public.coach_invites
for each row
execute function public.enqueue_coach_invite_notifications();

create or replace function public.enqueue_athlete_invite_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name text;
  v_tenant_name text;
  v_inviter_email text;
  v_athlete_email text;
  v_subject text;
  v_body text;
begin
  select t.name
  into v_tenant_name
  from public.tenants t
  where t.id = coalesce(new.tenant_id, old.tenant_id);

  select tm.name
  into v_team_name
  from public.teams tm
  where tm.id = coalesce(new.team_id, old.team_id);

  if tg_op = 'INSERT' and new.invited_by_user_id is not null then
    select lower(coalesce(au.email, ''))
    into v_inviter_email
    from auth.users au
    where au.id = new.invited_by_user_id;

    v_subject := 'Athlete invite ready to share';
    v_body := case
      when new.expires_at is null then format(
        'Your invite link for team %s in %s is ready to share.',
        coalesce(v_team_name, 'your team'),
        coalesce(v_tenant_name, 'your organization')
      )
      else format(
        'Your invite link for team %s in %s is ready to share and expires on %s.',
        coalesce(v_team_name, 'your team'),
        coalesce(v_tenant_name, 'your organization'),
        to_char(new.expires_at at time zone 'UTC', 'YYYY-MM-DD')
      )
    end;

    insert into public.notification_events (
      tenant_id,
      recipient_user_id,
      recipient_email,
      channel,
      event_type,
      subject,
      body,
      status,
      metadata
    )
    values (
      new.tenant_id,
      new.invited_by_user_id,
      nullif(v_inviter_email, ''),
      'in-app',
      'athlete_invite_created',
      v_subject,
      v_body,
      'pending',
      jsonb_build_object(
        'athlete_invite_id', new.id::text,
        'team_id', new.team_id,
        'expires_at', new.expires_at
      )
    );

    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'accepted' then
    if new.invited_by_user_id is not null then
      select lower(coalesce(au.email, ''))
      into v_inviter_email
      from auth.users au
      where au.id = new.invited_by_user_id;

      v_subject := 'Athlete joined from invite';
      v_body := format(
        'An athlete accepted the invite for team %s in %s.',
        coalesce(v_team_name, 'your team'),
        coalesce(v_tenant_name, 'your organization')
      );

      insert into public.notification_events (
        tenant_id,
        recipient_user_id,
        recipient_email,
        channel,
        event_type,
        subject,
        body,
        status,
        metadata
      )
      values
      (
        new.tenant_id,
        new.invited_by_user_id,
        nullif(v_inviter_email, ''),
        'email',
        'athlete_invite_accepted',
        v_subject,
        v_body,
        'pending',
        jsonb_build_object(
          'athlete_invite_id', new.id::text,
          'team_id', new.team_id,
          'accepted_at', new.accepted_at,
          'audience', 'inviter'
        )
      ),
      (
        new.tenant_id,
        new.invited_by_user_id,
        nullif(v_inviter_email, ''),
        'in-app',
        'athlete_invite_accepted',
        v_subject,
        v_body,
        'pending',
        jsonb_build_object(
          'athlete_invite_id', new.id::text,
          'team_id', new.team_id,
          'accepted_at', new.accepted_at,
          'audience', 'inviter'
        )
      );
    end if;

    if new.accepted_by_user_id is not null then
      select lower(coalesce(au.email, ''))
      into v_athlete_email
      from auth.users au
      where au.id = new.accepted_by_user_id;

      v_subject := 'Team join confirmed';
      v_body := format(
        'You are now assigned to team %s in %s.',
        coalesce(v_team_name, 'your team'),
        coalesce(v_tenant_name, 'your organization')
      );

      insert into public.notification_events (
        tenant_id,
        recipient_user_id,
        recipient_email,
        channel,
        event_type,
        subject,
        body,
        status,
        metadata
      )
      values
      (
        new.tenant_id,
        new.accepted_by_user_id,
        nullif(v_athlete_email, ''),
        'email',
        'athlete_invite_accepted',
        v_subject,
        v_body,
        'pending',
        jsonb_build_object(
          'athlete_invite_id', new.id::text,
          'team_id', new.team_id,
          'accepted_at', new.accepted_at,
          'audience', 'athlete'
        )
      ),
      (
        new.tenant_id,
        new.accepted_by_user_id,
        nullif(v_athlete_email, ''),
        'in-app',
        'athlete_invite_accepted',
        v_subject,
        v_body,
        'pending',
        jsonb_build_object(
          'athlete_invite_id', new.id::text,
          'team_id', new.team_id,
          'accepted_at', new.accepted_at,
          'audience', 'athlete'
        )
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists queue_athlete_invite_notifications on public.athlete_invites;
create trigger queue_athlete_invite_notifications
after insert or update on public.athlete_invites
for each row
execute function public.enqueue_athlete_invite_notifications();
