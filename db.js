const mysql = require('mysql2'); // Importamos la librería MYSQL2

/* 
    Crear conexión a la base de datos 
    Es la que se usara durante todo el proyecto para manejar los datos
*/
// Se establece el puerto a usar en base al entorno de ejecución
// Puerto para node:3307 - nginx: 3306
const puerto = 3307

const db = mysql.createPool({
    host: 'localhost', // El host al que conectamos gracias al tunel de host que abrimos
    port: puerto, // Puerto que usa el tunel 
    user: 'innova-sys', // Nombre del usuario que creamos para manipular la base de datos
    password: 'Js_a1kJJ2*sd_-128sam', // La contraseña del usuario
    database: 'actividades_extracurriculares', // Base de datos con la que trabajamos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar conexión inicial
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a MySQL:', err);
        return;
    }
    console.log('Conexión a MySQL exitosa (POOL)');
    connection.release();
});

/* Exportamos la conexión para usarla en otros archivos como "db" */
module.exports = db;