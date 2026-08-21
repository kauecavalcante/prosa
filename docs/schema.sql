-- Prosa — esquema do banco (PostgreSQL / Supabase)
-- Executável no SQL Editor do Supabase, na ordem em que está.
--
-- Convenção: nomes de tabela no singular, colunas em snake_case, texto em português.
-- Toda tabela com dado de usuário tem RLS habilitada. Nenhuma tabela guarda
-- progresso de leitura em página ou percentual — ver RNF-17 em requisitos.md.

-- ---------------------------------------------------------------- extensões

-- gen_random_bytes(), usada para gerar o código de convite, vem do pgcrypto.
-- gen_random_uuid() já é nativa do PostgreSQL 13 em diante.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tipos

create type estado_leitura as enum ('futuro', 'lendo', 'lido');
create type papel_membro   as enum ('admin', 'membro');
create type status_ciclo   as enum ('votacao', 'leitura', 'encerrado');
create type fonte_livro    as enum ('google_books', 'open_library', 'manual');
create type tipo_atividade as enum ('avaliou', 'resenhou', 'quer_ler');
create type visibilidade   as enum ('publica', 'privada');

-- ---------------------------------------------------------------- perfil

create table perfil (
  id              uuid primary key references auth.users(id) on delete cascade,
  nome            text not null check (length(trim(nome)) between 1 and 60),
  retrato         text not null default 'retrato-01',
  criado_em       timestamptz not null default now(),

  -- US-58: cada lista tem visibilidade própria
  vis_lidos       visibilidade not null default 'publica',
  vis_futuros     visibilidade not null default 'publica',
  vis_resenhas    visibilidade not null default 'publica'
);

-- ---------------------------------------------------------------- livro
-- O livro é copiado da API para cá na primeira vez que alguém o usa.
-- Assim todas as chaves estrangeiras apontam para o nosso id, e não para
-- um id externo que pode mudar ou sumir.

create table livro (
  id              uuid primary key default gen_random_uuid(),
  fonte           fonte_livro not null,
  fonte_id        text,
  isbn            text,
  titulo          text not null,
  autores         text[] not null default '{}',
  descricao       text,
  paginas         integer check (paginas is null or paginas > 0),
  ano             integer,
  editora         text,
  capa_url        text,
  categorias      text[] not null default '{}',
  criado_em       timestamptz not null default now(),

  unique (fonte, fonte_id)
);

create index livro_titulo_idx on livro using gin (to_tsvector('portuguese', titulo));

-- ---------------------------------------------------------------- clube

create table clube (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null check (length(trim(nome)) between 1 and 60),
  descricao       text,
  combinado       text,                       -- US-12: regras de convivência do clube
  criado_por      uuid not null references perfil(id) on delete restrict,
  criado_em       timestamptz not null default now()
);

create table membro_clube (
  clube_id        uuid not null references clube(id) on delete cascade,
  perfil_id       uuid not null references perfil(id) on delete cascade,
  papel           papel_membro not null default 'membro',
  entrou_em       timestamptz not null default now(),
  primary key (clube_id, perfil_id)           -- US-07: ninguém entra duas vezes
);

create index membro_clube_perfil_idx on membro_clube (perfil_id);

create table convite (
  id              uuid primary key default gen_random_uuid(),
  clube_id        uuid not null references clube(id) on delete cascade,
  codigo          text not null unique default encode(gen_random_bytes(6), 'hex'),
  criado_por      uuid not null references perfil(id) on delete cascade,
  expira_em       timestamptz,
  revogado        boolean not null default false,
  criado_em       timestamptz not null default now()
);

-- ---------------------------------------------------------------- ciclo e votação

create table ciclo (
  id              uuid primary key default gen_random_uuid(),
  clube_id        uuid not null references clube(id) on delete cascade,
  livro_id        uuid references livro(id) on delete restrict,  -- nulo até a votação fechar
  status          status_ciclo not null default 'votacao',
  prazo           date,                        -- US-23: meta de leitura, não trava nada
  votacao_ate     timestamptz,
  criado_em       timestamptz not null default now()
);

-- US-23: não é possível marcar prazo no passado.
-- Isso é gatilho, e não CHECK, porque current_date não é imutável — um CHECK
-- que o usasse passaria a rejeitar linhas antigas na restauração de um backup.
create or replace function exige_prazo_futuro() returns trigger
language plpgsql as $$
begin
  if new.prazo is not null and new.prazo < current_date then
    raise exception 'O prazo do ciclo não pode estar no passado.';
  end if;
  return new;
end $$;

create trigger ciclo_prazo_futuro
  before insert or update of prazo on ciclo
  for each row execute function exige_prazo_futuro();

create index ciclo_clube_idx on ciclo (clube_id, criado_em desc);

