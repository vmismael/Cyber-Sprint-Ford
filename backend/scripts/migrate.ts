import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

/** Aplica as migrações de db/migrations em ordem, uma única vez cada. */
const url = process.env.DATABASE_URL;
if (!url) throw new Error('Defina DATABASE_URL');

const sql = postgres(url, { prepare: false, ssl: url.includes('localhost') ? false : 'require', onnotice: () => {} });
const dir = join(import.meta.dirname, '..', 'db', 'migrations');

await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
// No Supabase, anon/authenticated recebem permissão em tudo do schema public. Sem RLS,
// a chave pública poderia inserir um nome aqui e fazer uma migração ser pulada.
await sql`alter table schema_migrations enable row level security`;
const applied = new Set((await sql`select name from schema_migrations`).map((r) => r.name as string));

for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue;
  const ddl = readFileSync(join(dir, file), 'utf8');
  await sql.begin(async (tx) => {
    // Arquivo versionado no repositório e revisado em PR: não contém entrada de usuário.
    await tx.unsafe(ddl); // nosemgrep: migração confiável, sem interpolação de dados externos
    await tx`insert into schema_migrations (name) values (${file})`;
  });
  process.stdout.write(`aplicada: ${file}\n`);
}
await sql.end();
