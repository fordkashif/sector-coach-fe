-- Notification email delivery tracking
-- Created: 2026-03-22

alter table public.notification_events
add column if not exists delivery_attempt_count int not null default 0,
add column if not exists last_error text,
add column if not exists provider_message_id text,
add column if not exists processing_started_at timestamptz;

create index if not exists notification_events_channel_status_created_idx
on public.notification_events (channel, status, created_at desc);
