-- A tela L3 mostra o nome do clube, a descrição e quem chamou antes de a
-- pessoa aceitar. Nada disso é legível pelas políticas: clube_leitura exige
-- participação, e antes de aceitar não há participação.
--
-- A prévia é a função que resolve isso. Quem tem o código está autorizado a
-- ver aquele clube — o código é a credencial, e é exatamente o que a L3
-- pressupõe. Ela devolve só o que a tela mostra, e nada de outros clubes.

create or replace function public.previa_do_convite(codigo text)
returns table (
  clube_id uuid,
  nome text,
  descricao text,
  convidou text,
  membros integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_convite convite%rowtype;
begin
  select * into v_convite
  from convite c
  where c.codigo = trim(previa_do_convite.codigo);

  if not found then
    raise exception 'convite inexistente' using errcode = 'PR001';
  end if;
  if v_convite.revogado then
    raise exception 'convite revogado' using errcode = 'PR002';
  end if;
  if v_convite.expira_em is not null and v_convite.expira_em < now() then
    raise exception 'convite vencido' using errcode = 'PR003';
  end if;

  return query
  select cl.id,
         cl.nome,
         cl.descricao,
         (select p.nome from perfil p where p.id = v_convite.criado_por),
         (select count(*)::integer from membro_clube m where m.clube_id = cl.id)
  from clube cl
  where cl.id = v_convite.clube_id;
end $$;

revoke execute on function public.previa_do_convite(text) from public, anon;
grant execute on function public.previa_do_convite(text) to authenticated;
