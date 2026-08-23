-- convite não tem política de select, então `insert ... returning` não devolve
-- nada e o admin não recupera o código que acabou de gerar. A emissão vira
-- função pela mesma razão que a entrada virou: o segredo não sai do banco por
-- leitura de tabela, sai por uma porta que decide o que devolver e a quem.
--
-- Reaproveita um convite válido em vez de acumular um por clique. Sem política
-- de leitura, código emitido é código que ninguém mais consegue listar nem
-- revogar individualmente pela interface — cada clique deixaria para trás mais
-- um segredo vivo e invisível. Com um por clube, revogar volta a significar
-- alguma coisa.

create or replace function public.criar_convite(p_clube uuid)
returns table (codigo text, expira_em timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_validade constant interval := interval '7 days';
begin
  if auth.uid() is null then
    raise exception 'é preciso estar autenticado' using errcode = 'PR000';
  end if;

  if not privado.e_admin(p_clube) then
    raise exception 'só quem administra o clube convida' using errcode = 'PR005';
  end if;

  return query
  with existente as (
    select c.codigo, c.expira_em
    from convite c
    where c.clube_id = p_clube
      and not c.revogado
      and (c.expira_em is null or c.expira_em > now())
    order by c.criado_em desc
    limit 1
  ), novo as (
    insert into convite (clube_id, criado_por, expira_em)
    select p_clube, auth.uid(), now() + v_validade
    where not exists (select 1 from existente)
    returning convite.codigo, convite.expira_em
  )
  select * from existente
  union all
  select * from novo;
end $$;

revoke execute on function public.criar_convite(uuid) from public, anon;
grant execute on function public.criar_convite(uuid) to authenticated;
