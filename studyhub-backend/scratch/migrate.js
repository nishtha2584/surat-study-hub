const mysql = require('mysql2/promise');
async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'study_hub'
  });
  console.log('Adding substitute_teacher_id column...');
  await connection.execute('ALTER TABLE class_sessions ADD COLUMN substitute_teacher_id CHAR(36) NULL AFTER teacher_status');
  console.log('Adding foreign key constraint...');
  await connection.execute('ALTER TABLE class_sessions ADD CONSTRAINT fk_substitute_teacher FOREIGN KEY (substitute_teacher_id) REFERENCES users(id)');
  console.log('Migration complete.');
  await connection.end();
}
run().catch(console.error);
