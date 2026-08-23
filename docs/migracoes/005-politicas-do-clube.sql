-- Políticas que o épico E2 exige. Sem elas o clube é criado e some na hora:
-- clube_leitura pede participação, e não havia como registrar participação.

-- ---------------------------------------------------- quem é admin
create or replace function privado.e_admin(p_clube uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from membro_clube
    where clube_id = p_clube and perfil_id = auth.uid() and papel = 'admin'
  );
$$;

revoke execute on function privado.e_admin(uuid) from public;
grant execute on function privado.e_admin(uuid) to anon, authenticated;

-- ---------------------------------------------------- criador vira admin
-- Por gatilho, não por política, pelo mesmo motivo da decisão 3.4: qualquer
-- caminho que esqueça a segunda inserção deixaria um clube sem dono, e sem
-- dono ninguém o enxerga. Com gatilho isso é impossível por construção.

create or replace function privado.cria_membro_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into membro_clube (clube_id, perfil_id, papel)
  values (new.id, new.criado_por, 'admin')
  on conflict (clube_id, perfil_id) do nothing;
  return new;
end $$;

revoke execute on function privado.cria_membro_admin() from public, anon, authenticated;

drop trigger if exists ao_criar_clube on clube;

create trigger ao_criar_clube
  after insert on clube
  for each row execute function privado.cria_membro_admin();

-- ---------------------------------------------------- entrar por convite
-- O código do convite é o segredo, então convite não ganha política de select:
-- uma política não sabe por qual código o cliente filtrou, e liberar a leitura
-- deixaria qualquer pessoa autenticada enumerar os convites de todos os clubes.
--
-- A entrada vira função: o código entra, a participação sai, e o segredo nunca
-- deixa o banco. Esta é a única função SECURITY DEFINER que deve mesmo ser
-- chamável pela API — é porta desenhada como porta.

create or replace function public.entrar_por_convite(codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_convite convite%rowtype;
begin
  if auth.uid() is null then
    raise exception 'é preciso estar autenticado' using errcode = 'PR000';
  end if;

  select * into v_convite
  from convite c
  where c.codigo = trim(entrar_por_convite.codigo);

  if not found then
    raise exception 'convite inexistente' using errcode = 'PR001';
  end if;

  if v_convite.revogado then
    raise exception 'convite revogado' using errcode = 'PR002';
  end if;

  if v_convite.expira_em is not null and v_convite.expira_em < now() then
    raise exception 'convite vencido' using errcode = 'PR003';
  end if;

  if exists (
    select 1 from membro_clube m
    where m.clube_id = v_convite.clube_id and m.perfil_id = auth.uid()
  ) then
    raise exception 'já é membro deste clube' using errcode = 'PR004';
  end if;

  insert into membro_clube (clube_id, perfil_id, papel)
  values (v_convite.clube_id, auth.uid(), 'membro');

  return v_convite.clube_id;
end $$;

revoke execute on function public.entrar_por_convite(text) from public, anon;
grant execute on function public.entrar_por_convite(text) to authenticated;

-- Convite se cria, não se lê. Só admin do clube emite.
create policy convite_criacao on convite for insert
  with check (criado_por = auth.uid() and privado.e_admin(clube_id));

-- ---------------------------------------------------- ciclo e proposta
create policy ciclo_criacao on ciclo for insert
  with check (privado.e_admin(clube_id));

create policy ciclo_edicao on ciclo for update
  using (privado.e_admin(clube_id))
  with check (privado.e_admin(clube_id));

create policy proposta_criacao on proposta for insert
  with check (
    proposto_por = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = proposta.ciclo_id))
  );

-- ---------------------------------------------------- trocar o voto (US-25)
create policy voto_troca on voto for update
  using (
    perfil_id = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
  )
  with check (
    perfil_id = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
  );

create policy voto_remocao on voto for delete
  using (
    perfil_id = auth.uid()
    and privado.e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id))
  );
