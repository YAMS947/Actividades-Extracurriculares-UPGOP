const express = require('express'); //Libreria para manejar los datos
// Se puede considerar como lo exportado
const router = express.Router();    //Mini servidor para arrojar la ruta del módulo
const db = require('../db');        // Conexión a MySQL

// Registrar usuaio

router.post('/', (req, res) => {// (peticion, respuesta)
    console.log("Datos recibidos:", req.body);

    const{
        nombre,
        apellido,
        matricula,
        usuario,
        contrasena
    } = req.body;

    //en los values tiene que haber un signo de interrogación por cada valor del usuario
    const sql = `
    INSERT INTO usuario
    (nombre, apellido, matricula, usuario, contrasena)
    VALUES (?, ?, ?, ?, ?)
    `;
    //Ejecutar consulta Registro
    db.query(sql,
        [nombre, apellido, matricula, usuario, contrasena],
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




// Inicio de sesion
router.post(`/Login`, (req, res) => {
    console.log("Datos recibidos:", req.body);

    const{
        usuario,
        contrasena
    } = req.body;

    const sql = `
    SELECT usuario * FROM usuario
    `  
})