create table proposta (
  id              uuid primary key default gen_random_uuid(),
  ciclo_id        uuid not null references ciclo(id) on delete cascade,
  livro_id        uuid not null references livro(id) on delete cascade,
  proposto_por    uuid not null references perfil(id) on delete cascade,
  defesa          text check (defesa is null or length(defesa) <= 200),
  criado_em       timestamptz not null default now(),
  unique (ciclo_id, livro_id)                  -- US-19: sem livro repetido na mesma votação
);

create table voto (
  ciclo_id        uuid not null references ciclo(id) on delete cascade,
  perfil_id       uuid not null references perfil(id) on delete cascade,
  proposta_id     uuid not null references proposta(id) on delete cascade,
  criado_em       timestamptz not null default now(),
  primary key (ciclo_id, perfil_id)            -- US-20: um voto por pessoa por votação
);

create index voto_proposta_idx on voto (proposta_id);

-- ---------------------------------------------------------------- estante

create table item_estante (
  id              uuid primary key default gen_random_uuid(),
  perfil_id       uuid not null references perfil(id) on delete cascade,
  livro_id        uuid not null references livro(id) on delete cascade,
  estado          estado_leitura not null default 'futuro',
  clube_id        uuid references clube(id) on delete set null,  -- de onde o livro veio
  atualizado_em   timestamptz not null default now(),
  unique (perfil_id, livro_id)
);

create index item_estante_perfil_idx on item_estante (perfil_id, estado);

-- Não existe coluna de progresso aqui, e isso é deliberado.
-- O acompanhamento é só pelo estado — ver RNF-17 e US-28.

-- ---------------------------------------------------------------- nota e resenha

create table nota (
  perfil_id       uuid not null references perfil(id) on delete cascade,
  livro_id        uuid not null references livro(id) on delete cascade,
  valor           smallint not null check (valor between 0 and 5),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  primary key (perfil_id, livro_id)
);

create table resenha (
  id              uuid primary key default gen_random_uuid(),
  perfil_id       uuid not null references perfil(id) on delete cascade,
  livro_id        uuid not null references livro(id) on delete cascade,
  texto           text not null check (length(trim(texto)) > 0),
  spoiler         boolean not null default false,
  criado_em       timestamptz not null default now(),
  unique (perfil_id, livro_id)
);

-- US-34: só avalia quem marcou o livro como lido
create or replace function exige_livro_lido() returns trigger
language plpgsql as $$
begin
  if not exists (
    select 1 from item_estante
    where perfil_id = new.perfil_id
      and livro_id  = new.livro_id
      and estado    = 'lido'
  ) then
    raise exception 'Só é possível avaliar um livro marcado como lido.';
  end if;
  return new;
end $$;

create trigger nota_exige_lido
  before insert or update on nota
  for each row execute function exige_livro_lido();

-- ---------------------------------------------------------------- conversa do clube

create table fala (
  id              uuid primary key default gen_random_uuid(),
  clube_id        uuid not null references clube(id) on delete cascade,
  livro_id        uuid not null references livro(id) on delete cascade,
  perfil_id       uuid not null references perfil(id) on delete cascade,
  texto           text not null check (length(trim(texto)) > 0),
  spoiler         boolean not null default false,   -- US-37
  responde_a      uuid references fala(id) on delete cascade,  -- US-40
  criado_em       timestamptz not null default now()
);

create index fala_clube_livro_idx on fala (clube_id, livro_id, criado_em);

-- A conversa não tem trava de data: US-41 foi removida do escopo.
-- Quem protege o leitor atrasado é a coluna `spoiler`, e a revelação
-- é estado local do cliente — nunca é gravada nem compartilhada (US-38).

-- ---------------------------------------------------------------- rede

create table segue (
  seguidor_id     uuid not null references perfil(id) on delete cascade,
  seguido_id      uuid not null references perfil(id) on delete cascade,
  criado_em       timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  constraint nao_segue_a_si check (seguidor_id <> seguido_id)
);

create index segue_seguido_idx on segue (seguido_id);

create table atividade (
  id              uuid primary key default gen_random_uuid(),
  perfil_id       uuid not null references perfil(id) on delete cascade,
  tipo            tipo_atividade not null,
  livro_id        uuid not null references livro(id) on delete cascade,
  clube_id        uuid references clube(id) on delete set null,
  criado_em       timestamptz not null default now()
);

create index atividade_perfil_idx on atividade (perfil_id, criado_em desc);

create table curtida (
  atividade_id    uuid not null references atividade(id) on delete cascade,
  perfil_id       uuid not null references perfil(id) on delete cascade,
  criado_em       timestamptz not null default now(),
  primary key (atividade_id, perfil_id)
);

create table comentario_atividade (
  id              uuid primary key default gen_random_uuid(),
  atividade_id    uuid not null references atividade(id) on delete cascade,
  perfil_id       uuid not null references perfil(id) on delete cascade,
  texto           text not null check (length(trim(texto)) > 0),
  spoiler         boolean not null default false,
  criado_em       timestamptz not null default now()
);

