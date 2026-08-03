// ============================================================
// RUTA: Gestión de Instructores
// Archivo: routes/Gestion_De_Instructores.js
// Descripción:
// - Obtiene la lista de instructores por taller.
// - Permite registrar instructores nuevos.
// - Solo gestores deben acceder a estas funciones.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db'); 

// ============================================================
// 1. OBTENER TODOS LOS TALLERES (solo gestores)
// ------------------------------------------------------------
// GET /gestion-instructores/talleres
// Devuelve todos los talleres disponibles.
// ============================================================
router.get('/talleres', (req, res) => {

    const sql = `
        SELECT id_taller, nombre_taller
        FROM taller;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error al obtener talleres:", err);
            return res.status(500).json({ error: "error_obtener_talleres" });
        }

        res.json({
            mensaje: "talleres_obtenidos",
            talleres: result
        });
    });
});


router.post('/lista', (req, res) => {

    const { tipo_usuario } = req.body;

    if (!tipo_usuario || tipo_usuario !== "GEST") {
        return res.status(403).json({ error: "no_autorizado" });
    }

    const sqlLista = `
        SELECT 
            usuarios.nombre,
            CONCAT(usuarios.apellido_paterno, ' ', usuarios.apellido_materno) AS apellidos,
            taller.nombre_taller
        FROM usuarios
        INNER JOIN taller_usuario
            ON usuarios.id_usuario = taller_usuario.id_usuario
        INNER JOIN taller
            ON taller_usuario.id_taller = taller.id_taller
        WHERE usuarios.tipo_usuario = "INST";
    `;

    db.query(sqlLista, (err, result) => {
        if (err) {
            console.error("Error al obtener lista de instructores:", err);
            return res.status(500).json({ error: "error_obtener_lista" });
        }

        res.json({
            mensaje: "lista_obtenida",
            instructores: result
        });
    });
});



// ============================================================
// 3. DAR DE ALTA UN INSTRUCTOR
// ------------------------------------------------------------
// POST /gestion-instructores/alta
//
// Body:
//   {
//     "tipo_usuario": "GEST",
//     "nombre": "Juan",
//     "apellido_paterno": "Pérez",
//     "apellido_materno": "López",
//     "usuario": "juanperez",
//     "contrasena": "1234",
//     "id_taller": 2
//   }
//
// Lógica:
//   - Verificar que el usuario no exista.
//   - Insertar en usuarios.
//   - Insertar en taller_usuario.
// ============================================================
router.post('/alta', (req, res) => {

    const {
        tipo_usuario,
        nombre,
        apellido_paterno,
        apellido_materno,
        usuario,
        contrasena,
        id_taller
    } = req.body;

    if (!tipo_usuario || tipo_usuario !== "GEST") {
        return res.status(403).json({ error: "no_autorizado" });
    }

    if (!nombre || !apellido_paterno || !apellido_materno ||
        !usuario || !contrasena || !id_taller) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // ============================================================
    // 1. Verificar si el nombre de usuario ya existe
    // ============================================================
    const sqlCheckUsuario = `
        SELECT usuario 
        FROM usuarios 
        WHERE usuario = ?;
    `;

    db.query(sqlCheckUsuario, [usuario], (err, result) => {
        if (err) {
            console.error("Error al verificar usuario:", err);
            return res.status(500).json({ error: "error_servidor" });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: "usuario_existente" });
        }

        // ============================================================
        // 2. Insertar instructor en usuarios
        // ============================================================
        const sqlInsertUsuario = `
            INSERT INTO usuarios 
            (nombre, apellido_paterno, apellido_materno, usuario, contrasena, tipo_usuario)
            VALUES (?, ?, ?, ?, ?, "INST");
        `;

        db.query(sqlInsertUsuario,
            [nombre, apellido_paterno, apellido_materno, usuario, contrasena],
            (err, result) => {

                if (err) {
                    console.error("Error al registrar instructor:", err);
                    return res.status(500).json({ error: "error_registro_usuario" });
                }

                const id_usuario = result.insertId;

                // ============================================================
                // 3. Insertar taller del instructor
                // ============================================================
                const sqlInsertTaller = `
                    INSERT INTO taller_usuario (id_usuario, id_taller)
                    VALUES (?, ?);
                `;

                db.query(sqlInsertTaller, [id_usuario, id_taller], (err) => {
                    if (err) {
                        console.error("Error al registrar taller:", err);
                        return res.status(500).json({ error: "error_registro_taller" });
                    }

                    res.json({
                        mensaje: "registro_exitoso",
                        id_usuario: id_usuario
                    });
                });
            }
        );
    });
});

module.exports = router;
