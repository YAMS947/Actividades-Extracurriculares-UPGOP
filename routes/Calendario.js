// ============================================================
// RUTA: Calendario
// Archivo: routes/Calendario.js
// Descripción:
// Maneja las consultas necesarias para mostrar el calendario
// de días activos de los talleres, considerando la sesión del
// usuario y su tipo (GESTOR, ALUM, INST).
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db'); 

// ============================================================
// 1. OBTENER TODOS LOS TALLERES (solo para gestores)
// ------------------------------------------------------------
// Esta ruta devuelve todos los talleres registrados.
// El frontend decidirá si mostrar o no el selector de talleres
// según el tipo de usuario guardado en localStorage.
// ============================================================
router.get('/talleres', (req, res) => {

    const sql = `
        SELECT 
            id_taller,
            nombre_taller
        FROM taller;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error al obtener talleres:", err);
            return res.status(500).json({ error: "Error al obtener talleres" });
        }

        res.json({
            mensaje: "Talleres obtenidos correctamente",
            talleres: result
        });
    });
});

// ============================================================
// 2. OBTENER DÍAS ACTIVOS SEGÚN EL TIPO DE USUARIO
// ------------------------------------------------------------
// Esta ruta recibe:
// - id_usuario (obligatorio)
// - id_taller (solo si el usuario es GESTOR)
//
// Lógica:
// - Si el usuario es GESTOR → usa id_taller enviado por el frontend.
// - Si NO es GESTOR → obtiene automáticamente el taller del usuario.
// - Si es ALUM → además obtiene sus asistencias.
// ============================================================
router.post('/dias-activos', (req, res) => {

    const { id_usuario, tipo_usuario, id_taller } = req.body;

    if (!id_usuario || !tipo_usuario) {
        return res.status(400).json({ error: "Faltan datos de sesión" });
    }

    // ============================
    // CASO 1: GESTOR
    // ============================
    if (tipo_usuario === "GEST") {

        if (!id_taller) {
            return res.status(400).json({ error: "El gestor debe enviar id_taller" });
        }

        const sqlDias = `
            SELECT id_dia, fecha
            FROM dia_activo
            WHERE id_taller = ?
            ORDER BY fecha ASC;
        `;

        db.query(sqlDias, [id_taller], (err, result) => {
            if (err) {
                console.error("Error al obtener días activos:", err);
                return res.status(500).json({ error: "Error al obtener días activos" });
            }

            res.json({
                mensaje: "Días activos obtenidos correctamente",
                dias_activos: result
            });
        });

        return; // ← importante
    }

    // ============================
    // CASO 2: ALUM / INST
    // ============================
    const sqlTallerUsuario = `
        SELECT id_taller
        FROM taller_usuario
        WHERE id_usuario = ?;
    `;

    db.query(sqlTallerUsuario, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al obtener taller del usuario:", err);
            return res.status(500).json({ error: "Error al obtener taller del usuario" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "El usuario no tiene taller asignado" });
        }

        const tallerUsuario = result[0].id_taller;

        const sqlDias = `
            SELECT id_dia, fecha
            FROM dia_activo
            WHERE id_taller = ?
            ORDER BY fecha ASC;
        `;

        db.query(sqlDias, [tallerUsuario], (err, dias) => {
            if (err) {
                console.error("Error al obtener días activos:", err);
                return res.status(500).json({ error: "Error al obtener días activos" });
            }

            // ============================
            // ALUM → obtener asistencias
            // ============================
            if (tipo_usuario === "ALUM") {

                const sqlAsistencias = `
                    SELECT id_dia, tipo
                    FROM asistencia
                    WHERE id_usuario = ?
                    ORDER BY id_dia ASC;
                `;

                db.query(sqlAsistencias, [id_usuario], (err, asistencias) => {
                    if (err) {
                        console.error("Error al obtener asistencias:", err);
                        return res.status(500).json({ error: "Error al obtener asistencias" });
                    }

                    res.json({
                        mensaje: "Días activos y asistencias obtenidos correctamente",
                        dias_activos: dias,
                        asistencias: asistencias
                    });
                });

                return; // ← importante
            }

            // ============================
            // INST → solo días activos
            // ============================
            res.json({
                mensaje: "Días activos obtenidos correctamente",
                dias_activos: dias
            });
        });
    });
});

module.exports = router;