-- Atividade é gravada por gatilho, não pela aplicação. Assim o feed nunca
-- fica dessincronizado do que de fato aconteceu.

create or replace function registra_atividade() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'nota' then
    insert into atividade (perfil_id, tipo, livro_id)
    values (new.perfil_id, 'avaliou', new.livro_id);
  elsif tg_table_name = 'resenha' then
    insert into atividade (perfil_id, tipo, livro_id)
    values (new.perfil_id, 'resenhou', new.livro_id);
  elsif tg_table_name = 'item_estante' and new.estado = 'futuro' then
    insert into atividade (perfil_id, tipo, livro_id, clube_id)
    values (new.perfil_id, 'quer_ler', new.livro_id, new.clube_id);
  end if;
  return new;
end $$;

create trigger nota_gera_atividade     after insert on nota          for each row execute function registra_atividade();
create trigger resenha_gera_atividade  after insert on resenha       for each row execute function registra_atividade();
create trigger estante_gera_atividade  after insert on item_estante  for each row execute function registra_atividade();

-- ---------------------------------------------------------------- RLS
--
-- Com RLS habilitada e sem política, o acesso é negado. As políticas abaixo
-- são o conjunto mínimo que sustenta o MVP; operações ainda não cobertas
-- (administrar clube, revogar convite, encerrar votação) serão liberadas
-- conforme as user stories correspondentes entrarem em desenvolvimento.
-- Negar por padrão é intencional: é mais seguro faltar permissão do que sobrar.

alter table perfil               enable row level security;
alter table clube                enable row level security;
alter table membro_clube         enable row level security;
alter table convite              enable row level security;
alter table ciclo                enable row level security;
alter table proposta             enable row level security;
alter table voto                 enable row level security;
alter table item_estante         enable row level security;
alter table nota                 enable row level security;
alter table resenha              enable row level security;
alter table fala                 enable row level security;
alter table segue                enable row level security;
alter table atividade            enable row level security;
alter table curtida              enable row level security;
alter table comentario_atividade enable row level security;

-- Livro é catálogo compartilhado: leitura livre, escrita por quem está logado.
alter table livro enable row level security;
create policy livro_leitura  on livro for select using (true);
create policy livro_escrita  on livro for insert with check (auth.uid() is not null);

-- Função de apoio: a pessoa é membro deste clube?
create or replace function e_membro(p_clube uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from membro_clube
    where clube_id = p_clube and perfil_id = auth.uid()
  );
$$;

-- Perfil é público; só o dono edita.
create policy perfil_leitura on perfil for select using (true);
create policy perfil_edicao  on perfil for update using (id = auth.uid());

-- Clube é fechado: só membro enxerga.
create policy clube_leitura  on clube for select using (e_membro(id));
create policy clube_criacao  on clube for insert with check (criado_por = auth.uid());
create policy membro_leitura on membro_clube for select using (e_membro(clube_id));

-- Ciclo, proposta, voto e conversa seguem o clube.
create policy ciclo_leitura    on ciclo    for select using (e_membro(clube_id));
create policy proposta_leitura on proposta for select using (e_membro((select clube_id from ciclo where ciclo.id = proposta.ciclo_id)));
create policy voto_leitura     on voto     for select using (e_membro((select clube_id from ciclo where ciclo.id = voto.ciclo_id)));
create policy voto_escrita     on voto     for insert with check (perfil_id = auth.uid());
create policy fala_leitura     on fala     for select using (e_membro(clube_id));
create policy fala_escrita     on fala     for insert with check (perfil_id = auth.uid() and e_membro(clube_id));

-- Estante respeita a visibilidade escolhida pelo dono (US-58).
create policy estante_leitura on item_estante for select using (
  perfil_id = auth.uid()
  or exists (
    select 1 from perfil p
    where p.id = item_estante.perfil_id
      and case item_estante.estado
            when 'lido'  then p.vis_lidos
            else              p.vis_futuros
          end = 'publica'
  )
);
create policy estante_escrita on item_estante for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- Nota e resenha são públicas para leitura, do dono para escrita.
create policy nota_leitura      on nota    for select using (true);
create policy nota_escrita      on nota    for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
create policy resenha_leitura   on resenha for select using (true);
create policy resenha_escrita   on resenha for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- Rede: leitura livre, escrita só em nome próprio.
create policy segue_leitura     on segue     for select using (true);
create policy segue_escrita     on segue     for all using (seguidor_id = auth.uid()) with check (seguidor_id = auth.uid());
create policy atividade_leitura on atividade for select using (true);
create policy curtida_leitura   on curtida   for select using (true);
create policy curtida_escrita   on curtida   for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
create policy coment_leitura    on comentario_atividade for select using (true);
create policy coment_escrita    on comentario_atividade for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
