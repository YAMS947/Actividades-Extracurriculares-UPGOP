// ============================================================
// RUTA: Gestión de Instructor
// Archivo: routes/Gestion_De_Instructor.js
// Descripción:
// - Muestra datos de un instructor.
// - Permite actualizar datos del instructor.
// - Permite dar de baja (eliminar) al instructor.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================================
// 1. OBTENER DATOS DE UN INSTRUCTOR
// ------------------------------------------------------------
// Casos:
//  - Instructor viendo sus propios datos (tipo_usuario = INST)
//  - Gestor viendo datos de un instructor seleccionado
// ============================================================
router.post('/datos', (req, res) => {

    const {
        tipo_usuario,
        id_usuario,
        nombre,
        apellido_paterno,
        apellido_materno,
        taller
    } = req.body;

    if (!tipo_usuario) {
        return res.status(400).json({ error: "falta_tipo_usuario" });
    }

    // ============================================================
    // CASO A: Instructor viendo sus propios datos
    // ============================================================
    if (tipo_usuario === "INST") {

        if (!id_usuario) {
            return res.status(400).json({ error: "falta_id_usuario" });
        }

        return obtenerDatosInstructor(id_usuario, res);
    }

    // ============================================================
    // CASO B: Gestor viendo datos de un instructor
    // ============================================================
    if (tipo_usuario === "GEST") {

        if (!nombre || !apellido_paterno || !apellido_materno || !taller) {
            return res.status(400).json({ error: "faltan_datos_busqueda" });
        }

        const sqlBuscar = `
            SELECT usuarios.id_usuario
            FROM usuarios
            INNER JOIN taller_usuario
                ON usuarios.id_usuario = taller_usuario.id_usuario
            INNER JOIN taller
                ON taller_usuario.id_taller = taller.id_taller
            WHERE usuarios.nombre = ?
            AND usuarios.apellido_paterno = ?
            AND usuarios.apellido_materno = ?
            AND taller.nombre_taller = ?
            AND usuarios.tipo_usuario = "INST";
        `;

        db.query(sqlBuscar,
            [nombre, apellido_paterno, apellido_materno, taller],
            (err, result) => {

                if (err) {
                    console.error("Error al buscar instructor:", err);
                    return res.status(500).json({ error: "error_busqueda" });
                }

                if (result.length === 0) {
                    return res.status(404).json({ error: "instructor_no_encontrado" });
                }

                const idInstructor = result[0].id_usuario;

                return obtenerDatosInstructor(idInstructor, res);
            }
        );

        return;
    }

    return res.status(403).json({ error: "no_autorizado" });
});


// ============================================================
// FUNCIÓN AUXILIAR: Obtener datos del instructor
// ============================================================
function obtenerDatosInstructor(id_usuario, res) {

    const sqlDatos = `
        SELECT
            usuarios.nombre,
            usuarios.apellido_paterno,
            usuarios.apellido_materno,
            taller.nombre_taller,
            usuarios.usuario
        FROM usuarios
        LEFT JOIN taller_usuario
            ON usuarios.id_usuario = taller_usuario.id_usuario
        LEFT JOIN taller
            ON taller_usuario.id_taller = taller.id_taller
        WHERE usuarios.id_usuario = ?;
    `;

    db.query(sqlDatos, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al obtener datos del instructor:", err);
            return res.status(500).json({ error: "error_obtener_datos" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "instructor_no_encontrado" });
        }

        res.json({
            mensaje: "datos_obtenidos",
            instructor: result[0]
        });
    });
}


// ============================================================
// 2. ACTUALIZAR DATOS DEL INSTRUCTOR
// ------------------------------------------------------------
// Solo gestores pueden modificar datos.
// Taller NO se modifica aquí.
// ============================================================
router.post('/actualizar', (req, res) => {

    const {
        tipo_usuario,
        id_usuario,
        nombre,
        apellido_paterno,
        apellido_materno,
        usuario,
        contrasena
    } = req.body;

    if (tipo_usuario !== "GEST") {
        return res.status(403).json({ error: "no_autorizado" });
    }

    if (!id_usuario || !nombre || !apellido_paterno || !apellido_materno || !usuario) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // ============================================================
    // Verificar si el usuario ya existe (excepto si es el mismo)
    // ============================================================
    const sqlCheckUsuario = `
        SELECT id_usuario 
        FROM usuarios 
        WHERE usuario = ?;
    `;

    db.query(sqlCheckUsuario, [usuario], (err, result) => {
        if (err) {
            console.error("Error al verificar usuario:", err);
            return res.status(500).json({ error: "error_servidor" });
        }

        if (result.length > 0 && result[0].id_usuario !== id_usuario) {
            return res.status(409).json({ error: "usuario_existente" });
        }

        // ============================================================
        // UPDATE datos del instructor
        // ============================================================
        const sqlUpdate = `
            UPDATE usuarios
            SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, usuario = ?, contrasena = ?
            WHERE id_usuario = ?;
        `;

        db.query(sqlUpdate,
            [nombre, apellido_paterno, apellido_materno, usuario, contrasena, id_usuario],
            (err) => {

                if (err) {
                    console.error("Error al actualizar instructor:", err);
                    return res.status(500).json({ error: "error_actualizar" });
                }

                res.json({ mensaje: "actualizacion_exitosa" });
            }
        );
    });
});


// ============================================================
// 3. DAR DE BAJA AL INSTRUCTOR
// ------------------------------------------------------------
// Elimina completamente el registro del instructor.
// La base de datos elimina en cascada los demás registros.
// ============================================================
router.post('/baja', (req, res) => {

    const { tipo_usuario, id_usuario } = req.body;

    if (tipo_usuario !== "GEST") {
        return res.status(403).json({ error: "no_autorizado" });
    }

    if (!id_usuario) {
        return res.status(400).json({ error: "falta_id_usuario" });
    }

    const sqlDelete = `
        DELETE FROM usuarios
        WHERE id_usuario = ?;
    `;

    db.query(sqlDelete, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al eliminar instructor:", err);
            return res.status(500).json({ error: "error_eliminar" });
        }

        res.json({
            mensaje: "instructor_eliminado",
            filas_afectadas: result.affectedRows
        });
    });
});

module.exports = router;
