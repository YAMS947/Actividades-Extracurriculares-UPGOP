// ============================================================
// RUTA: Solicitudes
// Archivo: routes/Solicitudes.js
// Descripción:
// - Obtiene solicitudes pendientes.
// - Permite aceptar o rechazar solicitudes.
// - Solo instructores y gestores pueden acceder.
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../../db');

// ============================================================
// 1. OBTENER TALLERES (solo para gestores)
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


// ============================================================
// 2. OBTENER SOLICITUDES PENDIENTES
// ------------------------------------------------------------
// Body:
//   {
//     tipo_usuario: "INST" | "GEST",
//     id_usuario: 12,      // si es instructor
//     id_taller: 3         // si es gestor
//   }
// ============================================================
router.post('/lista', (req, res) => {

    const { tipo_usuario, id_usuario, id_taller } = req.body;

    if (!tipo_usuario) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // ============================================================
    // Determinar taller según tipo de usuario
    // ============================================================

    // La función es para ambos casos solamente se determina antes cual es el id del taller a mostrar
    function continuarConTaller(idTallerFinal) {

        const sqlSolicitudes = `
            SELECT 
                solicitud.id_solicitud,
                solicitud.id_usuario,
                solicitud.id_taller,
                solicitud.descripcion,
                solicitud.fecha,
                solicitud.estado,
                usuarios.nombre,
                usuarios.apellido_paterno,
                usuarios.apellido_materno,
                matricula_usuario.matricula
            FROM solicitud
            INNER JOIN usuarios
                ON solicitud.id_usuario = usuarios.id_usuario
            INNER JOIN matricula_usuario
                ON usuarios.id_usuario = matricula_usuario.id_usuario
            WHERE solicitud.estado = 'pendiente'
            AND solicitud.id_taller = ?;
        `;

        db.query(sqlSolicitudes, [idTallerFinal], (err, result) => {
            if (err) {
                console.error("Error al obtener solicitudes:", err);
                return res.status(500).json({ error: "error_obtener_solicitudes" });
            }

            res.json({
                mensaje: "solicitudes_obtenidas",
                solicitudes: result
            });
        });
    }

    // ============================================================
    // CASO A: Instructor → obtener su taller automáticamente
    // ============================================================
    if (tipo_usuario === "INST") {

        const sqlTallerInst = `
            SELECT id_taller
            FROM taller_usuario
            WHERE id_usuario = ?;
        `;

        db.query(sqlTallerInst, [id_usuario], (err, result) => {
            if (err) {
                console.error("Error al obtener taller del instructor:", err);
                return res.status(500).json({ error: "error_taller_instructor" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "instructor_sin_taller" });
            }

            continuarConTaller(result[0].id_taller);
        });

        return;
    }

    // ============================================================
    // CASO B: Gestor → usa el taller enviado por el frontend
    // ============================================================
    if (tipo_usuario === "GEST") {

        if (!id_taller) {
            return res.status(400).json({ error: "falta_id_taller" });
        }

        continuarConTaller(id_taller);
        return;
    }

    return res.status(403).json({ error: "no_autorizado" });
});


// ============================================================
// 3. RESOLVER SOLICITUD (ACEPTAR O RECHAZAR)
// ------------------------------------------------------------
// Body:
//   {
//     id_solicitud: 5,
//     accion: "aceptar" | "rechazar"
//   }
// ============================================================
router.post('/resolver', (req, res) => {

    const { id_solicitud, accion } = req.body;

    if (!id_solicitud || !accion) {
        return res.status(400).json({ error: "faltan_datos" });
    }

    // ============================================================
    // Obtener datos de la solicitud
    // ============================================================
    const sqlGetSolicitud = `
        SELECT id_usuario, id_taller
        FROM solicitud
        WHERE id_solicitud = ?;
    `;

    db.query(sqlGetSolicitud, [id_solicitud], (err, result) => {
        if (err) {
            console.error("Error al obtener solicitud:", err);
            return res.status(500).json({ error: "error_obtener_solicitud" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "solicitud_no_encontrada" });
        }

        const idUsuario = result[0].id_usuario;
        const idTallerSolicitado = result[0].id_taller;

        // ============================================================
        // CASO A: Rechazar solicitud
        // ============================================================
        if (accion === "rechazar") {

            const sqlRechazar = `
                UPDATE solicitud
                SET estado = 'rechazada'
                WHERE id_solicitud = ?;
            `;

            db.query(sqlRechazar, [id_solicitud], (err) => {
                if (err) {
                    console.error("Error al rechazar solicitud:", err);
                    return res.status(500).json({ error: "error_rechazar" });
                }

                return res.json({ mensaje: "solicitud_rechazada" });
            });

            return;
        }

        // ============================================================
        // CASO B: Aceptar solicitud
        // ============================================================
        if (accion === "aceptar") {

            const sqlAceptar = `
                UPDATE solicitud
                SET estado = 'aceptada'
                WHERE id_solicitud = ?;
            `;

            db.query(sqlAceptar, [id_solicitud], (err) => {
                if (err) {
                    console.error("Error al aceptar solicitud:", err);
                    return res.status(500).json({ error: "error_aceptar" });
                }

                // ============================================================
                // Registrar al usuario en el taller solicitado
                // ============================================================
                const sqlInsertTaller = `
                    INSERT INTO taller_usuario (id_usuario, id_taller)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE id_taller = VALUES(id_taller);
                `;

                db.query(sqlInsertTaller, [idUsuario, idTallerSolicitado], (err) => {
                    if (err) {
                        console.error("Error al registrar taller:", err);
                        return res.status(500).json({ error: "error_registrar_taller" });
                    }

                    // ============================================================
                    // Registrar fecha de ingreso
                    // ============================================================
                    const sqlFecha = `
                        INSERT INTO fecha_ingreso (id_usuario, fecha)
                        VALUES (?, NOW())
                        ON DUPLICATE KEY UPDATE fecha = VALUES(fecha);
                    `;

                    db.query(sqlFecha, [idUsuario], (err) => {
                        if (err) {
                            console.error("Error al registrar fecha:", err);
                            return res.status(500).json({ error: "error_registrar_fecha" });
                        }

                        res.json({ mensaje: "solicitud_aceptada" });
                    });
                });
            });

            return;
        }

        return res.status(400).json({ error: "accion_invalida" });
    });
});

module.exports = router;
