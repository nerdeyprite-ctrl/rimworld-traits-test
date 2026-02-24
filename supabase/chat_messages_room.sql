-- Split chat by room (e.g. lobby, world)
alter table public.chat_messages
add column if not exists room text;

update public.chat_messages
set room = 'lobby'
where room is null or room = '';

alter table public.chat_messages
alter column room set default 'lobby';

alter table public.chat_messages
alter column room set not null;

create index if not exists idx_chat_messages_room_created_at
on public.chat_messages(room, created_at);
