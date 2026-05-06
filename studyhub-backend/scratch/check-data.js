const mysql = require('mysql2/promise');

async function checkBatches() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password', // Based on common setup in these assessments
        database: 'studyhub'
    });

    try {
        const [rows] = await connection.execute('SELECT teacher_id, COUNT(*) as count FROM batches GROUP BY teacher_id');
        console.log('Batch counts per teacher:', rows);

        const [users] = await connection.execute('SELECT id, name, role FROM users WHERE role = "TEACHER"');
        console.log('Teachers:', users);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

checkBatches();
