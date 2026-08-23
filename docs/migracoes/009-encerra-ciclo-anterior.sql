-- O enum status_ciclo tem 'encerrado' desde o começo e nada nunca o atribuía.
-- Funcionava porque as consultas pegavam a linha mais recente, mas um clube
-- com cinco livros lidos acumulava cinco ciclos em 'leitura' — o que, lido ao
-- pé da letra, diz que ele lê cinco livros ao mesmo tempo.
--
-- Por gatilho, e não pela aplicação, pelo mesmo motivo da decisão 3.4: um
-- caminho que esquecesse o segundo update deixaria o clube com dois ciclos em
-- leitura, e a diferença só apareceria muito depois.
--
-- Atenção para quem for ler as consultas: o livro atual do clube não sai de
-- 'leitura', e sim do ciclo mais recente que tem livro escolhido. Do contrário
-- abrir a votação seguinte faria o livro em leitura sumir da tela do clube.

create or replace function privado.encerra_ciclo_anterior()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Vale nos dois momentos: quando a votação seguinte abre, e quando um ciclo
  -- passa a leitura por ter livro escolhido. Só o segundo mantém a regra de pé
  -- o tempo todo — sem ele o clube fica com dois ciclos em leitura no intervalo
  -- entre encerrar uma votação e abrir a próxima.
  if new.status in ('votacao', 'leitura') then
    update ciclo
       set status = 'encerrado'
     where clube_id = new.clube_id
       and id <> new.id
       and status = 'leitura';
  end if;
  return new;
end $$;

revoke execute on function privado.encerra_ciclo_anterior() from public, anon, authenticated;

drop trigger if exists ao_abrir_ciclo on ciclo;

create trigger ao_abrir_ciclo
  after insert or update of status on ciclo
  for each row execute function privado.encerra_ciclo_anterior();
