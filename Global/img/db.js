const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    port: 3307, // ← gracias al túnel SSH
    user: 'innova-sys',
    password: 'jam32**21las',
    database: 'actividades_extracurriculares'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a MySQL:', err);
        return;
    }
    console.log('Conexión a MySQL exitosa desde VS Code');
});

module.exports = db;
