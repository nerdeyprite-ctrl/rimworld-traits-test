-- Global world simulation state store (single-row JSON document).
create table if not exists public.world_sim_state (
    id text primary key,
    payload jsonb not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_world_sim_state_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists trg_world_sim_state_updated_at on public.world_sim_state;
create trigger trg_world_sim_state_updated_at
before update on public.world_sim_state
for each row
execute function public.set_world_sim_state_updated_at();
