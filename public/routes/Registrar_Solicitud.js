// ============================================================
// RUTA: Registrar Solicitud
// Archivo: routes/Registrar_Solicitud.js
// Descripción:
// - Permite a los alumnos registrar una solicitud para un taller.
// - Verifica que no exista una solicitud pendiente.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================================
// 1. REGISTRAR SOLICITUD
// ------------------------------------------------------------
// Body:
//   {
//     tipo_usuario: "ALUM",
//     id_usuario: 12,
//     id_taller: 3,
//     descripcion: "Quiero entrar al taller"
//   }
// ============================================================
router.post('/registrar', (req, res) => {

    const { tipo_usuario, id_usuario, id_taller, descripcion } = req.body;

    // Validación básica
    if (!tipo_usuario || !id_usuario || !id_taller || !descripcion) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // Solo alumnos pueden registrar solicitudes
    if (tipo_usuario !== "ALUM") {
        return res.status(403).json({ error: "no_autorizado" });
    }

    // ============================================================
    // 1. Verificar si ya existe una solicitud pendiente
    // ============================================================
    const sqlCheck = `
        SELECT id_solicitud
        FROM solicitud
        WHERE id_usuario = ?
        AND estado = 'pendiente';
    `;

    db.query(sqlCheck, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al verificar solicitud:", err);
            return res.status(500).json({ error: "error_verificar_solicitud" });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: "solicitud_pendiente" });
        }

        // ============================================================
        // 2. Registrar nueva solicitud
        // ============================================================
        const sqlInsert = `
            INSERT INTO solicitud (id_usuario, id_taller, descripcion)
            VALUES (?, ?, ?);
        `;

        db.query(sqlInsert, [id_usuario, id_taller, descripcion], (err, result) => {
            if (err) {
                console.error("Error al registrar solicitud:", err);
                return res.status(500).json({ error: "error_registrar_solicitud" });
            }

            res.json({
                mensaje: "solicitud_registrada",
                id_solicitud: result.insertId
            });
        });
    });
});

module.exports = router;
