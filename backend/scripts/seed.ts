import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { SEED_LEADS } from '../src/repositories/seedLeads';

/**
 * Cria os usuários iniciais (admin e analista) e os leads de demonstração.
 * Senhas vêm de variáveis de ambiente — nunca ficam no código.
 */
const url = process.env.DATABASE_URL;
const accounts = [
  { role: 'admin', name: 'Administrador Ford', email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
  { role: 'analyst', name: 'Analista Pós-Venda', email: process.env.SEED_ANALYST_EMAIL, password: process.env.SEED_ANALYST_PASSWORD },
];
if (!url || accounts.some((a) => !a.email || !a.password || a.password.length < 12)) {
  throw new Error('Defina DATABASE_URL e SEED_ADMIN_/SEED_ANALYST_ EMAIL e PASSWORD (senha com 12+ caracteres)');
}

const sql = postgres(url, { prepare: false, ssl: url.includes('localhost') ? false : 'require' });

for (const a of accounts) {
  const hash = await bcrypt.hash(a.password!, 12);
  await sql`
    insert into users (name, email, password_hash, role)
    values (${a.name}, ${a.email!.toLowerCase()}, ${hash}, ${a.role})
    on conflict (email) do nothing`;
}

for (const l of SEED_LEADS) {
  await sql`
    insert into leads (id, client_name, email, phone, vehicle_model, vehicle_year, odometer_km, plan, service,
                       ai_score, risk_label, last_activity, status, estimated_revenue)
    values (${l.id}, ${l.clientName}, ${l.email}, ${l.phone}, ${l.vehicleModel}, ${l.vehicleYear}, ${l.odometerKm},
            ${l.plan}, ${l.service}, ${l.aiScore}, ${l.riskLabel}, ${l.lastActivity}, ${l.status}, ${l.estimatedRevenue})
    on conflict (id) do nothing`;
}
process.stdout.write(`seed concluído: ${accounts.length} usuários, ${SEED_LEADS.length} leads\n`);
await sql.end();
