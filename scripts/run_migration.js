import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const sql = readFileSync(join(process.cwd(), 'scripts/01_create_schema.sql'), 'utf8');

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
