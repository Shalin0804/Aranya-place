import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Either DATABASE_URL (mysql://user:pass@host:4000/db) or the DB_* parts.
// TiDB Cloud requires TLS: set DB_SSL=true.
const common = {
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  queueLimit: 0,
  connectTimeout: 15000,
  enableKeepAlive: true,
  decimalNumbers: true,
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2' } : undefined,
};

export const pool = process.env.DATABASE_URL
  ? mysql.createPool({ uri: process.env.DATABASE_URL, ...common })
  : mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 4000,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ...common,
    });

export async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}
