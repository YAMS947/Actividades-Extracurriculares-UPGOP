// ============================================================
// RUTA: Gestión de Instructor
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================================
// 1. OBTENER DATOS DE UN INSTRUCTOR
// ============================================================
router.post('/datos', (req, res) => {

    const { tipo_usuario, id_usuario } = req.body;

    if (!tipo_usuario) {
        return res.status(400).json({ error: "falta_tipo_usuario" });
    }

    if (!id_usuario) {
        return res.status(400).json({ error: "falta_id_usuario" });
    }

    obtenerDatosInstructor(id_usuario, res);
});

// ============================================================
// FUNCIÓN AUXILIAR
// ============================================================
function obtenerDatosInstructor(id_usuario, res) {

    const sqlDatos = `
        SELECT
            usuarios.id_usuario,
            usuarios.nombre,
            usuarios.apellido_paterno,
            usuarios.apellido_materno,
            usuarios.telefono,
            taller.nombre_taller
        FROM usuarios
        LEFT JOIN taller_usuario
            ON usuarios.id_usuario = taller_usuario.id_usuario
        LEFT JOIN taller
            ON taller_usuario.id_taller = taller.id_taller
        WHERE usuarios.id_usuario = ?
        AND usuarios.tipo_usuario = "INST";
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
// ============================================================
router.post('/actualizar', (req, res) => {

    const {
        tipo_usuario,
        id_usuario,
        nombre,
        apellido_paterno,
        apellido_materno,
        telefono
    } = req.body;

    if (!tipo_usuario || !id_usuario) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // Instructor solo puede modificar sus propios datos
    if (tipo_usuario === "INST" && String(id_usuario) !== String(req.body.id_usuario)) {
        return res.status(403).json({ error: "no_autorizado" });
    }

    // Gestor puede modificar cualquier instructor
    if (tipo_usuario !== "INST" && tipo_usuario !== "GEST") {
        return res.status(403).json({ error: "no_autorizado" });
    }

    const sqlUpdate = `
        UPDATE usuarios
        SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, telefono = ?
        WHERE id_usuario = ?;
    `;

    db.query(sqlUpdate,
        [nombre, apellido_paterno, apellido_materno, telefono, id_usuario],
        (err) => {

            if (err) {
                console.error("Error al actualizar instructor:", err);
                return res.status(500).json({ error: "error_actualizar" });
            }

            res.json({ mensaje: "actualizacion_exitosa" });
        }
    );
});

// ============================================================
// 3. DAR DE BAJA AL INSTRUCTOR
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