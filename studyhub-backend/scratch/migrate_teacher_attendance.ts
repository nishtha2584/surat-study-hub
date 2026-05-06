import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const connection = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Adding teacher_status and substitute_teacher_id to class_sessions...');
    await connection.execute(`
      ALTER TABLE class_sessions 
      ADD COLUMN IF NOT EXISTS teacher_status ENUM('PRESENT', 'ABSENT') DEFAULT 'PRESENT', 
      ADD COLUMN IF NOT EXISTS substitute_teacher_id VARCHAR(36) NULL,
      ADD FOREIGN KEY IF NOT EXISTS (substitute_teacher_id) REFERENCES users(id)
    `);
    console.log('Update complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
