// Applies database/migrations/*.sql in filename order, once each.
// Safe for the live TiDB database: migrations are additive and tracked in
// schema_migrations, so re-running only applies new files.
// Usage: npm run migrate
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(190) PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

const [rows] = await pool.query('SELECT name FROM schema_migrations');
const applied = new Set(rows.map((r) => r.name));
const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await fs.readFile(path.join(dir, file), 'utf8');
  // TiDB auto-commits DDL, so statements run one by one; keep each migration
  // idempotent (IF NOT EXISTS) so a half-applied file can simply be re-run.
  const statements = sql.split(/;\s*$/m).map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean);
  for (const stmt of statements) await pool.query(stmt);
  await pool.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
  console.log(`applied ${file}`);
}

console.log('Migrations up to date.');
await pool.end();
