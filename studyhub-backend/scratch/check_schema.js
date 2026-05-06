const mysql = require('mysql2/promise');
async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'study_hub'
  });
  const [rows] = await connection.execute('DESCRIBE batches');
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
run().catch(console.error);
