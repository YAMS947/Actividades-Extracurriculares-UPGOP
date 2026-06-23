const mysql = require('mysql2'); // Importamos la librería MYSQL2

/* 
    Crear conexión a la base de datos 
    Es la que se usara durante todo el proyecto para manejar los datos
*/
const db = mysql.createConnection({
    host: 'localhost', // El host al que conectamos gracias al tunel de host que abrimos
    port: 3307, // Puerto que usa el tunel 
    user: 'innova-sys', // Nombre del usuario que creamos para manipular la base de datos
    password: 'jam32**21las', // La contraseña del usuario
    database: 'actividades_extracurriculares' // Base de datos con la que trabajamos
});

/* Comprobamos que la conexión sea exitosa */
db.connect(err => {
    if (err) {
        console.error('Error al conectar a MySQL:', err);
        return;
    }
    console.log('Conexión a MySQL exitosa desde VS Code');
});

/* Exportamos la conexión para usarla en otros archivos como "db" */
module.exports = db;