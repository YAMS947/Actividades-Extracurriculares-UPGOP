const express = require('express'); // Librería para manejar los datos
// Se puede considerar como lo exportado
const router = express.Router();   // Mini servidor para alojar la ruta del módulo
const db = require('../db');       // Conexión a MySQL

// Registrar Usuario

router.post('/', (req, res) => {// (petición, respuesta)
    console.log("Datos recibidos:", req.body);
    
    const{
        nombre,
        apellido_paterno,
        apellido_materno,
        matricula,
        usuario,
        contrasena
    } = req.body;

    const sql = `
        INSERT INTO prueba_usuario
        (nombre, apellido_paterno, apellido_materno, matricula, usuario, contrasena)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    // Ejecutar consulta
    db.query(sql,
        [nombre, apellido_paterno, apellido_materno, matricula, usuario, contrasena],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({error: 'Error al registrar usuario'});
            }

            // Respuesta al Front-End
            res.json({
                mensaje: 'Usuario registrado correctamente',
                id: result.insertId
            });
        }
    );
}); 

// Exportar el módulo creado
module.exports = router;
